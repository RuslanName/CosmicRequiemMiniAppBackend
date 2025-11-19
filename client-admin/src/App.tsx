import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Users from './pages/Users';
import UserGuards from './pages/UserGuards';
import Clans from './pages/Clans';
import ClanWars from './pages/ClanWars';
import Accessories from './pages/Accessories';
import Products from './pages/Products';
import Kits from './pages/Kits';
import Admins from './pages/Admins';
import Settings from './pages/Settings';
import './App.css';

import { ENV } from './config/constants';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={ENV.BASE_URL}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/users" replace />} />
            <Route path="users" element={<Users />} />
            <Route path="user-guards" element={<UserGuards />} />
            <Route path="clans" element={<Clans />} />
            <Route path="clan-wars" element={<ClanWars />} />
            <Route path="products" element={<Products />} />
            <Route path="accessories" element={<Accessories />} />
            <Route path="kits" element={<Kits />} />
            <Route path="admins" element={<Admins />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
