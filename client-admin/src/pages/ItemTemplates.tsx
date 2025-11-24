import { useState, useEffect } from 'react';
import { itemTemplatesApi, type ItemTemplate, type CreateItemTemplateDto, type UpdateItemTemplateDto } from '../api/item-templates.api';
import { ItemTemplateType, ItemTemplateTypeLabels } from '../enums/item-template-type.enum';
import { ENV } from '../config/constants';
import Modal from '../components/Modal';
import '../components/Table.css';

const ItemTemplates = () => {
  const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingItemTemplate, setEditingItemTemplate] = useState<ItemTemplate | null>(null);
  const [formData, setFormData] = useState<CreateItemTemplateDto | UpdateItemTemplateDto>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('#ff0000');
  const [error, setError] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');

  useEffect(() => {
    if (!searchId) {
      loadItemTemplates();
    }
  }, [page]);

  const loadItemTemplates = async (searchIdValue?: string) => {
    try {
      setLoading(true);
      if (searchIdValue) {
        const id = parseInt(searchIdValue);
        if (!isNaN(id)) {
          const itemTemplate = await itemTemplatesApi.getById(id);
          setItemTemplates([itemTemplate]);
          setTotal(1);
          return;
        }
      }
      const response = await itemTemplatesApi.getAll({ page, limit });
      setItemTemplates(response?.data || []);
      setTotal(response?.total || 0);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setItemTemplates([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки шаблонов предметов');
        setItemTemplates([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadItemTemplates(searchId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
    if (!e.target.value) {
      loadItemTemplates();
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setEditingItemTemplate(null);
    setFormData({ name: '', type: ItemTemplateType.NICKNAME_COLOR });
    setImageFile(null);
    setSelectedColor('#ff0000');
    setIsModalOpen(true);
  };

  const handleEdit = (itemTemplate: ItemTemplate) => {
    setIsCreateMode(false);
    setEditingItemTemplate(itemTemplate);
    setFormData({
      name: itemTemplate.name,
      type: itemTemplate.type,
      value: itemTemplate.value || undefined,
    });
    setImageFile(null);
    if (itemTemplate.type === ItemTemplateType.NICKNAME_COLOR && itemTemplate.value) {
      setSelectedColor(itemTemplate.value);
    } else if (itemTemplate.type === ItemTemplateType.NICKNAME_COLOR) {
      setSelectedColor('#ff0000');
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон предмета?')) return;

    try {
      setError('');
      await itemTemplatesApi.delete(id);
      loadItemTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления шаблона');
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      const dataToSave = { ...formData };
      
      if ((formData as any).type === ItemTemplateType.NICKNAME_COLOR) {
        if (selectedColor) {
          dataToSave.value = selectedColor;
        } else {
          dataToSave.value = undefined;
        }
      }
      
      if ((formData as any).type === ItemTemplateType.NICKNAME_ICON || 
          (formData as any).type === ItemTemplateType.AVATAR_FRAME) {
        dataToSave.value = undefined;
      }
      
      const shouldSendImage = ![
        ItemTemplateType.NICKNAME_COLOR,
        ItemTemplateType.REWARD_DOUBLING,
        ItemTemplateType.COOLDOWN_HALVING
      ].includes((formData as any).type);
      
      if (isCreateMode) {
        await itemTemplatesApi.create(dataToSave as CreateItemTemplateDto, shouldSendImage ? (imageFile || undefined) : undefined);
      } else if (editingItemTemplate) {
        await itemTemplatesApi.update(editingItemTemplate.id, dataToSave as UpdateItemTemplateDto, shouldSendImage ? (imageFile || undefined) : undefined);
      }
      setIsModalOpen(false);
      setEditingItemTemplate(null);
      setIsCreateMode(false);
      setImageFile(null);
      loadItemTemplates();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения шаблона');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingItemTemplate(null);
    setIsCreateMode(false);
    setFormData({});
    setImageFile(null);
    setSelectedColor('#ff0000');
    setError('');
  };

  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2 className="table-title">Шаблоны предметов</h2>
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
              <button className="btn btn-secondary" onClick={() => { setSearchId(''); loadItemTemplates(); }}>
                Сбросить
              </button>
            )}
          </div>
          <button className="btn btn-success" onClick={handleCreate}>
            Добавить шаблон
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
            <th>Тип</th>
            <th>Значение</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {itemTemplates.map((itemTemplate) => {
            let displayValue = itemTemplate.value || '-';
            let colorPreview = null;
            
            if (itemTemplate.type === ItemTemplateType.NICKNAME_COLOR && itemTemplate.value) {
              displayValue = itemTemplate.value;
              colorPreview = (
                <span 
                  style={{ 
                    display: 'inline-block', 
                    width: '20px', 
                    height: '20px', 
                    background: itemTemplate.value,
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}
                />
              );
            }

            return (
              <tr key={itemTemplate.id}>
                <td>{itemTemplate.id}</td>
                <td>
                  {itemTemplate.image_path ? (
                    <img 
                      src={`${ENV.API_URL}/${itemTemplate.image_path}`} 
                      alt={itemTemplate.name}
                      style={{ width: '50px', height: '50px', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                    />
                  ) : (
                    '-'
                  )}
                </td>
                <td>{itemTemplate.name}</td>
                <td>{ItemTemplateTypeLabels[itemTemplate.type as ItemTemplateType] || itemTemplate.type}</td>
                <td>
                  {colorPreview}
                  {displayValue}
                </td>
                <td>
                  <div className="actions">
                    <button className="btn btn-primary" onClick={() => handleEdit(itemTemplate)}>
                      Редактировать
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(itemTemplate.id)}>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pagination">
        <div className="pagination-info">
          Показано {itemTemplates.length} из {total}
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
        title={isCreateMode ? 'Создать шаблон' : 'Редактировать шаблон'}
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
            <label className="form-label">Тип</label>
            <select
              className="form-select"
              value={(formData as any).type || ItemTemplateType.NICKNAME_COLOR}
              onChange={(e) => {
                const newType = e.target.value;
                setFormData({ ...formData, type: newType, value: undefined });
                if (newType !== ItemTemplateType.NICKNAME_COLOR) {
                  setSelectedColor('#ff0000');
                }
              }}
            >
              {Object.values(ItemTemplateType).map((type) => (
                <option key={type} value={type}>
                  {ItemTemplateTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>
          {((formData as any).type !== ItemTemplateType.NICKNAME_ICON && 
            (formData as any).type !== ItemTemplateType.AVATAR_FRAME) && (
          <div className="form-group">
              <label className="form-label">Значение {(formData as any).type === ItemTemplateType.NICKNAME_COLOR ? '(необязательно)' : ''}</label>
            {(formData as any).type === ItemTemplateType.NICKNAME_COLOR ? (
                <div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      style={{ width: '50px', height: '40px', cursor: 'pointer' }}
                    />
                    <input
                      className="form-input"
                      type="text"
                      value={selectedColor}
                      onChange={(e) => {
                        const color = e.target.value;
                        setSelectedColor(color);
                      }}
                      placeholder="#ff0000"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Выберите цвет из палитры или введите hex-код цвета
                  </div>
                </div>
            ) : (
              <input
                className="form-input"
                type="text"
                value={(formData as any).value || ''}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Введите значение"
              />
            )}
          </div>
          )}
          {((formData as any).type !== ItemTemplateType.NICKNAME_COLOR && 
            (formData as any).type !== ItemTemplateType.REWARD_DOUBLING && 
            (formData as any).type !== ItemTemplateType.COOLDOWN_HALVING) && (
            <div className="form-group">
              <label className="form-label">Изображение (необязательно)</label>
              <input
                className="form-input"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              {editingItemTemplate && editingItemTemplate.image_path && !imageFile && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={`${ENV.API_URL}/${editingItemTemplate.image_path}`} 
                    alt={editingItemTemplate.name}
                    style={{ width: '100px', height: '100px', objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                  />
                </div>
              )}
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

export default ItemTemplates;

