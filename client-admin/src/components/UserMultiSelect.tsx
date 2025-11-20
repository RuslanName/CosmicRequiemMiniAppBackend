import { useState, useEffect } from 'react';
import { usersApi, type User } from '../api/users.api';

interface UserMultiSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  required?: boolean;
}

const UserMultiSelect = ({ value, onChange, label = 'Пользователи', required = false }: UserMultiSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>(value || []);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setSelectedIds(value || []);
  }, [value]);

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

  const handleToggle = (id: number) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(sid => sid !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelected);
    onChange(newSelected);
  };

  const selectedUsers = users.filter(u => selectedIds.includes(u.id));

  if (loading) {
    return <div>Загрузка пользователей...</div>;
  }

  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      
      {selectedUsers.length > 0 && (
        <div style={{ marginBottom: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            Выбрано ({selectedUsers.length}):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {selectedUsers.map(u => (
              <span
                key={u.id}
                style={{
                  padding: '4px 8px',
                  background: '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => handleToggle(u.id)}
              >
                #{u.id} - {u.first_name} {u.last_name || ''} ✕
              </span>
            ))}
          </div>
        </div>
      )}

      <input
        className="form-input"
        type="text"
        placeholder="Поиск по ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '8px' }}
      />
      
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        maxHeight: '200px', 
        overflowY: 'auto',
        padding: '4px'
      }}>
        {filteredUsers.length === 0 ? (
          <div style={{ padding: '8px', color: '#666', textAlign: 'center' }}>
            {search ? 'Ничего не найдено' : 'Нет доступных пользователей'}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              style={{
                padding: '8px',
                cursor: 'pointer',
                background: selectedIds.includes(user.id) ? '#e3f2fd' : 'transparent',
                borderRadius: '4px',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => handleToggle(user.id)}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(user.id)}
                onChange={() => {}}
                style={{ cursor: 'pointer' }}
              />
              <span>
                #{user.id} - {user.first_name} {user.last_name || ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserMultiSelect;

