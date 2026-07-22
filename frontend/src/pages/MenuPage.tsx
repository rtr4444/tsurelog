import { useEffect, useState } from 'react';
import { MenuButton } from '../components/ui/MenuButton';
import { getReports } from '../api/fishingReport';
import { getPoints } from '../api/points';
import { getSeasonalFish, type SeasonalFishEntry } from '../api/seasonalFish';
import '../css/menu.css';
import type { FishingReport, MyPoint } from '../../../package/shared-types/types';

const menuItems = [
  {
    label: '釣果登録',
    description: '新しく釣れた魚の情報・写真を記録します',
    icon: '🎣',
    variant: 'large',
    link: '/reports/new',
  },
  {
    label: '釣果一覧',
    description: 'これまでの釣果ログを一覧で確認します',
    icon: '🗒️',
    variant: 'list',
    link: '/reports/list',
  },
  {
    label: '釣果一覧（MAP）',
    description: 'マップ上から釣果ポイントを視覚的に探します',
    icon: '🗺️',
    variant: 'map',
    link: '/reports/map',
  },
  {
    label: 'マイ釣り場登録',
    description: 'お気に入りのポイントや緯度経度を整理・登録します',
    icon: '📍',
    variant: 'spot',
    link: '/points/list',
  },
] as const;

/**
 * アプリのメインメニュー画面コンポーネント
 */
export default function MenuPage() {
  const [reports, setReports] = useState<FishingReport[]>([]);
  const [points, setPoints] = useState<MyPoint[]>([]);
  const [seasonalFish, setSeasonalFish] = useState<SeasonalFishEntry | null>(null);

  useEffect(() => {
    getReports()
      .then(setReports)
      .catch((error) => console.error('Failed to fetch reports:', error));

    getPoints()
      .then(setPoints)
      .catch((error) => console.error('Failed to fetch points:', error));

    const currentMonth = new Date().getMonth() + 1;
    getSeasonalFish(currentMonth)
      .then(setSeasonalFish)
      .catch((error) => console.error('Failed to fetch seasonal fish:', error));
  }, []);

  const totalCatches = reports.reduce((sum, r) => sum + r.fishTimeline.length, 0);
  const registeredPoints = points.length;
  const maxSize = reports
    .flatMap((r) => r.fishTimeline)
    .reduce((max, fish) => Math.max(max, parseFloat(fish.size) || 0), 0);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-logo">
          <img src="/logo.png" alt="釣れろぐ" className="header-logo-img" />
        </div>
      </header>

      <main className="main-content">
        {seasonalFish && (
          <div className="season-fish-card">
            <div className="season-badge">今が旬の魚</div>
            <div className="season-content">
              <div className="season-info">
                <h3 className="fish-name">{seasonalFish.fishNames.join('・')} 🐟</h3>
                <p className="fish-desc">{seasonalFish.description}</p>
              </div>
              <div className="fish-illustration">
                {seasonalFish.photoUrls.map((url) => (
                  <img key={url} src={url} alt="" className="season-fish-photo" />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-status">
          <div className="stat-item">
            <span className="stat-val">{totalCatches}</span>
            <span className="stat-label">総釣果数</span>
          </div>
          <div
            className="stat-item"
            style={{
              borderLeft: '1px solid var(--border-color)',
              borderRight: '1px solid var(--border-color)',
              padding: '0 20px',
            }}
          >
            <span className="stat-val">{registeredPoints}</span>
            <span className="stat-label">登録釣り場</span>
          </div>
          <div className="stat-item">
            <span className="stat-val">{maxSize > 0 ? `${maxSize}cm` : '-'}</span>
            <span className="stat-label">最大サイズ</span>
          </div>
        </div>

        <div>
          <h2 className="section-title">機能一覧</h2>
          <div className="menu-grid">
            {menuItems.map((item) => (
              <MenuButton
                key={item.link}
                label={item.label}
                description={item.description}
                icon={item.icon}
                variant={item.variant}
                link={item.link}
              />
            ))}

            <div className="menu-card coming-soon">
              <div className="menu-icon-wrapper">
                <span className="menu-icon-emoji">🔒</span>
              </div>
              <h3 className="menu-title">Coming Soon...</h3>
              <p className="menu-desc">新機能をお楽しみに！</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; 2026 tsurelog</p>
      </footer>
    </div>
  );
}
