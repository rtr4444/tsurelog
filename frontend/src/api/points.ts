import { getJson, putJson } from '../lib/apiClient';
import type {
  MyPoint,
  ListPointsResponseBody,
  UpdatePointRequestBody,
  UpdatePointResponseBody,
} from '../../../package/shared-types/types';

/**
 * 登録済みの釣行ポイント一覧を取得する
 */
export async function getPoints(): Promise<MyPoint[]> {
  const response = await getJson<ListPointsResponseBody>('/points');
  return response.points;
}

/**
 * 釣行ポイントを更新する
 */
export async function updatePoint(pointId: string, data: UpdatePointRequestBody): Promise<MyPoint> {
  const response = await putJson<UpdatePointResponseBody>(`/points/${pointId}`, data);
  return response.point;
}
