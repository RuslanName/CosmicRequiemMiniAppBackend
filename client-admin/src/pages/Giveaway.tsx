import { useState, useEffect } from 'react';
import { giveawaysApi, type Giveaway, type CreateGiveawayDto, type UpdateGiveawayDto } from '../api/giveaways.api';
import { ENV } from '../config/constants';
import '../components/Table.css';

const Giveaway = () => {
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [formData, setFormData] = useState<CreateGiveawayDto | UpdateGiveawayDto>({});
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadGiveaway();
  }, []);

  const loadGiveaway = async () => {
    try {
      setLoading(true);
      const data = await giveawaysApi.getOne();
      setGiveaway(data);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Ошибка загрузки конкурса');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setFormData({ description: '', url: '', image_path: null });
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (!giveaway) return;
    setIsCreateMode(false);
    setFormData({
      description: giveaway.description,
      url: giveaway.url,
      image_path: giveaway.image_path || null,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!giveaway) return;
    if (!confirm('Вы уверены, что хотите удалить конкурс?')) return;

    try {
      setError('');
      await giveawaysApi.delete(giveaway.id);
      setGiveaway(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления конкурса');
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      if (isCreateMode) {
        const created = await giveawaysApi.create(formData as CreateGiveawayDto);
        setGiveaway(created);
      } else if (giveaway) {
        const updated = await giveawaysApi.update(giveaway.id, formData as UpdateGiveawayDto);
        setGiveaway(updated);
      }
      setIsModalOpen(false);
      setIsCreateMode(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения конкурса');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setIsCreateMode(false);
    setFormData({});
    setError('');
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2 className="table-title">Конкурс</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {giveaway ? (
            <>
              <button className="btn btn-primary" onClick={handleEdit}>
                Редактировать
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Удалить
              </button>
            </>
          ) : (
            <button className="btn btn-success" onClick={handleCreate}>
              Создать конкурс
            </button>
          )}
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      
      {giveaway ? (
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '10px' }}>Текущий конкурс</h3>
            <div style={{ marginBottom: '10px' }}>
              <strong>ID:</strong> {giveaway.id}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Описание:</strong> {giveaway.description}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>URL:</strong>{' '}
              <a href={giveaway.url} target="_blank" rel="noopener noreferrer">
                {giveaway.url}
              </a>
            </div>
            {giveaway.image_path && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Изображение:</strong>
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={`${ENV.API_URL}/${giveaway.image_path}`}
                    alt="Giveaway"
                    style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain', backgroundColor: '#fff', padding: '10px', borderRadius: '4px' }}
                  />
                </div>
              </div>
            )}
            <div style={{ marginBottom: '10px' }}>
              <strong>Создан:</strong> {new Date(giveaway.created_at).toLocaleString('ru-RU')}
            </div>
            <div>
              <strong>Обновлен:</strong> {new Date(giveaway.updated_at).toLocaleString('ru-RU')}
            </div>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', color: '#856404' }}>
            <strong>Примечание:</strong> В системе может быть только один активный конкурс. Для создания нового необходимо удалить текущий.
          </div>
        </div>
      ) : (
        <div style={{ marginTop: '20px', padding: '20px', textAlign: 'center', color: '#666' }}>
          Конкурс не создан. Нажмите "Создать конкурс" для добавления.
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={isCreateMode ? 'Создать конкурс' : 'Редактировать конкурс'}
      >
        <div>
          <div className="form-group">
            <label className="form-label">Описание</label>
            <input
              className="form-input"
              type="text"
              value={(formData as any).description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">URL</label>
            <input
              className="form-input"
              type="text"
              value={(formData as any).url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://vk.com/contest"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Путь к изображению (опционально)</label>
            <input
              className="form-input"
              type="text"
              value={(formData as any).image_path || ''}
              onChange={(e) => setFormData({ ...formData, image_path: e.target.value || null })}
              placeholder="/images/giveaway.jpg"
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

export default Giveaway;

