import React, { useEffect, useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2, TrendingUp, Users, Wallet, Target, Landmark } from 'lucide-react';
import { apiFetch } from '../utils/api';

const LoanPage = () => {
    const [user, setUser] = useState(null);
    const [loans, setLoans] = useState([]);
    const [groups, setGroups] = useState([]); // Used to calculate Total Global Fund
    
    // Form States
    const [borrowerName, setBorrowerName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [interestAmount, setInterestAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('');
    const [guarantorName, setGuarantorName] = useState('');
    
    // Master Budget
    const [globalFund, setGlobalFund] = useState(() => {
        const saved = localStorage.getItem('loanGlobalFund');
        return saved ? Number(saved) : 10500;
    });

    useEffect(() => {
        localStorage.setItem('loanGlobalFund', globalFund);
    }, [globalFund]);
    
    const sigCanvas = useRef({});

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            fetchLoans(storedUser._id);
            fetchGroups(storedUser._id);
        }
    }, []);

    const fetchLoans = async (userId) => {
        try {
            const res = await apiFetch(`/api/loans/${userId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setLoans(data);
            } else {
                setLoans([]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchGroups = async (userId) => {
        try {
            const res = await apiFetch(`/api/groups/user/${userId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setGroups(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteLoan = async (id) => {
        try {
            const res = await apiFetch(`/api/loans/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setLoans(loans.filter(l => l._id !== id));
            } else {
                alert('Failed to clear borrower.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const clearSignature = () => {
        if(sigCanvas.current && sigCanvas.current.clear) {
            sigCanvas.current.clear();
        }
    };

    const handleIssueLoan = async (e) => {
        e.preventDefault();
        
        let signatureData = '';
        if (sigCanvas.current && typeof sigCanvas.current.isEmpty === 'function' && !sigCanvas.current.isEmpty()) {
            signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        }

        try {
            const res = await apiFetch('/api/loans/give-loan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    borrowerName,
                    mobileNumber,
                    guarantorName,
                    guarantorSignature: signatureData,
                    paymentMode,
                    amount: Number(amount),
                    interestAmount: Number(interestAmount) || 0
                })
            });
            if (res.ok) {
                setBorrowerName('');
                setMobileNumber('');
                setAmount('');
                setInterestAmount('');
                setPaymentMode('');
                setGuarantorName('');
                clearSignature();
                fetchLoans(user._id);
                alert("Loan Successfully Issued And Saved!");
            } else {
                const errorData = await res.json();
                alert(`Error issuing loan: ${errorData.message}`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Calculate Master Metrics
    const totalGlobalFund = globalFund;
    const totalPrincipal = loans.reduce((acc, curr) => acc + curr.amount, 0);
    const expectedInterest = loans.reduce((acc, curr) => {
        // Handle new interestAmount logic safely
        return curr.interestAmount ? acc + curr.interestAmount : acc + (curr.interestRate ? curr.amount * (curr.interestRate/100) : 0);
    }, 0);
    const totalDue = loans.reduce((acc, curr) => acc + curr.remaining, 0);
    
    // Total Remaining Money available in Fund
    const remainingAvailableMoney = totalGlobalFund - totalPrincipal;

    const activeCount = loans.filter(l => l.status === 'active').length;
    const isAdmin = user && user.role === 'admin';

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="text-gradient">Loan Master Session</h1>
                <p style={{ color: 'var(--text-muted)' }}>Track overall metrics, flat interest returns, and active outstanding accounts.</p>
            </div>

            {/* MASTER METRICS DASHBOARD */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass-card" style={{ background: 'var(--gradient-1)', border: 'none' }}>
                    <div className="flex-between">
                        <h4 style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>Total Fund Setup</h4>
                        <Landmark size={20} color="white" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', color: 'white', fontWeight: 'bold' }}>₹</span>
                        <input 
                            type="number" 
                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', fontWeight: 'bold', width: '100%', outline: 'none' }}
                            value={globalFund}
                            onChange={(e) => setGlobalFund(Number(e.target.value) || 0)}
                            readOnly={!isAdmin}
                        />
                    </div>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Available to Lent: ₹{remainingAvailableMoney}</p>
                </div>

                <div className="glass-card">
                    <div className="flex-between">
                        <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Principal Lent Out</h4>
                        <Wallet size={20} color="var(--danger)" />
                    </div>
                    <h2 style={{ margin: '1rem 0 0 0', fontSize: '2rem' }}>₹{totalPrincipal}</h2>
                </div>

                <div className="glass-card">
                    <div className="flex-between">
                        <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Profit (Flat Interest)</h4>
                        <TrendingUp size={20} color="var(--success)" />
                    </div>
                    <h2 style={{ margin: '1rem 0 0 0', fontSize: '2rem' }}>₹{Math.round(expectedInterest)}</h2>
                </div>

                <div className="glass-card">
                    <div className="flex-between">
                        <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Projected Returns (Total Due)</h4>
                        <Target size={20} color="var(--text-color)" />
                    </div>
                    <h2 style={{ margin: '1rem 0 0 0', fontSize: '2rem', color: 'var(--primary-color)' }}>₹{totalDue}</h2>
                </div>

                <div className="glass-card">
                    <div className="flex-between">
                        <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active Borrowers</h4>
                        <Users size={20} color="var(--primary-color)" />
                    </div>
                    <h2 style={{ margin: '1rem 0 0 0', fontSize: '2rem' }}>{activeCount} Members</h2>
                </div>
            </div>

            <div className="grid-2" style={{ alignItems: 'flex-start' }}>
                {isAdmin && (
                <div className="glass-card">
                    <h3 className="text-gradient">Issue a New Loan</h3>
                    <form onSubmit={handleIssueLoan}>
                        <div className="form-group">
                            <label className="input-label">Borrower Name (Another Person)</label>
                            <input type="text" className="input-field" placeholder="Full Name" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Mobile Number</label>
                            <input type="tel" className="input-field" placeholder="10-digit number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="input-label">Principal Amount (₹)</label>
                                <input type="number" className="input-field" placeholder="e.g. 50000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="input-label">Exact Flat Interest Value (₹)</label>
                                <input type="number" step="any" className="input-field" placeholder="e.g. 500" value={interestAmount} onChange={(e) => setInterestAmount(e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="input-label">Mode of Money Given</label>
                            <input type="text" className="input-field" placeholder="e.g. Hand Cash, GPay, Bank Transfer" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Guarantor Name (Trusted Person)</label>
                            <input type="text" className="input-field" placeholder="Surety Person Name" value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Guarantor Digital Signature</label>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', background: 'rgba(255,255,255,0.9)', overflow: 'hidden' }}>
                                <SignatureCanvas 
                                    ref={sigCanvas} 
                                    penColor="black"
                                    canvasProps={{ width: 500, height: 150, className: 'sigCanvas' }} 
                                />
                            </div>
                            <button type="button" onClick={clearSignature} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', marginTop: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                Clear Signature
                            </button>
                        </div>
                        
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Issue Loan Securely</button>
                    </form>
                </div>
                )}

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: isAdmin ? 'auto' : '1 / -1' }}>
                    <h3 className="text-gradient">Active & Past Loans</h3>
                    {loans.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No loans issued yet.</p>
                    ) : (
                        loans.map(loan => (
                            <div key={loan._id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div className="flex-between">
                                    <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{loan.borrowerName || (loan.groupId?.groupName ? loan.groupId.groupName + ' (Legacy)' : 'Unknown Borrower')}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', background: loan.status === 'active' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: loan.status === 'active' ? 'var(--danger)' : 'var(--success)' }}>
                                            {(loan.status || 'active').toUpperCase()}
                                        </span>
                                        {isAdmin && (
                                        <button 
                                            onClick={() => deleteLoan(loan._id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', padding: '0.2rem' }}
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <div><strong>Date Issued:</strong> <br/><span style={{ color: 'var(--text-color)' }}>{loan.createdAt ? new Date(loan.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Legacy Issue'}</span></div>
                                    <div><strong>Phone:</strong> <br/><span style={{ color: 'var(--text-color)' }}>{loan.mobileNumber || 'N/A'}</span></div>
                                    <div><strong>Method:</strong> <br/><span style={{ color: 'var(--text-color)' }}>{loan.paymentMode || 'N/A'}</span></div>
                                    <div><strong>Interest Applied:</strong> <br/><span style={{ color: loan.interestAmount > 0 ? 'var(--danger)' : 'var(--text-color)' }}>{loan.interestAmount ? `₹${loan.interestAmount}` : '₹0'}</span></div>
                                </div>
                                
                                {loan.guarantorSignature && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', textAlign: 'center' }}>
                                        <p style={{ color: '#666', fontSize: '0.8rem', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Authorized Signature: {loan.guarantorName}</p>
                                        <img src={loan.guarantorSignature} alt="Guarantor Signature" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                                    </div>
                                )}

                                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Principal Given</p>
                                        <p style={{ fontWeight: 'bold', fontSize: '1.2rem', margin: 0, color: 'var(--text-color)' }}>₹{loan.amount}</p>
                                    </div>
                                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Total Due (w/ Interest)</p>
                                        <p style={{ fontWeight: 'bold', fontSize: '1.2rem', margin: 0, color: loan.remaining > 0 ? 'var(--danger)' : 'var(--text-color)' }}>₹{loan.remaining}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoanPage;
