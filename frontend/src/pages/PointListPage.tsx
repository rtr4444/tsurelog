import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/ui/PageHeader';
import { getPoints } from '../api/points';
import '../css/point_list.css';
import type { MyPoint } from '../../../package/shared-types/types';

/**
 * 釣り場ポイントの一覧表示、検索、新規登録への導線を提供するコンポーネント
 */
export default function PointList() {
  const navigate = useNavigate();
  const pageHeader = { header: '📍 ポイント一覧', link: '/' };

  const [points, setPoints] = useState<MyPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string>('');

  useEffect(() => {
    getPoints()
      .then(setPoints)
      .catch((error) => {
        console.error('Failed to fetch points:', error);
        setLoadError('ポイント一覧の取得に失敗しました');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredPoints = points.filter(
    (p) =>
      p.pointName.toLowerCase().includes(keyword.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(keyword.toLowerCase()),
  );

  return (
    <div>
      <PageHeader header={pageHeader.header} link={pageHeader.link} />

      <main className="point-list-container">
        <div className="point-list-header-area">
          <input
            type="text"
            placeholder="キーワード検索..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="point-search-input"
          />
          <button className="btn-add-point" onClick={() => navigate('/points/new')}>
            ＋ 新規登録
          </button>
        </div>

        {isLoading && <p>読み込み中...</p>}
        {loadError && <p className="error-message">{loadError}</p>}
        {!isLoading && !loadError && filteredPoints.length === 0 && <p>ポイントがありません</p>}

        <div className="point-card-list">
          {filteredPoints.map((point) => {
            const hasLocation = point.latitude !== undefined && point.longitude !== undefined;

            return (
              <button
                key={point.pointId}
                type="button"
                className="point-card"
                onClick={() => navigate(`/points/edit/${point.pointId}`)}
              >
                <div className="point-card-header">
                  <span>
                    {hasLocation ? '📍' : '⚠️'} {point.pointName}
                  </span>
                </div>

                {point.description && <p className="point-description">{point.description}</p>}

                <p className="point-address">住所: {point.address ?? '未登録'}</p>

                {hasLocation ? (
                  <p className="point-latlng">
                    [ {point.latitude!.toFixed(4)}, {point.longitude!.toFixed(4)} ]
                  </p>
                ) : (
                  <p className="point-latlng point-latlng-missing">位置情報が未登録です</p>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
