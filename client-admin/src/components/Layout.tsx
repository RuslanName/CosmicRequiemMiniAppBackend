import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { path: '/users', label: 'Пользователи' },
    { path: '/user-guards', label: 'Стражи пользователей' },
    { path: '/clans', label: 'Кланы' },
    { path: '/clan-wars', label: 'Клановые войны' },
    { path: '/accessories', label: 'Аксессуары' },
    { path: '/kits', label: 'Наборы' },
    { path: '/admins', label: 'Администраторы' },
    { path: '/settings', label: 'Настройки' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('login', { replace: true });
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="sidebar-title">Админ-панель</h1>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
