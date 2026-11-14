/* Netlify Badge Hide */
a[href*="netlify.com"][target="_blank"],
div[id*="netlify-badge"],
iframe[title*="Netlify"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from './components/BottomNav';
import { supabase } from './lib/supabase';

export default function Home() {
  const router = useRouter();
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // ইউজার ও অথেন্টিকেশন স্টেট
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // ডাইনামিক সেটিংস স্টেট
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(2000);
  const [announcementText, setAnnouncementText] = useState('✨ Free Delivery on orders over ৳1000 across Bangladesh! ✨');
  const [heroTitle, setHeroTitle] = useState('AUREVÉ');
  const [heroSubtitle, setHeroSubtitle] = useState('Elegance in Every Detail.');
  const [desktopBanner, setDesktopBanner] = useState('');
  const [mobileBanner, setMobileBanner] = useState('');

  // কালেকশন কার্ড ৩টির স্টেট
  const [col1Title, setCol1Title] = useState('Signature Collection');
  const [col1Img, setCol1Img] = useState('/images/collection-1.jpg');
  const [col2Title, setCol2Title] = useState('Bespoke Collection');
  const [col2Img, setCol2Img] = useState('/images/collection-2.jpg');
  const [col3Title, setCol3Title] = useState('Other Products');
  const [col3Img, setCol3Img] = useState('/images/collection-3.jpg');

  useEffect(() => {
    async function fetchHomeData() {
      try {
        setLoading(true);

        // ১. ইনিশিয়াল সেশন চেক করা
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setAuthChecking(false);

        // ২. রিয়েল-টাইম সেশন পরিবর্তন লিসেনার
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
          setAuthChecking(false);
        });

        // ৩. অ্যাডমিন সেটিংস ফেচ করা
        const { data: settingData } = await supabase
          .from('admin_settings')
          .select('*');

        if (settingData && settingData.length > 0) {
          settingData.forEach(item => {
            if (item.key === 'free_delivery_threshold') setFreeDeliveryThreshold(parseFloat(item.value) || 2000);
            if (item.key === 'announcement_text') setAnnouncementText(item.value);
            if (item.key === 'hero_title') setHeroTitle(item.value);
            if (item.key === 'hero_subtitle') setHeroSubtitle(item.value);
            if (item.key === 'desktop_banner') setDesktopBanner(item.value);
            if (item.key === 'mobile_banner') setMobileBanner(item.value);

            if (item.key === 'col_title_1') setCol1Title(item.value);
            if (item.key === 'col_img_1' && item.value) setCol1Img(item.value);
            if (item.key === 'col_title_2') setCol2Title(item.value);
            if (item.key === 'col_img_2' && item.value) setCol2Img(item.value);
            if (item.key === 'col_title_3') setCol3Title(item.value);
            if (item.key === 'col_img_3' && item.value) setCol3Img(item.value);
          });
        }

        // ৪. প্রোডাক্টস ও অর্ডার আইটেমস ফেচ করা
        const { data: products, error: prodError } = await supabase.from('products').select('*');
        const { data: orderItems, error: ordError } = await supabase.from('order_items').select('*');
        
        if (prodError || !products || products.length === 0) {
          setBestSellers([]);
          setLoading(false);
          return;
        }

        const salesMap = {};
        products.forEach(p => {
          const imgUrl = (p.images && p.images[0]) ? p.images[0] : (p.image || p.image_url || 'https://images.unsplash.com/photo-1611591475170-438dcb90ce7b?q=80&w=600');
          salesMap[p.id] = {
            id: p.id,
            title: p.title || p.name || 'Handcrafted Item',
            price: p.price || 0,
            original_price: p.original_price || p.cut_price || p.old_price || null,
            image: imgUrl,
            stock: p.stock !== undefined ? p.stock : (p.quantity !== undefined ? p.quantity : 10),
            totalSold: 0
          };
        });

        if (orderItems && orderItems.length > 0) {
          orderItems.forEach(item => {
            const prodId = item.product_id;
            if (salesMap[prodId]) {
              salesMap[prodId].totalSold += (item.quantity || 1);
            }
          });
        }

        const sortedProducts = Object.values(salesMap).sort((a, b) => b.totalSold - a.totalSold);
        setBestSellers(sortedProducts.slice(0, 3));
      } catch (err) {
        console.error('Error fetching home data:', err);
        setBestSellers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHomeData();
  }, []);

  // ডাইনামিক গুগল লগইন হ্যান্ডলার
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
  };

  return (
    <div style={{ backgroundColor: '#FAF9F6', color: '#080808', minHeight: '100vh', paddingBottom: '90px', fontFamily: "'Montserrat', sans-serif" }}>
      {/* Top Announcement Bar */}
      <div style={{ backgroundColor: '#D4AF7C', color: '#080808', fontSize: '11px', padding: '8px 12px', textAlign: 'center', fontWeight: '600', letterSpacing: '1px' }}>
        {announcementText}
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#080808', borderBottom: '1px solid #222222', padding: '0 20px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 'bold', letterSpacing: '2px', textDecoration: 'none', color: '#D4AF7C', outline: 'none', border: 'none' }}>
          AUREVÉ
        </Link>
        <div className="desktop-only-nav">
          <Link href="/" style={{ color: '#D4AF7C', fontSize: '11px', textTransform: 'uppercase', textDecoration: 'none', fontWeight: '600', letterSpacing: '1.5px' }}>Home</Link>
          <Link href="/shop" style={{ color: '#FAF9F6', fontSize: '11px', textTransform: 'uppercase', textDecoration: 'none', fontWeight: '600', letterSpacing: '1.5px' }}>Shop</Link>
          <Link href="/track" style={{ color: '#FAF9F6', fontSize: '11px', textTransform: 'uppercase', textDecoration: 'none', fontWeight: '600', letterSpacing: '1.5px' }}>Track Order</Link>
        </div>

        {/* Header Right Actions: Login / My Orders Button + Three-dot Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!authChecking && (
            user ? (
              <Link href="/orders" style={{ backgroundColor: '#D4AF7C', color: '#080808', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none', borderRadius: '3px' }}>
                My Orders
              </Link>
            ) : (
              <button onClick={handleGoogleLogin} style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', borderRadius: '3px' }}>
                Login
              </button>
            )
          )}

          <button onClick={() => setMenuOpen(true)} style={{ background: 'none', border: 'none', color: '#D4AF7C', fontSize: '24px', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ⋮
          </button>
        </div>
      </header>

      {/* Sidebar Menu Drawer */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex' }} onClick={() => setMenuOpen(false)}>
          <div style={{ width: '280px', backgroundColor: '#080808', color: '#FAF9F6', height: '100%', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#D4AF7C', letterSpacing: '2px' }}>AUREVÉ</span>
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#FAF9F6', fontSize: '22px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Link href="/" onClick={() => setMenuOpen(false)} style={{ color: '#D4AF7C', textDecoration: 'none', padding: '8px 0' }}>Home</Link>
              <Link href="/shop" onClick={() => setMenuOpen(false)} style={{ color: '#FAF9F6', textDecoration: 'none', padding: '8px 0' }}>Shop</Link>
              <Link href="/cart" onClick={() => setMenuOpen(false)} style={{ color: '#FAF9F6', textDecoration: 'none', padding: '8px 0' }}>Cart</Link>
              <Link href="/track" onClick={() => setMenuOpen(false)} style={{ color: '#FAF9F6', textDecoration: 'none', padding: '8px 0' }}>Track Order</Link>
              
              {user ? (
                <Link href="/orders" onClick={() => setMenuOpen(false)} style={{ color: '#D4AF7C', textDecoration: 'none', padding: '8px 0', fontWeight: 'bold' }}>My Orders</Link>
              ) : (
                <button onClick={() => { setMenuOpen(false); handleGoogleLogin(); }} style={{ background: '#D4AF7C', color: '#080808', border: 'none', padding: '10px', textAlign: 'left', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', borderRadius: '3px', marginTop: '10px' }}>
                  Google Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner Section */}
      <section style={{
        position: 'relative',
        backgroundColor: '#080808',
        backgroundImage: `linear-gradient(to bottom, rgba(8,8,8,0.5), rgba(8,8,8,0.8)), url("${desktopBanner || '/images/hero-bg.jpg'}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#FAF9F6',
        padding: '80px 20px',
        textAlign: 'left',
        borderBottom: '2px solid #D4AF7C'
      }} className="hero-section">
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '42px', fontWeight: 'bold', letterSpacing: '2px', margin: 0, color: '#FAF9F6', lineHeight: '1.2' }} className="hero-title">
            {heroTitle}
          </h1>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', color: '#D4AF7C', margin: 0, fontStyle: 'italic' }} className="hero-subtitle">
            {heroSubtitle}
          </p>
          <p style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: '#CCC', margin: '0 0 15px 0' }} className="hero-desc">
            Premium Handcrafted Accessories
          </p>
          <div>
            <Link href="/shop" style={{ display: 'inline-block', backgroundColor: '#D4AF7C', color: '#080808', padding: '12px 30px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', textDecoration: 'none', borderRadius: '3px' }}>
              Shop the Collection &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Badges Bar */}
      <section style={{ backgroundColor: '#D4AF7C', borderTop: '1px solid #B89360', borderBottom: '1px solid #B89360', padding: '20px 10px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', textAlign: 'center' }} className="features-grid">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(8,8,8,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#080808' }}>Premium Quality</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(8,8,8,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#080808' }}>Custom Design</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(8,8,8,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#080808' }}>Fast Delivery</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(8,8,8,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#080808' }}>Secure Payment</span>
          </div>
        </div>
      </section>

      {/* Our Collections Section */}
      <main style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', letterSpacing: '1.5px', margin: '0 0 8px 0' }}>
            Our Collections
          </h2>
          <div style={{ width: '50px', height: '2px', backgroundColor: '#D4AF7C', margin: '0 auto' }}></div>
        </div>
        <div className="collections-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '50px' }}>
          
          <Link href="/shop?category=Signature" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ position: 'relative', height: '260px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #EDE6D9', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <img src={col1Img} alt={col1Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,0.85) 10%, rgba(8,8,8,0.2) 80%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px', textAlign: 'center' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#FAF9F6', fontSize: '18px', margin: '0 0 5px 0' }}>{col1Title}</h3>
                <span style={{ color: '#D4AF7C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Explore &rarr;</span>
              </div>
            </div>
          </Link>

          <Link href="/shop?category=Custom" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ position: 'relative', height: '260px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #EDE6D9', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <img src={col2Img} alt={col2Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,0.85) 10%, rgba(8,8,8,0.2) 80%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px', textAlign: 'center' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#FAF9F6', fontSize: '18px', margin: '0 0 5px 0' }}>{col2Title}</h3>
                <span style={{ color: '#D4AF7C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Explore &rarr;</span>
              </div>
            </div>
          </Link>

          <Link href="/shop?category=Other" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ position: 'relative', height: '260px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #EDE6D9', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <img src={col3Img} alt={col3Title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,0.85) 10%, rgba(8,8,8,0.2) 80%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px', textAlign: 'center' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#FAF9F6', fontSize: '18px', margin: '0 0 5px 0' }}>{col3Title}</h3>
                <span style={{ color: '#D4AF7C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Explore &rarr;</span>
              </div>
            </div>
          </Link>

        </div>

        {/* Dynamic Best Sellers Section */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Best Sellers</h2>
          <div style={{ width: '50px', height: '2px', backgroundColor: '#D4AF7C', margin: '0 auto' }}></div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8A8A8A' }}>Loading best sellers...</div>
        ) : bestSellers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8A8A8A' }}>No products found in database.</div>
        ) : (
          <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
            {bestSellers.map(product => {
              const currentPrice = parseFloat(product.price) || 0;
              const originalPrice = product.original_price ? parseFloat(product.original_price) : 0;
              const hasDiscount = originalPrice > currentPrice;
              const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

              return (
                <div key={product.id} style={{ backgroundColor: '#FAF9F6', border: '1px solid #EDE6D9', borderRadius: '6px', padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ height: '260px', backgroundColor: '#EDE6D9', borderRadius: '4px', marginBottom: '15px', overflow: 'hidden', position: 'relative' }}>
                      <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {/* Sold Count Badge */}
                      <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#080808', color: '#D4AF7C', fontSize: '10px', padding: '4px 8px', borderRadius: '3px', fontWeight: 'bold' }}>
                        Sold: {product.totalSold}
                      </span>

                      {/* Discount Badge */}
                      {hasDiscount && (
                        <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#D4AF7C', color: '#080808', fontSize: '10px', padding: '4px 8px', borderRadius: '3px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0', textAlign: 'center' }}>{product.title}</h3>
                    
                    {/* Price & Stock info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 15px 0', padding: '0 5px', flexWrap: 'wrap', gap: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#D4AF7C', fontWeight: 'bold', fontSize: '16px' }}>&#2547; {currentPrice}</span>
                        {hasDiscount && (
                          <span style={{ textDecoration: 'line-through', color: '#8A8A8A', fontSize: '12px', fontWeight: '500' }}>&#2547; {originalPrice}</span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: product.stock > 0 ? '#27ae60' : '#c0392b', fontWeight: '600' }}>
                        {product.stock > 0 ? `Stock: ${product.stock} pcs` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                  <Link href={`/product/${product.id}`} style={{ backgroundColor: '#080808', color: '#FAF9F6', textAlign: 'center', textDecoration: 'none', padding: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', borderRadius: '3px', display: 'block' }}>
                    View Product
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#080808', color: '#FAF9F6', padding: '50px 20px 25px 20px', borderTop: '1px solid #222222', marginTop: '50px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', marginBottom: '35px' }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#D4AF7C', letterSpacing: '2px', marginBottom: '10px' }}>AUREVÉ</h3>
            <p style={{ fontSize: '12px', color: '#A0A0A0', lineHeight: '1.6', margin: '0 0 12px 0' }}>
              Elegance in Every Detail. Crafted handmade luxury accessories designed to elevate your unique style.
            </p>
            <div style={{ fontSize: '11px', color: '#D4AF7C', fontWeight: '600' }}>
              📍 Brahmanbaria Sadar, Bangladesh
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#D4AF7C', marginBottom: '12px', fontWeight: 'bold' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <li><Link href="/" style={{ color: '#A0A0A0', textDecoration: 'none' }}>Home</Link></li>
              <li><Link href="/shop" style={{ color: '#A0A0A0', textDecoration: 'none' }}>Shop Collection</Link></li>
              <li><Link href="/track" style={{ color: '#A0A0A0', textDecoration: 'none' }}>Track Your Order</Link></li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#D4AF7C', marginBottom: '12px', fontWeight: 'bold' }}>Customer Care</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#A0A0A0' }}>
              <span>WhatsApp: <a href="https://wa.me/8801568476535" target="_blank" rel="noopener noreferrer" style={{ color: '#FAF9F6', textDecoration: 'none' }}>+8801568476535</a></span>
              <span>Email: <a href="mailto:saimahmed7980@gmail.com" style={{ color: '#FAF9F6', textDecoration: 'none' }}>saimahmed7980@gmail.com</a></span>
              <span style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>Bkash/Nagad Payment: +8801857251303</span>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#D4AF7C', marginBottom: '12px', fontWeight: 'bold' }}>Connect With Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <a href="https://www.facebook.com/share/19H1zPBJex/" target="_blank" rel="noopener noreferrer" style={{ color: '#A0A0A0', textDecoration: 'none' }}>Facebook Page</a>
              <a href="https://www.instagram.com/aureve.b?psln=MTVzazFrenpoOG96OA==" target="_blank" rel="noopener noreferrer" style={{ color: '#A0A0A0', textDecoration: 'none' }}>Instagram Store</a>
              <a href="https://www.tiktok.com/@aureve.b?_r=1&_t=ZS-9BAgz9XPvyo" target="_blank" rel="noopener noreferrer" style={{ color: '#A0A0A0', textDecoration: 'none' }}>TikTok Official</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1F1F1F', paddingTop: '15px', textAlign: 'center', fontSize: '10px', color: '#777', letterSpacing: '1px' }}>
          © 2026 AUREVÉ. All rights reserved.
        </div>
      </footer>

      <BottomNav />
      <style jsx global>{`
        .desktop-only-nav {
          display: flex;
          gap: 35px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        .collections-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 25px;
        }
        @media (max-width: 768px) {
          .desktop-only-nav {
            display: none !important;
          }
          .collections-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .product-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 15px !important;
          }
          .hero-section {
            padding: 40px 15px !important;
          }
          .hero-title {
            font-size: 32px !important;
          }
          .hero-subtitle {
            font-size: 20px !important;
          }
          .hero-desc {
            font-size: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
