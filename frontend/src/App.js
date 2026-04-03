import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CSVLink } from "react-csv";
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ 
    amount: '', 
    category: 'Food', 
    type: 'expense', 
    date: new Date().toISOString().split('T')[0] 
  });

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchTransactions();
  }, [isLoggedIn]);

  // Handle Login and Registration
  const handleAuth = async (e) => {
    e.preventDefault();
    const url = `http://localhost:5000/api/${isRegistering ? 'register' : 'login'}`;
    try {
      const res = await axios.post(url, { email, password });
      if (isRegistering) {
        alert("Account Created! Please Sign In.");
        setIsRegistering(false);
      } else {
        localStorage.setItem('token', res.data.token);
        setIsLoggedIn(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Auth Failed");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/transactions', formData);
      setFormData({ ...formData, amount: '' });
      fetchTransactions();
    } catch (err) {
      alert("Error adding transaction");
    }
  };

  const deleteItem = async (id) => {
    try {
      await axios.post('http://localhost:5000/api/transactions/delete', { id });
      fetchTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  // --- CALCULATIONS ---
  const total = transactions.reduce((acc, curr) => 
    curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0
  );

  // Grouping data for the Pie Chart (Expenses Only)
  const chartData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += Number(curr.amount);
      } else {
        acc.push({ name: curr.category, value: Number(curr.amount) });
      }
      return acc;
    }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // --- AUTH SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="btn-main">{isRegistering ? 'Sign Up' : 'Sign In'}</button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} className="toggle-link">
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </p>
        </div>
      </div>
    );
  }

  // --- DASHBOARD SCREEN ---
  return (
  <div className="dashboard-container">
    <header>
      <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>
        <span style={{ color: '#6366f1' }}>My</span>FinanceTracker
      </div>
      <button onClick={() => setIsLoggedIn(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>
        Sign Out
      </button>
    </header>

    {/* Hero Section */}
    <div className="balance-card">
      <p style={{ margin: 0, opacity: 0.8, fontWeight: '700', fontSize: '14px' }}>AVAILABLE BALANCE</p>
      <h2>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
    </div>

    <div className="main-grid">
      {/* Sidebar: Controls and Chart */}
      <div className="sidebar">
        <section className="glass-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0 }}>Add Transaction</h3>
          <form onSubmit={handleSubmit}>
            <input 
  type="number" 
  value={formData.amount} 
  placeholder="Amount (₹)" 
  onChange={e => setFormData({ ...formData, amount: e.target.value })} 
  required 
/>
            <select 
  value={formData.category} 
  onChange={e => setFormData({ ...formData, category: e.target.value })}
>
  <option value="Food">🍔 Food</option>
  <option value="Rent">🏠 Rent</option>
  <option value="Travel">✈️ Travel</option>
  <option value="Bills">🧾 Bills</option>
  <option value="Shopping">🛍️ Shopping</option>
  <option value="Salary">💰 Salary</option>
</select>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button type="submit" className="btn-main">Save Transaction</button>
          </form>
        </section>

        {chartData.length > 0 && (
          <section className="glass-card" style={{ height: '300px' }}>
            <h3 style={{ marginTop: 0, textAlign: 'center', fontSize: '16px' }}>Spending Analysis</h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {chartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>
        )}
      </div>

      {/* Main Content: History */}
      <section className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ margin: 0 }}>Recent Activity</h3>
          <CSVLink data={transactions} filename={"finance_report.csv"} className="export-btn">Download CSV</CSVLink>
        </div>
        
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {transactions.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>No transactions recorded yet.</p>
          ) : (
            transactions.map(t => (
              <div key={t.id} className="transaction-row">
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{t.category}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span className={t.type}>
  {t.type === 'expense' ? '-' : '+'}₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
</span>
                  <button onClick={() => deleteItem(t.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  </div>
);
}


export default App;