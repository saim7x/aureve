'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

function ReviewContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchOrderProducts() {
      if (!orderId) {
        setErrorMsg('কোনো অর্ডার আইডি পাওয়া যায়নি।');
        setLoading(false);
        return;
      }

      // ধাপ ১: order_items টেবিল থেকে ওই অর্ডারের সব product_id বের করা
      const { data: itemData, error: itemError } = await supabase
        .from('order_items')
        .select('product_id')
        .eq('order_id', orderId);

      if (itemError || !itemData || itemData.length === 0) {
        setErrorMsg('এই অর্ডারের জন্য কোনো পণ্য পাওয়া যায়নি অথবা অর্ডার আইডিটি সঠিক নয়।');
        setLoading(false);
        return;
      }

      // ধাপ ২: প্রাপ্ত product_id গুলোর বিপরীতে products টেবিল থেকে পণ্যের বিস্তারিত তথ্য আনা
      const productIds = itemData.map(item => item.product_id);
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('id, title, price, images')
        .in('id', productIds);

      if (prodError || !prodData || prodData.length === 0) {
        setErrorMsg('এই অর্ডারের পণ্যগুলোর বিস্তারিত তথ্য পাওয়া যায়নি।');
      } else {
        const formattedItems = prodData.map(prod => ({
          product_id: prod.id,
          products: prod
        }));
        setOrderItems(formattedItems);
      }
      setLoading(false);
    }
    fetchOrderProducts();
  }, [orderId]);

  const handleRatingChange = (productId, star) => {
    setRatings(prev => ({ ...prev, [productId]: star }));
  };

  const handleCommentChange = (productId, text) => {
    setComments(prev => ({ ...prev, [productId]: text }));
  };

  const handleSubmitAllReviews = async (e) => {
    e.preventDefault();
    try {
      // লুপ চালিয়ে অর্ডারে থাকা প্রতিটি পণ্যের রেটিং আলাদাভাবে reviews টেবিলে সেভ করা
      for (let item of orderItems) {
        const prodId = item.product_id;
        const ratingVal = ratings[prodId] || 5; // ডিফল্ট ৫ স্টার
        const commentVal = comments[prodId] || '';

        await supabase.from('reviews').insert([
          {
            order_id: orderId,
            product_id: prodId,
            rating: ratingVal,
            comment: commentVal
          }
        ]);
      }
      setSubmitted(true);
    } catch (err) {
      alert('রেটিংস সাবমিট করার সময় সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', fontFamily: "'Montserrat', sans-serif" }}>Loading products to rate...</div>;
  }

  return (
    <div style={{ backgroundColor: '#FAF9F6', color: '#080808', minHeight: '100vh', paddingBottom: '90px', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ backgroundColor: '#D4AF7C', color: '#080808', fontSize: '11px', padding: '8px 12px', textAlign: 'center', fontWeight: '600', letterSpacing: '1px' }}>
        AUREVÉ Customer Feedback Portal | Elegance in Every Detail
      </div>
      <header style={{ backgroundColor: '#080808', padding: '0 20px', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 'bold', color: '#D4AF7C', textDecoration: 'none', letterSpacing: '2px' }}>
          AUREVÉ
        </Link>
      </header>
      <main style={{ maxWidth: '650px', margin: '40px auto', padding: '0 20px' }}>
        <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE6D9', padding: '35px', borderRadius: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', textAlign: 'center', marginBottom: '8px' }}>Rate Your Purchased Items</h1>
          <p style={{ color: '#8A8A8A', fontSize: '12px', textAlign: 'center', marginBottom: '25px' }}>আপনার এই অর্ডারে থাকা পণ্যগুলোর অভিজ্ঞতা নিচে শেয়ার করুন।</p>
          
          {errorMsg ? (
            <div style={{ color: '#e74c3c', fontSize: '13px', textAlign: 'center', padding: '20px 0', lineHeight: 1.6 }}>
              {errorMsg}
            </div>
          ) : submitted ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ width: '50px', height: '50px', backgroundColor: '#27ae60', color: '#FFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', fontSize: '24px' }}>✓</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '10px' }}>ধন্যবাদ!</h3>
              <p style={{ fontSize: '13px', color: '#555', marginBottom: '20px' }}>আপনার সমস্ত পণ্যের রেটিং সফলভাবে জমা হয়েছে।</p>
              <Link href="/" style={{ backgroundColor: '#080808', color: '#FAF9F6', padding: '12px 25px', textDecoration: 'none', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', borderRadius: '3px' }}>
                হোম পেজে ফিরে যান
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmitAllReviews} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {orderItems.map((item) => {
                const product = item.products;
                const currentRating = ratings[product.id] || 5;
                const imgUrl = product.images?.[0] || '/images/collection-1.jpg';

                return (
                  <div key={product.id} style={{ borderBottom: '1px solid #EDE6D9', paddingBottom: '20px' }}>
                    {/* প্রোডাক্ট কার্ড */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#FAF9F6', padding: '12px', borderRadius: '4px', border: '1px solid #EDE6D9', marginBottom: '15px' }}>
                      <img src={imgUrl} alt={product.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '3px' }} />
                      <div>
                        <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', margin: '0 0 4px 0' }}>{product.title}</h4>
                        <p style={{ color: '#D4AF7C', fontWeight: 'bold', fontSize: '13px', margin: 0 }}>৳ {product.price}</p>
                      </div>
                    </div>

                    {/* স্টার রেটিং সিলেকশন */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px', letterSpacing: '1px' }}>Rating</label>
                      <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => handleRatingChange(product.id, star)}
                            style={{
                              fontSize: '24px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: star <= currentRating ? '#D4AF7C' : '#CCCCCC',
                              padding: 0
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* মতামত বা কমেন্ট বক্স */}
                    <div>
                      <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '6px', letterSpacing: '1px' }}>Feedback</label>
                      <textarea 
                        rows="3" 
                        placeholder="এই পণ্যটি সম্পর্কে আপনার মতামত লিখুন..." 
                        value={comments[product.id] || ''} 
                        onChange={e => handleCommentChange(product.id, e.target.value)} 
                        style={{ width: '100%', padding: '10px', border: '1px solid #EDE6D9', fontSize: '12px', borderRadius: '4px', backgroundColor: '#FAF9F6', resize: 'vertical' }}
                      ></textarea>
                    </div>
                  </div>
                );
              })}

              <button type="submit" style={{ backgroundColor: '#080808', color: '#FAF9F6', border: 'none', padding: '15px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '3px', width: '100%' }}>
                Submit All Reviews
              </button>
            </form>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}>Loading...</div>}>
      <ReviewContent />
    </Suspense>
  );
}