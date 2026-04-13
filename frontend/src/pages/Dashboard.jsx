import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [servicePlans, setServicePlans] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showServicePlanModal, setShowServicePlanModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phone: '', email: '', birth_date: '', gender: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [newPlan, setNewPlan] = useState({ name: '', price: '', bonus: '' });
  const [newServicePlan, setNewServicePlan] = useState({ name: '', price: '' });
  const [revenueData, setRevenueData] = useState([]);
  const navigate = useNavigate();

  const fetchMembers = async () => {
    try {
      const res = await axios.get('https://massage-app-zdtd.onrender.com/api/members');
      setMembers(res.data || []);
    } catch (error) {
      console.error("Error fetching members", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await axios.get('https://massage-app-zdtd.onrender.com/api/topup-plans');
      setPlans(res.data || []);
    } catch (error) {
      console.error("Error fetching plans", error);
    }
  };

  const fetchRevenue = async () => {
    try {
      const res = await axios.get('https://massage-app-zdtd.onrender.com/api/revenue/monthly');
      setRevenueData(res.data || []);
    } catch (error) {
      console.error("Error fetching revenue", error);
    }
  };

  const fetchServicePlans = async () => {
    try {
      const res = await axios.get('https://massage-app-zdtd.onrender.com/api/service-plans');
      setServicePlans(res.data || []);
    } catch (error) {
      console.error("Error fetching service plans", error);
    }
  };

  const handleViewRevenue = () => {
    fetchRevenue();
    setShowRevenueModal(true);
  };

  useEffect(() => {
    fetchMembers();
    fetchPlans();
    fetchServicePlans();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://massage-app-zdtd.onrender.com/api/members', newMember);
      setShowAddModal(false);
      setNewMember({ name: '', phone: '', email: '', birth_date: '', gender: '' });
      fetchMembers();
    } catch (error) {
      alert("新增會員失敗");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除此會員嗎？')) {
      try {
        await axios.delete(`https://massage-app-zdtd.onrender.com/api/members/${id}`);
        fetchMembers();
      } catch (error) {
        alert("刪除會員失敗");
      }
    }
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://massage-app-zdtd.onrender.com/api/topup-plans', {
        name: newPlan.name,
        price: parseInt(newPlan.price),
        bonus: parseInt(newPlan.bonus)
      });
      setNewPlan({ name: '', price: '', bonus: '' });
      fetchPlans();
    } catch (error) {
      alert("新增方案失敗");
    }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm('確定要刪除此儲值方案嗎？')) {
      try {
        await axios.delete(`https://massage-app-zdtd.onrender.com/api/topup-plans/${id}`);
        fetchPlans();
      } catch (error) {
        alert("刪除方案失敗");
      }
    }
  };

  const handleAddServicePlan = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://massage-app-zdtd.onrender.com/api/service-plans', {
        name: newServicePlan.name,
        price: parseInt(newServicePlan.price)
      });
      setNewServicePlan({ name: '', price: '' });
      fetchServicePlans();
    } catch (error) {
      alert("新增扣款方案失敗");
    }
  };

  const handleDeleteServicePlan = async (id) => {
    if (window.confirm('確定要刪除此扣款方案嗎？')) {
      try {
        await axios.delete(`https://massage-app-zdtd.onrender.com/api/service-plans/${id}`);
        fetchServicePlans();
      } catch (error) {
        alert("刪除扣款方案失敗");
      }
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">按摩會員管理系統</div>
        <button className="danger" onClick={handleLogout}>登出</button>
      </nav>

      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>會員列表</h2>
            <input
              type="text"
              placeholder="搜尋姓名或電話..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', width: '250px' }}
            />
          </div>
          <div>
            <button style={{ marginRight: '1rem', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} onClick={handleViewRevenue}>
              📊 營收與消費統計
            </button>
            <button style={{ marginRight: '1rem', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} onClick={() => setShowServicePlanModal(true)}>
              ⚙️ 扣款方案管理
            </button>
            <button style={{ marginRight: '1rem', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} onClick={() => setShowPlanModal(true)}>
              ⚙️ 儲值方案管理
            </button>
            <button onClick={() => setShowAddModal(true)}>+ 新增會員</button>
          </div>
        </div>

        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>編號 (ID)</th>
                <th>姓名 (Name)</th>
                <th>電話 (Phone)</th>
                <th>性別 (Gender)</th>
                <th>信箱 (Email)</th>
                <th>生日 (Birth Date)</th>
                <th>餘額 (Balance)</th>
                <th>操作 (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {members.filter(m => m.name.includes(searchTerm) || m.phone.includes(searchTerm)).length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>目前尚無符合的資料</td>
                </tr>
              ) : (
                members.filter(m => m.name.includes(searchTerm) || m.phone.includes(searchTerm)).map(member => (
                  <tr key={member.id}>
                    <td>{member.id}</td>
                    <td>{member.name}</td>
                    <td>{member.phone}</td>
                    <td>{member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}</td>
                    <td>{member.email || '-'}</td>
                    <td>{member.birth_date || '-'}</td>
                    <td style={{ color: member.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      ${member.balance}
                    </td>
                    <td>
                      <Link to={`/member/${member.id}`}>
                        <button style={{ marginRight: '0.5rem', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}>管理</button>
                      </Link>
                      <button className="danger" onClick={() => handleDelete(member.id)}>刪除</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>新增會員 (Add Member)</h2>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>姓名 (Name)</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>電話 (Phone)</label>
                <input
                  type="text"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>性別 (Gender)</label>
                <select
                  value={newMember.gender}
                  onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                  required
                >
                  <option value="">請選擇</option>
                  <option value="M">男</option>
                  <option value="F">女</option>
                </select>
              </div>
              <div className="form-group">
                <label>信箱 (Email)</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="可選"
                />
              </div>
              <div className="form-group">
                <label>生日 (Birth Date)</label>
                <input
                  type="date"
                  value={newMember.birth_date}
                  onChange={(e) => setNewMember({ ...newMember, birth_date: e.target.value })}
                />
              </div>
              <div className="button-group">
                <button type="button" onClick={() => setShowAddModal(false)}>取消</button>
                <button type="submit">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPlanModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <h2>固定儲值方案管理</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <form onSubmit={handleAddPlan} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>方案名稱</label>
                  <input type="text" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="例: 儲值1000送200" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>實收金額</label>
                  <input type="number" min="0" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>贈送金額</label>
                  <input type="number" min="0" value={newPlan.bonus} onChange={(e) => setNewPlan({ ...newPlan, bonus: e.target.value })} required />
                </div>
                <button type="submit" style={{ height: '42px', backgroundColor: 'var(--success)', color: '#121212' }}>新增</button>
              </form>
            </div>

            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>方案名稱</th>
                    <th>實收</th>
                    <th>贈送</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => (
                    <tr key={plan.id}>
                      <td>{plan.name}</td>
                      <td>${plan.price}</td>
                      <td>${plan.bonus}</td>
                      <td>
                        <button className="danger" style={{ padding: '0.2rem 0.5rem' }} onClick={() => handleDeletePlan(plan.id)}>刪除</button>
                      </td>
                    </tr>
                  ))}
                  {plans.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center' }}>尚無儲值方案</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="button-group" style={{ marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowPlanModal(false)} style={{ width: '100%' }}>關閉</button>
            </div>
          </div>
        </div>
      )}

      {showServicePlanModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <h2>固定扣款方案管理</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <form onSubmit={handleAddServicePlan} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>方案名稱</label>
                  <input type="text" value={newServicePlan.name} onChange={(e) => setNewServicePlan({ ...newServicePlan, name: e.target.value })} placeholder="例: 60分鐘指壓" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>扣除</label>
                  <input type="number" min="0" value={newServicePlan.price} onChange={(e) => setNewServicePlan({ ...newServicePlan, price: e.target.value })} placeholder="金額" required />
                </div>
                <button type="submit" style={{ height: '42px', backgroundColor: 'var(--success)', color: '#121212' }}>新增</button>
              </form>
            </div>

            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>方案名稱</th>
                    <th>扣除金額</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {servicePlans.map(plan => (
                    <tr key={plan.id}>
                      <td>{plan.name}</td>
                      <td>${plan.price}</td>
                      <td>
                        <button className="danger" style={{ padding: '0.2rem 0.5rem' }} onClick={() => handleDeleteServicePlan(plan.id)}>刪除</button>
                      </td>
                    </tr>
                  ))}
                  {servicePlans.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center' }}>尚無扣款方案</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="button-group" style={{ marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowServicePlanModal(false)} style={{ width: '100%' }}>關閉</button>
            </div>
          </div>
        </div>
      )}

      {showRevenueModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px', width: '90%' }}>
            <h2>營收與消費統計 (Revenue & Deductions)</h2>
            <div style={{ width: '100%', height: 350, marginTop: '2rem' }}>
              <ResponsiveContainer>
                <BarChart data={[...(revenueData || [])].reverse()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend />
                  <Bar dataKey="topup_revenue" name="儲值總收" fill="var(--success)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deduction_revenue" name="扣款總計" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '1rem' }}>
              <table style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>月份</th>
                    <th>總儲值額</th>
                    <th>總扣款額</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData && revenueData.length > 0 ? (
                    revenueData.map((data, index) => (
                      <tr key={index}>
                        <td>{data.month}</td>
                        <td style={{ color: 'var(--success)' }}>${data.topup_revenue}</td>
                        <td style={{ color: 'var(--danger)' }}>${data.deduction_revenue}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center' }}>尚無營收資料</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="button-group" style={{ marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowRevenueModal(false)} style={{ width: '100%' }}>關閉</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
