'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  
  // ডাইনামিক ফ্রি ডেলিভারি থ্রেশহোল্ড ও অ্যানাউন্সমেন্ট টেক্সট স্টেট
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(2000);
  const [announcementText, setAnnouncementText] = useState('✨ Free Delivery on orders over ৳1000 across Bangladesh! ✨');

  useEffect(() => {
    async function fetchCartData() {
      // অ্যাডমিন সেটিংস থেকে ফ্রি ডেলিভারি থ্রেশহোল্ড ও অ্যানাউন্সমেন্ট টেক্সট ফেচ করা
      const { data: settingData } = await supabase
        .from('admin_settings')
        .select('*');

      if (settingData && settingData.length > 0) {
        settingData.forEach(item => {
          if (item.key === 'free_delivery_threshold') {
            setFreeDeliveryThreshold(parseFloat(item.value) || 2000);
          }
          if (item.key === 'announcement_text') {
            setAnnouncementText(item.value);
          }
        });
      }

      const savedCart = JSON.parse(localStorage.getItem('aureve_cart')) || [];
      setCart(savedCart);
      setLoading(false);
    }
    fetchCartData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const updateQuantity = (index, delta) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = (item.quantity || 1) + delta;

    // স্টক চেক লজিক: স্টকের বেশি কোয়ান্টিটি বাড়াতে না দেওয়া
    if (delta > 0 && item.stock !== undefined && newQty > item.stock) {
      showToast(`দুঃখিত, এই পণ্যটির সর্বোচ্চ ${item.stock}টি স্টক রয়েছে। এর বেশি অর্ডার করা যাবে না।`);
      return;
    }

    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      item.quantity = newQty;
    }

    setCart(updated);
    localStorage.setItem('aureve_cart', JSON.stringify(updated));
  };

  const removeItem = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
    localStorage.setItem('aureve_cart', JSON.stringify(updated));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  return (
    <div style={{ backgroundColor: '#FAF9F6', color: '#080808', minHeight: '100vh', paddingBottom: '90px', fontFamily: "'Montserrat', sans-serif", position: 'relative' }}>
      {/* ডাইনামিক অ্যানাউন্সমেন্ট ও ফ্রি ডেলিভারি ব্যানার */}
      <div style={{ backgroundColor: '#D4AF7C', color: '#080808', fontSize: '11px', padding: '8px 12px', textAlign: 'center', fontWeight: '600', letterSpacing: '1px' }}>
        {announcementText}
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#080808', color: '#D4AF7C', padding: '12px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid #D4AF7C', textAlign: 'center', maxWidth: '90%' }}>
          {toastMessage}
        </div>
      )}

      {/* Clean Header with Brand Logo */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#080808', borderBottom: '1px solid #222222', padding: '0 25px', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', textDecoration: 'none', color: '#D4AF7C' }}>
          AUREVÉ
        </Link>
      </header>

      {/* Main Cart Container */}
      <main style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px', boxSizing: 'border-box' }}>
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
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
          <span>&larr;</span> Back
        </button>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 'bold', marginBottom: '25px', textAlign: 'center' }}>
          Your Cart ({cart.length})
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#8A8A8A' }}>Loading cart...</div>
        ) : cart.length === 0 ? (
          <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE6D9', padding: '40px', borderRadius: '6px', textAlign: 'center' }}>
            <p style={{ color: '#8A8A8A', fontSize: '14px', marginBottom: '20px' }}>আপনার কার্টটি বর্তমানে খালি রয়েছে।</p>
            <Link href="/shop" style={{ display: 'inline-block', backgroundColor: '#080808', color: '#FAF9F6', padding: '12px 25px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', textDecoration: 'none', borderRadius: '3px' }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              {cart.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', border: '1px solid #EDE6D9', padding: '15px', borderRadius: '6px', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {item.image && (
                      <img src={item.image} alt={item.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                    <div>
                      <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', margin: '0 0 5px 0' }}>{item.title}</h4>
                      <p style={{ color: '#D4AF7C', fontWeight: 'bold', fontSize: '13px', margin: 0 }}>&#2547; {item.price}</p>
                      {item.stock !== undefined && (
                        <span style={{ fontSize: '10px', color: '#666' }}>Available Stock: {item.stock}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EDE6D9', borderRadius: '4px' }}>
                      <button onClick={() => updateQuantity(idx, -1)} style={{ background: 'none', border: 'none', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                      <span style={{ padding: '0 8px', fontSize: '13px', fontWeight: '600' }}>{item.quantity || 1}</span>
                      <button onClick={() => updateQuantity(idx, 1)} style={{ background: 'none', border: 'none', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                    </div>
                    <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '16px' }} title="Remove">🗑</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal & Checkout Box */}
            <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE6D9', padding: '25px', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '600', marginBottom: '20px', borderBottom: '1px solid #EDE6D9', paddingBottom: '15px' }}>
                <span>Subtotal</span>
                <span style={{ color: '#D4AF7C' }}>&#2547; {subtotal}</span>
              </div>
              <button 
                onClick={() => router.push('/checkout')} 
                style={{ width: '100%', backgroundColor: '#080808', color: '#FAF9F6', border: 'none', padding: '14px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '3px' }}
              >
                Proceed to Checkout &rarr;
              </button>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}