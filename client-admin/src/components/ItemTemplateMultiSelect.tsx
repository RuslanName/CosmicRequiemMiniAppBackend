import { useState, useEffect } from 'react';
import { itemTemplatesApi, type ItemTemplate } from '../api/item-templates.api';
import { ItemTemplateTypeLabels } from '../enums/item-template-type.enum';

interface ItemTemplateMultiSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  required?: boolean;
}

const ItemTemplateMultiSelect = ({ value, onChange, label = 'Шаблоны предметов', required = false }: ItemTemplateMultiSelectProps) => {
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>(value || []);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    setSelectedIds(value || []);
  }, [value]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await itemTemplatesApi.getAll({ page: 1, limit: 1000 });
      setTemplates(response?.data || []);
    } catch (err) {
      console.error('Ошибка загрузки шаблонов:', err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.id.toString().includes(search)
  );

  const handleToggle = (id: number) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(sid => sid !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelected);
    onChange(newSelected);
  };

  const selectedTemplates = templates.filter(t => selectedIds.includes(t.id));

  if (loading) {
    return <div>Загрузка шаблонов...</div>;
  }

  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      
      {selectedTemplates.length > 0 && (
        <div style={{ marginBottom: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            Выбрано ({selectedTemplates.length}):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {selectedTemplates.map(t => (
              <span
                key={t.id}
                style={{
                  padding: '4px 8px',
                  background: '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => handleToggle(t.id)}
              >
                #{t.id} - {t.name} ✕
              </span>
            ))}
          </div>
        </div>
      )}

      <input
        className="form-input"
        type="text"
        placeholder="Поиск по ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '8px' }}
      />
      
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        maxHeight: '200px', 
        overflowY: 'auto',
        padding: '4px'
      }}>
        {filteredTemplates.length === 0 ? (
          <div style={{ padding: '8px', color: '#666', textAlign: 'center' }}>
            {search ? 'Ничего не найдено' : 'Нет доступных шаблонов'}
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              style={{
                padding: '8px',
                cursor: 'pointer',
                background: selectedIds.includes(template.id) ? '#e3f2fd' : 'transparent',
                borderRadius: '4px',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => handleToggle(template.id)}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(template.id)}
                onChange={() => {}}
                style={{ cursor: 'pointer' }}
              />
              <span>
                #{template.id} - {template.name} ({ItemTemplateTypeLabels[template.type] || template.type})
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ItemTemplateMultiSelect;

