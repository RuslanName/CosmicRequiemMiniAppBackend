import { useState, useEffect } from 'react';
import { clanWarsApi, type ClanWar, type UpdateClanWarDto } from '../api/clan-wars.api';
import { ClanWarStatus, ClanWarStatusLabels } from '../enums';
import Modal from '../components/Modal';
import ClanSelect from '../components/ClanSelect';
import '../components/Table.css';

const ClanWars = () => {
  const [wars, setWars] = useState<ClanWar[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWar, setEditingWar] = useState<ClanWar | null>(null);
  const [formData, setFormData] = useState<UpdateClanWarDto>({});
  const [error, setError] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');

  useEffect(() => {
    if (!searchId) {
      loadWars();
    }
  }, [page]);

  const loadWars = async (searchIdValue?: string) => {
    try {
      setLoading(true);
      if (searchIdValue) {
        const id = parseInt(searchIdValue);
        if (!isNaN(id)) {
          const war = await clanWarsApi.getById(id);
          setWars([war]);
          setTotal(1);
          return;
        }
      }
      const response = await clanWarsApi.getAll({ page, limit });
      setWars(response?.data || []);
      setTotal(response?.total || 0);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setWars([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки войн');
        setWars([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadWars(searchId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
    if (!e.target.value) {
      loadWars();
    }
  };

  const handleEdit = (war: ClanWar) => {
    setEditingWar(war);
    setFormData({
      clan_1_id: war.clan_1_id,
      clan_2_id: war.clan_2_id,
      start_time: war.start_time ? new Date(war.start_time).toISOString().slice(0, 16) : '',
      end_time: war.end_time ? new Date(war.end_time).toISOString().slice(0, 16) : '',
      status: war.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту войну?')) return;

    try {
      setError('');
      await clanWarsApi.delete(id);
      loadWars();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления войны');
    }
  };

  const handleSave = async () => {
    if (!editingWar) return;

    try {
      setError('');
      await clanWarsApi.update(editingWar.id, formData);
      setIsModalOpen(false);
      setEditingWar(null);
      loadWars();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления войны');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingWar(null);
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
        <h2 className="table-title">Клановые войны</h2>
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
            <button className="btn btn-secondary" onClick={() => { setSearchId(''); loadWars(); }}>
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
            <th>ID первого клана</th>
            <th>ID второго клана</th>
            <th>Начало</th>
            <th>Конец</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {wars.map((war) => (
            <tr key={war.id}>
              <td>{war.id}</td>
              <td>{war.clan_1_id}</td>
              <td>{war.clan_2_id}</td>
              <td>{new Date(war.start_time).toLocaleString()}</td>
              <td>{new Date(war.end_time).toLocaleString()}</td>
              <td>{ClanWarStatusLabels[war.status as ClanWarStatus] || war.status}</td>
              <td>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(war)}>
                    Редактировать
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(war.id)}>
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
          Показано {wars.length} из {total}
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

      <Modal isOpen={isModalOpen} onClose={handleClose} title="Редактировать войну">
        <div>
          <ClanSelect
            value={formData.clan_1_id}
            onChange={(id) => setFormData({ ...formData, clan_1_id: id })}
            label="Клан 1"
            required={false}
          />
          <ClanSelect
            value={formData.clan_2_id}
            onChange={(id) => setFormData({ ...formData, clan_2_id: id })}
            label="Клан 2"
            required={false}
          />
          <div className="form-group">
            <label className="form-label">Время начала</label>
            <input
              className="form-input"
              type="datetime-local"
              value={formData.start_time || ''}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Время окончания</label>
            <input
              className="form-input"
              type="datetime-local"
              value={formData.end_time || ''}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Статус</label>
            <select
              className="form-select"
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {Object.values(ClanWarStatus).map((status) => (
                <option key={status} value={status}>
                  {ClanWarStatusLabels[status]}
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

export default ClanWars;

