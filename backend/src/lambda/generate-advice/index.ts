import { APIGatewayProxyHandler } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import {
  GenerateAdviceRequestBody,
  GenerateAdviceResponseBody,
} from '../../../../package/shared-types/types';

const secretsClient = new SecretsManagerClient({});
const SECRET_NAME = process.env.ANTHROPIC_SECRET_NAME;

// Lambdaコンテナ再利用時のためのAPIキーキャッシュ
let cachedApiKey: string | undefined;

// API Gateway経由でのアクセスに必要なCORSヘッダー（エラーレスポンス時にも必須）
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

async function getApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  if (!SECRET_NAME) {
    throw new Error('Environment variable ANTHROPIC_SECRET_NAME is not defined.');
  }

  const result = await secretsClient.send(new GetSecretValueCommand({ SecretId: SECRET_NAME }));
  if (!result.SecretString) {
    throw new Error('Secret value is empty.');
  }

  const parsed = JSON.parse(result.SecretString) as { apiKey: string };
  cachedApiKey = parsed.apiKey;
  return cachedApiKey;
}

function buildPrompt(data: GenerateAdviceRequestBody): string {
  const fishSummary =
    data.fishTimeline.length > 0
      ? data.fishTimeline
          .map((f) => `${f.date} ${f.fishType}(${f.size}cm, ${f.rigType})`)
          .join('\n')
      : 'なし';

  const weatherSummary = data.weather
    ? `気温${data.weather.temperature}度, 湿度${data.weather.humidity}%, 風速${data.weather.windSpeed}m/s`
    : '天気情報なし';

  const tideSummary = data.tide
    ? `潮回り: ${data.tide.moonTitle}, 満潮: ${data.tide.flood.map((f) => `${f.time}(${f.cm}cm)`).join('/')}, 干潮: ${data.tide.ebb.map((e) => `${e.time}(${e.cm}cm)`).join('/')}`
    : '潮汐情報なし';

  return `あなたは経験豊富な釣りアドバイザーです。以下の釣行記録をもとに、次回の釣行に活かせる短いアドバイスを2〜3文の日本語で書いてください。専門的になりすぎず、親しみやすい口調でお願いします。

ポイント: ${data.pointName}
釣果:
${fishSummary}
天気: ${weatherSummary}
潮汐: ${tideSummary}
メモ: ${data.memo || 'なし'}`;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    const parsedBody = JSON.parse(event.body) as GenerateAdviceRequestBody;
    const apiKey = await getApiKey();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: buildPrompt(parsedBody) }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Failed to generate advice' }),
      };
    }

    const result = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
    };

    const advice = result.content.find((c) => c.type === 'text')?.text ?? '';
    const responseBody: GenerateAdviceResponseBody = { advice };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error('Error generating advice:', error instanceof Error ? error.stack : error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
