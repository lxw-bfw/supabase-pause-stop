import { keepAliveConfig as config } from "../config/keep-alive-config";
import { createTestClient } from "../utils/supabase/test-client";
import {
  QueryResponse,
  determineAction,
  generateRandomString,
} from "../app/api/keep-alive/helper";
/**
 * 创建测试脚本文件
 */

async function testKeepAlive() {
  try {
    const supabase = createTestClient();
    let responseMessage = "";
    let successfulResponses = true;

    // 测试随机字符串
    if (config?.disableRandomStringQuery !== true) {
      const currentRandomString = generateRandomString();
      const { data, error } = await supabase
        .from(config.table)
        .select("*")
        .eq(config.column, currentRandomString);

      const queryResult = error
        ? {
            successful: false,
            message: `Error: ${error.message}`,
          }
        : {
            successful: true,
            message: `Query result: ${JSON.stringify(data)}`,
          };

      successfulResponses = successfulResponses && queryResult.successful;
      responseMessage += queryResult.message + "\n\n";
    }

    // 测试插入/删除操作
    if (config?.allowInsertionAndDeletion === true) {
      const actionResult = await determineAction(supabase);
      successfulResponses = successfulResponses && actionResult.successful;
      responseMessage += actionResult.message + "\n\n";
    }

    // 测试其他端点
    if (config?.otherEndpoints?.length > 0) {
      const endpointResults = await Promise.all(
        config.otherEndpoints.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint, { cache: "no-store" });
            return `${endpoint} - ${
              response.status === 200 ? "Passed" : "Failed"
            }`;
          } catch (error) {
            // @ts-ignore
            return `${endpoint} - Error: ${error.message}`;
          }
        })
      );
      responseMessage +=
        "\nOther Endpoint Results:\n" + endpointResults.join("\n");
    }

    console.log("Test Results:");
    console.log("Status:", successfulResponses ? "Success" : "Failed");
    console.log("Response:\n", responseMessage);
  } catch (error) {
    console.error("Test Error:", error);
  }
}

// 确保环境变量已加载
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });

testKeepAlive();
