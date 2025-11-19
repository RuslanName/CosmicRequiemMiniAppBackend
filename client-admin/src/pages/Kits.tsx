import { useState, useEffect } from 'react';
import { kitsApi, type Kit, type CreateKitDto, type UpdateKitDto } from '../api/kits.api';
import { AccessoryStatus, AccessoryStatusLabels, Currency, CurrencyLabels } from '../enums';
import Modal from '../components/Modal';
import '../components/Table.css';

const Kits = () => {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [formData, setFormData] = useState<CreateKitDto | UpdateKitDto>({});
  const [productIdsString, setProductIdsString] = useState('');
  const [error, setError] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');

  useEffect(() => {
    if (!searchId) {
      loadKits();
    }
  }, [page]);

  const loadKits = async (searchIdValue?: string) => {
    try {
      setLoading(true);
      if (searchIdValue) {
        const id = parseInt(searchIdValue);
        if (!isNaN(id)) {
          const kit = await kitsApi.getById(id);
          setKits([kit]);
          setTotal(1);
          return;
        }
      }
      const response = await kitsApi.getAll({ page, limit });
      setKits(response.data);
      setTotal(response.total);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setKits([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки наборов');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadKits(searchId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
    if (!e.target.value) {
      loadKits();
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setEditingKit(null);
    setFormData({ name: '', currency: 'virtual', price: 0, product_ids: [] });
    setProductIdsString('');
    setIsModalOpen(true);
  };

  const handleEdit = (kit: Kit) => {
    setIsCreateMode(false);
    setEditingKit(kit);
    const ids = kit.products?.map(p => p.id) || [];
    setFormData({
      name: kit.name,
      currency: kit.currency,
      price: kit.price,
      status: kit.status,
      product_ids: ids,
    });
    setProductIdsString(ids.join(', '));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот набор?')) return;

    try {
      setError('');
      await kitsApi.delete(id);
      loadKits();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления набора');
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      const productIds = productIdsString
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      const data = {
        ...formData,
        product_ids: productIds,
      };

      if (isCreateMode) {
        await kitsApi.create(data as CreateKitDto);
      } else if (editingKit) {
        await kitsApi.update(editingKit.id, data as UpdateKitDto);
      }
      setIsModalOpen(false);
      setEditingKit(null);
      setIsCreateMode(false);
      setProductIdsString('');
      loadKits();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения набора');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingKit(null);
    setIsCreateMode(false);
    setFormData({});
    setProductIdsString('');
    setError('');
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2 className="table-title">Наборы</h2>
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
              <button className="btn btn-secondary" onClick={() => { setSearchId(''); loadKits(); }}>
                Сбросить
              </button>
            )}
          </div>
          <button className="btn btn-success" onClick={handleCreate}>
            Добавить набор
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
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {kits.map((kit) => (
            <tr key={kit.id}>
              <td>{kit.id}</td>
              <td>{kit.name}</td>
              <td>{CurrencyLabels[kit.currency as Currency] || kit.currency}</td>
              <td>{kit.price}</td>
              <td>{AccessoryStatusLabels[kit.status as AccessoryStatus] || kit.status}</td>
              <td>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(kit)}>
                    Редактировать
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(kit.id)}>
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
          Показано {kits.length} из {total}
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
        title={isCreateMode ? 'Создать набор' : 'Редактировать набор'}
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
            <label className="form-label">ID продуктов (через запятую)</label>
            <input
              className="form-input"
              type="text"
              value={productIdsString}
              onChange={(e) => setProductIdsString(e.target.value)}
              placeholder="1, 2, 3"
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

export default Kits;

