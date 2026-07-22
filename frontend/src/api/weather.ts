export type WeatherInfo = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  hourlyWindSpeed: { time: string; windSpeed: number }[];
};

/**
 * 指定された位置と日付の天気情報をOpen-Meteo APIから取得する
 */
export async function getWeatherInfo(
  lat: number,
  lng: number,
  date: string, // YYYY-MM-DD
): Promise<WeatherInfo> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    timezone: 'Asia/Tokyo',
    start_date: date,
    end_date: date,
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error('天気情報の取得に失敗しました');

  const data = await response.json();
  const hourly = data.hourly as {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    weather_code: number[];
  };

  // 代表値として正午(12時)のデータを採用
  const noonIndex = hourly.time.findIndex((t) => t.endsWith('T12:00'));
  const index = noonIndex >= 0 ? noonIndex : 0;

  return {
    temperature: hourly.temperature_2m[index],
    humidity: hourly.relative_humidity_2m[index],
    windSpeed: hourly.wind_speed_10m[index],
    weatherCode: hourly.weather_code[index],
    hourlyWindSpeed: hourly.time.map((t, i) => ({ time: t, windSpeed: hourly.wind_speed_10m[i] })),
  };
}
