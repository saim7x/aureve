'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [user, setUser] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [reviewedOrderIds, setReviewedOrderIds] = useState([]);

  // কাস্টম ক্যানসেল কনফার্মেশন মডালের স্টেট
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

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

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_email', userEmail);

        if (ordersError) throw ordersError;

        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('order_id');

        let reviewedIds = [];
        if (!reviewsError && reviewsData) {
          reviewedIds = reviewsData.map(r => String(r.order_id).trim());
          setReviewedOrderIds(reviewedIds);
        }

        const sortedOrders = (ordersData || []).sort((a, b) => {
          const aId = String(a.id).trim();
          const bId = String(b.id).trim();

          const aStatus = (a.order_status || a.status || 'Pending').toLowerCase();
          const bStatus = (b.order_status || b.status || 'Pending').toLowerCase();
          
          const aIsDelivered = aStatus === 'delivered' || aStatus === 'completed';
          const bIsDelivered = bStatus === 'delivered' || bStatus === 'completed';
          
          const aHasReviewed = reviewedIds.includes(aId);
          const bHasReviewed = reviewedIds.includes(bId);
          
          const aHasActionButtons = aStatus === 'pending' || aStatus === 'processing' || (aIsDelivered && !aHasReviewed);
          const bHasActionButtons = bStatus === 'pending' || bStatus === 'processing' || (bIsDelivered && !bHasReviewed);

          const aNeedsReview = aIsDelivered && !aHasReviewed;
          const bNeedsReview = bIsDelivered && !bHasReviewed;

          if (aNeedsReview && !bNeedsReview) return -1;
          if (!aNeedsReview && bNeedsReview) return 1;

          if (aHasActionButtons && !bHasActionButtons) return -1;
          if (!aHasActionButtons && bHasActionButtons) return 1;

          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });

        setOrders(sortedOrders);

      } catch (err) {
        console.error('Error fetching data:', err.message);
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

      showToast('অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে!');
    } catch (err) {
      console.error('Error confirming order:', err.message);
      showToast('অর্ডার কনফার্ম করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setActionLoadingId(null);
    }
  };

  const promptCancelOrder = (orderId) => {
    setOrderToCancel(orderId);
    setCancelModalOpen(true);
  };

  const executeCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      setActionLoadingId(orderToCancel);
      setCancelModalOpen(false);

      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'Cancelled', status: 'Cancelled' })
        .eq('id', orderToCancel);

      if (error) throw error;

      setOrders(prev => prev.map(ord => {
        if (ord.id === orderToCancel) {
          return { ...ord, order_status: 'Cancelled', status: 'Cancelled' };
        }
        return ord;
      }));

      showToast('অর্ডারটি সফলভাবে ক্যানসেল করা হয়েছে!');
    } catch (err) {
      console.error('Error cancelling order:', err.message);
      showToast('অর্ডার কনফার্ম করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setActionLoadingId(null);
      setOrderToCancel(null);
    }
  };

  const handleGiveReview = (order) => {
    router.push(`/review?order_id=${order.id}`);
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
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#080808', color: '#D4AF7C', padding: '10px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', zIndex: 1000, border: '1px solid #D4AF7C', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', width: '90%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' }}>
          {toastMessage}
        </div>
      )}

      {/* Fully Mobile Friendly Custom Confirmation Modal */}
      {cancelModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '15px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '25px 20px', borderRadius: '8px', width: '100%', maxWidth: '320px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid #EDE6D9', boxSizing: 'border-box' }}>
            <div style={{ width: '45px', height: '45px', backgroundColor: '#F8D7DA', color: '#721C24', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '20px', fontWeight: 'bold' }}>!</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', marginBottom: '8px', color: '#080808' }}>অর্ডার ক্যানসেল</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>আপনি কি নিশ্চিতভাবে এই অর্ডারটি ক্যানসেল করতে চান?</p>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => setCancelModalOpen(false)}
                style={{ backgroundColor: '#FAF9F6', color: '#080808', border: '1px solid #CCCCCC', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', letterSpacing: '1px', flex: 1 }}
              >
                না, ফিরে যান
              </button>
              <button 
                onClick={executeCancelOrder}
                style={{ backgroundColor: '#721C24', color: '#FFFFFF', border: 'none', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', letterSpacing: '1px', flex: 1 }}
              >
                হ্যাঁ, ক্যানসেল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ backgroundColor: '#080808', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px', textDecoration: 'none', color: '#D4AF7C' }}>
          AUREVÉ
        </Link>
        <Link href="/" style={{ color: '#FAF9F6', fontSize: '11px', textTransform: 'uppercase', textDecoration: 'none', letterSpacing: '1px' }}>
          &larr; Home
        </Link>
      </header>

      <main style={{ maxWidth: '850px', margin: '20px auto', padding: '0 15px', boxSizing: 'border-box' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', marginBottom: '8px', textAlign: 'center' }}>
          অর্ডার পেজ
        </h1>
        {user && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginBottom: '20px', wordBreak: 'break-all' }}>
            Logged in as: <strong>{user.email}</strong>
          </p>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginBottom: '25px', borderBottom: '1px solid #EDE6D9', paddingBottom: '10px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {['all', 'active', 'completed', 'cancelled'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              style={{ 
                padding: '8px 14px', 
                backgroundColor: activeTab === tab ? '#080808' : 'transparent', 
                color: activeTab === tab ? '#FAF9F6' : '#080808', 
                border: '1px solid #080808', 
                borderRadius: '4px', 
                fontSize: '10px', 
                fontWeight: 'bold', 
                textTransform: 'uppercase', 
                cursor: 'pointer', 
                letterSpacing: '1px' 
              }}
            >
              {tab === 'all' ? 'All Orders' : tab === 'active' ? 'Active / Pending' : tab === 'completed' ? 'Completed' : 'Cancelled'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading your real-time orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#FFF', border: '1px solid #EDE6D9', borderRadius: '6px' }}>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>No orders found in this category.</p>
            <Link href="/shop" style={{ backgroundColor: '#D4AF7C', color: '#080808', padding: '8px 16px', textDecoration: 'none', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '3px' }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredOrders.map(order => {
              const currentStatus = (order.order_status || order.status || 'Pending').toLowerCase();
              const isCompleted = currentStatus === 'completed' || currentStatus === 'delivered';
              const isCancelledOrReturned = currentStatus === 'cancelled' || currentStatus === 'returned';
              
              const hasAlreadyReviewed = reviewedOrderIds.includes(String(order.id).trim());

              let badgeBg = '#FFF3CD';
              let badgeColor = '#856404';
              if (isCompleted) {
                badgeBg = '#D4EDDA';
                badgeColor = '#155724';
              } else if (isCancelledOrReturned) {
                badgeBg = '#F8D7DA';
                badgeColor = '#721C24';
              }

              return (
                <div key={order.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #EDE6D9', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', boxSizing: 'border-box' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0EFE9', paddingBottom: '10px', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#888' }}>Order ID: </span>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#080808' }}>{order.order_id || `#AUR-${order.id}`}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: badgeBg, textTransform: 'uppercase', color: badgeColor }}>
                        {order.order_status || order.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px', fontSize: '11px', backgroundColor: '#FAF9F6', padding: '10px', borderRadius: '6px', border: '1px solid #F0EFE9' }}>
                    <div>
                      <span style={{ color: '#888', display: 'block', marginBottom: '2px' }}>Customer Info:</span>
                      <strong>{order.customer_name}</strong><br/>
                      <span>Phone: {order.phone || order.mobile}</span><br/>
                      <span>WhatsApp: {order.whatsapp || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#888', display: 'block', marginBottom: '2px' }}>Delivery Address:</span>
                      <span>{order.delivery_address || order.address}</span><br/>
                      <span>District: <strong>{order.district || 'Brahmanbaria'}</strong></span><br/>
                      <span>Payment: <strong>{order.payment_method || order.payment_type || 'COD'}</strong></span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Ordered Products:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {order.items && Array.isArray(order.items) ? (
                        order.items.map((it, idx) => {
                          const itemImg = it.image || it.img || (it.images && it.images[0]) || '';
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', backgroundColor: '#FFF', padding: '8px', borderRadius: '6px', border: '1px solid #EDE6D9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                {itemImg ? (
                                  <img src={itemImg} alt={it.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd', flexShrink: 0 }} />
                                ) : (
                                  <div style={{ width: '40px', height: '40px', backgroundColor: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#666', flexShrink: 0 }}>No Img</div>
                                )}
                                <div style={{ overflow: 'hidden' }}>
                                  <strong style={{ fontSize: '11px', color: '#080808', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</strong>
                                  <span style={{ fontSize: '10px', color: '#666' }}>Qty: {it.quantity} {it.customization && `| Name: ${it.customization}`}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#080808', flexShrink: 0 }}>৳ {it.price * it.quantity}</span>
                            </div>
                          );
                        })
                      ) : (
                        <span style={{ fontSize: '11px', color: '#555' }}>Order item details stored in system</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', borderTop: '1px dashed #EDE6D9', paddingTop: '10px', marginBottom: '12px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', color: '#080808', borderTop: '1px solid #F0EFE9', paddingTop: '6px', marginTop: '2px' }}>
                      <span>Total Amount:</span>
                      <span style={{ color: '#D4AF7C' }}>৳ {order.grand_total || order.total_amount || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0EFE9', paddingTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#666' }}>Date: {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</span>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {currentStatus === 'pending' && (
                        <button 
                          onClick={() => handleConfirmOrder(order.id)}
                          disabled={actionLoadingId === order.id}
                          style={{
                            backgroundColor: '#080808',
                            color: '#D4AF7C',
                            border: 'none',
                            padding: '6px 12px',
                            fontSize: '10px',
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

                      {(currentStatus === 'pending' || currentStatus === 'processing') && (
                        <button 
                          onClick={() => promptCancelOrder(order.id)}
                          disabled={actionLoadingId === order.id}
                          style={{
                            backgroundColor: '#F8D7DA',
                            color: '#721C24',
                            border: '1px solid #F5C6CB',
                            padding: '6px 12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            borderRadius: '4px',
                            cursor: actionLoadingId === order.id ? 'not-allowed' : 'pointer',
                            letterSpacing: '1px'
                          }}
                        >
                          {actionLoadingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}

                      {(currentStatus === 'delivered' || currentStatus === 'completed') && (
                        hasAlreadyReviewed ? (
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#27ae60', backgroundColor: '#E8F8F5', padding: '5px 10px', borderRadius: '4px', border: '1px solid #A3E4D7' }}>
                            ✓ Reviewed
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleGiveReview(order)}
                            style={{
                              backgroundColor: '#D4AF7C',
                              color: '#080808',
                              border: 'none',
                              padding: '6px 12px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              letterSpacing: '1px'
                            }}
                          >
                            Give Review &rarr;
                          </button>
                        )
                      )}
                    </div>
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
