import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

export default function Orders() {
  const { showToast, showError } = useApp();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState([{ product_id: '', quantity: '1' }]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.orders.list(), api.customers.list(), api.products.list()])
      .then(([o, c, p]) => {
        setOrders(o);
        setCustomers(c);
        setProducts(p);
      })
      .catch(showError)
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const addLine = () => setLines([...lines, { product_id: '', quantity: '1' }]);

  const updateLine = (index, field, value) => {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  };

  const removeLine = (index) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const validateOrder = () => {
    const errs = {};
    if (!customerId) errs.customer = 'Select a customer';
    const validLines = lines.filter((l) => l.product_id);
    if (validLines.length === 0) errs.items = 'Add at least one product';
    lines.forEach((l, i) => {
      if (l.product_id) {
        const q = parseInt(l.quantity, 10);
        if (!q || q < 1) errs[`qty_${i}`] = 'Quantity must be at least 1';
      }
    });
    const ids = validLines.map((l) => l.product_id);
    if (new Set(ids).size !== ids.length) errs.items = 'Duplicate products not allowed';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateOrder()) return;
    setSubmitting(true);
    try {
      await api.orders.create({
        customer_id: parseInt(customerId, 10),
        items: lines
          .filter((l) => l.product_id)
          .map((l) => ({
            product_id: parseInt(l.product_id, 10),
            quantity: parseInt(l.quantity, 10),
          })),
      });
      showToast('Order created');
      setShowCreate(false);
      setCustomerId('');
      setLines([{ product_id: '', quantity: '1' }]);
      load();
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel/delete this order? Stock will be restored.')) return;
    try {
      await api.orders.delete(id);
      showToast('Order deleted');
      setDetail(null);
      load();
    } catch (err) {
      showError(err);
    }
  };

  const viewDetail = async (id) => {
    try {
      const order = await api.orders.get(id);
      setDetail(order);
    } catch (err) {
      showError(err);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1>Orders</h1>
        <p>Create and track customer orders</p>
      </header>

      <div className="toolbar">
        <span />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowCreate(true);
            setErrors({});
          }}
          disabled={!customers.length || !products.length}
        >
          Create Order
        </button>
      </div>

      {(!customers.length || !products.length) && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Add at least one customer and one product before creating orders.
        </p>
      )}

      <div className="card">
        {loading ? (
          <p className="empty">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="empty">No orders yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.customer_name || `Customer ${o.customer_id}`}</td>
                    <td>${Number(o.total_amount).toFixed(2)}</td>
                    <td>{new Date(o.created_at).toLocaleString()}</td>
                    <td className="actions">
                      <button type="button" className="btn btn-ghost" onClick={() => viewDetail(o.id)}>
                        Details
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => handleDelete(o.id)}>
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

      {showCreate && (
        <Modal title="Create Order" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="customer">Customer</label>
              <select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
              {errors.customer && <span className="error">{errors.customer}</span>}
            </div>

            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Order items</p>
            {errors.items && <span className="error" style={{ display: 'block', marginBottom: '0.5rem' }}>{errors.items}</span>}

            {lines.map((line, i) => (
              <div key={i} className="order-line">
                <div className="form-group">
                  <label>Product</label>
                  <select
                    value={line.product_id}
                    onChange={(e) => updateLine(i, 'product_id', e.target.value)}
                  >
                    <option value="">Select…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (stock: {p.quantity_in_stock}) — ${Number(p.price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                  />
                  {errors[`qty_${i}`] && <span className="error">{errors[`qty_${i}`]}</span>}
                </div>
                <button type="button" className="btn btn-danger" onClick={() => removeLine(i)} disabled={lines.length === 1}>
                  ×
                </button>
              </div>
            ))}

            <button type="button" className="btn btn-ghost" style={{ marginBottom: '1rem' }} onClick={addLine}>
              + Add line
            </button>

            <div className="actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Place Order'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal title={`Order #${detail.id}`} onClose={() => setDetail(null)}>
          <p>
            <strong>Customer:</strong> {detail.customer_name} ({detail.customer_email})
          </p>
          <p>
            <strong>Total:</strong> ${Number(detail.total_amount).toFixed(2)}
          </p>
          <p>
            <strong>Date:</strong> {new Date(detail.created_at).toLocaleString()}
          </p>
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.product_sku}</td>
                    <td>{item.quantity}</td>
                    <td>${Number(item.unit_price).toFixed(2)}</td>
                    <td>${Number(item.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-danger" onClick={() => handleDelete(detail.id)}>
              Cancel Order
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
