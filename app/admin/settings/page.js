'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

// অ্যাডমিন মেনুবার কম্পোনেন্ট
function AdminHeader() {
  return (
    <header style={{ backgroundColor: '#111', borderBottom: '1px solid #222', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Link href="/admin" style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 'bold', color: '#D4AF7C', textDecoration: 'none', letterSpacing: '1px' }}>
          AUREVÉ ADMIN
        </Link>
      </div>
      <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Link href="/admin" style={{ backgroundColor: '#1a1a1a', color: '#FAF9F6', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #333' }}>📊 Dashboard</Link>
        <Link href="/admin/products" style={{ backgroundColor: '#1a1a1a', color: '#FAF9F6', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #333' }}>🏷️ Products</Link>
        <Link href="/admin/manual-orders" style={{ backgroundColor: '#1a1a1a', color: '#FAF9F6', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #333' }}>📦 Manual Orders</Link>
        <Link href="/admin/customers" style={{ backgroundColor: '#1a1a1a', color: '#FAF9F6', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #333' }}>👥 Customers</Link>
        <Link href="/admin/expenses" style={{ backgroundColor: '#1a1a1a', color: '#FAF9F6', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #333' }}>💰 Expenses</Link>
        <Link href="/admin/reviews" style={{ backgroundColor: '#1a1a1a', color: '#FAF9F6', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #333' }}>⭐ Reviews</Link>
        <Link href="/admin/settings" style={{ backgroundColor: '#D4AF7C', color: '#080808', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #D4AF7C' }}>⚙️ Settings</Link>
      </nav>
    </header>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingField, setUploadingField] = useState('');

  // Website Content & Banner States
  const [heroTitle, setHeroTitle] = useState('Luxury Handcrafted Creations');
  const [heroSubtitle, setHeroSubtitle] = useState('Discover timeless elegance designed for your unique style.');
  const [desktopBanner, setDesktopBanner] = useState('');
  const [mobileBanner, setMobileBanner] = useState('');
  const [announcementText, setAnnouncementText] = useState('✨ Free Delivery on orders over ৳1000 across Bangladesh! ✨');

  // Homepage 3 Collection Cards States
  const [collectionImg1, setCollectionImg1] = useState('');
  const [collectionTitle1, setCollectionTitle1] = useState('Signature Bracelets');
  
  const [collectionImg2, setCollectionImg2] = useState('');
  const [collectionTitle2, setCollectionTitle2] = useState('Custom Base Lights');

  const [collectionImg3, setCollectionImg3] = useState('');
  const [collectionTitle3, setCollectionTitle3] = useState('Exclusive Accessories');
  
  // Delivery Settings States
  const [brahmanbariaCharge, setBrahmanbariaCharge] = useState('60');
  const [dhakaCharge, setDhakaCharge] = useState('80');
  const [outsideCharge, setOutsideCharge] = useState('100');
  const [extraItemCharge, setExtraItemCharge] = useState('0');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('2000');

  useEffect(() => {
    const authStatus = sessionStorage.getItem('aureve_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchSettings();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'Iqra@345') {
      setIsAuthenticated(true);
      sessionStorage.setItem('aureve_admin_auth', 'true');
      setPasswordError('');
      fetchSettings();
    } else {
      setPasswordError('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।');
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('admin_settings').select('*');
    if (!error && data) {
      data.forEach(item => {
        if (item.key === 'hero_title') setHeroTitle(item.value);
        if (item.key === 'hero_subtitle') setHeroSubtitle(item.value);
        if (item.key === 'desktop_banner') setDesktopBanner(item.value);
        if (item.key === 'mobile_banner') setMobileBanner(item.value);
        if (item.key === 'announcement_text') setAnnouncementText(item.value);
        
        if (item.key === 'col_img_1') setCollectionImg1(item.value);
        if (item.key === 'col_title_1') setCollectionTitle1(item.value);
        if (item.key === 'col_img_2') setCollectionImg2(item.value);
        if (item.key === 'col_title_2') setCollectionTitle2(item.value);
        if (item.key === 'col_img_3') setCollectionImg3(item.value);
        if (item.key === 'col_title_3') setCollectionTitle3(item.value);

        // ডেলিভারি সেটিংস ফেচ
        if (item.key === 'delivery_charge_brahmanbaria') setBrahmanbariaCharge(item.value);
        if (item.key === 'delivery_charge_dhaka') setDhakaCharge(item.value);
        if (item.key === 'delivery_charge_outside') setOutsideCharge(item.value);
        if (item.key === 'extra_item_charge') setExtraItemCharge(item.value);
        if (item.key === 'free_delivery_threshold') setFreeDeliveryThreshold(item.value);
      });
    }
    setLoading(false);
  };

  // ডাইরেক্ট ইমেজ আপলোড হ্যান্ডলার
  const handleImageUpload = async (e, setterFunction, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingField(fieldName);
    const fileExt = file.name.split('.').pop();
    const fileName = `${fieldName}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(filePath, file);

    if (uploadError) {
      alert('ছবি আপলোড করতে সমস্যা হয়েছে: ' + uploadError.message);
      setUploadingField('');
      return;
    }

    const { data } = supabase.storage
      .from('site-assets')
      .getPublicUrl(filePath);

    if (data && data.publicUrl) {
      setterFunction(data.publicUrl);
    }
    setUploadingField('');
  };

  // সকল সেটিংস ও ডেলিভারি রুলস সঠিকভাবে ব্যাচ আপসর্ট (Batch Upsert) করার ফাংশন
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    const settingsToSave = [
      { key: 'hero_title', value: heroTitle != null ? heroTitle.toString() : '', updated_at: new Date().toISOString() },
      { key: 'hero_subtitle', value: heroSubtitle != null ? heroSubtitle.toString() : '', updated_at: new Date().toISOString() },
      { key: 'desktop_banner', value: desktopBanner != null ? desktopBanner.toString() : '', updated_at: new Date().toISOString() },
      { key: 'mobile_banner', value: mobileBanner != null ? mobileBanner.toString() : '', updated_at: new Date().toISOString() },
      { key: 'announcement_text', value: announcementText != null ? announcementText.toString() : '', updated_at: new Date().toISOString() },
      
      { key: 'col_img_1', value: collectionImg1 != null ? collectionImg1.toString() : '', updated_at: new Date().toISOString() },
      { key: 'col_title_1', value: collectionTitle1 != null ? collectionTitle1.toString() : '', updated_at: new Date().toISOString() },
      { key: 'col_img_2', value: collectionImg2 != null ? collectionImg2.toString() : '', updated_at: new Date().toISOString() },
      { key: 'col_title_2', value: collectionTitle2 != null ? collectionTitle2.toString() : '', updated_at: new Date().toISOString() },
      { key: 'col_img_3', value: collectionImg3 != null ? collectionImg3.toString() : '', updated_at: new Date().toISOString() },
      { key: 'col_title_3', value: collectionTitle3 != null ? collectionTitle3.toString() : '', updated_at: new Date().toISOString() },

      // ডেলিভারি চার্জ রুলস
      { key: 'delivery_charge_brahmanbaria', value: brahmanbariaCharge != null ? brahmanbariaCharge.toString() : '60', updated_at: new Date().toISOString() },
      { key: 'delivery_charge_dhaka', value: dhakaCharge != null ? dhakaCharge.toString() : '80', updated_at: new Date().toISOString() },
      { key: 'delivery_charge_outside', value: outsideCharge != null ? outsideCharge.toString() : '100', updated_at: new Date().toISOString() },
      { key: 'extra_item_charge', value: extraItemCharge != null ? extraItemCharge.toString() : '0', updated_at: new Date().toISOString() },
      { key: 'free_delivery_threshold', value: freeDeliveryThreshold != null ? freeDeliveryThreshold.toString() : '2000', updated_at: new Date().toISOString() },
    ];

    const { error } = await supabase
      .from('admin_settings')
      .upsert(settingsToSave, { onConflict: 'key' });

    setSaving(false);

    if (error) {
      alert('সেটিংস সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } else {
      setSuccessMsg('সফলভাবে সকল সেটিংস, ব্যানার ও ডেলিভারি রুলস সেভ করা হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: '#080808', color: '#FAF9F6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Montserrat', sans-serif" }}>
        <div style={{ backgroundColor: '#111', border: '1px solid #D4AF7C', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '380px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: '0 0 10px 0' }}>AUREVÉ ADMIN</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="password" placeholder="Enter Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} style={{ backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '12px', borderRadius: '4px', textAlign: 'center' }} />
            {passwordError && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{passwordError}</span>}
            <button type="submit" style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '12px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>Unlock Panel</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#080808', color: '#FAF9F6', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <AdminHeader />

      <main style={{ padding: '30px', flex: 1, maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: 0, fontSize: '24px' }}>Website Content & Delivery Settings</h2>
          {successMsg && <span style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.3)', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{successMsg}</span>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#8A8A8A' }}>Loading settings...</div>
        ) : (
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            {/* সেকশন ১: হিরো ব্যানার ও কন্টেন্ট ম্যানেজমেন্ট */}
            <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '25px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: '0 0 10px 0', fontSize: '18px', borderBottom: '1px solid #222', paddingBottom: '8px' }}>🖼️ Hero Banners & Texts</h3>

              <div>
                <label style={{ fontSize: '11px', color: '#AAA', display: 'block', marginBottom: '5px' }}>Announcement Bar Text</label>
                <input type="text" value={announcementText} onChange={e => setAnnouncementText(e.target.value)} style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#AAA', display: 'block', marginBottom: '5px' }}>Hero Main Title</label>
                  <input type="text" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#AAA', display: 'block', marginBottom: '5px' }}>Hero Subtitle</label>
                  <input type="text" value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#AAA', display: 'block', marginBottom: '5px' }}>Desktop Banner Image Upload</label>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setDesktopBanner, 'desktop-banner')} style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '8px', borderRadius: '4px', fontSize: '11px' }} />
                  {uploadingField === 'desktop-banner' && <span style={{ fontSize: '10px', color: '#D4AF7C' }}>Uploading...</span>}
                  {desktopBanner && <img src={desktopBanner} alt="Desktop Preview" style={{ width: '100%', height: '80px', objectFit: 'cover', marginTop: '8px', borderRadius: '4px', border: '1px solid #333' }} />}
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#AAA', display: 'block', marginBottom: '5px' }}>Mobile Banner Image Upload</label>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setMobileBanner, 'mobile-banner')} style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '8px', borderRadius: '4px', fontSize: '11px' }} />
                  {uploadingField === 'mobile-banner' && <span style={{ fontSize: '10px', color: '#D4AF7C' }}>Uploading...</span>}
                  {mobileBanner && <img src={mobileBanner} alt="Mobile Preview" style={{ width: '100%', height: '80px', objectFit: 'cover', marginTop: '8px', borderRadius: '4px', border: '1px solid #333' }} />}
                </div>
              </div>
            </div>

            {/* সেকশন ২: হোমপেজের ৩টি কালেকশন কার্ড ম্যানেজমেন্ট */}
            <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '25px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: '0 0 10px 0', fontSize: '18px', borderBottom: '1px solid #222', paddingBottom: '8px' }}>📂 Homepage 3 Collections Cards Management</h3>

              {/* কালেকশন ১ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', backgroundColor: '#080808', padding: '12px', borderRadius: '6px', border: '1px solid #222', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#AAA', display: 'block', marginBottom: '3px' }}>Collection 1 Title</label>
                  <input type="text" value={collectionTitle1} onChange={e => setCollectionTitle1(e.target.value)} style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#FAF9F6', padding: '8px', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#AAA', display: 'block', marginBottom: '3px' }}>Collection 1 Image Upload</label>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setCollectionImg1, 'col-img-1')} style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#FAF9F6', padding: '6px', borderRadius: '4px', fontSize: '10px' }} />
                  {uploadingField === 'col-img-1' && <span style={{ fontSize: '10px', color: '#D4AF7C' }}>Uploading...</span>}
                  {collectionImg1 && <img src={collectionImg1} alt="Col 1" style={{ width: '60px', height: '40px', objectFit: 'cover', marginTop: '5px', borderRadius: '3px' }} />}
                </div>
              </div>

              {/* কালেকশন ২ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', backgroundColor: '#080808', padding: '12px', borderRadius: '6px', border: '1px solid #222', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#AAA', display: 'block', marginBottom: '3px' }}>Collection 2 Title</label>
                  <input type="text" value={collectionTitle2} onChange={e => setCollectionTitle2(e.target.value)} style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#FAF9F6', padding: '8px', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#AAA', display: 'block', marginBottom: '3px' }}>Collection 2 Image Upload</label>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setCollectionImg2, 'col-img-2')} style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#FAF9F6', padding: '6px', borderRadius: '4px', fontSize: '10px' }} />
                  {uploadingField === 'col-img-2' && <span style={{ fontSize: '10px', color: '#D4AF7C' }}>Uploading...</span>}
                  {collectionImg2 && <img src={collectionImg2} alt="Col 2" style={{ width: '60px', height: '40px', objectFit: 'cover', marginTop: '5px', borderRadius: '3px' }} />}
                </div>
              </div>

              {/* কালেকশন ৩ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', backgroundColor: '#080808', padding: '12px', borderRadius: '6px', border: '1px solid #222', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#AAA', display: 'block', marginBottom: '3px' }}>Collection 3 Title</label>
                  <input type="text" value={collectionTitle3} onChange={e => setCollectionTitle3(e.target.value)} style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#FAF9F6', padding: '8px', borderRadius: '4px', fontSize: '11px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#AAA', display: 'block', marginBottom: '3px' }}>Collection 3 Image Upload</label>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setCollectionImg3, 'col-img-3')} style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#FAF9F6', padding: '6px', borderRadius: '4px', fontSize: '10px' }} />
                  {uploadingField === 'col-img-3' && <span style={{ fontSize: '10px', color: '#D4AF7C' }}>Uploading...</span>}
                  {collectionImg3 && <img src={collectionImg3} alt="Col 3" style={{ width: '60px', height: '40px', objectFit: 'cover', marginTop: '5px', borderRadius: '3px' }} />}
                </div>
              </div>

            </div>

            {/* সেকশন ৩: ডেলিভারি চার্জ ও ফ্রি ডেলিভারি রুলস */}
            <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '25px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: '0 0 10px 0', fontSize: '18px', borderBottom: '1px solid #222', paddingBottom: '8px' }}>🚚 Delivery & Shipping Rules</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#AAA', display: 'block', marginBottom: '5px' }}>ব্রাহ্মণবাড়িয়া সদর ডেলিভারি চার্জ (৳)</label>
                  <input type="number" value={brahmanbariaCharge} onChange={e => setBrahmanbariaCharge(e.target.value)} style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#AAA', display: 'block', marginBottom: '5px' }}>ঢাকার ভেতরে ডেলিভারি চার্জ (৳)</label>
                  <input type="number" value={dhakaCharge} onChange={e => setDhakaCharge(e.target.value)} style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#AAA', display: 'block', marginBottom: '5px' }}>ঢাকার বাইরে ডেলিভারি চার্জ (৳)</label>
                  <input type="number" value={outsideCharge} onChange={e => setOutsideCharge(e.target.value)} style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#AAA', display: 'block', marginBottom: '5px' }}>অতিরিক্ত প্রতি পণ্যের চার্জ (৳)</label>
                  <input type="number" value={extraItemCharge} onChange={e => setExtraItemCharge(e.target.value)} style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#D4AF7C', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>✨ ফ্রি ডেলিভারির জন্য ন্যূনতম কেনাকাটার পরিমাণ (৳)</label>
                <input type="number" value={freeDeliveryThreshold} onChange={e => setFreeDeliveryThreshold(e.target.value)} style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #D4AF7C', color: '#D4AF7C', padding: '10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', boxSizing: 'border-box' }} required />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '14px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px' }}
            >
              {saving ? 'Saving Changes...' : '💾 Save All Settings & Delivery Rules'}
            </button>

          </form>
        )}
      </main>
    </div>
  );
}