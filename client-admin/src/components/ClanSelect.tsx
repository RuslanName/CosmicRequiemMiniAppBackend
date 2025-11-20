import { useState, useEffect } from 'react';
import { clansApi, type Clan } from '../api/clans.api';

interface ClanSelectProps {
  value: number | undefined;
  onChange: (id: number) => void;
  label?: string;
  required?: boolean;
}

const ClanSelect = ({ value, onChange, label = 'Клан', required = false }: ClanSelectProps) => {
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadClans();
  }, []);

  const loadClans = async () => {
    try {
      setLoading(true);
      const response = await clansApi.getAll({ page: 1, limit: 1000 });
      setClans(response?.data || []);
    } catch (err) {
      console.error('Ошибка загрузки кланов:', err);
      setClans([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClans = clans.filter(c => 
    c.id.toString().includes(search)
  );

  if (loading) {
    return <div>Загрузка кланов...</div>;
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
        <option value="">-- Выберите клан --</option>
        {filteredClans.map((clan) => (
          <option key={clan.id} value={clan.id}>
            #{clan.id} - {clan.name}
          </option>
        ))}
      </select>
      {filteredClans.length === 0 && search && (
        <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
          Ничего не найдено
        </div>
      )}
    </div>
  );
};

export default ClanSelect;

