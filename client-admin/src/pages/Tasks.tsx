import { useState, useEffect } from 'react';
import { tasksApi, type Task, type CreateTaskDto, type UpdateTaskDto } from '../api/tasks.api';
import { TaskType, TaskTypeLabels } from '../enums';
import Modal from '../components/Modal';
import '../components/Table.css';

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<CreateTaskDto | UpdateTaskDto>({});
  const [error, setError] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');

  useEffect(() => {
    if (!searchId) {
      loadTasks();
    }
  }, [page]);

  const loadTasks = async (searchIdValue?: string) => {
    try {
      setLoading(true);
      if (searchIdValue) {
        const id = parseInt(searchIdValue);
        if (!isNaN(id)) {
          const task = await tasksApi.getById(id);
          setTasks([task]);
          setTotal(1);
          return;
        }
      }
      const response = await tasksApi.getAll({ page, limit });
      setTasks(response?.data || []);
      setTotal(response?.total || 0);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setTasks([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки заданий');
        setTasks([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadTasks(searchId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
    if (!e.target.value) {
      loadTasks();
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setEditingTask(null);
    setFormData({ description: '', type: TaskType.COMPLETE_CONTRACT, value: null, money_reward: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setIsCreateMode(false);
    setEditingTask(task);
    setFormData({
      description: task.description,
      type: task.type,
      value: task.value || null,
      money_reward: task.money_reward,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить это задание?')) return;

    try {
      setError('');
      await tasksApi.delete(id);
      loadTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления задания');
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      if (isCreateMode) {
        await tasksApi.create(formData as CreateTaskDto);
      } else if (editingTask) {
        await tasksApi.update(editingTask.id, formData as UpdateTaskDto);
      }
      setIsModalOpen(false);
      setEditingTask(null);
      setIsCreateMode(false);
      loadTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения задания');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
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
        <h2 className="table-title">Задания</h2>
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
              <button className="btn btn-secondary" onClick={() => { setSearchId(''); loadTasks(); }}>
                Сбросить
              </button>
            )}
          </div>
          <button className="btn btn-success" onClick={handleCreate}>
            Добавить задание
          </button>
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Описание</th>
            <th>Тип</th>
            <th>Значение</th>
            <th>Награда</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.id}</td>
              <td>{task.description}</td>
              <td>{TaskTypeLabels[task.type as TaskType] || task.type}</td>
              <td>{task.value || '-'}</td>
              <td>{task.money_reward}</td>
              <td>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(task)}>
                    Редактировать
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(task.id)}>
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
          Показано {tasks.length} из {total}
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
        title={isCreateMode ? 'Создать задание' : 'Редактировать задание'}
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
            <label className="form-label">Тип</label>
            <select
              className="form-select"
              value={(formData as any).type || TaskType.COMPLETE_CONTRACT}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {Object.values(TaskType).map((type) => (
                <option key={type} value={type}>
                  {TaskTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Значение (количество раз, опционально)</label>
            <input
              className="form-input"
              type="text"
              value={(formData as any).value || ''}
              onChange={(e) => setFormData({ ...formData, value: e.target.value || null })}
              placeholder="Например: 5"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Денежная награда</label>
            <input
              className="form-input"
              type="number"
              value={(formData as any).money_reward || ''}
              onChange={(e) => setFormData({ ...formData, money_reward: parseInt(e.target.value) || 0 })}
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

export default Tasks;

