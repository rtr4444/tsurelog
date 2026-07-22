import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { SubmitReportRequestBody } from '../../../../package/shared-types/types';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const FISHING_LOG_TABLE_NAME = process.env.FISHING_LOG_TABLE_NAME;
const MY_POINTS_TABLE_NAME = process.env.MY_POINTS_TABLE_NAME;

// 認証が未実装のため、個人利用の単一ユーザーを想定した固定ID
const DEFAULT_USER_ID = 'default-user';

// API Gateway経由でのアクセスに必要なCORSヘッダー（エラーレスポンス時にも必須）
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!FISHING_LOG_TABLE_NAME || !MY_POINTS_TABLE_NAME) {
      throw new Error('Required table name environment variables are not defined.');
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Invalid JSON format' }),
      };
    }

    if (!isSubmitReportRequestBody(parsedBody)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Invalid request payload structure' }),
      };
    }

    // 新規ポイント（'other'）の場合は、先にMyPointsTableへ登録してpointIdを発行
    let pointId = parsedBody.point.code;

    if (parsedBody.point.code === 'other') {
      if (!parsedBody.point.customName || !parsedBody.point.customName.trim()) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ message: 'customName is required for a new point' }),
        };
      }

      pointId = randomUUID();

      await docClient.send(
        new PutCommand({
          TableName: MY_POINTS_TABLE_NAME,
          Item: {
            pointId,
            pointName: parsedBody.point.customName,
            createdAt: Date.now(),
          },
        }),
      );
    }

    // 釣行開始時刻をソートキー用のUnix時間（ミリ秒）に変換
    const timestamp = new Date(parsedBody.time.start).getTime();

    if (Number.isNaN(timestamp)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Invalid time.start format' }),
      };
    }

    const reportId = randomUUID();

    await docClient.send(
      new PutCommand({
        TableName: FISHING_LOG_TABLE_NAME,
        Item: {
          userId: DEFAULT_USER_ID,
          timestamp,
          reportId,
          pointId,
          time: parsedBody.time,
          photoKeys: parsedBody.photoKeys,
          fishTimeline: parsedBody.fishTimeline,
          memo: parsedBody.memo,
        },
      }),
    );

    const responseBody = { reportId, pointId };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error('Error submitting report:', error instanceof Error ? error.stack : error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// リクエストボディの型ガード
function isSubmitReportRequestBody(obj: unknown): obj is SubmitReportRequestBody {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;

  if (!candidate.time || typeof candidate.time !== 'object') return false;
  const time = candidate.time as Record<string, unknown>;
  if (typeof time.start !== 'string' || typeof time.end !== 'string') return false;

  if (
    !Array.isArray(candidate.photoKeys) ||
    !candidate.photoKeys.every((k) => typeof k === 'string')
  ) {
    return false;
  }

  if (!candidate.point || typeof candidate.point !== 'object') return false;
  const point = candidate.point as Record<string, unknown>;
  if (typeof point.code !== 'string') return false;
  if (point.customName !== null && typeof point.customName !== 'string') return false;

  if (!Array.isArray(candidate.fishTimeline)) return false;

  if (typeof candidate.memo !== 'string') return false;

  return true;
}
