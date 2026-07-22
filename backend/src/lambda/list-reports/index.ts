import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { FishingReport, ListReportsResponseBody } from '../../../../package/shared-types/types';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const FISHING_LOG_TABLE_NAME = process.env.FISHING_LOG_TABLE_NAME;
const POINT_INDEX_NAME = 'PointIndex';

// submit-reportと同じ固定ユーザーID
const DEFAULT_USER_ID = 'default-user';

// API Gateway経由でのアクセスに必要なCORSヘッダー（エラーレスポンス時にも必須）
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!FISHING_LOG_TABLE_NAME) {
      throw new Error('Environment variable FISHING_LOG_TABLE_NAME is not defined.');
    }

    const queryParams = event.queryStringParameters ?? {};
    const pointId = queryParams.pointId;
    const startDate = queryParams.startDate; // ISO文字列を想定（例: 2026-07-01）
    const endDate = queryParams.endDate;

    const startTimestamp = startDate ? new Date(startDate).getTime() : undefined;
    const endTimestamp = endDate ? new Date(endDate).getTime() : undefined;

    if ((startDate && Number.isNaN(startTimestamp)) || (endDate && Number.isNaN(endTimestamp))) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Invalid startDate or endDate format' }),
      };
    }

    const reports = pointId
      ? await queryByPoint(pointId, startTimestamp, endTimestamp)
      : await queryByUser(startTimestamp, endTimestamp);

    const responseBody: ListReportsResponseBody = { reports };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error('Error listing reports:', error instanceof Error ? error.stack : error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

async function queryByUser(
  startTimestamp?: number,
  endTimestamp?: number,
): Promise<FishingReport[]> {
  const condition = buildTimestampCondition(
    'userId',
    DEFAULT_USER_ID,
    startTimestamp,
    endTimestamp,
  );

  const result = await docClient.send(
    new QueryCommand({
      TableName: FISHING_LOG_TABLE_NAME,
      KeyConditionExpression: condition.keyConditionExpression,
      ExpressionAttributeNames: condition.expressionAttributeNames,
      ExpressionAttributeValues: condition.expressionAttributeValues,
      ScanIndexForward: false, // 新しい順
    }),
  );

  return (result.Items ?? []) as FishingReport[];
}

async function queryByPoint(
  pointId: string,
  startTimestamp?: number,
  endTimestamp?: number,
): Promise<FishingReport[]> {
  const condition = buildTimestampCondition('pointId', pointId, startTimestamp, endTimestamp);

  const result = await docClient.send(
    new QueryCommand({
      TableName: FISHING_LOG_TABLE_NAME,
      IndexName: POINT_INDEX_NAME,
      KeyConditionExpression: condition.keyConditionExpression,
      ExpressionAttributeNames: condition.expressionAttributeNames,
      ExpressionAttributeValues: condition.expressionAttributeValues,
      ScanIndexForward: false, // 新しい順
    }),
  );

  return (result.Items ?? []) as FishingReport[];
}

/**
 * パーティションキー条件 + オプションのtimestamp範囲条件を組み立てる共通ヘルパー
 */
function buildTimestampCondition(
  partitionKeyName: string,
  partitionKeyValue: string,
  startTimestamp?: number,
  endTimestamp?: number,
) {
  const expressionAttributeNames: Record<string, string> = { '#pk': partitionKeyName };

  if (startTimestamp !== undefined && endTimestamp !== undefined) {
    expressionAttributeNames['#ts'] = 'timestamp';
    return {
      keyConditionExpression: '#pk = :pk AND #ts BETWEEN :start AND :end',
      expressionAttributeNames,
      expressionAttributeValues: {
        ':pk': partitionKeyValue,
        ':start': startTimestamp,
        ':end': endTimestamp,
      },
    };
  }

  if (startTimestamp !== undefined) {
    expressionAttributeNames['#ts'] = 'timestamp';
    return {
      keyConditionExpression: '#pk = :pk AND #ts >= :start',
      expressionAttributeNames,
      expressionAttributeValues: { ':pk': partitionKeyValue, ':start': startTimestamp },
    };
  }

  if (endTimestamp !== undefined) {
    expressionAttributeNames['#ts'] = 'timestamp';
    return {
      keyConditionExpression: '#pk = :pk AND #ts <= :end',
      expressionAttributeNames,
      expressionAttributeValues: { ':pk': partitionKeyValue, ':end': endTimestamp },
    };
  }

  return {
    keyConditionExpression: '#pk = :pk',
    expressionAttributeNames,
    expressionAttributeValues: { ':pk': partitionKeyValue },
  };
}
