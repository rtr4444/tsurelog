import { postJson, getJson } from '../lib/apiClient';
import type {
  GetPresignedUrlRequestBody,
  GetPresignedUrlResponseBody,
  PresignedUrlResponse,
  FinalFishingReport,
  SubmitReportRequestBody,
  SubmitReportResponseBody,
  FishingReport,
  ListReportsResponseBody,
} from '../../../package/shared-types/types';

export type ListReportsFilters = {
  pointId?: string;
  startDate?: string;
  endDate?: string;
};

/**
 * アップロード対象のファイル群から、S3のPre-signed URLをまとめて取得する
 */
export async function getPresignedUrls(files: File[]): Promise<PresignedUrlResponse[]> {
  const requestBody: GetPresignedUrlRequestBody = {
    files: files.map((file) => ({
      fileName: file.name,
      contentType: file.type,
    })),
  };

  const response = await postJson<GetPresignedUrlResponseBody>('/presigned-url', requestBody);
  return response.urls;
}

/**
 * Pre-signed URLに対してファイルを直接PUTし、S3へアップロードする
 */
export async function uploadPhotoToS3(file: File, uploadUrl: string): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`S3アップロードに失敗しました: ${file.name} (status: ${response.status})`);
  }
}

/**
 * 最終的な釣果レポートをDynamoDBへ保存する（submit-report Lambda）
 */
export async function submitFinalReport(
  data: FinalFishingReport,
): Promise<SubmitReportResponseBody> {
  const requestBody: SubmitReportRequestBody = data;
  return postJson<SubmitReportResponseBody>('/catches', requestBody);
}

/**
 * 釣果レポートの一覧を取得する（絞り込み対応）
 */
export async function getReports(filters: ListReportsFilters = {}): Promise<FishingReport[]> {
  const params: Record<string, string> = {};
  if (filters.pointId) params.pointId = filters.pointId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const response = await getJson<ListReportsResponseBody>('/catches', params);
  return response.reports;
}
