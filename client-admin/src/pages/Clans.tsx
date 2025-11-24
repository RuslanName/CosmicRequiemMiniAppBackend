import { useState, useEffect } from 'react';
import { clansApi, type Clan, type CreateClanDto, type UpdateClanDto } from '../api/clans.api';
import { ClanStatus, ClanStatusLabels } from '../enums';
import { ENV } from '../config/constants';
import Modal from '../components/Modal';
import UserSelect from '../components/UserSelect';
import '../components/Table.css';

const Clans = () => {
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingClan, setEditingClan] = useState<Clan | null>(null);
  const [formData, setFormData] = useState<CreateClanDto | UpdateClanDto>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');

  useEffect(() => {
    if (!searchId) {
      loadClans();
    }
  }, [page]);

  const loadClans = async (searchIdValue?: string) => {
    try {
      setLoading(true);
      if (searchIdValue) {
        const id = parseInt(searchIdValue);
        if (!isNaN(id)) {
          const clan = await clansApi.getById(id);
          setClans([clan]);
          setTotal(1);
          return;
        }
      }
      const response = await clansApi.getAll({ page, limit });
      setClans(response?.data || []);
      setTotal(response?.total || 0);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setClans([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки кланов');
        setClans([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadClans(searchId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
    if (!e.target.value) {
      loadClans();
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setEditingClan(null);
    setFormData({ name: '', max_members: 50, leader_id: 0 });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = (clan: Clan) => {
    setIsCreateMode(false);
    setEditingClan(clan);
    setFormData({
      name: clan.name,
      max_members: clan.max_members,
      leader_id: clan.leader_id,
      status: clan.status,
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот клан?')) return;

    try {
      setError('');
      await clansApi.delete(id);
      loadClans();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления клана');
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      if (isCreateMode) {
        await clansApi.create(formData as CreateClanDto, imageFile || undefined);
      } else if (editingClan) {
        await clansApi.update(editingClan.id, formData as UpdateClanDto, imageFile || undefined);
      }
      setIsModalOpen(false);
      setEditingClan(null);
      setIsCreateMode(false);
      setImageFile(null);
      loadClans();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения клана');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingClan(null);
    setIsCreateMode(false);
    setFormData({});
    setImageFile(null);
    setError('');
  };

  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2 className="table-title">Кланы</h2>
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
              <button className="btn btn-secondary" onClick={() => { setSearchId(''); loadClans(); }}>
                Сбросить
              </button>
            )}
          </div>
          <button className="btn btn-success" onClick={handleCreate}>
            Добавить клан
          </button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Изображение</th>
            <th>Название</th>
            <th>Макс. участников</th>
            <th>ID лидера</th>
            <th>Деньги</th>
            <th>Сила</th>
            <th>Количество стражей</th>
            <th>Количество участников</th>
            <th>Количество войн</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {clans.map((clan) => (
            <tr key={clan.id}>
              <td>{clan.id}</td>
              <td>
                {clan.image_path ? (
                  <img 
                    src={`${ENV.API_URL}/${clan.image_path}`} 
                    alt={clan.name}
                    style={{ width: '50px', height: '50px', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                  />
                ) : (
                  '-'
                )}
              </td>
              <td>{clan.name}</td>
              <td>{clan.max_members}</td>
              <td>{clan.leader_id || '-'}</td>
              <td>{clan.money ?? '-'}</td>
              <td>{clan.strength ?? '-'}</td>
              <td>{clan.guards_count ?? '-'}</td>
              <td>{clan.members_count ?? '-'}</td>
              <td>{clan.wars_count ?? '-'}</td>
              <td>{ClanStatusLabels[clan.status as ClanStatus] || clan.status}</td>
              <td>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(clan)}>
                    Редактировать
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(clan.id)}>
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
          Показано {clans.length} из {total}
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
        title={isCreateMode ? 'Создать клан' : 'Редактировать клан'}
      >
        <div>
          <div className="form-group">
            <label className="form-label">Название</label>
            <input
              className="form-input"
              type="text"
              value={(formData as any).name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Максимум участников</label>
            <input
              className="form-input"
              type="number"
              value={(formData as any).max_members || ''}
              onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 50 })}
            />
          </div>
          <UserSelect
            value={(formData as any).leader_id}
            onChange={(id) => setFormData({ ...formData, leader_id: id })}
            label="Лидер клана"
            required={true}
          />
          <div className="form-group">
            <label className="form-label">Статус</label>
            <select
              className="form-select"
              value={(formData as any).status || ClanStatus.ACTIVE}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {Object.values(ClanStatus).map((status) => (
                <option key={status} value={status}>
                  {ClanStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Изображение {isCreateMode ? '(обязательно)' : '(опционально)'}</label>
            <input
              className="form-input"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            {editingClan && editingClan.image_path && !imageFile && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={`${ENV.API_URL}/${editingClan.image_path}`} 
                  alt={editingClan.name}
                  style={{ width: '100px', height: '100px', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                />
              </div>
            )}
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

export default Clans;

