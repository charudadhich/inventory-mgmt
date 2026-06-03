import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

const emptyForm = { full_name: '', email: '', phone: '' };

function validateCustomer(form) {
  const errors = {};
  if (!form.full_name?.trim()) errors.full_name = 'Full name is required';
  if (!form.email?.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email';
  if (!form.phone?.trim()) errors.phone = 'Phone is required';
  return errors;
}

export default function Customers() {
  const { showToast, showError } = useApp();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.customers
      .list()
      .then(setCustomers)
      .catch(showError)
      .finally(() => setLoading(false));
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateCustomer(form);
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    setSubmitting(true);
    try {
      await api.customers.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      showToast('Customer created');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.customers.delete(id);
      showToast('Customer deleted');
      load();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1>Customers</h1>
        <p>Manage customer records</p>
      </header>

      <div className="toolbar">
        <span />
        <button type="button" className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setShowModal(true); }}>
          Add Customer
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="empty">Loading…</p>
        ) : customers.length === 0 ? (
          <p className="empty">No customers yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>
                      <button type="button" className="btn btn-danger" onClick={() => handleDelete(c.id)}>
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

      {showModal && (
        <Modal title="Add Customer" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                {errors.full_name && <span className="error">{errors.full_name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                {errors.phone && <span className="error">{errors.phone}</span>}
              </div>
            </div>
            <div className="actions" style={{ marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
