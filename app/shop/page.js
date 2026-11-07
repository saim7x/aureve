'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

function ShopContent() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  
  // ডাইনামিক ফ্রি ডেলিভারি থ্রেশহোল্ড ও অ্যানাউন্সমেন্ট টেক্সট স্টেট
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(2000);
  const [announcementText, setAnnouncementText] = useState('✨ Free Delivery on orders over ৳1000 across Bangladesh! ✨');

  const searchParams = useSearchParams();
  const catQuery = searchParams.get('category');

  useEffect(() => {
    async function fetchShopData() {
      setLoading(true);

      // ১. অ্যাডমিন সেটিংস থেকে ফ্রি ডেলিভারি থ্রেশহোল্ড ও অ্যানাউন্সমেন্ট টেক্সট ফেচ করা
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

      // ২. প্রোডাক্টস ও অর্ডার আইটেমস ফেচ করা
      const { data: prodData, error: prodError } = await supabase.from('products').select('*');
      const { data: orderItems, error: ordError } = await supabase.from('order_items').select('*');

      if (!prodError && prodData) {
        const salesCountMap = {};
        prodData.forEach(p => {
          salesCountMap[p.id] = 0;
        });

        if (orderItems && orderItems.length > 0) {
          orderItems.forEach(item => {
            if (salesCountMap[item.product_id] !== undefined) {
              salesCountMap[item.product_id] += (item.quantity || 1);
            }
          });
        }

        const processedProducts = prodData.map(p => ({
          ...p,
          realSales: salesCountMap[p.id] || 0
        }));

        setProducts(processedProducts);

        if (catQuery) {
          setSelectedCategory(catQuery);
          const filtered = processedProducts.filter(p => {
            const pCat = (p.category || '').trim().toLowerCase();
            const targetCat = catQuery.trim().toLowerCase();
            return pCat === targetCat || pCat.includes(targetCat);
          });
          setFilteredProducts(filtered);
        } else {
          setFilteredProducts(processedProducts);
        }
      }
      setLoading(false);
    }
    fetchShopData();

    const cart = JSON.parse(localStorage.getItem('aureve_cart')) || [];
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, [catQuery]);

  const filterCategory = (cat) => {
    setSelectedCategory(cat);
    if (cat.toLowerCase() === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p => {
        const pCat = (p.category || '').trim().toLowerCase();
        const targetCat = cat.trim().toLowerCase();
        return pCat === targetCat || pCat.includes(targetCat);
      });
      setFilteredProducts(filtered);
    }
  };

  return (
    <div style={{ backgroundColor: '#FAF9F6', color: '#080808', minHeight: '100vh', paddingBottom: '85px', fontFamily: "'Montserrat', sans-serif" }}>
      {/* ডাইনামিক অ্যানাউন্সমেন্ট ও ফ্রি ডেলিভারি ব্যানার */}
      <div style={{ backgroundColor: '#D4AF7C', color: '#080808', fontSize: '11px', padding: '8px 12px', textAlign: 'center', fontWeight: '600', letterSpacing: '1px' }}>
        {announcementText}
      </div>

      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#080808', borderBottom: '1px solid #222222', padding: '0 20px', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', textDecoration: 'none', color: '#D4AF7C' }}>
          AUREVÉ
        </Link>
        <nav style={{ display: 'flex', gap: '25px', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1.5px' }} className="desktop-nav">
          <Link href="/" style={{ color: '#FAF9F6', textDecoration: 'none' }}>Home</Link>
          <Link href="/shop" style={{ color: '#D4AF7C', textDecoration: 'none' }}>Shop</Link>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/cart" style={{ color: '#FAF9F6', textDecoration: 'none', display: 'flex', position: 'relative' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', backgroundColor: '#D4AF7C', color: '#080808', fontSize: '9px', fontWeight: 'bold', width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Our Products</h1>
          <div style={{ width: '50px', height: '2px', backgroundColor: '#D4AF7C', margin: '0 auto' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {[
            { label: 'All', value: 'All' },
            { label: 'Signature', value: 'Signature Products' },
            { label: 'Other', value: 'Other Products' },
            { label: 'Custom', value: 'Custom Products' }
          ].map((cat) => (
            <button 
              key={cat.value}
              onClick={() => filterCategory(cat.value)}
              style={{
                backgroundColor: selectedCategory.toLowerCase() === cat.value.toLowerCase() ? '#080808' : '#EDE6D9',
                color: selectedCategory.toLowerCase() === cat.value.toLowerCase() ? '#FAF9F6' : '#080808',
                border: 'none',
                padding: '9px 20px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: '600',
                cursor: 'pointer',
                borderRadius: '3px'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A8A8A', fontSize: '13px' }}>Loading collection...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A8A8A', fontSize: '13px' }}>No products found.</div>
        ) : (
          <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
            {filteredProducts.map((p) => {
              const imageUrl = (p.images && p.images[0]) ? p.images[0] : (p.image || 'https://images.unsplash.com/photo-1611591475170-438dcb90ce7b?q=80&w=600');
              const totalSold = p.realSales || 0;
              
              const stock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0;
              
              const currentPrice = parseFloat(p.price) || 0;
              const rawOriginalPrice = p.original_price || p.cut_price || p.old_price;
              const originalPrice = rawOriginalPrice ? parseFloat(rawOriginalPrice) : 0;
              const hasDiscount = originalPrice > currentPrice;
              const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

              return (
                <div key={p.id} style={{ backgroundColor: '#FAF9F6', border: '1px solid #EDE6D9', borderRadius: '6px', padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ height: '260px', backgroundColor: '#EDE6D9', borderRadius: '4px', marginBottom: '15px', overflow: 'hidden', position: 'relative' }}>
                      <img src={imageUrl} alt={p.title || p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#080808', color: '#D4AF7C', fontSize: '10px', padding: '4px 8px', borderRadius: '3px', fontWeight: 'bold' }}>
                        Sold: {totalSold}
                      </span>

                      {hasDiscount && (
                        <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#D4AF7C', color: '#080808', fontSize: '10px', padding: '4px 8px', borderRadius: '3px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0', textAlign: 'center' }}>
                      {p.title || p.name}
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 15px 0', padding: '0 5px', flexWrap: 'wrap', gap: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#D4AF7C', fontWeight: 'bold', fontSize: '16px' }}>৳ {currentPrice}</span>
                        {hasDiscount && (
                          <span style={{ textDecoration: 'line-through', color: '#8A8A8A', fontSize: '12px', fontWeight: '500' }}>৳ {originalPrice}</span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: stock > 0 ? '#27ae60' : '#c0392b', fontWeight: '600' }}>
                        {stock > 0 ? `Stock: ${stock} pcs` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                  <Link href={`/product/${p.id}`} style={{ backgroundColor: '#080808', color: '#FAF9F6', textAlign: 'center', textDecoration: 'none', padding: '12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', borderRadius: '3px', display: 'block' }}>
                    View Product
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
      <style jsx global>{`
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
          .product-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
      `}</style>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}