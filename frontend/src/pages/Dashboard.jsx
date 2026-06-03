import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { showError } = useApp();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard()
      .then(setSummary)
      .catch(showError)
      .finally(() => setLoading(false));
  }, [showError]);

  if (loading) return <p className="empty">Loading dashboard…</p>;
  if (!summary) return null;

  return (
    <>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your inventory and orders</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Products</div>
          <div className="value">{summary.total_products}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Customers</div>
          <div className="value">{summary.total_customers}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Orders</div>
          <div className="value">{summary.total_orders}</div>
        </div>
        <div className="stat-card">
          <div className="label">Low Stock (≤{summary.low_stock_threshold})</div>
          <div className="value" style={{ color: summary.low_stock_products.length ? 'var(--warning)' : 'inherit' }}>
            {summary.low_stock_products.length}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Low Stock Products</h2>
        {summary.low_stock_products.length === 0 ? (
          <p className="empty" style={{ padding: '1rem 0' }}>All products are adequately stocked.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>In Stock</th>
                </tr>
              </thead>
              <tbody>
                {summary.low_stock_products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>
                      <span className="badge badge-warning">{p.quantity_in_stock}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ marginTop: '1rem' }}>
          <Link to="/products" style={{ color: 'var(--primary)' }}>
            Manage products →
          </Link>
        </p>
      </div>
    </>
  );
}
