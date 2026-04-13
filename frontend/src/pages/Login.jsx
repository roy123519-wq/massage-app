import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://massage-app-zdtd.onrender.com/api/login', { username, password });
      if (res.data.message === "Login successful") {
        localStorage.setItem('adminToken', res.data.admin.username);
        navigate('/');
      }
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '2rem', textAlign: 'center', color: 'var(--accent)' }}>系統管理員</h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>帳號或密碼錯誤</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>帳號 (Username)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="admin"
            />
          </div>
          <div className="form-group">
            <label>密碼 (Password)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="password123"
            />
          </div>
          <button type="submit" style={{ width: '100%', marginTop: '1rem' }}>登入</button>
        </form>
      </div>
    </div>
  );
}
