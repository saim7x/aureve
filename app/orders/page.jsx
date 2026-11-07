'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [user, setUser] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function fetchUserAndOrders() {
      try {
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          window.location.href = '/login';
          return;
        }

        setUser(session.user);
        const userEmail = session.user.email;

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_email', userEmail)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching orders:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndOrders();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'Processing', status: 'Processing' })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(ord => {
        if (ord.id === orderId) {
          return { ...ord, order_status: 'Processing', status: 'Processing' };
        }
        return ord;
      }));

      showToast('অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে!');
    } catch (err) {
      console.error('Error confirming order:', err.message);
      showToast('অর্ডার কনফার্ম করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const status = (order.order_status || order.status || 'pending').toLowerCase();
    
    if (activeTab === 'all') {
      return true;
    } else if (activeTab === 'active') {
      return status === 'pending' || status === 'processing' || status === 'active';
    } else if (activeTab === 'completed') {
      return status === 'completed' || status === 'delivered';
    } else if (activeTab === 'cancelled') {
      return status === 'cancelled' || status === 'returned';
    }
    return true;
  });

  return (
    <div style={{ backgroundColor: '#FAF9F6', color: '#080808', minHeight: '100vh', paddingBottom: '60px', fontFamily: "'Montserrat', sans-serif", position: 'relative' }}>
      
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#080808', color: '#D4AF7C', padding: '12px 24px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', zIndex: 1000, border: '1px solid #D4AF7C', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header style={{ backgroundColor: '#080808', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 'bold', letterSpacing: '2px', textDecoration: 'none', color: '#D4AF7C' }}>
          AUREVÉ
        </Link>
        <Link href="/" style={{ color: '#FAF9F6', fontSize: '11px', textTransform: 'uppercase', textDecoration: 'none', letterSpacing: '1px' }}>
          &larr; Back to Home
        </Link>
      </header>

      <main style={{ maxWidth: '850px', margin: '30px auto', padding: '0 20px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', marginBottom: '10px', textAlign: 'center' }}>
          My Orders
        </h1>
        {user && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginBottom: '25px' }}>
            Logged in as: <strong>{user.email}</strong>
          </p>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #EDE6D9', paddingBottom: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 18px',
              backgroundColor: activeTab === 'all' ? '#080808' : 'transparent',
              color: activeTab === 'all' ? '#FAF9F6' : '#080808',
              border: '1px solid #080808',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer',
              letterSpacing: '1px'
            }}
          >
            All Orders
          </button>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '10px 18px',
              backgroundColor: activeTab === 'active' ? '#080808' : 'transparent',
              color: activeTab === 'active' ? '#FAF9F6' : '#080808',
              border: '1px solid #080808',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer',
              letterSpacing: '1px'
            }}
          >
            Active / Pending
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '10px 18px',
              backgroundColor: activeTab === 'completed' ? '#080808' : 'transparent',
              color: activeTab === 'completed' ? '#FAF9F6' : '#080808',
              border: '1px solid #080808',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer',
              letterSpacing: '1px'
            }}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            style={{
              padding: '10px 18px',
              backgroundColor: activeTab === 'cancelled' ? '#080808' : 'transparent',
              color: activeTab === 'cancelled' ? '#FAF9F6' : '#080808',
              border: '1px solid #080808',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              cursor: 'pointer',
              letterSpacing: '1px'
            }}
          >
            Cancelled / Returned
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading your real-time orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#FFF', border: '1px solid #EDE6D9', borderRadius: '6px' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>No orders found in this category.</p>
            <Link href="/shop" style={{ backgroundColor: '#D4AF7C', color: '#080808', padding: '10px 20px', textDecoration: 'none', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '3px' }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredOrders.map(order => {
              const currentStatus = (order.order_status || order.status || 'Pending').toLowerCase();
              const isPending = currentStatus === 'pending' || currentStatus === 'processing' || currentStatus === 'active';
              const isCompleted = currentStatus === 'completed' || currentStatus === 'delivered';
              const isCancelledOrReturned = currentStatus === 'cancelled' || currentStatus === 'returned';

              // ডাইনামিক স্ট্যাটাস কালার ও ব্যাকগ্রাউন্ড লজিক
              let badgeBg = '#FFF3CD';
              let badgeColor = '#856404';
              if (isCompleted) {
                badgeBg = '#D4EDDA';
                badgeColor = '#155724';
              } else if (isCancelledOrReturned) {
                badgeBg = '#F8D7DA'; // লাল রঙের ব্যাকগ্রাউন্ড
                badgeColor = '#721C24'; // গাঢ় লাল টেক্সট
              }

              return (
                <div key={order.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #EDE6D9', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0EFE9', paddingBottom: '12px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#888' }}>Order ID: </span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#080808' }}>{order.order_id || `#AUR-${order.id}`}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: badgeBg, textTransform: 'uppercase', color: badgeColor }}>
                        {order.order_status || order.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', fontSize: '12px', backgroundColor: '#FAF9F6', padding: '12px', borderRadius: '6px', border: '1px solid #F0EFE9' }}>
                    <div>
                      <span style={{ color: '#888', display: 'block', marginBottom: '3px' }}>Customer Info:</span>
                      <strong>{order.customer_name}</strong><br/>
                      <span>Phone: {order.phone || order.mobile}</span><br/>
                      <span>WhatsApp: {order.whatsapp || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#888', display: 'block', marginBottom: '3px' }}>Delivery Address:</span>
                      <span>{order.delivery_address || order.address}</span><br/>
                      <span>District: <strong>{order.district || 'Brahmanbaria'}</strong></span><br/>
                      <span>Payment: <strong>{order.payment_method || order.payment_type || 'COD'}</strong></span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#888', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Ordered Products:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {order.items && Array.isArray(order.items) ? (
                        order.items.map((it, idx) => {
                          const itemImg = it.image || it.img || (it.images && it.images[0]) || '';
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', backgroundColor: '#FFF', padding: '10px', borderRadius: '6px', border: '1px solid #EDE6D9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {itemImg ? (
                                  <img src={itemImg} alt={it.title} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                                ) : (
                                  <div style={{ width: '45px', height: '45px', backgroundColor: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#666' }}>No Img</div>
                                )}
                                <div>
                                  <strong style={{ fontSize: '12px', color: '#080808', display: 'block' }}>{it.title}</strong>
                                  <span style={{ fontSize: '11px', color: '#666' }}>Qty: {it.quantity} {it.customization && `| Custom Name: ${it.customization}`}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#080808' }}>৳ {it.price * it.quantity}</span>
                            </div>
                          );
                        })
                      ) : (
                        <span style={{ fontSize: '12px', color: '#555' }}>Order item details stored in system</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', borderTop: '1px dashed #EDE6D9', paddingTop: '12px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                      <span>Subtotal:</span>
                      <span>৳ {order.subtotal || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                      <span>Delivery Charge:</span>
                      <span>৳ {order.delivery_charge || 0}</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#27ae60', fontWeight: 'bold' }}>
                        <span>Discount / Coupon:</span>
                        <span>- ৳ {order.discount_amount}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', color: '#080808', borderTop: '1px solid #F0EFE9', paddingTop: '8px', marginTop: '4px' }}>
                      <span>Total Amount (incl. delivery):</span>
                      <span style={{ color: '#D4AF7C' }}>৳ {order.grand_total || order.total_amount || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0EFE9', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>Order Date: {new Date(order.created_at).toLocaleDateString()}</span>
                    
                    {currentStatus === 'pending' && (
                      <button 
                        onClick={() => handleConfirmOrder(order.id)}
                        disabled={actionLoadingId === order.id}
                        style={{
                          backgroundColor: '#080808',
                          color: '#D4AF7C',
                          border: 'none',
                          padding: '8px 16px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          borderRadius: '4px',
                          cursor: actionLoadingId === order.id ? 'not-allowed' : 'pointer',
                          letterSpacing: '1px',
                          opacity: actionLoadingId === order.id ? 0.7 : 1
                        }}
                      >
                        {actionLoadingId === order.id ? 'Confirming...' : 'Confirm Order'}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}