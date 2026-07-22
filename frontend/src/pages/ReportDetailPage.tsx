import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '../components/ui/PageHeader';
import { getReports } from '../api/fishingReport';
import { getPoints } from '../api/points';
import { getPhotoUrls } from '../api/photos';
import { getWeatherInfo, type WeatherInfo } from '../api/weather';
import { getTideInfo } from '../api/tide';
import { generateAdvice } from '../api/advice';
import { weatherCodeToLabel } from '../utils/weatherCode';
import '../css/report_detail.css';
import type {
  FishingReport,
  MyPoint,
  TideInfoResponseBody,
} from '../../../package/shared-types/types';

function formatDuration(start: string, end: string): string {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}時間${minutes}分`;
}

/**
 * 釣果の詳細情報、天気・潮汐グラフ、AIアドバイスなどを表示するコンポーネント
 */
export default function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const pageHeader = { header: '🐟 釣果詳細', link: '/reports/list' };

  const [report, setReport] = useState<FishingReport | null>(null);
  const [point, setPoint] = useState<MyPoint | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [tide, setTide] = useState<TideInfoResponseBody | null>(null);

  const [advice, setAdvice] = useState<string | null>(null);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;

    (async () => {
      try {
        const [reports, points] = await Promise.all([getReports(), getPoints()]);
        const targetReport = reports.find((r) => r.reportId === reportId);

        if (!targetReport) {
          setLoadError('指定された釣果が見つかりませんでした');
          return;
        }

        setReport(targetReport);

        const targetPoint = points.find((p) => p.pointId === targetReport.pointId) ?? null;
        setPoint(targetPoint);

        if (targetReport.photoKeys.length > 0) {
          const urls = await getPhotoUrls(targetReport.photoKeys);
          setPhotoUrls(urls.map((u) => u.url));
        }

        if (
          targetPoint &&
          targetPoint.latitude !== undefined &&
          targetPoint.longitude !== undefined
        ) {
          const date = targetReport.time.start.split('T')[0];

          const [weatherResult, tideResult] = await Promise.allSettled([
            getWeatherInfo(targetPoint.latitude, targetPoint.longitude, date),
            getTideInfo(targetPoint.latitude, targetPoint.longitude, date),
          ]);

          if (weatherResult.status === 'fulfilled') setWeather(weatherResult.value);
          if (tideResult.status === 'fulfilled') setTide(tideResult.value);
        }
      } catch (error) {
        console.error('Failed to fetch report details:', error);
        setLoadError('釣果詳細の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [reportId]);

  const handleGenerateAdvice = async () => {
    if (!report || !point) return;

    setIsGeneratingAdvice(true);
    setAdviceError(null);

    try {
      const result = await generateAdvice({
        pointName: point.pointName,
        fishTimeline: report.fishTimeline,
        memo: report.memo,
        weather: weather
          ? {
              temperature: weather.temperature,
              humidity: weather.humidity,
              windSpeed: weather.windSpeed,
            }
          : undefined,
        tide: tide
          ? {
              moonTitle: tide.moon.title,
              flood: tide.flood.map((f) => ({ time: f.time, cm: f.cm })),
              ebb: tide.ebb.map((e) => ({ time: e.time, cm: e.cm })),
            }
          : undefined,
      });
      setAdvice(result);
    } catch (error) {
      console.error('Failed to generate AI advice:', error);
      setAdviceError('AIアドバイスの生成に失敗しました');
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader header={pageHeader.header} link={pageHeader.link} />
        <p className="report-detail-loading">読み込み中...</p>
      </div>
    );
  }

  if (loadError || !report) {
    return (
      <div>
        <PageHeader header={pageHeader.header} link={pageHeader.link} />
        <p className="error-message">{loadError}</p>
      </div>
    );
  }

  const weatherLabel = weather ? weatherCodeToLabel(weather.weatherCode) : null;

  return (
    <div>
      <PageHeader header={pageHeader.header} link={pageHeader.link} />

      <main className="report-detail-container">
        <p className="report-detail-date">
          {new Date(report.time.start).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </p>

        {photoUrls.length > 0 ? (
          <div className="photo-carousel">
            <img
              src={photoUrls[activePhotoIndex]}
              alt=""
              className="photo-carousel-main"
              onClick={() => navigate('#')}
            />
            <div className="photo-carousel-thumbnails">
              {photoUrls.map((url, index) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className={`photo-thumbnail ${index === activePhotoIndex ? 'active' : ''}`}
                  onClick={() => setActivePhotoIndex(index)}
                />
              ))}
            </div>
            <p className="photo-count-label">釣果写真（{photoUrls.length}枚）</p>
          </div>
        ) : (
          <div className="photo-carousel-placeholder">写真なし</div>
        )}

        <div className="info-card-row">
          <div className="info-card">
            <p className="info-card-title">天気・気温</p>
            {weather ? (
              <>
                <p className="info-card-main">
                  {weatherLabel?.emoji} {weatherLabel?.label}
                </p>
                <p>
                  {weather.temperature}℃ / 湿度{weather.humidity}%
                </p>
                {point && <p className="info-card-sub">📍 {point.pointName}</p>}
              </>
            ) : (
              <p>天気情報を取得できませんでした</p>
            )}
          </div>

          <div className="info-card">
            <p className="info-card-title">🕐 釣行時間</p>
            <p>
              開始:{' '}
              {new Date(report.time.start).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p>
              終了:{' '}
              {new Date(report.time.end).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p>合計: {formatDuration(report.time.start, report.time.end)}</p>
          </div>
        </div>

        {(tide || weather) && (
          <div className="chart-section">
            <p className="chart-section-title">潮汐情報・天気予報</p>

            {weather && weather.hourlyWindSpeed.length > 0 && (
              <>
                <p className="chart-label">風速予報</p>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={weather.hourlyWindSpeed}>
                    <XAxis dataKey="time" tickFormatter={(t) => t.split('T')[1]} fontSize={10} />
                    <YAxis fontSize={10} unit="m/s" />
                    <Tooltip labelFormatter={(t) => t} />
                    <Line type="monotone" dataKey="windSpeed" stroke="#3498db" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}

            {tide && tide.chart.length > 0 && (
              <>
                <p className="chart-label">
                  潮位（{tide.moon.title} / {tide.harborName}）
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={tide.chart}>
                    <XAxis dataKey="time" fontSize={10} />
                    <YAxis fontSize={10} unit="cm" />
                    <Tooltip />
                    <Area type="monotone" dataKey="cm" stroke="#2980b9" fill="#aed6f1" />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}

        <div className="timeline-section">
          <p className="section-title">釣果タイムライン</p>
          {report.fishTimeline.length === 0 ? (
            <p>釣果なし</p>
          ) : (
            <ul className="timeline-list">
              {report.fishTimeline.map((fish) => (
                <li key={fish.id} className="timeline-item">
                  <span className="timeline-time">
                    {new Date(fish.date).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className="timeline-detail">
                    <p className="timeline-fish-type">{fish.fishType}</p>
                    <p>
                      {fish.size}cm / {fish.weight}g
                    </p>
                    <p>
                      {fish.rigType} {fish.hookSize}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="memo-section">
          <p className="section-title">メモ・備考</p>
          <p>{report.memo || 'なし'}</p>
        </div>

        <div className="advice-section">
          <p className="section-title">🤖 AIアドバイス</p>
          {advice ? (
            <p className="advice-text">{advice}</p>
          ) : (
            <button
              type="button"
              className="btn-generate-advice"
              onClick={handleGenerateAdvice}
              disabled={isGeneratingAdvice}
            >
              {isGeneratingAdvice ? '生成中...' : 'AIアドバイスを生成する'}
            </button>
          )}
          {adviceError && <p className="error-message">{adviceError}</p>}
        </div>
      </main>
    </div>
  );
}
