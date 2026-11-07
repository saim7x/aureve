'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AdminHeader from '../../components/AdminHeader';

export default function AdminReviewsAndCouponsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('reviews');

  // Reviews & Coupons States
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [allowMultipleCoupons, setAllowMultipleCoupons] = useState(false);
  
  // Coupon Modal States
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('aureve_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchReviews();
      fetchCoupons();
      fetchSettings();
    } else {
      router.push('/admin');
    }
  }, []);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    const { data } = await supabase
      .from('reviews')
      .select('*, products(title)')
      .order('id', { ascending: false });
    setReviews(data || []);
    setLoadingReviews(false);
  };

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .order('id', { ascending: false });
    setCoupons(data || []);
    setLoadingCoupons(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'allow_multiple_coupons')
      .single();

    if (data && data.value !== undefined) {
      setAllowMultipleCoupons(data.value === true || data.value === 'true');
    }
  };

  // টগল বাটনে একাধিক কুপন অন/অফ সুইচ করার ফাংশন
  const handleToggleMultipleCoupons = async () => {
    const newValue = !allowMultipleCoupons;
    setAllowMultipleCoupons(newValue);

    const { error } = await supabase
      .from('store_settings')
      .upsert({ key: 'allow_multiple_coupons', value: JSON.stringify(newValue) });

    if (error) {
      alert('সেটিংস আপডেট করতে সমস্যা হয়েছে: ' + error.message);
      setAllowMultipleCoupons(!newValue);
    } else {
      alert(`একাধিক কুপন ব্যবহার এখন ${newValue ? 'সক্রিয় (ENABLED)' : 'বন্ধ (DISABLED)'} করা হয়েছে!`);
    }
  };

  const handleDeleteReview = async (id) => {
    if (window.confirm('আপনি কি সত্যিই এই রিভিউটি মুছে ফেলতে চান?')) {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (!error) {
        alert('রিভিউ সফলভাবে মুছে ফেলা হয়েছে!');
        setReviews(prev => prev.filter(r => r.id !== id));
      }
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      alert('অনুগ্রহ করে কুপন কোড এবং ডিসকাউন্টের পরিমাণ প্রদান করুন!');
      return;
    }

    setIsSavingCoupon(true);
    const payload = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      is_active: true
    };

    const { error } = await supabase.from('coupons').insert([payload]);

    if (!error) {
      alert('নতুন কুপন সফলভাবে যোগ করা হয়েছে!');
      setCode('');
      setDiscountValue('');
      setShowCouponModal(false);
      fetchCoupons();
    } else {
      alert('কুপন তৈরি করতে সমস্যা হয়েছে: ' + error.message);
    }
    setIsSavingCoupon(false);
  };

  const handleToggleCouponStatus = async (coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id);

    if (!error) {
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
    }
  };

  const handleDeleteCoupon = async (id, couponCode) => {
    if (window.confirm(`আপনি কি সত্যিই "${couponCode}" কুপনটি ডিলিট করতে চান?`)) {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (!error) {
        setCoupons(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ backgroundColor: '#080808', color: '#FAF9F6', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif" }}>
      <AdminHeader />

      <main style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid #222', paddingBottom: '15px', marginBottom: '30px' }}>
          <button 
            onClick={() => setActiveTab('reviews')}
            style={{
              backgroundColor: activeTab === 'reviews' ? '#D4AF7C' : '#111',
              color: activeTab === 'reviews' ? '#080808' : '#FAF9F6',
              border: '1px solid #333',
              padding: '10px 22px',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ⭐ Customer Reviews ({reviews.length})
          </button>

          <button 
            onClick={() => setActiveTab('coupons')}
            style={{
              backgroundColor: activeTab === 'coupons' ? '#D4AF7C' : '#111',
              color: activeTab === 'coupons' ? '#080808' : '#FAF9F6',
              border: '1px solid #333',
              padding: '10px 22px',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🎟️ Coupon Management
          </button>
        </div>

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: '0 0 15px 0', fontSize: '22px' }}>Customer Reviews Management</h2>
            {loadingReviews ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#8A8A8A' }}>Loading Reviews...</div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#111', borderRadius: '6px', color: '#8A8A8A' }}>কোনো রিভিউ পাওয়া যায়নি।</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {reviews.map(rev => (
                  <div key={rev.id} style={{ backgroundColor: '#111', border: '1px solid #222', padding: '18px', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ color: '#D4AF7C', fontSize: '14px' }}>
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </span>
                        <span style={{ fontSize: '10px', color: '#666' }}>ID: #{rev.id}</span>
                      </div>
                      <strong style={{ color: '#FAF9F6', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                        Product: {rev.products?.title || `Product ID: ${rev.product_id}`}
                      </strong>
                      <p style={{ fontSize: '12px', color: '#AAA', margin: 0, lineHeight: 1.5 }}>"{rev.comment}"</p>
                    </div>

                    <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #222', display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleDeleteReview(rev.id)}
                        style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer', textTransform: 'uppercase' }}
                      >
                        🗑️ Delete Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COUPONS TAB WITH MULTIPLE COUPON SWITCH */}
        {activeTab === 'coupons' && (
          <div>
            <div style={{ backgroundColor: '#111', border: '1px solid #D4AF7C', padding: '15px 20px', borderRadius: '6px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <strong style={{ color: '#D4AF7C', fontSize: '14px', display: 'block' }}>Allow Multiple Coupons Per Order</strong>
                <span style={{ fontSize: '11px', color: '#8A8A8A' }}>অন থাকলে কাস্টমার একই অর্ডারে একের অধিক কুপন কোড ব্যবহার করতে পারবে।</span>
              </div>
              <button 
                onClick={handleToggleMultipleCoupons}
                style={{
                  backgroundColor: allowMultipleCoupons ? '#2ecc71' : '#e74c3c',
                  color: '#FAF9F6',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
              >
                {allowMultipleCoupons ? '● ALLOW MULTIPLE (ON)' : '○ SINGLE COUPON ONLY (OFF)'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: 0, fontSize: '22px' }}>Coupon & Offer Analytics</h2>
                <p style={{ fontSize: '12px', color: '#8A8A8A', margin: '4px 0 0 0' }}>কুপন তৈরি করুন এবং ব্যবহারের লাইভ হিসাব ট্র্যাকিং করুন</p>
              </div>
              
              <button 
                onClick={() => setShowCouponModal(true)}
                style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '10px 20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer' }}
              >
                + Create New Coupon
              </button>
            </div>

            {loadingCoupons ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#8A8A8A' }}>Loading Coupons...</div>
            ) : coupons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#111', borderRadius: '6px', color: '#8A8A8A' }}>কোনো কুপন তৈরি করা হয়নি।</div>
            ) : (
              <div style={{ overflowX: 'auto', backgroundColor: '#111', borderRadius: '6px', border: '1px solid #222' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1a1a1a', color: '#D4AF7C', borderBottom: '1px solid #222', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>
                      <th style={{ padding: '14px' }}>Coupon Code</th>
                      <th style={{ padding: '14px' }}>Discount</th>
                      <th style={{ padding: '14px' }}>Times Used</th>
                      <th style={{ padding: '14px' }}>Total Discount Given</th>
                      <th style={{ padding: '14px' }}>Total Sales Generated</th>
                      <th style={{ padding: '14px' }}>Status</th>
                      <th style={{ padding: '14px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(coupon => (
                      <tr key={coupon.id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '14px' }}>
                          <strong style={{ color: '#D4AF7C', fontSize: '14px', letterSpacing: '1px' }}>{coupon.code}</strong>
                        </td>
                        <td style={{ padding: '14px', color: '#FAF9F6', fontWeight: 'bold' }}>
                          {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `৳${coupon.discount_value} OFF`}
                        </td>
                        <td style={{ padding: '14px', color: '#FAF9F6', fontWeight: 'bold' }}>
                          {coupon.usage_count || 0} times
                        </td>
                        <td style={{ padding: '14px', color: '#e74c3c', fontWeight: 'bold' }}>
                          ৳{coupon.total_discount_given || 0}
                        </td>
                        <td style={{ padding: '14px', color: '#2ecc71', fontWeight: 'bold' }}>
                          ৳{coupon.total_sales_generated || 0}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <button 
                            onClick={() => handleToggleCouponStatus(coupon)}
                            style={{ 
                              backgroundColor: coupon.is_active ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                              color: coupon.is_active ? '#2ecc71' : '#e74c3c',
                              border: '1px solid currentColor',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            {coupon.is_active ? '● Active' : '○ Disabled'}
                          </button>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                            style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 10px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer' }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* CREATE COUPON MODAL */}
      {showCouponModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: '20px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #D4AF7C', borderRadius: '8px', width: '100%', maxWidth: '450px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.9)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: 0, fontSize: '18px' }}>Create New Promo Coupon</h3>
              <button onClick={() => setShowCouponModal(false)} style={{ backgroundColor: 'transparent', color: '#8A8A8A', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>Coupon Code *</label>
                <input type="text" placeholder="e.g. AUREVE100" value={code} onChange={e => setCode(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', outline: 'none', textTransform: 'uppercase', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>Discount Type *</label>
                <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="fixed">Fixed Amount Off (৳ টাকা ছাড়)</option>
                  <option value="percent">Percentage Off (% পার্সেন্ট ছাড়)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>
                  {discountType === 'percent' ? 'Discount Percentage (%) *' : 'Discount Amount (৳) *'}
                </label>
                <input type="number" placeholder={discountType === 'percent' ? '10 (means 10% off)' : '100 (means ৳100 off)'} value={discountValue} onChange={e => setDiscountValue(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={isSavingCoupon} style={{ flex: 1, backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer' }}>
                  {isSavingCoupon ? 'Saving...' : 'Save Coupon'}
                </button>
                <button type="button" onClick={() => setShowCouponModal(false)} style={{ backgroundColor: '#222', color: '#8A8A8A', border: 'none', padding: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}