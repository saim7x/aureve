'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Brahmanbaria');
  
  // ইউজার ও অথেন্টিকেশন স্টেট
  const [user, setUser] = useState(null);

  // গ্লোবাল রিস্ক লিমিট ও কাস্টমার রিস্ক স্টেট
  const [maxAllowedRiskRate, setMaxAllowedRiskRate] = useState(30);
  const [allSystemOrders, setAllSystemOrders] = useState([]);
  const [customerRiskInfo, setCustomerRiskInfo] = useState(null);

  // ডাইনামিক ডেলিভারি চার্জ ও ফ্রি ডেলিভারি সেটিংস স্টেট
  const [dbCharges, setDbCharges] = useState({
    brahmanbaria: 60,
    dhaka: 80,
    outside: 100,
    extraItem: 0,
    freeThreshold: 2000
  });

  // কাস্টম নাম ম্যানেজমেন্ট স্টেট
  const [customNamesMap, setCustomNamesMap] = useState({});
  const [applySameNameToAll, setApplySameNameToAll] = useState(false);
  const [masterGlobalName, setMasterGlobalName] = useState('');

  const [paymentType, setPaymentType] = useState('Cash on Delivery'); 
  const [onlineSubMethod, setOnlineSubMethod] = useState('bKash'); 
  const [trxId, setTrxId] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState(null);

  // Coupon States
  const [allowMultipleCoupons, setAllowMultipleCoupons] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupons, setAppliedCoupons] = useState([]);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('aureve_cart')) || [];
    setCartItems(cart);
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // সেশন চেক করা এবং লগইন না থাকলে লগইন পেজে রিডাইরেক্ট করা
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push('/login?next=/checkout');
      return;
    }

    setUser(session.user);

    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push('/login?next=/checkout');
      } else {
        setUser(session.user);
      }
    });

    // ১. অ্যাডমিন সেটিংস ও ডেলিভারি চার্জ ফেচ করা
    const { data: settingsData } = await supabase
      .from('admin_settings')
      .select('*');

    if (settingsData) {
      let bCharge = 60;
      let dCharge = 80;
      let oCharge = 100;
      let eCharge = 0;
      let fThreshold = 2000;
      let riskVal = 30;
      let multiCoupon = false;

      settingsData.forEach(item => {
        if (item.key === 'max_allowed_risk_rate') riskVal = parseInt(item.value) || 30;
        if (item.key === 'allow_multiple_coupons') multiCoupon = item.value === true || item.value === 'true';
        if (item.key === 'delivery_charge_brahmanbaria') bCharge = parseFloat(item.value) || 60;
        if (item.key === 'delivery_charge_dhaka') dCharge = parseFloat(item.value) || 80;
        if (item.key === 'delivery_charge_outside') oCharge = parseFloat(item.value) || 100;
        if (item.key === 'extra_item_charge') eCharge = parseFloat(item.value) || 0;
        if (item.key === 'free_delivery_threshold') fThreshold = parseFloat(item.value) || 2000;
      });

      setMaxAllowedRiskRate(riskVal);
      setAllowMultipleCoupons(multiCoupon);
      setDbCharges({
        brahmanbaria: bCharge,
        dhaka: dCharge,
        outside: oCharge,
        extraItem: eCharge,
        freeThreshold: fThreshold
      });
    }

    // ২. সিস্টেমের সকল অর্ডার ফেচ করা (রিস্ক ক্যালকুলেশনের জন্য)
    const { data: ordData } = await supabase
      .from('orders')
      .select('*');
    if (ordData) {
      setAllSystemOrders(ordData);
    }
  };

  // মোবাইল নাম্বার লেখার সাথে সাথে ব্যাকগ্রাউন্ডে রিস্ক চেক করার ফাংশন
  const handleMobileNumberChange = (val) => {
    setMobileNumber(val);
    const query = val.trim();
    if (!query || query.length < 5) {
      setCustomerRiskInfo(null);
      return;
    }

    const customerOrders = allSystemOrders.filter(o => {
      const phone = (o.phone || '').trim();
      const mobile = (o.mobile || '').trim();
      const whatsapp = (o.whatsapp || '').trim();
      return phone.includes(query) || mobile.includes(query) || whatsapp.includes(query);
    });

    const total = customerOrders.length;
    if (total === 0) {
      setCustomerRiskInfo({ isRisky: false });
      return;
    }

    const delivered = customerOrders.filter(o => (o.order_status || o.status) === 'Delivered').length;
    const returned = customerOrders.filter(o => (o.order_status || o.status) === 'Returned').length;
    const cancelled = customerOrders.filter(o => (o.order_status || o.status) === 'Cancelled').length;

    const validTotal = delivered + returned + cancelled;
    const riskRate = validTotal > 0 ? Math.round(((returned + cancelled) / validTotal) * 100) : 0;
    const isRisky = riskRate >= maxAllowedRiskRate;

    setCustomerRiskInfo({
      isRisky,
      riskRate,
      delivered,
      returned,
      cancelled,
      total: validTotal
    });

    if (isRisky) {
      setPaymentType('Online Full Payment');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const totalItemCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const extraItemsCount = Math.max(0, totalItemCount - 1);
  
  let baseDeliveryFee = dbCharges.brahmanbaria;
  if (district === 'Dhaka') baseDeliveryFee = dbCharges.dhaka;
  else if (district === 'Outside') baseDeliveryFee = dbCharges.outside;

  let calculatedDeliveryCharge = cartItems.length > 0 ? (baseDeliveryFee + (extraItemsCount * dbCharges.extraItem)) : 0;

  if (subtotal >= dbCharges.freeThreshold) {
    calculatedDeliveryCharge = 0;
  }
  const deliveryCharge = calculatedDeliveryCharge;
  
  let totalDiscountAmount = 0;
  appliedCoupons.forEach(coupon => {
    let disc = 0;
    if (coupon.discount_type === 'percent') {
      disc = (subtotal * coupon.discount_value) / 100;
    } else {
      disc = parseFloat(coupon.discount_value) || 0;
    }
    totalDiscountAmount += disc;
  });
  if (totalDiscountAmount > subtotal) totalDiscountAmount = subtotal;

  const grandTotal = subtotal + (cartItems.length > 0 ? deliveryCharge : 0) - totalDiscountAmount;
  
  // কাস্টম প্রোডাক্ট ফিল্টার করার নিখুঁত লজিক (Category বা Title-এ custom থাকলে সেটি কাস্টম প্রোডাক্ট হিসেবে ধরবে)
  const customProductsInCart = [];
  cartItems.forEach((item, index) => {
    const catStr = (item.category || '').toLowerCase();
    const titleStr = (item.title || item.product_name || '').toLowerCase();
    const isCustom = catStr === 'custom' || catStr.includes('custom') || titleStr.includes('custom') || titleStr.includes('name');

    if (isCustom) {
      const qty = item.quantity || 1;
      for (let q = 0; q < qty; q++) {
        customProductsInCart.push({
          ...item,
          uniqueKey: `${index}-${q}`,
          itemIndex: index,
          pieceIndex: q
        });
      }
    }
  });

  const hasCustomProduct = customProductsInCart.length > 0;

  const handleApplyCoupon = async () => {
    const inputCode = couponCodeInput.trim().toUpperCase();
    if (!inputCode) {
      setCouponError('একটি কুপন কোড লিখুন।');
      return;
    }

    if (appliedCoupons.some(c => (c.code || c.coupon_code) === inputCode)) {
      setCouponError('এই কুপনটি ইতিমধ্যে যুক্ত করা হয়েছে!');
      return;
    }

    if (!allowMultipleCoupons && appliedCoupons.length >= 1) {
      setCouponError('দুঃখিত, একটি অর্ডারে কেবল ১টি কুপন ব্যবহার করা যাবে!');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    const { data: couponData, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', inputCode)
      .eq('is_active', true)
      .single();

    if (error || !couponData) {
      setCouponError('দুঃখিত, এই কুপনটি সঠিক নয় বা মেয়াদ শেষ!');
    } else {
      setAppliedCoupons(prev => [...prev, couponData]);
      setCouponCodeInput('');
      showToast(`সফলভাবে কুপন "${couponData.code}" যোগ করা হয়েছে!`);
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = (codeToRemove) => {
    setAppliedCoupons(prev => prev.filter(c => (c.code || c.coupon_code) !== codeToRemove));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      showToast('Your cart is empty!');
      return;
    }
    if (!fullName.trim() || !mobileNumber.trim() || !whatsappNumber.trim() || !address.trim()) {
      showToast('অনুগ্রহ করে ডেলিভারির সকল তথ্য প্রদান করুন।');
      return;
    }

    if (customerRiskInfo?.isRisky && paymentType === 'Cash on Delivery') {
      showToast('আপনার পূর্বের ডেলিভারি রেকর্ড অনুযায়ী ক্যাশ অন ডেলিভারি প্রযোজ্য নয়। অনুগ্রহ করে অনলাইন পেমেন্ট সিলেক্ট করুন।');
      return;
    }

    if (hasCustomProduct) {
      if (applySameNameToAll) {
        if (!masterGlobalName.trim()) {
          showToast('সকল কাস্টম প্রোডাক্টের জন্য প্রযোজ্য নাম প্রদান করুন।');
          return;
        }
      } else {
        for (let cp of customProductsInCart) {
          if (!customNamesMap[cp.uniqueKey]?.trim()) {
            showToast(`"${cp.title || cp.product_name}" এর সকল পিসের জন্য কাস্টম নাম প্রদান করুন।`);
            return;
          }
        }
      }
    }

    if (paymentType === 'Online Full Payment' && !trxId.trim()) {
      showToast('ট্রানজেকশন আইডি (TrxID) প্রদান করুন।');
      return;
    }

    const rawId = Math.floor(100000 + Math.random() * 900000);
    const orderId = '#AUR-' + rawId;
    const orderCode = 'AUR-' + rawId;
    const methodDesc = paymentType === 'Cash on Delivery' ? 'Cash on Delivery' : `Online Full Payment (${onlineSubMethod})`;

    const updatedCartItems = cartItems.map((item, idx) => {
      const catStr = (item.category || '').toLowerCase();
      const titleStr = (item.title || item.product_name || '').toLowerCase();
      const isCustom = catStr === 'custom' || catStr.includes('custom') || titleStr.includes('custom') || titleStr.includes('name');

      if (!isCustom) return { ...item, customization: null };

      if (applySameNameToAll) {
        return { ...item, customization: masterGlobalName };
      } else {
        const namesForThisItem = [];
        for (let q = 0; q < (item.quantity || 1); q++) {
          const key = `${idx}-${q}`;
          if (customNamesMap[key]) namesForThisItem.push(customNamesMap[key]);
        }
        return { ...item, customization: namesForThisItem.join(', ') || 'N/A' };
      }
    });

    let primaryCustomName = 'N/A';
    if (hasCustomProduct) {
      if (applySameNameToAll) {
        primaryCustomName = masterGlobalName;
      } else {
        primaryCustomName = Object.values(customNamesMap).filter(Boolean).join(', ') || 'N/A';
      }
    }

    const appliedCodesStr = appliedCoupons.map(c => c.code || c.coupon_code).join(', ');

    const { data: orderData, error: orderError } = await supabase.from('orders').insert([
      {
        order_id: orderId,
        order_code: orderCode,
        customer_name: fullName,
        phone: mobileNumber,
        mobile: mobileNumber,
        whatsapp: whatsappNumber,
        address: address,
        delivery_address: address,
        district: district,
        subtotal: subtotal,
        delivery_charge: deliveryCharge,
        discount_amount: totalDiscountAmount,
        total_amount: grandTotal,
        grand_total: grandTotal,
        customer_email: user?.email || null,
        coupon_code: appliedCodesStr || null,
        applied_coupons: appliedCoupons,
        items: updatedCartItems,
        custom_engraving_name: primaryCustomName,
        payment_type: paymentType,
        payment_method: methodDesc,
        transaction_id: trxId || 'N/A',
        status: 'Pending',
        order_status: 'Pending'
      }
    ]).select();

    if (orderError) {
      showToast('অর্ডার প্রসেস করতে সমস্যা হয়েছে।');
      return;
    }

    const currentOrderId = orderData?.[0]?.id || orderId;

    if (updatedCartItems.length > 0) {
      const orderItemsPayload = updatedCartItems.map(item => ({
        order_id: currentOrderId,
        product_id: item.id,
        product_title: item.title || item.product_name,
        quantity: item.quantity,
        price: item.price,
        unit_price: item.price
      }));

      await supabase.from('order_items').insert(orderItemsPayload);

      for (let item of updatedCartItems) {
        const { data: prodData } = await supabase.from('products').select('*').eq('id', item.id).single();
        if (prodData) {
          const currentStock = Number(prodData.stock || 0);
          const currentSales = Number(prodData.sales || prodData.total_sales || 0);
          const newStock = Math.max(0, currentStock - item.quantity);
          
          await supabase.from('products').update({
            stock: newStock,
            sales: currentSales + item.quantity
          }).eq('id', item.id);
        }
      }
    }

    for (let c of appliedCoupons) {
      let cDiscount = c.discount_type === 'percent' ? (subtotal * c.discount_value) / 100 : parseFloat(c.discount_value);
      await supabase.from('coupons').update({
        usage_count: (c.usage_count || 0) + 1,
        total_discount_given: (parseFloat(c.total_discount_given) || 0) + cDiscount,
        total_sales_generated: (parseFloat(c.total_sales_generated) || 0) + grandTotal
      }).eq('id', c.id);
    }

    localStorage.removeItem('aureve_cart');
    setSuccessBanner(`অর্ডার সফলভাবে সম্পন্ন হয়েছে! (${orderId}) | মোট: ৳${grandTotal} | হোয়াটসঅ্যাপে যোগাযোগ করা হবে।`);
    setTimeout(() => { router.push('/orders'); }, 5000);
  };

  return (
    <div style={{ backgroundColor: '#FAF9F6', color: '#080808', minHeight: '100vh', paddingBottom: '90px', fontFamily: "'Montserrat', sans-serif" }}>
      {successBanner && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'rgba(8, 8, 8, 0.94)', color: '#FAF9F6', padding: '18px 20px', zIndex: 9999, borderBottom: '2px solid #D4AF7C', textAlign: 'center' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <span style={{ color: '#D4AF7C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>AUREVÉ Order Confirmed</span>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>{successBanner}</p>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#D4AF7C', color: '#080808', fontSize: '11px', padding: '8px 12px', textAlign: 'center', fontWeight: '600', letterSpacing: '1px' }}>
        Free Delivery on orders above ৳{dbCharges.freeThreshold.toLocaleString()} | Elegance in Every Detail
      </div>

      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#080808', color: '#D4AF7C', padding: '14px 24px', borderRadius: '4px', fontSize: '13px', fontWeight: '600', zIndex: 1000, border: '1px solid #D4AF7C' }}>
          {toastMessage}
        </div>
      )}

      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#080808', borderBottom: '1px solid #222222', padding: '0 20px', height: '75px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', textDecoration: 'none', color: '#D4AF7C' }}>AUREVÉ</Link>
        <Link href="/shop" style={{ color: '#FAF9F6', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', textDecoration: 'none', fontWeight: '600' }}>Continue Shopping</Link>
      </header>

      <main style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 15px' }}>
        <button onClick={() => router.back()} style={{ backgroundColor: '#FAF9F6', color: '#080808', border: '1px solid #D4AF7C', padding: '8px 18px', borderRadius: '30px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '25px' }}>
          &larr; Back to Cart
        </button>

        <div className="checkout-grid-container">
          <div style={{ backgroundColor: '#FAF9F6', border: '1px solid #EDE6D9', padding: '20px', borderRadius: '6px' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '20px', borderBottom: '1px solid #EDE6D9', paddingBottom: '10px' }}>Delivery Details</h2>
            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Full Name *</label>
                <input type="text" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EDE6D9', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }} required />
              </div>

              <div className="checkout-form-row">
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Mobile Number *</label>
                  <input 
                    type="text" 
                    placeholder="01XXXXXXXXX" 
                    value={mobileNumber} 
                    onChange={e => handleMobileNumberChange(e.target.value)} 
                    style={{ width: '100%', padding: '12px', border: '1px solid #EDE6D9', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }} 
                    required 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '5px' }}>WhatsApp Number *</label>
                  <input type="text" placeholder="For tracking" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EDE6D9', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }} required />
                </div>
              </div>

              {/* শুধুমাত্র কার্টে কাস্টম প্রোডাক্ট থাকলেই এই অপশনটি দেখাবে */}
              {hasCustomProduct && (
                <div style={{ backgroundColor: '#FFF8EC', border: '1px solid #D4AF7C', padding: '15px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px dashed #D4AF7C', paddingBottom: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="sameNameToggle" 
                      checked={applySameNameToAll} 
                      onChange={e => setApplySameNameToAll(e.target.checked)} 
                      style={{ width: '16px', height: '16px', accentColor: '#D4AF7C', cursor: 'pointer' }} 
                    />
                    <label htmlFor="sameNameToggle" style={{ fontSize: '11px', fontWeight: 'bold', color: '#080808', cursor: 'pointer', textTransform: 'uppercase' }}>
                      সকল কাস্টম প্রোডাক্টে একই নাম ব্যবহার করুন (Apply same name to all)
                    </label>
                  </div>

                  {applySameNameToAll ? (
                    <div>
                      <label style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#D4AF7C', display: 'block', marginBottom: '4px' }}>
                        সকল কাস্টম প্রোডাক্টের জন্য অভিন্ন নাম (Global Name) *
                      </label>
                      <input 
                        type="text" 
                        placeholder="সকল প্রোডাক্টে যে নাম প্রিন্ট হবে" 
                        value={masterGlobalName} 
                        onChange={e => setMasterGlobalName(e.target.value)} 
                        style={{ width: '100%', padding: '10px', border: '1px solid #D4AF7C', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: '#FFF' }} 
                        required 
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#D4AF7C' }}>
                        প্রতিটি কাস্টম প্রোডাক্টের জন্য আলাদা নাম দিন (Individual Names) *
                      </span>
                      {customProductsInCart.map((cp) => {
                        const itemImg = cp.image || cp.img || (cp.images && cp.images[0]) || '';
                        const itemName = cp.title || cp.product_name || 'Custom Product';
                        return (
                          <div key={cp.uniqueKey} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFF', padding: '8px', borderRadius: '4px', border: '1px solid #EDE6D9' }}>
                            {itemImg ? (
                              <img src={itemImg} alt={itemName} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                            ) : (
                              <div style={{ width: '40px', height: '40px', backgroundColor: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#666' }}>No Img</div>
                            )}
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#080808', display: 'block', marginBottom: '3px' }}>
                                {itemName} (পিস #{cp.pieceIndex + 1})
                              </span>
                              <input 
                                type="text" 
                                placeholder="এই পিসের জন্য নাম লিখুন" 
                                value={customNamesMap[cp.uniqueKey] || ''} 
                                onChange={e => setCustomNamesMap({ ...customNamesMap, [cp.uniqueKey]: e.target.value })} 
                                style={{ width: '100%', padding: '8px', border: '1px solid #D4AF7C', fontSize: '12px', borderRadius: '3px', boxSizing: 'border-box' }} 
                                required 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Delivery Address *</label>
                <textarea rows="3" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EDE6D9', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }} required></textarea>
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '5px' }}>District / Area *</label>
                <select value={district} onChange={e => setDistrict(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #EDE6D9', fontSize: '12px', borderRadius: '4px', boxSizing: 'border-box' }}>
                  <option value="Brahmanbaria">Brahmanbaria Sadar (৳{dbCharges.brahmanbaria})</option>
                  <option value="Dhaka">Dhaka City (৳{dbCharges.dhaka})</option>
                  <option value="Outside">Outside Dhaka (৳{dbCharges.outside})</option>
                </select>
              </div>

              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', margin: '15px 0 8px 0', borderBottom: '1px solid #EDE6D9', paddingBottom: '8px' }}>Payment Method</h3>
              
              {customerRiskInfo?.isRisky && (
                <div style={{ backgroundColor: '#E8F8F5', border: '1px solid #27ae60', padding: '12px 15px', borderRadius: '6px', color: '#117A65', fontSize: '12px', lineHeight: '1.5', fontWeight: '600' }}>
                  🌿 আপনার পূর্বের ডেলিভারি পারফরম্যান্স অনুযায়ী ক্যাশ অন ডেলিভারি প্রযোজ্য নয়। অনুগ্রহ করে অনলাইন ফুল পেমেন্ট সম্পন্ন করুন।
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <label style={{ cursor: customerRiskInfo?.isRisky ? 'not-allowed' : 'pointer', opacity: customerRiskInfo?.isRisky ? 0.5 : 1 }}>
                  <input 
                    type="radio" 
                    name="payType" 
                    checked={paymentType === 'Cash on Delivery'} 
                    onChange={() => !customerRiskInfo?.isRisky && setPaymentType('Cash on Delivery')} 
                    disabled={customerRiskInfo?.isRisky}
                  /> Cash on Delivery {customerRiskInfo?.isRisky && '(Not available)'}
                </label>
                <label style={{ cursor: 'pointer' }}>
                  <input type="radio" name="payType" checked={paymentType === 'Online Full Payment'} onChange={() => setPaymentType('Online Full Payment')} /> Online Full Payment (bKash / Nagad)
                </label>

                {paymentType === 'Online Full Payment' && (
                  <div style={{ backgroundColor: '#FFF8EC', border: '1px solid #D4AF7C', padding: '15px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '12px' }}>
                      <label style={{ fontWeight: 'bold', cursor: 'pointer' }}><input type="radio" name="onlineMethod" checked={onlineSubMethod === 'bKash'} onChange={() => setOnlineSubMethod('bKash')} /> বিকাশ (bKash)</label>
                      <label style={{ fontWeight: 'bold', cursor: 'pointer' }}><input type="radio" name="onlineMethod" checked={onlineSubMethod === 'Nagad'} onChange={() => setOnlineSubMethod('Nagad')} /> নগদ (Nagad)</label>
                    </div>

                    <div style={{ backgroundColor: '#FFF', border: '1px solid #EDE6D9', padding: '12px', borderRadius: '4px', fontSize: '12px', lineHeight: '1.6', color: '#333' }}>
                      <strong style={{ color: '#D4AF7C', display: 'block', marginBottom: '4px' }}>📌 পেমেন্ট করার নিয়মাবলী:</strong>
                      ১. আপনার {onlineSubMethod} অ্যাপ বা ডায়াল কোডে গিয়ে **Send Money** করুন।<br/>
                      ২. পার্সোনাল নম্বর: <strong style={{ color: '#080808' }}>+8801857251303</strong><br/>
                      ৩. মোট <strong style={{ color: '#D4AF7C' }}>৳ {grandTotal}</strong> টাকা সেন্ড মানি করুন।<br/>
                      ৪. পেমেন্ট শেষে প্রাপ্ত **TrxID** নিচের ঘরে দিন।
                    </div>

                    <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{onlineSubMethod} নম্বর: <strong>+8801857251303</strong></span>
                      <button type="button" onClick={() => copyToClipboard('+8801857251303', `${onlineSubMethod} Number`)} style={{ backgroundColor: '#D4AF7C', border: 'none', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '3px' }}>নম্বর কপি করুন</button>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>ট্রানজেকশন আইডি (TrxID) *</label>
                      <input type="text" placeholder="যেমন: 9N87A6B5" value={trxId} onChange={e => setTrxId(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #D4AF7C', fontSize: '12px', borderRadius: '3px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" style={{ marginTop: '20px', backgroundColor: '#080808', color: '#FAF9F6', border: 'none', padding: '15px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', width: '100%' }}>
                Place Order (৳ {grandTotal})
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: '#FAF9F6', border: '1px solid #EDE6D9', padding: '20px', borderRadius: '6px', height: 'fit-content' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', marginBottom: '15px', borderBottom: '1px solid #EDE6D9', paddingBottom: '10px' }}>Order Summary</h3>
            
            <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #EDE6D9' }}>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                Have Promo Coupons?
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Enter Coupon Code" 
                  value={couponCodeInput} 
                  onChange={e => setCouponCodeInput(e.target.value)} 
                  style={{ flex: 1, padding: '10px', border: '1px solid #EDE6D9', borderRadius: '4px', fontSize: '12px', outline: 'none', textTransform: 'uppercase', backgroundColor: '#FFF' }} 
                />
                <button 
                  type="button" 
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  style={{ backgroundColor: '#080808', color: '#D4AF7C', border: 'none', padding: '0 15px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  Apply
                </button>
              </div>
              {couponError && <span style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px', display: 'block' }}>{couponError}</span>}

              {appliedCoupons.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {appliedCoupons.map((c, idx) => {
                    const cCode = c.code || c.coupon_code || 'COUPON';
                    const cDiscText = c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `৳${c.discount_value} OFF`;
                    return (
                      <span key={idx} style={{ backgroundColor: '#D4AF7C', color: '#080808', padding: '4px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {cCode} ({cDiscText})
                        <button type="button" onClick={() => handleRemoveCoupon(cCode)} style={{ background: 'none', border: 'none', color: '#080808', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>✕</button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', marginBottom: '15px', paddingBottom: '12px', borderBottom: '1px solid #EDE6D9' }}>
              {cartItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>{item.title || item.product_name} (x{item.quantity})</span>
                  <span style={{ fontWeight: '600' }}>৳ {item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: '600' }}>৳ {subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px' }}>
              <span>Delivery Charge</span>
              <span style={{ fontWeight: '600' }}>৳ {cartItems.length > 0 ? deliveryCharge : 0} {subtotal >= dbCharges.freeThreshold && <span style={{ color: '#27ae60', fontSize: '10px' }}>(Free!)</span>}</span>
            </div>
            {totalDiscountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px', color: '#27ae60', fontWeight: 'bold' }}>
                <span>Coupon Discount:</span>
                <span>- ৳ {totalDiscountAmount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold', color: '#080808', borderTop: '1px solid #EDE6D9', paddingTop: '12px', marginTop: '5px' }}>
              <span>Total Amount</span>
              <span style={{ color: '#D4AF7C' }}>৳ {grandTotal}</span>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .checkout-grid-container {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 30px;
        }
        .checkout-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        @media (max-width: 768px) {
          .checkout-grid-container {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .checkout-form-row {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
