import { APIGatewayProxyHandler } from 'aws-lambda';
// 開発者メモ: harbors.json は事前に生成し、このファイルと同じディレクトリに配置しておくこと
import harbors from './harbors.json';
import {
  TideInfoResponseBody,
  HarborMaster,
  TideApiResponse,
} from '../../../../package/shared-types/types';

const harborList = harbors as HarborMaster[];

// API Gateway経由でのアクセスに必要なCORSヘッダー（エラーレスポンス時にも必須）
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ハーバーサイン法による2点間の距離(km)を計算
function calcDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function findNearestHarbor(lat: number, lng: number): { harbor: HarborMaster; distanceKm: number } {
  let nearest: HarborMaster = harborList[0];
  let minDistance = Infinity;

  for (const harbor of harborList) {
    const distance = calcDistanceKm(lat, lng, harbor.latitude, harbor.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = harbor;
    }
  }

  return { harbor: nearest, distanceKm: minDistance };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const params = event.queryStringParameters ?? {};
    const lat = params.lat ? parseFloat(params.lat) : undefined;
    const lng = params.lng ? parseFloat(params.lng) : undefined;
    const date = params.date; // 形式: YYYY-MM-DD

    if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'lat/lng is required and must be valid numbers' }),
      };
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'date (YYYY-MM-DD) is required' }),
      };
    }

    const { harbor, distanceKm } = findNearestHarbor(lat, lng);
    const [yearStr, monthStr, dayStr] = date.split('-');

    // tide736 API を呼び出して潮汐情報を取得
    const tideUrl = `https://api.tide736.net/get_tide.php?pc=${harbor.prefectureCode}&hc=${harbor.harborCode}&yr=${yearStr}&mn=${Number(monthStr)}&dy=${Number(dayStr)}&rg=day`;
    const tideResponse = await fetch(tideUrl);
    const tideData = (await tideResponse.json()) as TideApiResponse;

    if (tideData.status !== 1 || !tideData.tide?.chart) {
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'Failed to fetch tide data from upstream API' }),
      };
    }

    const dayChart = tideData.tide.chart[date];

    if (!dayChart) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ message: 'No tide data available for the given date' }),
      };
    }

    const responseBody: TideInfoResponseBody = {
      harborName: harbor.harborName,
      distanceKm: Math.round(distanceKm * 10) / 10,
      sun: dayChart.sun,
      moon: dayChart.moon,
      ebb: dayChart.edd.map((e) => ({ time: e.time, unixMs: e.unix, cm: e.cm })),
      flood: dayChart.flood.map((f) => ({ time: f.time, unixMs: f.unix, cm: f.cm })),
      chart: dayChart.tide.map((t) => ({ time: t.time, unixMs: t.unix, cm: t.cm })),
    };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error('Error fetching tide info:', error instanceof Error ? error.stack : error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
