import { postJson } from '../lib/apiClient';
import type {
  GetPhotoUrlsRequestBody,
  GetPhotoUrlsResponseBody,
  PhotoUrlItem,
} from '../../../package/shared-types/types';

/**
 * 指定されたオブジェクトキーのリストから、写真閲覧用のPre-signed URLをまとめて取得する
 */
export async function getPhotoUrls(keys: string[]): Promise<PhotoUrlItem[]> {
  if (keys.length === 0) return [];

  const requestBody: GetPhotoUrlsRequestBody = { keys };
  const response = await postJson<GetPhotoUrlsResponseBody>('/photo-url', requestBody);
  return response.urls;
}