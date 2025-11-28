import { useState, useEffect } from 'react';
import { kitsApi, type Kit, type CreateKitDto, type UpdateKitDto } from '../api/kits.api';
import { ShopItemStatus, ShopItemStatusLabels, Currency, CurrencyLabels } from '../enums';
import Modal from '../components/Modal';
import ItemTemplateMultiSelect from '../components/ItemTemplateMultiSelect';
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
      setKits(response?.data || []);
      setTotal(response?.total || 0);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setKits([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки наборов');
        setKits([]);
        setTotal(0);
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
    setFormData({ name: '', currency: 'virtual', price: 0, money: 0, item_template_ids: [] });
    setIsModalOpen(true);
  };

  const handleEdit = (kit: Kit) => {
    setIsCreateMode(false);
    setEditingKit(kit);
    const ids = kit.item_templates?.map(p => p.id) || [];
    setFormData({
      name: kit.name,
      currency: kit.currency,
      price: kit.price,
      money: kit.money || 0,
      status: kit.status,
      item_template_ids: ids,
    });
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
      const data = {
        ...formData,
        item_template_ids: (formData as any).item_template_ids || [],
      };

      if (isCreateMode) {
        await kitsApi.create(data as CreateKitDto);
      } else if (editingKit) {
        await kitsApi.update(editingKit.id, data as UpdateKitDto);
      }
      setIsModalOpen(false);
      setEditingKit(null);
      setIsCreateMode(false);
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
    setError('');
  };

  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

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
            <th>Деньги</th>
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
              <td>{kit.money || 0}</td>
              <td>{ShopItemStatusLabels[kit.status as ShopItemStatus] || kit.status}</td>
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
          Показано {kits.length > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, total)} из {total}
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
            <label className="form-label">Деньги (количество денег, которое даст набор)</label>
            <input
              className="form-input"
              type="number"
              value={(formData as any).money || ''}
              onChange={(e) => setFormData({ ...formData, money: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Статус</label>
            <select
              className="form-select"
              value={(formData as any).status || ShopItemStatus.IN_STOCK}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {Object.values(ShopItemStatus).map((status) => (
                <option key={status} value={status}>
                  {ShopItemStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>
          <ItemTemplateMultiSelect
            value={(formData as any).item_template_ids || []}
            onChange={(ids) => setFormData({ ...formData, item_template_ids: ids })}
            label="Шаблоны предметов"
            required={true}
          />
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
