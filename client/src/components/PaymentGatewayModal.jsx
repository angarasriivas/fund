import React, { useState } from 'react';
import { CreditCard, Smartphone, CheckCircle, XCircle, Banknote } from 'lucide-react';
import { apiFetch } from '../utils/api';

const PaymentGatewayModal = ({ isOpen, onClose, contributor, user, onPaymentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [upiApp, setUpiApp] = useState('Google Pay');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);

    if (!isOpen) return null;

    const handleProcessPayment = () => {
        setIsProcessing(true);
        // Simulate a real payment processing window
        setTimeout(async () => {
            try {
                // Once "processed", ping our actual backend route to record it
                const actualMethod = paymentMethod === 'upi' ? `UPI (${upiApp})` : paymentMethod === 'cash' ? 'Hand Cash' : 'Card';
                const response = await apiFetch('/api/payments/pay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user._id,
                        groupId: contributor._id,
                        month: new Date().toLocaleString('default', { month: 'long' }),
                        amount: contributor.monthlyAmount,
                        paymentMethod: actualMethod
                    })
                });

                if (response.ok) {
                    setPaymentStatus('success');
                    setTimeout(() => {
                        onPaymentSuccess();
                        onClose();
                        setPaymentStatus(null);
                        setIsProcessing(false);
                    }, 2000);
                } else {
                    setPaymentStatus('failed');
                    setIsProcessing(false);
                }
            } catch (error) {
                setPaymentStatus('failed');
                setIsProcessing(false);
            }
        }, 2000);
    };

    return (
        <div style={overlayStyle}>
            <div className="glass-card animate-fade-in" style={modalStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 'bold' }}>Secure Checkout</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Paying Contribution For</p>
                    <h4 style={{ margin: 0 }}>{contributor.groupName}</h4>
                    <h2 style={{ margin: '0.5rem 0 0 0', color: 'var(--primary-color)' }}>₹{contributor.monthlyAmount}</h2>
                </div>

                {paymentStatus === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--success)' }}>
                        <CheckCircle size={48} style={{ marginBottom: '1rem' }} />
                        <h3>Payment Successful!</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Transaction completed securely.</p>
                    </div>
                ) : paymentStatus === 'failed' ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--danger)' }}>
                        <XCircle size={48} style={{ marginBottom: '1rem' }} />
                        <h3>Payment Failed</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Something went wrong. Please try again.</p>
                        <button className="btn btn-secondary" onClick={() => setPaymentStatus(null)}>Try Again</button>
                    </div>
                ) : (
                    <>
                        <h4 style={{ marginBottom: '0.5rem' }}>Payment Method</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <button 
                                className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : ''}`}
                                style={{ flex: 1, padding: '0.5rem', background: paymentMethod !== 'cash' ? 'rgba(255,255,255,0.1)' : '' }}
                                onClick={() => setPaymentMethod('cash')}
                            >
                                <Banknote size={16} style={{ display: 'block', margin: '0 auto 4px' }} /> Cash
                            </button>
                            <button 
                                className={`btn ${paymentMethod === 'card' ? 'btn-primary' : ''}`}
                                style={{ flex: 1, padding: '0.5rem', background: paymentMethod !== 'card' ? 'rgba(255,255,255,0.1)' : '' }}
                                onClick={() => setPaymentMethod('card')}
                            >
                                <CreditCard size={16} style={{ display: 'block', margin: '0 auto 4px' }} /> Card
                            </button>
                            <button 
                                className={`btn ${paymentMethod === 'upi' ? 'btn-primary' : ''}`}
                                style={{ flex: 1, padding: '0.5rem', background: paymentMethod !== 'upi' ? 'rgba(255,255,255,0.1)' : '' }}
                                onClick={() => setPaymentMethod('upi')}
                            >
                                <Smartphone size={16} style={{ display: 'block', margin: '0 auto 4px' }} /> UPI
                            </button>
                        </div>

                        {paymentMethod === 'upi' && (
                            <div className="animate-fade-in" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                {['Google Pay', 'PhonePe', 'Paytm'].map(app => (
                                    <button 
                                        key={app}
                                        className="btn" 
                                        style={{ 
                                            flex: 1, padding: '0.5rem', fontSize: '0.8rem',
                                            background: upiApp === app ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)' 
                                        }}
                                        onClick={() => setUpiApp(app)}
                                    >
                                        {app}
                                    </button>
                                ))}
                            </div>
                        )}

                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', padding: '1rem', opacity: isProcessing ? 0.7 : 1 }}
                            onClick={handleProcessPayment}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing Securely...' : `Pay ₹${contributor.monthlyAmount} Securely`}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const overlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
};

const modalStyle = {
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

export default PaymentGatewayModal;
