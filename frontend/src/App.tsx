import './css/App.css';
import { BrowserRouter, Routes, Route } from 'react-router';
import MenuPage from './pages/MenuPage';
import RegisterFishingReport from './pages/RegisterPage';
import FishingReportList from './pages/ListPage';
import PointList from './pages/PointListPage';
import PointEdit from './pages/PointEditPage';
import ReportMap from './pages/MapPage';
import ReportDetail from './pages/ReportDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* メニュー画面（ルートパス） */}
        <Route path="/" element={<MenuPage />} />

        {/* 釣果登録画面 */}
        <Route path="/reports/new" element={<RegisterFishingReport />} />

        {/* マイポイント管理画面 */}
        <Route path="/points/new" element={<PointEdit />} />
        <Route path="/points/list" element={<PointList />} />
        <Route path="/points/edit/:pointId" element={<PointEdit />} />

        {/* 釣果一覧・マップ画面 */}
        <Route path="/reports/map" element={<ReportMap />} />

        {/* 釣果一覧・リスト画面 */}
        <Route path="/reports/list" element={<FishingReportList />} />

        {/* 釣果詳細画面 */}
        <Route path="/reports/:reportId" element={<ReportDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
