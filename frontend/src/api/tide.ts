import { getJson } from '../lib/apiClient';
import type { TideInfoResponseBody } from '../../../package/shared-types/types';

/**
 * 指定された位置と日付の潮汐情報を取得する
 */
export async function getTideInfo(
  lat: number,
  lng: number,
  date: string, // YYYY-MM-DD
): Promise<TideInfoResponseBody> {
  return getJson<TideInfoResponseBody>('/tide', {
    lat: String(lat),
    lng: String(lng),
    date,
  });
}
