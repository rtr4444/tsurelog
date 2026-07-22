import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  GetPhotoUrlsRequestBody,
  GetPhotoUrlsResponseBody,
} from '../../../../package/shared-types/types';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.FISHING_LOG_PHOTO_BUCKET_NAME;

// API Gateway経由でのアクセスに必要なCORSヘッダー（エラーレスポンス時にも必須）
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('Environment variable FISHING_LOG_PHOTO_BUCKET_NAME is not defined.');
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    const parsedBody: unknown = JSON.parse(event.body);

    if (!isGetPhotoUrlsRequestBody(parsedBody)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Invalid request payload structure' }),
      };
    }

    const urls = await Promise.all(
      parsedBody.keys.map(async (key) => {
        const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
        // 有効期限を15分(900秒)に設定して署名付きURLを発行
        const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
        return { key, url };
      }),
    );

    const responseBody: GetPhotoUrlsResponseBody = { urls };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error('Error generating photo URLs:', error instanceof Error ? error.stack : error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// リクエストボディの型ガード
function isGetPhotoUrlsRequestBody(obj: unknown): obj is GetPhotoUrlsRequestBody {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return Array.isArray(candidate.keys) && candidate.keys.every((k) => typeof k === 'string');
}
