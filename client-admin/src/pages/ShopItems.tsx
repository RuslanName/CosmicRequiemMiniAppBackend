import { useState, useEffect } from 'react';
import { shopItemsApi, type ShopItem, type CreateShopItemDto, type UpdateShopItemDto } from '../api/shop-items.api';
import { ShopItemStatus, ShopItemStatusLabels, Currency, CurrencyLabels } from '../enums';
import { ENV } from '../config/constants';
import Modal from '../components/Modal';
import ItemTemplateSelect from '../components/ItemTemplateSelect';
import '../components/Table.css';

const ShopItems = () => {
  const [accessories, setAccessories] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<ShopItem | null>(null);
  const [formData, setFormData] = useState<CreateShopItemDto | UpdateShopItemDto>({});
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
          const accessory = await shopItemsApi.getById(id);
          setAccessories([accessory]);
          setTotal(1);
          return;
        }
      }
      const response = await shopItemsApi.getAll({ page, limit });
      setAccessories(response?.data || []);
      setTotal(response?.total || 0);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setAccessories([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки товаров магазина');
        setAccessories([]);
        setTotal(0);
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
    setFormData({ name: '', currency: 'virtual', price: 0, item_template_id: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (accessory: ShopItem) => {
    setIsCreateMode(false);
    setEditingAccessory(accessory);
    setFormData({
      name: accessory.name,
      currency: accessory.currency,
      price: accessory.price,
      status: accessory.status,
      item_template_id: accessory.item_template_id,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар магазина?')) return;

    try {
      setError('');
      await shopItemsApi.delete(id);
      loadAccessories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления товара магазина');
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      if (isCreateMode) {
        await shopItemsApi.create(formData as CreateShopItemDto);
      } else if (editingAccessory) {
        await shopItemsApi.update(editingAccessory.id, formData as UpdateShopItemDto);
      }
      setIsModalOpen(false);
      setEditingAccessory(null);
      setIsCreateMode(false);
      loadAccessories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения товара магазина');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingAccessory(null);
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
        <h2 className="table-title">Товары магазина</h2>
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
            Добавить товар
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
            <th>Валюта</th>
            <th>Цена</th>
            <th>Статус</th>
            <th>ID шаблона предмета</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {accessories.map((accessory) => (
            <tr key={accessory.id}>
              <td>{accessory.id}</td>
              <td>
                {accessory.item_template?.image_path ? (
                  <img 
                    src={`${ENV.API_URL}/${accessory.item_template.image_path}`} 
                    alt={accessory.name}
                    style={{ width: '50px', height: '50px', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                  />
                ) : (
                  '-'
                )}
              </td>
              <td>{accessory.name}</td>
              <td>{CurrencyLabels[accessory.currency as Currency] || accessory.currency}</td>
              <td>{accessory.price}</td>
              <td>{ShopItemStatusLabels[accessory.status as ShopItemStatus] || accessory.status}</td>
              <td>{accessory.item_template_id}</td>
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
        title={isCreateMode ? 'Создать товар магазина' : 'Редактировать товар магазина'}
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
          <ItemTemplateSelect
            value={(formData as any).item_template_id}
            onChange={(id) => setFormData({ ...formData, item_template_id: id })}
            label="Шаблон предмета"
            required={true}
          />
          {editingAccessory?.item_template?.image_path && (
          <div className="form-group">
              <label className="form-label">Изображение из шаблона</label>
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={`${ENV.API_URL}/${editingAccessory.item_template.image_path}`} 
                  alt={editingAccessory.name}
                  style={{ width: '100px', height: '100px', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                />
              </div>
              </div>
            )}
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

export default ShopItems;

