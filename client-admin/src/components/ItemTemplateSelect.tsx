import { useState, useEffect } from 'react';
import { itemTemplatesApi, type ItemTemplate } from '../api/item-templates.api';
import { ItemTemplateTypeLabels } from '../enums/item-template-type.enum';

interface ItemTemplateSelectProps {
  value: number | undefined;
  onChange: (id: number) => void;
  label?: string;
  required?: boolean;
}

const ItemTemplateSelect = ({ value, onChange, label = 'Шаблон предмета', required = false }: ItemTemplateSelectProps) => {
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

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

  if (loading) {
    return <div>Загрузка шаблонов...</div>;
  }

  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </label>
      <input
        className="form-input"
        type="text"
        placeholder="Поиск по ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '8px' }}
      />
      <select
        className="form-select"
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        required={required}
        style={{ maxHeight: '200px' }}
      >
        <option value="">-- Выберите шаблон --</option>
        {filteredTemplates.map((template) => (
          <option key={template.id} value={template.id}>
            #{template.id} - {template.name} ({ItemTemplateTypeLabels[template.type] || template.type})
          </option>
        ))}
      </select>
      {filteredTemplates.length === 0 && search && (
        <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
          Ничего не найдено
        </div>
      )}
    </div>
  );
};

export default ItemTemplateSelect;

