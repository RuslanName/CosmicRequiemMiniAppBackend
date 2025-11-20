import { useState, useEffect } from 'react';
import { usersApi, type User } from '../api/users.api';

interface UserSelectProps {
  value: number | undefined;
  onChange: (id: number) => void;
  label?: string;
  required?: boolean;
}

const UserSelect = ({ value, onChange, label = 'Пользователь', required = false }: UserSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll({ page: 1, limit: 1000 });
      setUsers(response?.data || []);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.id.toString().includes(search)
  );

  if (loading) {
    return <div>Загрузка пользователей...</div>;
  }

  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      <input
        className="form-input"
        type="text"
        placeholder="Поиск по ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '8px' }}
      />
      <select
        className="form-select"
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        required={required}
        style={{ maxHeight: '200px' }}
      >
        <option value="">-- Выберите пользователя --</option>
        {filteredUsers.map((user) => (
          <option key={user.id} value={user.id}>
            #{user.id} - {user.first_name} {user.last_name || ''}
          </option>
        ))}
      </select>
      {filteredUsers.length === 0 && search && (
        <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
          Ничего не найдено
        </div>
      )}
    </div>
  );
};

export default UserSelect;

