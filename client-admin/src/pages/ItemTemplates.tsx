import { useState, useEffect } from 'react';
import { itemTemplatesApi, type ItemTemplate, type CreateItemTemplateDto, type UpdateItemTemplateDto } from '../api/item-templates.api';
import { ItemTemplateType, ItemTemplateTypeLabels } from '../enums/item-template-type.enum';
import { Color, ColorLabels } from '../enums/color.enum';
import { NicknameIcon, NicknameIconLabels } from '../enums/nickname-icon.enum';
import { AvatarFrame, AvatarFrameLabels } from '../enums/avatar-frame.enum';
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
    setFormData({ name: '', type: ItemTemplateType.NICKNAME_COLOR, value: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (itemTemplate: ItemTemplate) => {
    setIsCreateMode(false);
    setEditingItemTemplate(itemTemplate);
    setFormData({
      name: itemTemplate.name,
      type: itemTemplate.type,
      value: itemTemplate.value,
    });
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
      if (isCreateMode) {
        await itemTemplatesApi.create(formData as CreateItemTemplateDto);
      } else if (editingItemTemplate) {
        await itemTemplatesApi.update(editingItemTemplate.id, formData as UpdateItemTemplateDto);
      }
      setIsModalOpen(false);
      setEditingItemTemplate(null);
      setIsCreateMode(false);
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
    setError('');
  };

  const totalPages = Math.ceil(total / limit);

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
            <th>Название</th>
            <th>Тип</th>
            <th>Значение</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {itemTemplates.map((itemTemplate) => {
            let displayValue = itemTemplate.value;
            let colorPreview = null;
            
            if (itemTemplate.type === ItemTemplateType.NICKNAME_COLOR) {
              displayValue = ColorLabels[itemTemplate.value as Color] || itemTemplate.value;
              const colorMap: Record<string, string> = {
                'red': '#ff0000',
                'blue': '#0000ff',
                'green': '#00ff00',
                'colorful': 'linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)',
              };
              const bgColor = colorMap[itemTemplate.value] || itemTemplate.value;
              colorPreview = (
                <span 
                  style={{ 
                    display: 'inline-block', 
                    width: '20px', 
                    height: '20px', 
                    background: bgColor,
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}
                />
              );
            } else if (itemTemplate.type === ItemTemplateType.NICKNAME_ICON) {
              displayValue = NicknameIconLabels[itemTemplate.value as NicknameIcon] || itemTemplate.value;
            } else if (itemTemplate.type === ItemTemplateType.AVATAR_FRAME) {
              displayValue = AvatarFrameLabels[itemTemplate.value as AvatarFrame] || itemTemplate.value;
            }

            return (
              <tr key={itemTemplate.id}>
                <td>{itemTemplate.id}</td>
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
              onChange={(e) => setFormData({ ...formData, type: e.target.value, value: '' })}
            >
              {Object.values(ItemTemplateType).map((type) => (
                <option key={type} value={type}>
                  {ItemTemplateTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Значение</label>
            {(formData as any).type === ItemTemplateType.NICKNAME_COLOR ? (
              <select
                className="form-select"
                value={(formData as any).value || ''}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              >
                <option value="">-- Выберите цвет --</option>
                {Object.values(Color).map((color) => (
                  <option key={color} value={color}>
                    {ColorLabels[color]}
                  </option>
                ))}
              </select>
            ) : (formData as any).type === ItemTemplateType.NICKNAME_ICON ? (
              <select
                className="form-select"
                value={(formData as any).value || ''}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              >
                <option value="">-- Выберите иконку --</option>
                {Object.values(NicknameIcon).map((icon) => (
                  <option key={icon} value={icon}>
                    {NicknameIconLabels[icon]}
                  </option>
                ))}
              </select>
            ) : (formData as any).type === ItemTemplateType.AVATAR_FRAME ? (
              <select
                className="form-select"
                value={(formData as any).value || ''}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              >
                <option value="">-- Выберите рамку --</option>
                {Object.values(AvatarFrame).map((frame) => (
                  <option key={frame} value={frame}>
                    {AvatarFrameLabels[frame]}
                  </option>
                ))}
              </select>
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

