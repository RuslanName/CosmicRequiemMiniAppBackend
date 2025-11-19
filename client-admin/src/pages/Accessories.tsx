import { useState, useEffect } from 'react';
import { accessoriesApi, type Accessory, type CreateAccessoryDto, type UpdateAccessoryDto } from '../api/accessories.api';
import { AccessoryStatus, AccessoryStatusLabels, Currency, CurrencyLabels } from '../enums';
import Modal from '../components/Modal';
import '../components/Table.css';

const Accessories = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [formData, setFormData] = useState<CreateAccessoryDto | UpdateAccessoryDto>({});
  const [error, setError] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');

  useEffect(() => {
    if (!searchId) {
      loadAccessories();
    }
  }, [page]);

  const loadAccessories = async (searchIdValue?: string) => {
    try {
      setLoading(true);
      if (searchIdValue) {
        const id = parseInt(searchIdValue);
        if (!isNaN(id)) {
          const accessory = await accessoriesApi.getById(id);
          setAccessories([accessory]);
          setTotal(1);
          return;
        }
      }
      const response = await accessoriesApi.getAll({ page, limit });
      setAccessories(response.data);
      setTotal(response.total);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setAccessories([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки аксессуаров');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadAccessories(searchId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
    if (!e.target.value) {
      loadAccessories();
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setEditingAccessory(null);
    setFormData({ name: '', currency: 'virtual', price: 0, product_id: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (accessory: Accessory) => {
    setIsCreateMode(false);
    setEditingAccessory(accessory);
    setFormData({
      name: accessory.name,
      currency: accessory.currency,
      price: accessory.price,
      status: accessory.status,
      product_id: accessory.product_id,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот аксессуар?')) return;

    try {
      setError('');
      await accessoriesApi.delete(id);
      loadAccessories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления аксессуара');
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      if (isCreateMode) {
        await accessoriesApi.create(formData as CreateAccessoryDto);
      } else if (editingAccessory) {
        await accessoriesApi.update(editingAccessory.id, formData as UpdateAccessoryDto);
      }
      setIsModalOpen(false);
      setEditingAccessory(null);
      setIsCreateMode(false);
      loadAccessories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения аксессуара');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingAccessory(null);
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
        <h2 className="table-title">Аксессуары</h2>
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
              <button className="btn btn-secondary" onClick={() => { setSearchId(''); loadAccessories(); }}>
                Сбросить
              </button>
            )}
          </div>
          <button className="btn btn-success" onClick={handleCreate}>
            Добавить аксессуар
          </button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Валюта</th>
            <th>Цена</th>
            <th>Статус</th>
            <th>ID продукта</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {accessories.map((accessory) => (
            <tr key={accessory.id}>
              <td>{accessory.id}</td>
              <td>{accessory.name}</td>
              <td>{CurrencyLabels[accessory.currency as Currency] || accessory.currency}</td>
              <td>{accessory.price}</td>
              <td>{AccessoryStatusLabels[accessory.status as AccessoryStatus] || accessory.status}</td>
              <td>{accessory.product_id}</td>
              <td>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(accessory)}>
                    Редактировать
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(accessory.id)}>
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
          Показано {accessories.length} из {total}
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
        title={isCreateMode ? 'Создать аксессуар' : 'Редактировать аксессуар'}
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
            <label className="form-label">Валюта</label>
            <select
              className="form-select"
              value={(formData as any).currency || Currency.VIRTUAL}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              {Object.values(Currency).map((currency) => (
                <option key={currency} value={currency}>
                  {CurrencyLabels[currency]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Цена</label>
            <input
              className="form-input"
              type="number"
              value={(formData as any).price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Статус</label>
            <select
              className="form-select"
              value={(formData as any).status || AccessoryStatus.IN_STOCK}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {Object.values(AccessoryStatus).map((status) => (
                <option key={status} value={status}>
                  {AccessoryStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">ID продукта</label>
            <input
              className="form-input"
              type="number"
              value={(formData as any).product_id || ''}
              onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) || 0 })}
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

export default Accessories;

