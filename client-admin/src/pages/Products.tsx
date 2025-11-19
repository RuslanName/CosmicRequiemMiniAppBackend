import { useState, useEffect } from 'react';
import { productsApi, type Product, type CreateProductDto, type UpdateProductDto } from '../api/products.api';
import { ProductType, ProductTypeLabels } from '../enums/product-type.enum';
import Modal from '../components/Modal';
import '../components/Table.css';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductDto | UpdateProductDto>({});
  const [error, setError] = useState<string>('');
  const [searchId, setSearchId] = useState<string>('');

  useEffect(() => {
    if (!searchId) {
      loadProducts();
    }
  }, [page]);

  const loadProducts = async (searchIdValue?: string) => {
    try {
      setLoading(true);
      if (searchIdValue) {
        const id = parseInt(searchIdValue);
        if (!isNaN(id)) {
          const product = await productsApi.getById(id);
          setProducts([product]);
          setTotal(1);
          return;
        }
      }
      const response = await productsApi.getAll({ page, limit });
      setProducts(response?.data || []);
      setTotal(response?.total || 0);
    } catch (err: any) {
      if (err.response?.status === 404 && searchIdValue) {
        setProducts([]);
        setTotal(0);
      } else {
        setError(err.response?.data?.message || 'Ошибка загрузки продуктов');
        setProducts([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadProducts(searchId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchId(e.target.value);
    if (!e.target.value) {
      loadProducts();
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setEditingProduct(null);
    setFormData({ name: '', type: ProductType.NICKNAME_COLOR, value: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setIsCreateMode(false);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      type: product.type,
      value: product.value,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот продукт?')) return;

    try {
      setError('');
      await productsApi.delete(id);
      loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления продукта');
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      if (isCreateMode) {
        await productsApi.create(formData as CreateProductDto);
      } else if (editingProduct) {
        await productsApi.update(editingProduct.id, formData as UpdateProductDto);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setIsCreateMode(false);
      loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения продукта');
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
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
        <h2 className="table-title">Продукты</h2>
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
              <button className="btn btn-secondary" onClick={() => { setSearchId(''); loadProducts(); }}>
                Сбросить
              </button>
            )}
          </div>
          <button className="btn btn-success" onClick={handleCreate}>
            Добавить продукт
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
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>{ProductTypeLabels[product.type as ProductType] || product.type}</td>
              <td>{product.value}</td>
              <td>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(product)}>
                    Редактировать
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(product.id)}>
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
          Показано {products.length} из {total}
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
        title={isCreateMode ? 'Создать продукт' : 'Редактировать продукт'}
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
              value={(formData as any).type || ProductType.NICKNAME_COLOR}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {Object.values(ProductType).map((type) => (
                <option key={type} value={type}>
                  {ProductTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Значение</label>
            <input
              className="form-input"
              type="text"
              value={(formData as any).value || ''}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
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

export default Products;

