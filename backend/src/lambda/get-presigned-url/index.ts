import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { GetPresignedUrlRequestBody } from '../../../../package/shared-types/types';

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

    if (!isGetPresignedUrlRequestBody(parsedBody)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Invalid request payload structure' }),
      };
    }

    const urls = await Promise.all(
      parsedBody.files.map(async (file) => {
        const fileExtension = file.fileName.split('.').pop() ?? 'jpg';
        const uniqueId = randomUUID();
        const s3Path = `raw-contents/${uniqueId}.${fileExtension}`;

        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Path,
          ContentType: file.contentType,
        });

        // 有効期限を15分(900秒)に設定して署名付きURLを発行
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

        return {
          fileName: file.fileName,
          uploadUrl,
          s3Path,
        };
      }),
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ urls }),
    };
  } catch (error) {
    console.error('Error generating presigned URLs:', error instanceof Error ? error.stack : error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

// リクエストボディの型ガード
function isGetPresignedUrlRequestBody(obj: unknown): obj is GetPresignedUrlRequestBody {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;

  if (!Array.isArray(candidate.files)) return false;

  return candidate.files.every((file) => {
    if (!file || typeof file !== 'object') return false;
    const f = file as Record<string, unknown>;
    return typeof f.fileName === 'string' && typeof f.contentType === 'string';
  });
}
