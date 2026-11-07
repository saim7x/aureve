'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // টাচ সোয়াইপ হ্যান্ডেল করার জন্য রিফ (Touch Swipe Refs)
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    async function fetchProductAndReviews() {
      if (!id) return;
      setLoading(true);
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!prodError && prodData) {
        setProduct(prodData);
      } else {
        console.error('Product fetch error:', prodError);
      }

      const { data: revData, error: revError } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id);
      
      if (!revError && revData) {
        setReviews(revData);
      }
      setLoading(false);
    }
    fetchProductAndReviews();
    const cart = JSON.parse(localStorage.getItem('aureve_cart')) || [];
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleIncreaseQuantity = () => {
    if (product && quantity >= product.stock) {
      showToast(`দুঃখিত, এই পণ্যটির সর্বোচ্চ ${product.stock}টি স্টক available আছে।`);
      return;
    }
    setQuantity(q => q + 1);
  };

  const addToCart = () => {
    if (product.stock <= 0) {
      showToast('দুঃখিত, এই পণ্যটি বর্তমানে আউট অফ স্টক রয়েছে।');
      return;
    }
    let cart = JSON.parse(localStorage.getItem('aureve_cart')) || [];
    const existingIndex = cart.findIndex(item => item.id === product.id);
    
    const currentCartQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    if (currentCartQty + quantity > product.stock) {
      showToast(`দুঃখিত, স্টকে মাত্র ${product.stock}টি পণ্য আছে। এর বেশি কার্টে যোগ করা যাবে না।`);
      return;
    }

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    localStorage.setItem('aureve_cart', JSON.stringify(cart));
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    showToast('Product added to cart successfully!');
  };

  const handleDirectOrder = () => {
    if (product.stock <= 0) {
      showToast('দুঃখিত, এই পণ্যটি বর্তমানে আউট অফ স্টক রয়েছে।');
      return;
    }
    addToCart();
    router.push('/cart');
  };

  // টাচ সোয়াইপ ডিটেক্ট করার ফাংশন
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!productImages || productImages.length <= 1) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // ন্যূনতম কতটুকু সোয়াইপ করলে কাজ করবে

    if (distance > minSwipeDistance) {
      // বাম দিকে সোয়াইপ করলে পরবর্তী ছবি আসবে
      setCurrentImageIndex(prev => (prev === productImages.length - 1 ? 0 : prev + 1));
    } else if (distance < -minSwipeDistance) {
      // ডান দিকে সোয়াইপ করলে পূর্ববর্তী ছবি আসবে
      setCurrentImageIndex(prev => (prev === 0 ? productImages.length - 1 : prev - 1));
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', fontFamily: "'Montserrat', sans-serif" }}>Loading product details...</div>;
  }
  if (!product) {
    return <div style={{ textAlign: 'center', padding: '100px', fontFamily: "'Montserrat', sans-serif" }}>Product not found.</div>;
  }

  const isOutOfStock = product.stock <= 0;
  
  const productImages = (product.images && product.images.length > 0) 
    ? product.images 
    : [product.image || product.img || '/images/collection-1.jpg'];

  const currentImageUrl = productImages[currentImageIndex] || productImages[0];

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : 'No ratings yet';

  const currentPrice = parseFloat(product.price) || 0;
  const rawOriginalPrice = product.original_price || product.cut_price || product.old_price;
  const originalPrice = rawOriginalPrice ? parseFloat(rawOriginalPrice) : 0;

  const hasDiscount = originalPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  return (
    <div style={{ backgroundColor: '#FAF9F6', color: '#080808', minHeight: '100vh', paddingBottom: '90px', fontFamily: "'Montserrat', sans-serif", position: 'relative' }}>
      {/* Top Announcement Bar */}
      <div style={{ backgroundColor: '#D4AF7C', color: '#080808', fontSize: '11px', padding: '8px 12px', textAlign: 'center', fontWeight: '600', letterSpacing: '1px' }}>
        Free Delivery on orders above ৳2,000 | Elegance in Every Detail
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '80px', right: '30px', backgroundColor: '#080808', color: '#D4AF7C', padding: '12px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid #D4AF7C' }}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#080808', borderBottom: '1px solid #222222', padding: '0 20px', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', textDecoration: 'none', color: '#D4AF7C' }}>
          AUREVÉ
        </Link>
        <Link href="/shop" style={{ color: '#FAF9F6', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', textDecoration: 'none', fontWeight: '600' }}>Shop</Link>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
        {/* Premium Back Button */}
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
            marginBottom: '30px', 
            boxShadow: '0 2px 8px rgba(212,175,124,0.15)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#D4AF7C'; e.currentTarget.style.color = '#080808'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FAF9F6'; e.currentTarget.style.color = '#080808'; }}
        >
          <span style={{ fontSize: '14px' }}>←</span> Back to Shop
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }} className="product-detail-grid">
          
          {/* Product Image Gallery Section with Swipe and Desktop Arrows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ height: '380px', backgroundColor: '#EDE6D9', borderRadius: '6px', overflow: 'hidden', border: '1px solid #EDE6D9', position: 'relative', cursor: 'grab' }}
            >
              <img src={currentImageUrl} alt={product.title || product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none' }} />
              
              {hasDiscount && (
                <span style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#D4AF7C', color: '#080808', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '1px', pointerEvents: 'none' }}>
                  {discountPercent}% OFF
                </span>
              )}

              {/* Desktop / Mobile Arrow Buttons */}
              {productImages.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentImageIndex(prev => (prev === 0 ? productImages.length - 1 : prev - 1))}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', zIndex: 10, transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'}
                  >
                    ❮
                  </button>
                  <button 
                    onClick={() => setCurrentImageIndex(prev => (prev === productImages.length - 1 ? 0 : prev + 1))}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', zIndex: 10, transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'}
                  >
                    ❯
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                {productImages.map((img, index) => (
                  <div 
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    style={{ 
                      width: '70px', 
                      height: '70px', 
                      borderRadius: '4px', 
                      overflow: 'hidden', 
                      cursor: 'pointer', 
                      border: currentImageIndex === index ? '2px solid #D4AF7C' : '1px solid #EDE6D9',
                      backgroundColor: '#EDE6D9',
                      flexShrink: 0
                    }}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#D4AF7C', fontWeight: '600', marginBottom: '8px' }}>
              {product.category || 'Signature Collection'}
            </span>
            
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '30px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#080808' }}>
              {product.title || product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 15px 0', flexWrap: 'wrap' }}>
              <span style={{ color: '#D4AF7C', fontWeight: 'bold', fontSize: '24px' }}>
                ৳ {currentPrice}
              </span>
              {hasDiscount && (
                <span style={{ textDecoration: 'line-through', color: '#8A8A8A', fontSize: '16px', fontWeight: '500' }}>
                  ৳ {originalPrice}
                </span>
              )}
              {hasDiscount && (
                <span style={{ backgroundColor: 'rgba(212, 175, 124, 0.15)', color: '#b8860b', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', border: '1px solid #D4AF7C' }}>
                  Save {discountPercent}% ({discountPercent}% OFF)
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', fontSize: '13px', fontWeight: '600', color: '#555' }}>
              <span style={{ color: '#D4AF7C', fontSize: '16px' }}>★</span>
              <span>{averageRating} {reviews.length > 0 ? `(${reviews.length} reviews)` : ''}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isOutOfStock ? '#e74c3c' : '#27ae60', fontSize: '12px', fontWeight: '600', marginBottom: '20px' }}>
              <span>{isOutOfStock ? '● Out of Stock' : `● In Stock (${product.stock} pcs available)`}</span>
            </div>

            <p style={{ color: '#555555', fontSize: '13px', lineHeight: 1.6, margin: '0 0 25px 0' }}>
              {product.description || 'A timeless handcrafted accessory designed with precision and elegance. Perfect for every occasion.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '1px' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EDE6D9', backgroundColor: '#FFF' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ background: 'none', border: 'none', padding: '8px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>-</button>
                <span style={{ padding: '0 12px', fontSize: '13px', fontWeight: '600' }}>{quantity}</span>
                <button onClick={handleIncreaseQuantity} style={{ background: 'none', border: 'none', padding: '8px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={addToCart}
                disabled={isOutOfStock}
                style={{ flex: 1, backgroundColor: isOutOfStock ? '#ccc' : 'transparent', color: isOutOfStock ? '#666' : '#080808', border: isOutOfStock ? 'none' : '1px solid #080808', padding: '14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', cursor: isOutOfStock ? 'not-allowed' : 'pointer', borderRadius: '3px' }}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button 
                onClick={handleDirectOrder}
                disabled={isOutOfStock}
                style={{ flex: 1, backgroundColor: isOutOfStock ? '#ccc' : '#080808', color: isOutOfStock ? '#666' : '#FAF9F6', border: 'none', padding: '14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', cursor: isOutOfStock ? 'not-allowed' : 'pointer', borderRadius: '3px' }}
              >
                {isOutOfStock ? 'Out of Stock' : 'Order Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div style={{ marginTop: '60px', borderTop: '1px solid #EDE6D9', paddingTop: '40px' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', marginBottom: '20px' }}>Customer Reviews</h3>
          {reviews.length === 0 ? (
            <p style={{ color: '#8A8A8A', fontSize: '13px' }}>No reviews for this product yet. Be the first to review after purchase!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {reviews.map((rev, idx) => (
                <div key={idx} style={{ backgroundColor: '#FFF', border: '1px solid #EDE6D9', padding: '20px', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ color: '#D4AF7C', fontSize: '14px' }}>
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    <span style={{ fontSize: '11px', color: '#8A8A8A' }}>Verified Buyer</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#333', margin: 0, lineHeight: 1.5 }}>{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
      <style jsx global>{`
        @media (max-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 25px !important;
          }
        }
      `}</style>
    </div>
  );
}