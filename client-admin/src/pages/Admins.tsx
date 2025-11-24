import { useState, useEffect } from 'react';
import { adminsApi, type Admin, type CreateAdminDto, type UpdateAdminDto } from '../api/admins.api';
import Modal from '../components/Modal';
import UserSelect from '../components/UserSelect';
import '../components/Table.css';

const Admins = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<CreateAdminDto | UpdateAdminDto>({});
  const [error, setError] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');

  useEffect(() => {
    if (!searchId) {
      loadAdmins();
    }
  }, [page]);

  const loadAdmins = async (searchIdValue?: string) => {
    try {
      setLoading(true);
      if (searchIdValue) {
        const id = parseInt(searchIdValue);
        if (!isNaN(id)) {
          const admin = await adminsApi.getById(id);
          setAdmins([admin]);
          setTotal(1);
          return;
        }
      }
      const response = await adminsApi.getAll({ page, limit });
      setAdmins(response?.data || []);
      setTotal(response?.total || 0);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setAdmins([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки администраторов');
        setAdmins([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadAdmins(searchId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
    if (!e.target.value) {
      loadAdmins();
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setEditingAdmin(null);
    setFormData({ user_id: 0, username: '', password: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (admin: Admin) => {
    if (admin.is_system_admin) {
      setError('Невозможно редактировать системного администратора');
      return;
    }

    setIsCreateMode(false);
    setEditingAdmin(admin);
    setFormData({
      user_id: admin.user_id,
      username: admin.username,
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, isSystemAdmin: boolean) => {
    if (isSystemAdmin) {
      setError('Невозможно удалить системного администратора');
      return;
    }

    if (!confirm('Вы уверены, что хотите удалить этого администратора?')) return;

    try {
      setError('');
      await adminsApi.delete(id);
      loadAdmins();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления администратора');
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      const data = { ...formData };
      if (!isCreateMode && !(data as UpdateAdminDto).password) {
        delete (data as UpdateAdminDto).password;
      }

      if (isCreateMode) {
        await adminsApi.create(data as CreateAdminDto);
      } else if (editingAdmin) {
        await adminsApi.update(editingAdmin.id, data as UpdateAdminDto);
      }
      setIsModalOpen(false);
      setEditingAdmin(null);
      setIsCreateMode(false);
      loadAdmins();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения администратора');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
    setIsCreateMode(false);
    setFormData({});
    setError('');
  };

  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2 className="table-title">Администраторы</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
              <button className="btn btn-secondary" onClick={() => { setSearchId(''); loadAdmins(); }}>
                Сбросить
              </button>
            )}
          </div>
          <button className="btn btn-success" onClick={handleCreate}>
            Добавить администратора
          </button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя пользователя</th>
            <th>ID пользователя</th>
            <th>Тип</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
              <td>{admin.id}</td>
              <td>{admin.username}</td>
              <td>{admin.user_id}</td>
              <td>
                {admin.is_system_admin && (
                  <span style={{ 
                    padding: '4px 8px', 
                    background: '#ffc107', 
                    color: '#000', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    СИСТЕМНЫЙ
                  </span>
                )}
              </td>
              <td>
                <div className="actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleEdit(admin)}
                    disabled={admin.is_system_admin}
                    style={{ opacity: admin.is_system_admin ? 0.5 : 1, cursor: admin.is_system_admin ? 'not-allowed' : 'pointer' }}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDelete(admin.id, admin.is_system_admin)}
                    disabled={admin.is_system_admin}
                    style={{ opacity: admin.is_system_admin ? 0.5 : 1, cursor: admin.is_system_admin ? 'not-allowed' : 'pointer' }}
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <div className="pagination-info">
          Показано {admins.length} из {total}
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={isCreateMode ? 'Создать администратора' : 'Редактировать администратора'}
      >
        <div>
          <UserSelect
            value={(formData as any).user_id}
            onChange={(id) => setFormData({ ...formData, user_id: id })}
            label="Пользователь"
            required={true}
          />
          <div className="form-group">
            <label className="form-label">Имя пользователя</label>
            <input
              className="form-input"
              type="text"
              value={(formData as any).username || ''}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль {isCreateMode ? '(обязательно)' : '(оставьте пустым, чтобы не менять)'}</label>
            <input
              className="form-input"
              type="password"
              value={(formData as any).password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
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

export default Admins;

