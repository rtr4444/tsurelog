import { useEffect, useState } from 'react';
import { getPoints } from '../api/points';
import type { MyPoint } from '../../../package/shared-types/types';

interface FishingPointProps {
  selectedPoint: string;
  setSelectedPoint: React.Dispatch<React.SetStateAction<string>>;
  newPointName: string;
  setNewPointName: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * 釣り場ポイントの選択および新規ポイント入力を行うコンポーネント
 */
export default function FishingPointSelect({
  selectedPoint,
  setSelectedPoint,
  newPointName,
  setNewPointName,
}: FishingPointProps) {
  const [points, setPoints] = useState<MyPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getPoints()
      .then((fetchedPoints) => {
        if (isMounted) setPoints(fetchedPoints);
      })
      .catch((error) => {
        console.error('Failed to fetch points:', error);
        if (isMounted) setLoadError('ポイント一覧の取得に失敗しました');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePointChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedPoint(value);

    if (value !== 'other') {
      setNewPointName('');
    }
  };

  return (
    <div className="point-selection-box">
      <label className="point-label">📍 釣り場ポイント</label>

      <select
        value={selectedPoint}
        onChange={handlePointChange}
        className="point-select"
        disabled={isLoading}
      >
        <option value="">{isLoading ? '読み込み中...' : '-- ポイントを選択してください --'}</option>
        {points.map((point) => (
          <option key={point.pointId} value={point.pointId}>
            {point.pointName}
          </option>
        ))}
        <option value="other">その他（新しいポイントを登録する）</option>
      </select>

      {loadError && <p className="point-error">{loadError}</p>}

      {selectedPoint === 'other' && (
        <div className="new-point-area">
          <label className="new-point-label">新しいポイント名</label>
          <input
            type="text"
            className="new-point-input"
            placeholder="例：神戸港"
            required={selectedPoint === 'other'}
            value={newPointName}
            onChange={(e) => setNewPointName(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
