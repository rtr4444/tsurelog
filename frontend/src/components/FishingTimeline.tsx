import { useState } from 'react';

type TimelineItem = {
  id: string;
  checked: boolean;
  date: string;
  fishType: string;
  size: string;
  rigType: string;
  weight: string;
  hookSize: string;
};

interface FishingTimelineProps {
  timelineList: TimelineItem[];
  setTimelineList: React.Dispatch<React.SetStateAction<TimelineItem[]>>;
}

/**
 * 釣果タイムラインの入力および一括変更を行うコンポーネント
 */
export default function FishingTimeline({ timelineList, setTimelineList }: FishingTimelineProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [bulkData, setBulkData] = useState({
    fishType: '',
    size: '',
    rigType: '',
    weight: '',
    hookSize: '',
  });

  const handleAddTimeline = () => {
    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      checked: false,
      date: '',
      fishType: '',
      size: '',
      rigType: '',
      weight: '',
      hookSize: '',
    };
    setTimelineList((prev) => [...prev, newItem]);
  };

  const handleDeleteRow = (targetId: string) => {
    setTimelineList((prev) => prev.filter((item) => item.id !== targetId));
  };

  const handleFieldChange = (id: string, key: keyof TimelineItem, value: string | boolean) => {
    setTimelineList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [key]: value };
        }
        return item;
      }),
    );
  };

  const handleBulkFieldChange = (key: string, value: string) => {
    setBulkData((prev) => ({ ...prev, [key]: value }));
  };

  const modalCheck = () => {
    const checkedItems = timelineList.filter((item) => item.checked);
    if (checkedItems.length === 0) {
      alert('変更対象がチェックされていません');
      return;
    }
    setIsModalOpen(true);
  };

  const handleBulkApply = () => {
    const isConfirmed = window.confirm('一括反映してもよろしいでしょうか');
    if (!isConfirmed) return;

    setTimelineList((prev) =>
      prev.map((item) => {
        if (item.checked) {
          return {
            ...item,
            fishType: bulkData.fishType || item.fishType,
            size: bulkData.size || item.size,
            rigType: bulkData.rigType || item.rigType,
            weight: bulkData.weight || item.weight,
            hookSize: bulkData.hookSize || item.hookSize,
            checked: false,
          };
        }
        return item;
      }),
    );

    setIsModalOpen(false);
    setBulkData({ fishType: '', size: '', rigType: '', weight: '', hookSize: '' });
  };

  return (
    <section className="form-section">
      <h2 className="section-title">🐟 釣果タイムライン</h2>

      <div className="timeline-list">
        {timelineList.map((item, index) => (
          <div key={item.id} className="timeline-row">
            <div className="timeline-field">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => handleFieldChange(item.id, 'checked', e.target.checked)}
              />
              <span>{index + 1}尾目</span>
            </div>

            <div className="timeline-field">
              <input
                type="datetime-local"
                className="timeline-input input-datetime"
                value={item.date}
                onChange={(e) => handleFieldChange(item.id, 'date', e.target.value)}
              />
            </div>

            <div className="timeline-field">
              <select
                className="timeline-input"
                value={item.fishType}
                onChange={(e) => handleFieldChange(item.id, 'fishType', e.target.value)}
              >
                <option value="">-- 魚種 --</option>
                <option value="アジ">-- アジ --</option>
                <option value="メバル">-- メバル --</option>
                <option value="カサゴ">-- カサゴ --</option>
                <option value="グレ">-- グレ --</option>
                <option value="青物">-- 青物 --</option>
              </select>
            </div>

            <div className="timeline-field">
              <input
                type="number"
                min="10"
                max="200"
                placeholder="サイズ"
                className="timeline-input input-size"
                value={item.size}
                onChange={(e) => handleFieldChange(item.id, 'size', e.target.value)}
              />
              <span>cm</span>
            </div>

            <div className="timeline-field">
              <select
                className="timeline-input"
                value={item.rigType}
                onChange={(e) => handleFieldChange(item.id, 'rigType', e.target.value)}
              >
                <option value="">-- 仕掛け --</option>
                <option value="ジグヘッド">-- ジグヘッド --</option>
                <option value="メタルジグ">-- メタルジグ --</option>
                <option value="ダウンショット">-- ダウンショット --</option>
                <option value="フリーリグ">-- フリーリグ --</option>
              </select>
            </div>

            <div className="timeline-field">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="200"
                placeholder="重量"
                className="timeline-input input-weight"
                value={item.weight}
                onChange={(e) => handleFieldChange(item.id, 'weight', e.target.value)}
              />
              <span>g</span>
            </div>

            <div className="timeline-field">
              <select
                className="timeline-input"
                value={item.hookSize}
                onChange={(e) => handleFieldChange(item.id, 'hookSize', e.target.value)}
              >
                <option value="">-- フック --</option>
                <option value="#10">#10</option>
                <option value="#8">#8</option>
                <option value="#6">#6</option>
                <option value="#4">#4</option>
              </select>
            </div>

            <button
              type="button"
              className="btn-timeline btn-delete-row"
              onClick={() => handleDeleteRow(item.id)}
            >
              削除
            </button>
          </div>
        ))}

        {timelineList.length === 0 && (
          <p style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>
            下のボタンを押して、釣果を追加してください。
          </p>
        )}
      </div>

      <div className="timeline-actions">
        <button type="button" className="btn-timeline btn-add" onClick={handleAddTimeline}>
          ➕ 釣果タイムラインを追加
        </button>

        <button type="button" className="btn-timeline btn-bulk" onClick={modalCheck}>
          🔄️ 釣果タイムライン一括変更
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">🔄 釣果タイムライン 一括変更</h3>

            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>
              ※メイン画面でチェックを入れた尾数に対して、ここで入力した項目を一括反映します（日時は変更されません）。入力しなかった項目は元のデータが維持されます。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="modal-form-group">
                <label className="point-label">魚種</label>
                <select
                  className="point-select"
                  value={bulkData.fishType}
                  onChange={(e) => handleBulkFieldChange('fishType', e.target.value)}
                >
                  <option value="">-- 変更なし --</option>
                  <option value="アジ">-- アジ --</option>
                  <option value="メバル">-- メバル --</option>
                  <option value="カサゴ">-- カサゴ --</option>
                  <option value="グレ">-- グレ --</option>
                  <option value="青物">-- 青物 --</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label className="point-label">サイズ (cm)</label>
                <input
                  type="number"
                  className="new-point-input"
                  min="10"
                  max="200"
                  placeholder="変更なし"
                  value={bulkData.size}
                  onChange={(e) => handleBulkFieldChange('size', e.target.value)}
                />
                <span>cm</span>
              </div>

              <div className="modal-form-group">
                <label className="point-label">仕掛けの種類</label>
                <select
                  className="point-select"
                  value={bulkData.rigType}
                  onChange={(e) => handleBulkFieldChange('rigType', e.target.value)}
                >
                  <option value="">-- 変更なし --</option>
                  <option value="ジグヘッド">-- ジグヘッド --</option>
                  <option value="メタルジグ">-- メタルジグ --</option>
                  <option value="ダウンショット">-- ダウンショット --</option>
                  <option value="フリーリグ">-- フリーリグ --</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label className="point-label">重量</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="200"
                  placeholder="変更なし"
                  className="new-point-input"
                  value={bulkData.weight}
                  onChange={(e) => handleBulkFieldChange('weight', e.target.value)}
                />
                <span>g</span>
              </div>

              <div className="modal-form-group">
                <label className="point-label">フックサイズ</label>
                <select
                  className="point-select"
                  value={bulkData.hookSize}
                  onChange={(e) => handleBulkFieldChange('hookSize', e.target.value)}
                >
                  <option value="">-- 変更なし --</option>
                  <option value="#10">#10</option>
                  <option value="#8">#8</option>
                  <option value="#6">#6</option>
                  <option value="#4">#4</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-timeline btn-cancel"
                onClick={() => setIsModalOpen(false)}
              >
                キャンセル
              </button>
              <button type="button" className="btn-timeline btn-confirm" onClick={handleBulkApply}>
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
