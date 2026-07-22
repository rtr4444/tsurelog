import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  UpdatePointRequestBody,
  UpdatePointResponseBody,
  MyPoint,
} from '../../../../package/shared-types/types';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const MY_POINTS_TABLE_NAME = process.env.MY_POINTS_TABLE_NAME;

// API Gateway経由でのアクセスに必要なCORSヘッダー（エラーレスポンス時にも必須）
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!MY_POINTS_TABLE_NAME) {
      throw new Error('Environment variable MY_POINTS_TABLE_NAME is not defined.');
    }

    const pointId = event.pathParameters?.pointId;
    if (!pointId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Missing pointId' }),
      };
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

    if (!isUpdatePointRequestBody(parsedBody)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Invalid request payload structure' }),
      };
    }

    const now = Date.now();

    const result = await docClient.send(
      new UpdateCommand({
        TableName: MY_POINTS_TABLE_NAME,
        Key: { pointId },
        UpdateExpression:
          'SET pointName = :pointName, description = :description, address = :address, latitude = :latitude, longitude = :longitude, updatedAt = :updatedAt, createdAt = if_not_exists(createdAt, :now)',
        ExpressionAttributeValues: {
          ':pointName': parsedBody.pointName,
          ':description': parsedBody.description ?? null,
          ':address': parsedBody.address ?? null,
          ':latitude': parsedBody.latitude ?? null,
          ':longitude': parsedBody.longitude ?? null,
          ':updatedAt': now,
          ':now': now,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );

    const responseBody: UpdatePointResponseBody = { point: result.Attributes as MyPoint };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error('Error updating point:', error instanceof Error ? error.stack : error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// リクエストボディの型ガード
function isUpdatePointRequestBody(obj: unknown): obj is UpdatePointRequestBody {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;

  if (typeof candidate.pointName !== 'string') return false;
  if (candidate.description !== undefined && typeof candidate.description !== 'string')
    return false;
  if (candidate.address !== undefined && typeof candidate.address !== 'string') return false;
  if (candidate.latitude !== undefined && typeof candidate.latitude !== 'number') return false;
  if (candidate.longitude !== undefined && typeof candidate.longitude !== 'number') return false;

  return true;
}
