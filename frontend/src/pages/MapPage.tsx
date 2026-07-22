import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { PageHeader } from '../components/ui/PageHeader';
import { getPoints } from '../api/points';
import { markerIcon } from '../lib/leafletIcon';
import '../css/report_map.css';
import type { MyPoint } from '../../../package/shared-types/types';

const DEFAULT_CENTER: [number, number] = [34.6937, 135.5023]; // 大阪駅付近

/**
 * 釣果マップを表示し、各ポイントの詳細や釣果一覧への遷移を行うコンポーネント
 */
export default function ReportMap() {
  const navigate = useNavigate();
  const pageHeader = { header: '🗺️ 釣果マップ', link: '/' };

  const [points, setPoints] = useState<MyPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getPoints()
      .then(setPoints)
      .catch((error) => {
        console.error('Failed to fetch points:', error);
        setLoadError('ポイント一覧の取得に失敗しました');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const pointsWithLocation = points.filter(
    (p) => p.latitude !== undefined && p.longitude !== undefined,
  );

  const mapCenter: [number, number] =
    pointsWithLocation.length > 0
      ? [pointsWithLocation[0].latitude!, pointsWithLocation[0].longitude!]
      : DEFAULT_CENTER;

  return (
    <div>
      <PageHeader header={pageHeader.header} link={pageHeader.link} />

      <main className="report-map-container">
        {isLoading && <p>読み込み中...</p>}
        {loadError && <p className="error-message">{loadError}</p>}

        {!isLoading && !loadError && (
          <MapContainer center={mapCenter} zoom={11} style={{ height: '70vh', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {pointsWithLocation.map((point) => (
              <Marker
                key={point.pointId}
                position={[point.latitude!, point.longitude!]}
                icon={markerIcon}
              >
                <Popup>
                  <div className="report-map-popup">
                    <p className="report-map-popup-name">📍 {point.pointName}</p>
                    <button
                      type="button"
                      className="btn-view-reports"
                      onClick={() => navigate(`/reports/list?pointId=${point.pointId}`)}
                    >
                      この釣果を見る
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {!isLoading && !loadError && pointsWithLocation.length === 0 && (
          <p>位置情報が登録されているポイントがありません</p>
        )}
      </main>
    </div>
  );
}
