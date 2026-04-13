import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [servicePlans, setServicePlans] = useState([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState('topup');

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [transactionForm, setTransactionForm] = useState({ amount: '', note: '' });

  const fetchMemberAndTransactions = async () => {
    try {
      const [membersRes, txRes, plansRes, servicePlansRes] = await Promise.all([
        axios.get('https://massage-app-zdtd.onrender.com/api/members'),
        axios.get(`https://massage-app-zdtd.onrender.com/api/members/${id}/transactions`),
        axios.get('https://massage-app-zdtd.onrender.com/api/topup-plans'),
        axios.get('https://massage-app-zdtd.onrender.com/api/service-plans')
      ]);
      const currentMember = (membersRes.data || []).find(m => m.id === parseInt(id));
      if (!currentMember) {
        navigate('/');
        return;
      }
      setMember(currentMember);
      setTransactions(txRes.data || []);
      setPlans(plansRes.data || []);
      setServicePlans(servicePlansRes.data || []);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchMemberAndTransactions();
  }, [id]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    let finalAmount = 0;
    let finalNote = transactionForm.note;

    if (transactionType === 'topup' && selectedPlanId) {
      const plan = plans.find(p => p.id === parseInt(selectedPlanId));
      if (plan) {
        finalAmount = plan.price + plan.bonus; // Total added to balance
        finalNote = plan.name;
      }
    } else if (transactionType === 'deduction' && selectedPlanId) {
      const servicePlan = servicePlans.find(p => p.id === parseInt(selectedPlanId));
      if (servicePlan) {
        finalAmount = servicePlan.price;
        finalNote = servicePlan.name;
      }
    } else {
      finalAmount = parseInt(transactionForm.amount, 10);
    }

    try {
      await axios.post(`https://massage-app-zdtd.onrender.com/api/members/${id}/transactions`, {
        amount: finalAmount,
        type: transactionType,
        note: finalNote
      });
      setShowTransactionModal(false);
      setTransactionForm({ amount: '', note: '' });
      setSelectedPlanId('');
      fetchMemberAndTransactions(); // Refresh data
    } catch (error) {
      alert("交易失敗: " + (error.response?.data?.error || "未知錯誤"));
    }
  };

  if (!member) return <div style={{ padding: '2rem', textAlign: 'center' }}>載入中...</div>;

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand" style={{ whiteSpace: 'nowrap' }}>
          <Link to="/">← 回到會員列表</Link>
        </div>
        <div className="header-actions-right">
          <button style={{ backgroundColor: 'var(--success)', color: '#121212' }} onClick={() => { setTransactionType('topup'); setSelectedPlanId(''); setTransactionForm({ amount: '', note: '' }); setShowTransactionModal(true); }}>
            儲值 (Top Up)
          </button>
          <button className="danger" onClick={() => { setTransactionType('deduction'); setTransactionForm({ amount: '', note: '' }); setShowTransactionModal(true); }}>
            扣款 (Deduct)
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>會員詳細資料</h2>
          <div className="member-info-grid">
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>姓名</div>
              <div style={{ fontSize: '1.2rem' }}>{member.name}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>電話</div>
              <div style={{ fontSize: '1.2rem' }}>{member.phone}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>性別</div>
              <div style={{ fontSize: '1.2rem' }}>{member.gender === 'M' ? '男' : member.gender === 'F' ? '女' : '-'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>信箱</div>
              <div style={{ fontSize: '1.2rem' }}>{member.email || '-'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>生日</div>
              <div style={{ fontSize: '1.2rem' }}>{member.birth_date || '-'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>目前餘額</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: member.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                ${member.balance}
              </div>
            </div>
          </div>
        </div>

        <div className="card table-container">
          <h3 style={{ marginBottom: '1rem' }}>交易紀錄</h3>
          <table>
            <thead>
              <tr>
                <th>時間</th>
                <th>類型</th>
                <th>金額</th>
                <th>備註</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>尚無交易紀錄</td>
                </tr>
              ) : (
                transactions.map(tx => {
                  const date = new Date(tx.created_at).toLocaleString();
                  const isTopup = tx.type === 'topup';
                  return (
                    <tr key={tx.id}>
                      <td>{date}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: isTopup ? 'rgba(3, 218, 198, 0.1)' : 'rgba(207, 102, 121, 0.1)',
                          color: isTopup ? 'var(--success)' : 'var(--danger)',
                          fontSize: '0.85rem'
                        }}>
                          {isTopup ? '儲值' : '扣款'}
                        </span>
                      </td>
                      <td style={{ color: isTopup ? 'var(--success)' : 'var(--danger)' }}>
                        {isTopup ? '+' : ''}{tx.amount}
                      </td>
                      <td>{tx.note || '-'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showTransactionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{transactionType === 'topup' ? '會員儲值' : '會員扣款'}</h2>
            <form onSubmit={handleTransactionSubmit}>

              <div className="form-group">
                <label>{transactionType === 'topup' ? '儲值方案' : '扣款方案'}</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', marginBottom: '1rem' }}
                >
                  <option value="">-- 自訂金額 --</option>
                  {transactionType === 'topup' ? (
                    plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (實收 ${plan.price}, 總存入 ${plan.price + plan.bonus})
                      </option>
                    ))
                  ) : (
                    servicePlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (扣除 ${plan.price})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {!selectedPlanId && (
                <>
                  <div className="form-group">
                    <label>金額 (額度)</label>
                    <input
                      type="number"
                      min="1"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                      required={!selectedPlanId}
                    />
                  </div>
                  <div className="form-group">
                    <label>備註 (可選)</label>
                    <input
                      type="text"
                      value={transactionForm.note}
                      onChange={(e) => setTransactionForm({ ...transactionForm, note: e.target.value })}
                      placeholder={transactionType === 'topup' ? "例: 現金儲值" : "例: 60分鐘指壓"}
                    />
                  </div>
                </>
              )}

              <div className="button-group">
                <button type="button" onClick={() => setShowTransactionModal(false)}>取消</button>
                <button type="submit" className={transactionType === 'deduction' ? 'danger' : ''}>確認</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
