import { useState, useEffect } from 'react';
import { usersApi, type User, type UpdateUserDto } from '../api/users.api';
import { UserStatus, UserStatusLabels } from '../enums';
import Modal from '../components/Modal';
import '../components/Table.css';

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UpdateUserDto>({});
  const [error, setError] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');

  useEffect(() => {
    if (!searchId) {
      loadUsers();
    }
  }, [page]);

  const loadUsers = async (searchIdValue?: string) => {
    try {
      setLoading(true);
      if (searchIdValue) {
        const id = parseInt(searchIdValue);
        if (!isNaN(id)) {
          const user = await usersApi.getById(id);
          setUsers([user]);
          setTotal(1);
          return;
        }
      }
      const response = await usersApi.getAll({ page, limit });
      setUsers(response.data);
      setTotal(response.total);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setUsers([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки пользователей');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers(searchId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
    if (!e.target.value) {
      loadUsers();
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      sex: user.sex,
      avatar_url: user.avatar_url,
      birthday_date: user.birthday_date,
      money: user.money,
      shield_end_time: user.shield_end_time,
      last_shield_purchase_time: user.last_shield_purchase_time,
      last_contract_time: user.last_contract_time,
      clan_leave_time: user.clan_leave_time,
      status: user.status,
      last_login_at: user.last_login_at,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      setError('');
      await usersApi.update(editingUser.id, formData);
      setIsModalOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления пользователя');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({});
    setError('');
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2 className="table-title">Пользователи</h2>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по ID..."
            value={searchId}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>
            Найти
          </button>
          {searchId && (
            <button className="btn btn-secondary" onClick={() => { setSearchId(''); loadUsers(); }}>
              Сбросить
            </button>
          )}
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>VK ID</th>
            <th>Имя</th>
            <th>Фамилия</th>
            <th>Деньги</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.vk_id}</td>
              <td>{user.first_name}</td>
              <td>{user.last_name || '-'}</td>
              <td>{user.money}</td>
              <td>{UserStatusLabels[user.status as UserStatus] || user.status}</td>
              <td>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(user)}>
                    Редактировать
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <div className="pagination-info">
          Показано {users.length} из {total}
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Назад
          </button>
          <span>
            Страница {page} из {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Вперед
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleClose} title="Редактировать пользователя">
        <div>
          <div className="form-group">
            <label className="form-label">Имя</label>
            <input
              className="form-input"
              type="text"
              value={formData.first_name || ''}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Фамилия</label>
            <input
              className="form-input"
              type="text"
              value={formData.last_name || ''}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Пол</label>
            <input
              className="form-input"
              type="number"
              value={formData.sex || ''}
              onChange={(e) => setFormData({ ...formData, sex: parseInt(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Аватар URL</label>
            <input
              className="form-input"
              type="text"
              value={formData.avatar_url || ''}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Деньги</label>
            <input
              className="form-input"
              type="number"
              value={formData.money || ''}
              onChange={(e) => setFormData({ ...formData, money: parseInt(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Статус</label>
            <select
              className="form-select"
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {Object.values(UserStatus).map((status) => (
                <option key={status} value={status}>
                  {UserStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={handleClose}>
              Отмена
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Сохранить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;

