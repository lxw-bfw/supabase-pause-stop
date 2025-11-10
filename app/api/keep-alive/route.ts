/**
 * @file Supabase 数据库保活服务接口
 * @description
 * 此文件实现了一个定时访问 Supabase 数据库的 API 端点，用于防止数据库因不活动而被暂停。
 * 主要功能：
 * 1. 执行数据库查询操作
 * 2. 可选的数据插入和删除操作
 * 3. 支持同时访问多个其他端点
 *
 * @author Your Name
 * @date 2024
 */

import { createClient } from "@/utils/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

import { keepAliveConfig as config } from "@/config/keep-alive-config";
import { QueryResponse, determineAction, generateRandomString } from "./helper";

// 强制设置为动态路由，确保每次请求都会执行
export const dynamic = "force-dynamic"; // defaults to auto

const querySupabase = async (
  supabase: SupabaseClient,
  randomStringLength: number = 12
): Promise<QueryResponse> => {
  const currentRandomString = generateRandomString(randomStringLength);

  const { data, error } = await supabase
    .from(config.table)
    .select("*")
    .eq(config.column, currentRandomString);

  const messageInfo: string = `Results for retrieving\n'${currentRandomString}' from '${config.table}' at column '${config.column}'`;

  if (error) {
    const errorInfo = `${messageInfo}: ${error.message}`;
    if (config.consoleLogOnError) console.log(errorInfo);
    return {
      successful: false,
      message: errorInfo,
    };
  }

  return {
    successful: true,
    message: `${messageInfo}: ${JSON.stringify(data)}`,
  };
};

const fetchOtherEndpoints = async (): Promise<string[]> => {
  if (config?.otherEndpoints != null && config?.otherEndpoints.length > 0) {
    const fetchPromises = config.otherEndpoints.map(async (endpoint) => {
      const endpointResults = await fetch(endpoint, { cache: "no-store" });
      const passOrFail = endpointResults?.status == 200 ? "Passed" : "Failed";
      return `${endpoint} - ${passOrFail}`;
    });

    const fetchResults = await Promise.all(fetchPromises);
    return fetchResults;
  }

  return [];
};

/**
 * API
 */
export async function GET() {
  const supabase = createClient(); // maybe switch to ClientSide Client

  let responseMessage: string = "";
  let successfulResponses: boolean = true;

  if (config?.disableRandomStringQuery != true) {
    const querySupabaseResponse: QueryResponse = await querySupabase(supabase);

    successfulResponses =
      successfulResponses && querySupabaseResponse.successful;
    responseMessage += querySupabaseResponse.message + "\n\n";
  }

  if (config?.allowInsertionAndDeletion == true) {
    const insertOrDeleteResults: QueryResponse = await determineAction(
      supabase
    );

    successfulResponses =
      successfulResponses && insertOrDeleteResults.successful;
    responseMessage += insertOrDeleteResults.message + "\n\n";
  }

  if (config?.otherEndpoints != null && config?.otherEndpoints.length > 0) {
    const fetchResults: string[] = await fetchOtherEndpoints();
    responseMessage += `\n\nOther Endpoint Results:\n${fetchResults.join(
      "\n"
    )}`;
  }

  return new Response(responseMessage, {
    status: successfulResponses == true ? 200 : 400,
  });
}
