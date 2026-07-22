import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { getReports } from '../api/fishingReport';
import { getPoints } from '../api/points';
import { getPhotoUrls } from '../api/photos';
import { useSearchParams } from 'react-router';
import { useNavigate } from 'react-router';
import '../css/report_list.css';
import type { FishingReport, MyPoint } from '../../../package/shared-types/types';

/**
 * 釣果レポートの一覧表示およびフィルタリングを行うコンポーネント
 */
export default function FishingReportList() {
  const navigate = useNavigate();
  const pageHeader = { header: '📋 釣果一覧', link: '/' };

  const [reports, setReports] = useState<FishingReport[]>([]);
  const [points, setPoints] = useState<MyPoint[]>([]);
  const [photoUrlMap, setPhotoUrlMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [pointFilter, setPointFilter] = useState<string>(searchParams.get('pointId') ?? '');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  useEffect(() => {
    getPoints()
      .then(setPoints)
      .catch((error) => console.error('Failed to fetch points:', error));
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    getReports({
      pointId: pointFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    })
      .then((data) => {
        if (isMounted) setReports(data);
      })
      .catch((error) => {
        console.error('Failed to fetch reports:', error);
        if (isMounted) setLoadError('釣果一覧の取得に失敗しました');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pointFilter, startDateFilter, endDateFilter]);

  // 各レポートの先頭の写真の Pre-signed URL をまとめて取得
  useEffect(() => {
    const firstPhotoKeys = reports
      .map((r) => r.photoKeys[0])
      .filter((key): key is string => Boolean(key));

    if (firstPhotoKeys.length === 0) {
      setPhotoUrlMap({});
      return;
    }

    getPhotoUrls(firstPhotoKeys)
      .then((urls) => {
        const map: Record<string, string> = {};
        urls.forEach((u) => {
          map[u.key] = u.url;
        });
        setPhotoUrlMap(map);
      })
      .catch((error) => console.error('Failed to fetch photo URLs:', error));
  }, [reports]);

  const getPointName = (pointId: string) =>
    points.find((p) => p.pointId === pointId)?.pointName ?? pointId;

  return (
    <div>
      <PageHeader header={pageHeader.header} link={pageHeader.link} />

      <main className="list-container">
        <div className="report-list-filter-area">
          <select value={pointFilter} onChange={(e) => setPointFilter(e.target.value)}>
            <option value="">すべてのポイント</option>
            {points.map((point) => (
              <option key={point.pointId} value={point.pointId}>
                {point.pointName}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
          />
          <span>〜</span>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
          />
        </div>

        {isLoading && <p>読み込み中...</p>}
        {loadError && <p className="error-message">{loadError}</p>}
        {!isLoading && !loadError && reports.length === 0 && <p>釣果レポートがまだありません</p>}

        <div className="report-card-list">
          {reports.map((report) => {
            const firstPhotoKey = report.photoKeys[0];
            const thumbnailUrl = firstPhotoKey ? photoUrlMap[firstPhotoKey] : undefined;

            return (
              <div
                key={report.reportId}
                className="report-card"
                onClick={() => navigate(`/reports/${report.reportId}`)}
              >
                <div className="report-card-thumbnail">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="" className="report-thumbnail-img" />
                  ) : (
                    <div className="report-thumbnail-placeholder" />
                  )}
                </div>

                <div className="report-card-body">
                  <div className="report-card-header">
                    <span className="report-point-name">📍 {getPointName(report.pointId)}</span>
                    <span className="report-date">
                      {new Date(report.time.start).toLocaleString('ja-JP')}
                    </span>
                  </div>

                  <div className="report-fish-list">
                    {report.fishTimeline.length === 0 ? (
                      <p>釣果なし</p>
                    ) : (
                      report.fishTimeline.map((fish) => (
                        <span key={fish.id} className="fish-tag">
                          🐟 {fish.fishType}（{fish.size}cm）
                        </span>
                      ))
                    )}
                  </div>

                  {report.memo && <p className="report-memo">{report.memo}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
