import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const emptyForm = { name: '', sku: '', price: '', quantity_in_stock: '' };

function validateForm(form, isEdit) {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'Name is required';
  if (!isEdit && !form.sku?.trim()) errors.sku = 'SKU is required';
  const price = parseFloat(form.price);
  if (form.price === '' || isNaN(price) || price <= 0) errors.price = 'Valid price required';
  const qty = parseInt(form.quantity_in_stock, 10);
  if (form.quantity_in_stock === '' || isNaN(qty) || qty < 0) {
    errors.quantity_in_stock = 'Quantity must be 0 or more';
  }
  return errors;
}

function ProductForm({ form, setForm, errors, isEdit }) {
  return (
    <div className="form-grid">
      <div className="form-group">
        <label htmlFor="name">Product Name</label>
        <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="sku">SKU / Code</label>
        <input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        {errors.sku && <span className="error">{errors.sku}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="price">Price ($)</label>
        <input id="price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        {errors.price && <span className="error">{errors.price}</span>}
      </div>
      <div className="form-group">
        <label htmlFor="qty">Quantity in Stock</label>
        <input id="qty" type="number" min="0" value={form.quantity_in_stock} onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })} />
        {errors.quantity_in_stock && <span className="error">{errors.quantity_in_stock}</span>}
      </div>
    </div>
  );
}

export default function Products() {
  const { showToast, showError } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.products
      .list()
      .then(setProducts)
      .catch(showError)
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setModal('create');
  };

  const openEdit = (p) => {
    setForm({
      name: p.name,
      sku: p.sku,
      price: String(p.price),
      quantity_in_stock: String(p.quantity_in_stock),
    });
    setErrors({});
    setModal({ type: 'edit', id: p.id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = modal?.type === 'edit' || modal === 'edit';
    const editId = modal?.id;
    const validation = validateForm(form, !!editId);
    if (Object.keys(validation).filter((k) => validation[k]).length) {
      setErrors(validation);
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        quantity_in_stock: parseInt(form.quantity_in_stock, 10),
      };
      if (editId) {
        body.sku = form.sku.trim();
        await api.products.update(editId, body);
        showToast('Product updated');
      } else {
        body.sku = form.sku.trim();
        await api.products.create(body);
        showToast('Product created');
      }
      setModal(null);
      load();
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.products.delete(id);
      showToast('Product deleted');
      load();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1>Products</h1>
        <p>Manage catalog and stock levels</p>
      </header>

      <div className="toolbar">
        <span />
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Add Product
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty">Loading…</p>
        ) : products.length === 0 ? (
          <p className="empty">No products yet. Add your first product.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>
                      {p.quantity_in_stock <= 10 ? (
                        <span className="badge badge-warning">{p.quantity_in_stock}</span>
                      ) : (
                        p.quantity_in_stock
                      )}
                    </td>
                    <td className="actions">
                      <button type="button" className="btn btn-ghost" onClick={() => openEdit(p)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => handleDelete(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'create' || modal?.type !== 'edit' ? 'Add Product' : 'Edit Product'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit}>
            <ProductForm form={form} setForm={setForm} errors={errors} isEdit={!!modal?.id} />
            <div className="actions" style={{ marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
