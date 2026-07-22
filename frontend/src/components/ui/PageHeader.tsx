import { useNavigate } from 'react-router';

type PageHeaderProps = {
  header: string;
  link: string;
};

/**
 * 戻るボタンとタイトルを持つページヘッダーコンポーネント
 */
export const PageHeader = ({ header, link }: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // 履歴がある場合は1つ前の画面に戻り、ない場合はフォールバック先のリンクへ遷移
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;

    if (historyIndex > 0) {
      navigate(-1);
    } else {
      navigate(link);
    }
  };

  return (
    <header className="list-header">
      <button type="button" className="back-btn" onClick={handleBack}>
        ◀
      </button>
      <div className="header-title">{header}</div>
    </header>
  );
};
