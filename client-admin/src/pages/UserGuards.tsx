import { useState, useEffect } from 'react';
import { userGuardsApi, type UserGuard, type CreateUserGuardDto, type UpdateUserGuardDto } from '../api/user-guards.api';
import Modal from '../components/Modal';
import '../components/Table.css';

const UserGuards = () => {
  const [guards, setGuards] = useState<UserGuard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingGuard, setEditingGuard] = useState<UserGuard | null>(null);
  const [formData, setFormData] = useState<CreateUserGuardDto | UpdateUserGuardDto>({});
  const [error, setError] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');

  useEffect(() => {
    if (!searchId) {
      loadGuards();
    }
  }, [page]);

  const loadGuards = async (searchIdValue?: string) => {
    try {
      setLoading(true);
      if (searchIdValue) {
        const id = parseInt(searchIdValue);
        if (!isNaN(id)) {
          const guard = await userGuardsApi.getById(id);
          setGuards([guard]);
          setTotal(1);
          return;
        }
      }
      const response = await userGuardsApi.getAll({ page, limit });
      setGuards(response.data);
      setTotal(response.total);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setGuards([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки стражей');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadGuards(searchId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
    if (!e.target.value) {
      loadGuards();
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setEditingGuard(null);
    setFormData({ name: '', strength: 0, is_first: false, user_id: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (guard: UserGuard) => {
    setIsCreateMode(false);
    setEditingGuard(guard);
    setFormData({
      name: guard.name,
      strength: guard.strength,
      is_first: guard.is_first,
      user_id: guard.user_id,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого стража?')) return;

    try {
      setError('');
      await userGuardsApi.delete(id);
      loadGuards();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления стража');
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      if (isCreateMode) {
        await userGuardsApi.create(formData as CreateUserGuardDto);
      } else if (editingGuard) {
        await userGuardsApi.update(editingGuard.id, formData as UpdateUserGuardDto);
      }
      setIsModalOpen(false);
      setEditingGuard(null);
      setIsCreateMode(false);
      loadGuards();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения стража');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingGuard(null);
    setIsCreateMode(false);
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
        <h2 className="table-title">Стражи пользователей</h2>
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
              <button className="btn btn-secondary" onClick={() => { setSearchId(''); loadGuards(); }}>
                Сбросить
              </button>
            )}
          </div>
          <button className="btn btn-success" onClick={handleCreate}>
            Добавить стража
          </button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Сила</th>
            <th>Первый</th>
            <th>ID пользователя</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {guards.map((guard) => (
            <tr key={guard.id}>
              <td>{guard.id}</td>
              <td>{guard.name}</td>
              <td>{guard.strength}</td>
              <td>{guard.is_first ? 'Да' : 'Нет'}</td>
              <td>{guard.user_id}</td>
              <td>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(guard)}>
                    Редактировать
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(guard.id)}>
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
          Показано {guards.length} из {total}
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
        title={isCreateMode ? 'Создать стража' : 'Редактировать стража'}
      >
        <div>
          <div className="form-group">
            <label className="form-label">Имя</label>
            <input
              className="form-input"
              type="text"
              value={(formData as any).name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Сила</label>
            <input
              className="form-input"
              type="number"
              value={(formData as any).strength || ''}
              onChange={(e) => setFormData({ ...formData, strength: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Первый</label>
            <select
              className="form-select"
              value={(formData as any).is_first ? 'true' : 'false'}
              onChange={(e) => setFormData({ ...formData, is_first: e.target.value === 'true' })}
            >
              <option value="false">Нет</option>
              <option value="true">Да</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">ID пользователя</label>
            <input
              className="form-input"
              type="number"
              value={(formData as any).user_id || ''}
              onChange={(e) => setFormData({ ...formData, user_id: parseInt(e.target.value) || 0 })}
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

export default UserGuards;

