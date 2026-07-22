export function weatherCodeToLabel(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: '快晴' };
  if (code <= 3) return { emoji: '⛅', label: '晴れ/曇り' };
  if (code <= 48) return { emoji: '🌫️', label: '霧' };
  if (code <= 67) return { emoji: '🌧️', label: '雨' };
  if (code <= 77) return { emoji: '❄️', label: '雪' };
  if (code <= 82) return { emoji: '🌦️', label: 'にわか雨' };
  if (code <= 99) return { emoji: '⛈️', label: '雷雨' };
  return { emoji: '❓', label: '不明' };
}
