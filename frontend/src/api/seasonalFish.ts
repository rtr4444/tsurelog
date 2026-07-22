export type SeasonalFishEntry = {
  fishNames: string[];
  description: string;
  photoUrls: string[];
};

type SeasonalFishJson = Record<
  string,
  {
    fishNames: string[];
    description: string;
    photoKeys: string[];
  }
>;

const BUCKET_URL = import.meta.env.VITE_SEASONAL_FISH_BUCKET_URL;

/**
 * 指定された月の旬の魚情報を取得する
 */
export async function getSeasonalFish(month: number): Promise<SeasonalFishEntry | null> {
  if (!BUCKET_URL) {
    console.warn('VITE_SEASONAL_FISH_BUCKET_URL is not defined.');
    return null;
  }

  const response = await fetch(`${BUCKET_URL}/seasonal-fish.json`);
  if (!response.ok) throw new Error('旬の魚情報の取得に失敗しました');

  const data: SeasonalFishJson = await response.json();
  const entry = data[String(month)];

  if (!entry) return null;

  return {
    fishNames: entry.fishNames,
    description: entry.description,
    // 写真は最大2件までに制限
    photoUrls: entry.photoKeys.slice(0, 2).map((key) => `${BUCKET_URL}/${key}`),
  };
}
