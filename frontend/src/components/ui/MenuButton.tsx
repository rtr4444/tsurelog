import { Link } from 'react-router';

type MenuButtonProps = {
  label: string;
  description: string;
  icon: string;
  variant: 'large' | 'list' | 'map' | 'spot';
  link: string;
};

/**
 * メニュー画面で使用するカード型のリンクボタンコンポーネント
 */
export const MenuButton = ({ label, description, icon, variant, link }: MenuButtonProps) => {
  return (
    <Link to={link} className={`menu-card ${variant}`}>
      <div className="menu-icon-wrapper">
        <span className="menu-icon-emoji">{icon}</span>
      </div>
      <h3 className="menu-title">{label}</h3>
      <p className="menu-desc">{description}</p>
    </Link>
  );
};
