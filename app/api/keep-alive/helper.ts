/**
 * @file Supabase 数据库保活服务辅助函数
 * @description
 * 此文件提供了一系列辅助函数，用于支持 Supabase 数据库保活服务的核心功能：
 * 1. 生成随机字符串
 * 2. 数据库记录的查询、插入和删除
 * 3. 根据表大小自动决定是执行插入还是删除操作
 *
 * @author Your Name
 * @date 2024
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { keepAliveConfig as config } from "@/config/keep-alive-config";

/**
 * 基础查询响应类型
 * @typedef QueryResponse
 * @property {boolean} successful - 操作是否成功
 * @property {string} message - 操作结果消息
 */
export type QueryResponse = {
  successful: boolean;
  message: string;
};

/**
 * 带数据的查询响应类型
 * @typedef QueryResponseWithData
 * @extends QueryResponse
 * @property {any[] | null} data - 查询返回的数据数组
 */
export type QueryResponseWithData = QueryResponse & {
  data: any[] | null;
};

/**
 * 默认随机字符串长度
 */
const defaultRandomStringLength: number = 12;

/**
 * 字母 'a' 的 ASCII 码偏移量，用于生成随机小写字母
 */
const alphabetOffset: number = "a".charCodeAt(0);

/**
 * 生成指定长度的随机小写字母字符串
 * @param length - 字符串长度，默认为 defaultRandomStringLength (12)
 * @returns 生成的随机字符串
 */
export const generateRandomString = (
  length: number = defaultRandomStringLength
) => {
  let newString = "";

  // 循环生成每个字符
  for (let i = 0; i < length; i++) {
    // 生成 a-z 范围内的随机字母
    newString += String.fromCharCode(
      alphabetOffset + Math.floor(Math.random() * 26)
    );
  }

  return newString;
};

//

/**
 * 从数据库中检索所有记录
 * @param supabase - Supabase 客户端实例
 * @returns 包含查询结果的 QueryResponseWithData 对象
 */
export const retrieveEntries = async (
  supabase: SupabaseClient
): Promise<QueryResponseWithData> => {
  // 从配置的表中查询指定列的所有记录
  const { data, error } = await supabase
    .from(config.table)
    .select(config.column);

  // 构建响应消息
  const messageInfo: string = `Results for retrieving entries from '${config.table}' - '${config.column} column`;

  // 错误处理
  if (error) {
    const errorInfo = `${messageInfo}: ${error.message}`;
    if (config.consoleLogOnError) console.log(errorInfo);
    return {
      successful: false,
      message: errorInfo,
      data: null,
    };
  }

  // 返回成功结果
  return {
    successful: true,
    message: `${messageInfo}: ${JSON.stringify(data)}`,
    data: data,
  };
};

/**
 * 向数据库中插入随机字符串记录
 * @param supabase - Supabase 客户端实例
 * @param randomString - 要插入的随机字符串
 * @returns 插入操作的结果
 */
export const insertRandom = async (
  supabase: SupabaseClient,
  randomString: string
): Promise<QueryResponse> => {
  // 构建要插入的数据对象
  // 使用 ES6 的计算属性名语法，动态设置列名
  const upsertData = {
    [config.column]: randomString,
  };

  // 执行 upsert 操作并返回插入的数据
  const { data, error } = await supabase
    .from(config.table)
    .upsert(upsertData)
    .select();

  // 构建响应消息
  const messageInfo: string = `Results for upserting\n'${randomString}' from '${config.table}' at column '${config.column}'`;

  // 错误处理
  if (error) {
    const errorInfo = `${messageInfo}: ${error.message}`;
    if (config.consoleLogOnError) console.log(errorInfo);
    return {
      successful: false,
      message: errorInfo,
    };
  }

  // 返回成功结果
  return {
    successful: true,
    message: `${messageInfo}: ${JSON.stringify(data)}`,
  };
};

/**
 * 从数据库中删除指定的记录
 * @param supabase - Supabase 客户端实例
 * @param entryToDelete - 要删除的记录值
 * @returns 删除操作的结果
 */
export const deleteRandom = async (
  supabase: SupabaseClient,
  entryToDelete: any
): Promise<QueryResponse> => {
  // 执行删除操作，删除指定列值的记录
  const { error } = await supabase
    .from(config.table)
    .delete()
    .eq(config.column, entryToDelete);

  // 构建响应消息
  const messageInfo: string = `Results for deleting\n'${entryToDelete}' from '${config.table}' at column '${config.column}'`;

  // 错误处理
  if (error) {
    const errorInfo = `${messageInfo}: ${error.message}`;
    if (config.consoleLogOnError) console.log(errorInfo);
    return {
      successful: false,
      message: errorInfo,
    };
  }

  // 返回成功结果
  return {
    successful: true,
    message: `${messageInfo}: success`,
  };
};

/**
 * 根据数据库表的当前状态决定执行插入还是删除操作
 * @param supabase - Supabase 客户端实例
 * @returns 操作执行的结果
 *
 * @description
 * 此函数的工作流程：
 * 1. 首先获取表中所有记录
 * 2. 如果表大小超过配置的阈值，则删除最后一条记录
 * 3. 否则，插入一条新的随机记录
 */
export const determineAction = async (
  supabase: SupabaseClient
): Promise<QueryResponse> => {
  // 获取当前所有记录
  const retrievalResults: QueryResponseWithData = await retrieveEntries(
    supabase
  );

  // 处理查询失败的情况
  if (retrievalResults.successful == false) {
    return {
      successful: false,
      message: `Failed to retrieve entries from ${config.table}\n${retrievalResults.message}`,
    };
  } else {
    const retrievedEntries = retrievalResults.data;
    // 处理查询结果为空的情况
    if (retrievedEntries == null) {
      return {
        successful: false,
        message: `Received 'null' data result when retrieving entries from ${config.table}\n${retrievalResults.message}`,
      };
    } else {
      // 初始化响应数据
      let responseMessage = `${retrievalResults.message}\n\n`;
      let responseSuccessful: boolean = true;

      // 根据表大小决定执行删除还是插入操作
      if (retrievedEntries.length > config.sizeBeforeDeletions) {
        // 表太大，需要删除记录
        const entryToDelete = retrievedEntries.pop();
        const deletionResults: QueryResponse = await deleteRandom(
          supabase,
          entryToDelete[config.column]
        );

        responseSuccessful = deletionResults.successful;
        responseMessage += deletionResults.message;
      } else {
        // 表未达到最大大小，插入新记录
        const currentRandomString = generateRandomString();
        const insertResults: QueryResponse = await insertRandom(
          supabase,
          currentRandomString
        );

        responseSuccessful = insertResults.successful;
        responseMessage += insertResults.message;
      }

      // 返回操作结果
      return {
        message: responseMessage,
        successful: responseSuccessful,
      };
    }
  }
};
