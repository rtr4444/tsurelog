export type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

/**
 * 住所からジオコーディング（緯度経度を取得）する（OpenStreetMap Nominatim）
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({ q: address, format: 'json', limit: '1' });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);

  if (!response.ok) throw new Error('住所検索に失敗しました');

  const results: Array<{ lat: string; lon: string; display_name: string }> = await response.json();

  if (results.length === 0) return null;

  return {
    latitude: parseFloat(results[0].lat),
    longitude: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}

/**
 * 緯度経度から住所を取得する（リバースジオコーディング）
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), format: 'json' });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);

  if (!response.ok) throw new Error('住所の取得に失敗しました');

  const result: { display_name?: string } = await response.json();
  return result.display_name ?? null;
}
