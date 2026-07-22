/**
 * =====================================================================
 * 1. API共通・ファイルメタデータ
 * =====================================================================
 */

/** アップロードするファイルのメタデータ */
export type UploadFileMetadata = {
  fileName: string;
  contentType: string;
};

/** S3アップロード用のPresigned URL取得リクエスト */
export type GetPresignedUrlRequestBody = {
  files: UploadFileMetadata[];
};

/** 最終的な釣果レポート送信リクエスト */
export type SubmitReportRequestBody = FinalFishingReport;

/** Presigned URL取得APIのレスポンス（個別アイテム） */
export type PresignedUrlResponse = {
  fileName: string;
  uploadUrl: string;
  s3Path: string;
};

/** Presigned URL取得APIのレスポンス全体 */
export type GetPresignedUrlResponseBody = {
  urls: PresignedUrlResponse[];
};

/** 釣果レポート登録APIのレスポンス */
export type SubmitReportResponseBody = {
  reportId: string;
  pointId: string;
};

/**
 * =====================================================================
 * 2. 釣果レポート関連（登録・タイムライン・写真）
 * =====================================================================
 */

/** 釣果タイムラインの1件分の型定義 */
export type TimelineItem = {
  id: string;
  checked: boolean;
  date: string;
  fishType: string;
  size: string;
  rigType: string;
  weight: string;
  hookSize: string;
};

/** 写真データの型定義（プレビュー管理用） */
export type PhotoItem = {
  file: File;
  previewUrl: string;
};

/** 最終的にサーバー（DynamoDB）に送信する釣果レポートの構造 */
export type FinalFishingReport = {
  time: {
    start: string;
    end: string;
  };
  photoKeys: string[];
  point: {
    code: string;
    customName: string | null;
  };
  fishTimeline: Omit<TimelineItem, 'checked'>[];
  memo: string;
};

/**
 * =====================================================================
 * 3. 釣果レポート関連（取得・一覧）
 * =====================================================================
 */

/** データベースに保存されている釣果レポート1件分の型 */
export type FishingReport = {
  userId: string;
  timestamp: number;
  reportId: string;
  pointId: string;
  time: {
    start: string;
    end: string;
  };
  photoKeys: string[];
  fishTimeline: Omit<TimelineItem, 'checked'>[];
  memo: string;
};

/** 釣果一覧取得APIのレスポンス型 */
export type ListReportsResponseBody = {
  reports: FishingReport[];
};

/**
 * =====================================================================
 * 4. 釣り場ポイント関連
 * =====================================================================
 */

/** 登録されている釣り場ポイント1件分の型 */
export type MyPoint = {
  pointId: string;
  pointName: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
  updatedAt?: number;
};

/** ポイント更新・登録リクエストのボディ */
export type UpdatePointRequestBody = {
  pointName: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

/** ポイント更新・登録APIのレスポンス */
export type UpdatePointResponseBody = {
  point: MyPoint;
};

/** ポイント一覧取得APIのレスポンス */
export type ListPointsResponseBody = {
  points: MyPoint[];
};

/**
 * =====================================================================
 * 5. 写真URL取得関連
 * =====================================================================
 */

/** 写真のPre-signed URL取得リクエスト */
export type GetPhotoUrlsRequestBody = {
  keys: string[];
};

/** 個別の写真URLアイテム */
export type PhotoUrlItem = {
  key: string;
  url: string;
};

/** 写真URL取得APIのレスポンス */
export type GetPhotoUrlsResponseBody = {
  urls: PhotoUrlItem[];
};

/**
 * =====================================================================
 * 6. 天気・潮汐・AIアドバイス関連
 * =====================================================================
 */

/** 潮汐の極大値（満潮・干潮）情報 */
export type TideExtremum = {
  time: string;
  unixMs: number;
  cm: number;
};

/** 潮汐チャート用の時系列ポイント */
export type TideChartPoint = {
  time: string;
  unixMs: number;
  cm: number;
};

/** 潮汐情報APIのレスポンス型 */
export type TideInfoResponseBody = {
  harborName: string;
  distanceKm: number;
  sun: {
    rise: string;
    set: string;
  };
  moon: {
    title: string;
    age: string;
  };
  ebb: TideExtremum[];
  flood: TideExtremum[];
  chart: TideChartPoint[];
};

/** AIアドバイス生成リクエストのボディ */
export type GenerateAdviceRequestBody = {
  pointName: string;
  fishTimeline: Omit<TimelineItem, 'checked'>[];
  memo: string;
  weather?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  tide?: {
    moonTitle: string;
    flood: { time: string; cm: number }[];
    ebb: { time: string; cm: number }[];
  };
};

/** AIアドバイス生成APIのレスポンス */
export type GenerateAdviceResponseBody = {
  advice: string;
};

/**
 * =====================================================================
 * 7. 外部潮汐API・マスターデータ関連
 * =====================================================================
 */

/** 港湾マスターデータの型 */
export type HarborMaster = {
  prefectureCode: number;
  harborCode: number;
  harborName: string;
  latitude: number;
  longitude: number;
};

/** 日別の潮汐チャートデータ */
export type TideDayChart = {
  sun: { rise: string; set: string };
  moon: { title: string; age: string };
  edd: Array<{ time: string; unix: number; cm: number }>;
  flood: Array<{ time: string; unix: number; cm: number }>;
  tide: Array<{ time: string; unix: number; cm: number }>;
};

/** 外部潮汐APIからの生レスポンス型 */
export type TideApiResponse = {
  status: number;
  tide?: {
    chart?: Record<string, TideDayChart>;
  };
};
