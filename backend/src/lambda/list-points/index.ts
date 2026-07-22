import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { MyPoint, ListPointsResponseBody } from '../../../../package/shared-types/types';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const MY_POINTS_TABLE_NAME = process.env.MY_POINTS_TABLE_NAME;

// API Gateway経由でのアクセスに必要なCORSヘッダー（エラーレスポンス時にも必須）
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler: APIGatewayProxyHandler = async () => {
  try {
    if (!MY_POINTS_TABLE_NAME) {
      throw new Error('Environment variable MY_POINTS_TABLE_NAME is not defined.');
    }

    const result = await docClient.send(
      new ScanCommand({
        TableName: MY_POINTS_TABLE_NAME,
      }),
    );

    const points = (result.Items ?? []) as MyPoint[];
    const responseBody: ListPointsResponseBody = { points };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error('Error fetching points:', error instanceof Error ? error.stack : error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
