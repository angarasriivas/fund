import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [portalType, setPortalType] = useState('user');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? `${API_BASE_URL}/api/auth/login` : `${API_BASE_URL}/api/auth/register`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData)
      });
      const data = await response.json();
      
      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.result));
          window.location.href = '/';
        } else {
          setIsLogin(true);
          alert('Registration successful! Please sign in.');
        }
      } else {
        alert(data.message || 'Error occurred');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            type="button"
            className={`btn ${portalType === 'admin' ? 'btn-primary' : ''}`}
            style={{ background: portalType === 'admin' ? '' : 'rgba(255,255,255,0.1)' }}
            onClick={() => {
              setPortalType('admin');
              setFormData((prev) => ({ ...prev, role: 'admin' }));
            }}
          >
            Admin Login
          </button>
          <button
            type="button"
            className={`btn ${portalType === 'user' ? 'btn-primary' : ''}`}
            style={{ background: portalType === 'user' ? '' : 'rgba(255,255,255,0.1)' }}
            onClick={() => {
              setPortalType('user');
              setFormData((prev) => ({ ...prev, role: 'user' }));
            }}
          >
            User Login
          </button>
        </div>

        <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {isLogin ? `${portalType === 'admin' ? 'Admin' : 'User'} Sign In` : 'Create Account'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="input-label">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required={!isLogin}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Account Type</label>
                <input
                  type="text"
                  className="input-field"
                  value="User (View Only)"
                  readOnly
                />
              </div>
            </>
          )}

          {isLogin && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
              {portalType === 'admin'
                ? 'Admin portal: add and manage contributors, payments, and loans.'
                : 'User portal: view-only access to admin-entered contributors, payments, and loans.'}
            </p>
          )}
          
          <div className="form-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {isLogin ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Sign Up</>}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', marginLeft: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
