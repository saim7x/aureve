'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';

function TrackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';
  const cleanInitial = initialOrderId.startsWith('#') ? initialOrderId.replace('#', '') : initialOrderId;
  const [orderIdInput, setOrderIdInput] = useState(cleanInitial);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const executeTracking = async (queryId) => {
    if (!queryId || !queryId.trim()) return;
    setLoading(true);
    setSearched(true);
    const formattedQuery = queryId.trim().startsWith('#') ? queryId.trim() : '#' + queryId.trim();
    const altQuery = queryId.trim().replace('#', '');
    
    // orders টেবিল থেকে order_id এবং order_code দিয়ে কুয়েরি করা হচ্ছে
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`order_id.eq.${formattedQuery},order_code.eq.${altQuery},order_id.eq.${altQuery}`);
      
    if (!error && data && data.length > 0) {
      setOrderDetails(data[0]);
    } else {
      setOrderDetails(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (cleanInitial) {
      executeTracking(cleanInitial);
    }
  }, [cleanInitial]);

  const handleTrackOrder = (e) => {
    if (e) e.preventDefault();
    executeTracking(orderIdInput);
  };

  // স্ট্যাটাস অনুযায়ী ডাইনামিক কালার এবং স্টাইল রিটার্ন করার ফাংশন
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Pending':
        return { bg: 'rgba(230, 126, 34, 0.1)', border: '#e67e22', color: '#e67e22' };
      case 'Pending Verification':
        return { bg: 'rgba(243, 156, 18, 0.1)', border: '#f39c12', color: '#f39c12' };
      case 'Admin Verified':
      case 'Confirmed':
        return { bg: 'rgba(52, 152, 219, 0.1)', border: '#3498db', color: '#3498db' };
      case 'Shipped':
      case 'Processing':
        return { bg: 'rgba(241, 196, 15, 0.1)', border: '#f1c40f', color: '#f1c40f' };
      case 'Delivered':
        return { bg: 'rgba(46, 204, 113, 0.1)', border: '#2ecc71', color: '#2ecc71' };
      case 'Cancelled':
        return { bg: 'rgba(231, 76, 60, 0.1)', border: '#e74c3c', color: '#e74c3c' };
      default:
        return { bg: '#FFF8EC', border: '#D4AF7C', color: '#D4AF7C' };
    }
  };

  const currentStatus = orderDetails ? (orderDetails.order_status || orderDetails.status || 'Pending Verification') : '';
  const badgeStyle = getStatusBadgeStyle(currentStatus);

  return (
    <div style={{ backgroundColor: '#FAF9F6', color: '#080808', minHeight: '100vh', paddingBottom: '90px', fontFamily: "'Montserrat', sans-serif" }}>
      {/* Top Announcement Bar */}
      <div style={{ backgroundColor: '#D4AF7C', color: '#080808', fontSize: '11px', padding: '8px 12px', textAlign: 'center', fontWeight: '600', letterSpacing: '1px' }}>
        Free Delivery on orders above &#2547;2,000 | Elegance in Every Detail
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#080808', borderBottom: '1px solid #222222', padding: '0 20px', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', textDecoration: 'none', color: '#D4AF7C' }}>
          AUREVÉ
        </Link>
        <div style={{ display: 'flex', gap: '30px', margin: '0 auto' }} className="desktop-nav">
          <Link href="/" style={{ color: '#FAF9F6', fontSize: '11px', textTransform: 'uppercase', textDecoration: 'none', fontWeight: '600', letterSpacing: '1.5px' }}>Home</Link>
          <Link href="/shop" style={{ color: '#FAF9F6', fontSize: '11px', textTransform: 'uppercase', textDecoration: 'none', fontWeight: '600', letterSpacing: '1.5px' }}>Shop</Link>
          <Link href="/track" style={{ color: '#D4AF7C', fontSize: '11px', textTransform: 'uppercase', textDecoration: 'none', fontWeight: '600', letterSpacing: '1.5px' }}>Track Order</Link>
        </div>
        <div style={{ width: '80px' }} className="desktop-nav-spacer"></div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '750px', margin: '30px auto', padding: '0 20px', boxSizing: 'border-box' }}>
        {/* Premium Back Button */}
        <button 
          onClick={() => router.push('/')} 
          style={{ 
            backgroundColor: '#FAF9F6', 
            color: '#080808', 
            border: '1px solid #D4AF7C', 
            padding: '8px 18px', 
            borderRadius: '30px', 
            cursor: 'pointer', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '11px', 
            fontWeight: '600', 
            textTransform: 'uppercase', 
            letterSpacing: '1.5px', 
            marginBottom: '20px', 
            boxShadow: '0 2px 8px rgba(212,175,124,0.15)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#D4AF7C'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FAF9F6'; }}
        >
          <span>&larr;</span> Back to Home
        </button>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '30px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Track Your Order</h1>
          <p style={{ color: '#8A8A8A', fontSize: '13px' }}>Enter your order code (e.g. AUR-913450) and click track to check parcel status.</p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleTrackOrder} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '35px', backgroundColor: '#FFF', border: '1px solid #EDE6D9', borderRadius: '4px', padding: '6px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <span style={{ color: '#D4AF7C', fontWeight: 'bold', fontSize: '15px', paddingLeft: '12px', userSelect: 'none', whiteSpace: 'nowrap' }}>#</span>
          <input 
            type="text" 
            required 
            placeholder="AUR-913450" 
            value={orderIdInput} 
            onChange={e => setOrderIdInput(e.target.value.replace('#', ''))} 
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', backgroundColor: 'transparent', padding: '10px 0', width: '100%' }} 
          />
          <button type="submit" style={{ backgroundColor: '#080808', color: '#FAF9F6', border: 'none', padding: '12px 28px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '3px', whiteSpace: 'nowrap' }}>
            Track
          </button>
        </form>

        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#8A8A8A' }}>Searching order status...</div>}

        {searched && !loading && !orderDetails && (
          <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE6D9', padding: '30px', borderRadius: '6px', textAlign: 'center' }}>
            <p style={{ color: '#e74c3c', fontSize: '13px', margin: 0 }}>No order found with this ID. Please check your order code.</p>
          </div>
        )}

        {orderDetails && (
          <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE6D9', padding: '30px', borderRadius: '6px', boxShadow: '0 6px 25px rgba(0,0,0,0.04)' }}>
            {/* Status Header Box with Dynamic Colors */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EDE6D9', paddingBottom: '20px', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '4px' }}>Order ID</span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', margin: 0, color: '#080808', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  {orderDetails.order_id}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '4px' }}>Parcel Status</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: badgeStyle.bg, border: `1px solid ${badgeStyle.border}`, padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: badgeStyle.color }}>
                  <span>●</span> {currentStatus}
                </div>
              </div>
            </div>

            {/* Detailed Grid Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #EDE6D9' }}>
              <div>
                <span style={{ display: 'block', color: '#8A8A8A', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Customer Name</span>
                <strong style={{ color: '#080808' }}>{orderDetails.customer_name}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#8A8A8A', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Payment Method</span>
                <strong style={{ color: '#080808' }}>{orderDetails.payment_method}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#8A8A8A', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Mobile Number</span>
                <strong style={{ color: '#080808' }}>{orderDetails.mobile || orderDetails.phone || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#8A8A8A', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>WhatsApp Number</span>
                <strong style={{ color: '#080808' }}>{orderDetails.whatsapp || 'N/A'}</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ display: 'block', color: '#8A8A8A', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Delivery Address</span>
                <strong style={{ color: '#080808', lineHeight: '1.4' }}>{orderDetails.address || orderDetails.delivery_address}, {orderDetails.district}</strong>
              </div>
              {orderDetails.custom_engraving_name && orderDetails.custom_engraving_name !== 'N/A' && (
                <div style={{ gridColumn: 'span 2', backgroundColor: '#FFF8EC', padding: '10px 14px', borderRadius: '4px', border: '1px solid #D4AF7C' }}>
                  <span style={{ display: 'block', color: '#D4AF7C', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px', fontWeight: 'bold' }}>Custom Engraving / Name</span>
                  <strong style={{ color: '#080808' }}>{orderDetails.custom_engraving_name}</strong>
                </div>
              )}
            </div>

            {/* Ordered Items & Delivery Details List */}
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', marginBottom: '12px', color: '#080808' }}>Ordered Items & Delivery</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {orderDetails.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', backgroundColor: '#FAF9F6', padding: '12px 15px', borderRadius: '4px', border: '1px solid #EDE6D9' }}>
                  <span style={{ fontWeight: '500' }}>{item.title} <span style={{ color: '#8A8A8A' }}>(x{item.quantity})</span></span>
                  <span style={{ fontWeight: '600', color: '#080808' }}>&#2547; {item.price * item.quantity}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', backgroundColor: '#FFF8EC', padding: '12px 15px', borderRadius: '4px', border: '1px solid #D4AF7C' }}>
                <span style={{ fontWeight: '600', color: '#D4AF7C' }}>
                  Delivery Charge ({orderDetails.district === 'Brahmanbaria' ? 'Brahmanbaria Sadar' : orderDetails.district === 'Dhaka' ? 'Dhaka City' : 'Outside Dhaka'})
                </span>
                <span style={{ fontWeight: '600', color: '#080808' }}>
                  &#2547; {orderDetails.delivery_charge || (orderDetails.district === 'Brahmanbaria' ? 60 : orderDetails.district === 'Dhaka' ? 80 : 100)}
                </span>
              </div>
            </div>

            {/* Total Amount Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#080808', color: '#FAF9F6', padding: '15px 20px', borderRadius: '4px', marginBottom: currentStatus === 'Delivered' ? '20px' : '0' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Grand Total</span>
              <span style={{ color: '#D4AF7C', fontSize: '18px', fontWeight: 'bold' }}>&#2547; {orderDetails.total_amount || orderDetails.grand_total}</span>
            </div>

            {/* Delivered Product Review Banner */}
            {currentStatus === 'Delivered' && (
              <div style={{ backgroundColor: '#FFF8EC', border: '1px solid #D4AF7C', padding: '20px', borderRadius: '6px', textAlign: 'center', marginTop: '15px' }}>
                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: '#080808', margin: '0 0 6px 0' }}>আপনার পার্সেলটি কি ডেলিভারি হয়েছে?</h4>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 15px 0' }}>আমাদের প্রোডাক্টটি আপনার কেমন লেগেছে তা জানান এবং একটি সুন্দর রিভিউ দিন!</p>
                <Link 
                  href={`/review?orderId=${orderDetails.order_code || orderDetails.order_id.replace('#', '')}`} 
                  style={{ display: 'inline-block', backgroundColor: '#D4AF7C', color: '#080808', padding: '10px 24px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px', textDecoration: 'none', borderRadius: '3px' }}
                >
                  Leave a Review &rarr;
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
      <BottomNav />
      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-nav-spacer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>}>
      <TrackContent />
    </Suspense>
  );
}