import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PageHeader } from '../components/ui/PageHeader';
import { getPoints, updatePoint } from '../api/points';
import { geocodeAddress, reverseGeocode } from '../api/geocoding';
import { markerIcon } from '../lib/leafletIcon';
import '../css/point_edit.css';

const DEFAULT_CENTER: [number, number] = [34.6937, 135.5023]; // 大阪駅付近

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 16);
  }, [center, map]);
  return null;
}

/**
 * 地図の長押しでピンを立てるコンポーネント
 */
function LongPressHandler({ onLongPress }: { onLongPress: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let moved = false;

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const handleStart = (e: L.LeafletMouseEvent) => {
      moved = false;
      timer = setTimeout(() => {
        if (!moved) onLongPress(e.latlng.lat, e.latlng.lng);
      }, 100);
    };

    const handleMove = () => {
      moved = true;
      clearTimer();
    };

    map.on('mousedown', handleStart);
    map.on('mousemove', handleMove);
    map.on('mouseup', clearTimer);
    map.on('touchstart', handleStart as unknown as L.LeafletEventHandlerFn);
    map.on('touchmove', handleMove);
    map.on('touchend', clearTimer);

    return () => {
      map.off('mousedown', handleStart);
      map.off('mousemove', handleMove);
      map.off('mouseup', clearTimer);
      map.off('touchstart', handleStart as unknown as L.LeafletEventHandlerFn);
      map.off('touchmove', handleMove);
      map.off('touchend', clearTimer);
      clearTimer();
    };
  }, [map, onLongPress]);

  return null;
}

/**
 * 釣り場ポイントの編集・新規登録を行うコンポーネント
 */
export default function PointEdit() {
  const navigate = useNavigate();
  const { pointId } = useParams<{ pointId: string }>();
  const isNew = !pointId || pointId === 'new';

  const pageHeader = { header: '📍 ポイント編集・登録', link: '/points/list' };

  const [pointName, setPointName] = useState('');
  const [description, setDescription] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !pointId) return;

    getPoints()
      .then((points) => {
        const target = points.find((p) => p.pointId === pointId);
        if (!target) {
          setErrorMessage('指定されたポイントが見つかりませんでした');
          return;
        }
        setPointName(target.pointName);
        setDescription(target.description ?? '');
        setResolvedAddress(target.address ?? '');
        if (target.latitude !== undefined && target.longitude !== undefined) {
          setPosition([target.latitude, target.longitude]);
          setMapCenter([target.latitude, target.longitude]);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch point info:', error);
        setErrorMessage('ポイント情報の取得に失敗しました');
      })
      .finally(() => setIsLoading(false));
  }, [isNew, pointId]);

  const handleAddressSearch = async () => {
    if (!addressInput.trim()) return;

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const result = await geocodeAddress(addressInput);
      if (!result) {
        setErrorMessage('該当する住所が見つかりませんでした');
        return;
      }
      setPosition([result.latitude, result.longitude]);
      setMapCenter([result.latitude, result.longitude]);
      setResolvedAddress(result.displayName);
    } catch (error) {
      console.error('Failed to search address:', error);
      setErrorMessage('住所検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLongPress = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setErrorMessage(null);

    try {
      const address = await reverseGeocode(lat, lng);
      setResolvedAddress(address ?? '');
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
    }
  };

  const handleSave = async () => {
    if (!pointName.trim()) {
      setErrorMessage('ポイント名を入力してください');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const targetPointId = isNew ? crypto.randomUUID() : pointId!;

      await updatePoint(targetPointId, {
        pointName,
        description: description || undefined,
        address: resolvedAddress || undefined,
        latitude: position?.[0],
        longitude: position?.[1],
      });

      navigate('/points/list');
    } catch (error) {
      console.error('Failed to save point:', error);
      setErrorMessage('保存に失敗しました。時間をおいて再度お試しください');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader header={pageHeader.header} link={pageHeader.link} />
        <p className="point-edit-loading">読み込み中...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader header={pageHeader.header} link={pageHeader.link} />

      <main className="point-edit-container">
        <label className="point-edit-label">ポイント名</label>
        <input
          type="text"
          className="point-edit-input"
          value={pointName}
          onChange={(e) => setPointName(e.target.value)}
        />

        <label className="point-edit-label">説明</label>
        <textarea
          className="point-edit-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <h3 className="point-edit-section-title">▼ 位置情報の登録・変更</h3>

        <div className="point-edit-search-row">
          <input
            type="text"
            className="point-edit-input"
            placeholder="住所を入力して検索..."
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
          />
          <button
            type="button"
            className="btn-search-address"
            onClick={handleAddressSearch}
            disabled={isSearching}
          >
            {isSearching ? '検索中...' : '確定'}
          </button>
        </div>

        <div className="point-edit-map">
          <MapContainer
            center={mapCenter ?? DEFAULT_CENTER}
            zoom={position ? 16 : 12}
            style={{ height: '280px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {position && <Marker position={position} icon={markerIcon} />}
            <MapController center={mapCenter} />
            <LongPressHandler onLongPress={handleLongPress} />
          </MapContainer>
        </div>

        <p className="point-edit-resolved-address">取得住所: {resolvedAddress || '未登録'}</p>
        <p className="point-edit-resolved-latlng">
          緯度経度: {position ? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}` : '未登録'}
        </p>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="point-edit-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/points/list')}>
            キャンセル
          </button>
          <button type="button" className="btn-save" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中...' : 'この内容で保存'}
          </button>
        </div>
      </main>
    </div>
  );
}
