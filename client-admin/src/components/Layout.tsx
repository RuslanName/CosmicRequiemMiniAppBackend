import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const menuItems = [
    { path: '/users', label: 'Пользователи' },
    { path: '/user-guards', label: 'Стражи пользователей' },
    { path: '/clans', label: 'Кланы' },
    { path: '/clan-wars', label: 'Клановые войны' },
    { path: '/item-templates', label: 'Шаблоны предметов' },
    { path: '/shop-items', label: 'Товары магазина' },
    { path: '/kits', label: 'Наборы' },
    { path: '/tasks', label: 'Задания' },
    { path: '/giveaway', label: 'Конкурс' },
    { path: '/settings', label: 'Настройки' },
    { path: '/admins', label: 'Администраторы' },
  ];

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('login', { replace: true });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="layout">
      <button 
        className="hamburger"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {isSidebarOpen && isMobile && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button 
            className="hamburger-inside"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h1 className="sidebar-title">Admin панель</h1>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Пользователи</div>
            <Link
              to="/users"
              className={`sidebar-link ${location.pathname === '/users' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Пользователи
            </Link>
            <Link
              to="/user-guards"
              className={`sidebar-link ${location.pathname === '/user-guards' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Стражи пользователей
            </Link>
          </div>
          <div className="nav-section">
            <div className="nav-section-title">Кланы</div>
            <Link
              to="/clans"
              className={`sidebar-link ${location.pathname === '/clans' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Кланы
            </Link>
            <Link
              to="/clan-wars"
              className={`sidebar-link ${location.pathname === '/clan-wars' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Клановые войны
            </Link>
          </div>
          <div className="nav-section">
            <div className="nav-section-title">Магазин</div>
            <Link
              to="/item-templates"
              className={`sidebar-link ${location.pathname === '/item-templates' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Шаблоны предметов
            </Link>
            <Link
              to="/shop-items"
              className={`sidebar-link ${location.pathname === '/shop-items' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Товары магазина
            </Link>
            <Link
              to="/kits"
              className={`sidebar-link ${location.pathname === '/kits' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Наборы
            </Link>
          </div>
          <div className="nav-section">
            <div className="nav-section-title">Задания</div>
            <Link
              to="/tasks"
              className={`sidebar-link ${location.pathname === '/tasks' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Задания
            </Link>
            <Link
              to="/giveaway"
              className={`sidebar-link ${location.pathname === '/giveaway' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Конкурс
            </Link>
          </div>
          <div className="nav-section">
            <div className="nav-section-title">Система</div>
            <Link
              to="/settings"
              className={`sidebar-link ${location.pathname === '/settings' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Настройки
            </Link>
            <Link
              to="/admins"
              className={`sidebar-link ${location.pathname === '/admins' ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              Администраторы
            </Link>
          </div>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      </aside>
      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
