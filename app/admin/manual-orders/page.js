'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AdminHeader from '../../components/AdminHeader';

export default function ManualOrdersPanel() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [orders, setOrders] = useState([]);
  const [allSystemOrders, setAllSystemOrders] = useState([]); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); 
  const [filterSource, setFilterSource] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // গ্লোবাল রিস্ক পার্সেন্টেজ লিমিট ও ডাইনামিক ডেলিভারি চার্জ স্টেট
  const [maxAllowedRiskRate, setMaxAllowedRiskRate] = useState(30);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(2000);
  
  const [brahmanbariaCharge, setBrahmanbariaCharge] = useState(60);
  const [dhakaCharge, setDhakaCharge] = useState(80);
  const [outsideCharge, setOutsideCharge] = useState(100);
  const [extraItemCharge, setExtraItemCharge] = useState(0);

  const [savingRiskLimit, setSavingRiskLimit] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Manual Order Modal States
  const [showManualModal, setShowManualModal] = useState(false);
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mWhatsApp, setMWhatsApp] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mDistrict, setMDistrict] = useState('Brahmanbaria');
  const [mOrderSource, setMOrderSource] = useState('Facebook');
  const [mPaymentType, setMPaymentType] = useState('Cash on Delivery');
  const [mTransactionId, setMTransactionId] = useState('');
  const [mSelectedItems, setMSelectedItems] = useState([]); 
  const [mManualDiscount, setMManualDiscount] = useState('');

  // ড্রপডাউন থেকে সিলেক্ট করার জন্য সাময়িক স্টেট
  const [selectedProductId, setSelectedProductId] = useState('');

  // ম্যানুয়াল অর্ডার ফর্মে লাইভ মোবাইল নাম্বার টাইপ করার সময় রিস্ক চেক স্টেট
  const [manualPhoneRiskInfo, setManualPhoneRiskInfo] = useState(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('aureve_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'Iqra@345') {
      setIsAuthenticated(true);
      sessionStorage.setItem('aureve_admin_auth', 'true');
      setPasswordError('');
      fetchData();
    } else {
      setPasswordError('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    // ১. অর্ডারসমূহ ফেচ করা
    const { data: allOrdData, error: allOrdErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!allOrdErr) {
      setAllSystemOrders(allOrdData || []);
      const manualList = (allOrdData || []).filter(o => o.transaction_id === 'Manual Order' || o.order_source || o.coupon_code === 'MANUAL_DISCOUNT');
      setOrders(manualList);
    }

    // ২. প্রোডাক্টস ফেচ করা
    const { data: prodData, error: prodErr } = await supabase
      .from('products')
      .select('*');

    if (!prodErr) setProducts(prodData || []);

    // ৩. ডাটাবেজ admin_settings থেকে গ্লোবাল রিস্ক লিমিট ও এলাকাভিত্তিক ডেলিভারি চার্জ ফেচ করা
    const { data: settingData, error: settingErr } = await supabase
      .from('admin_settings')
      .select('*');

    if (!settingErr && settingData) {
      settingData.forEach(item => {
        if (item.key === 'max_allowed_risk_rate') setMaxAllowedRiskRate(parseInt(item.value) || 30);
        if (item.key === 'free_delivery_threshold') setFreeDeliveryThreshold(parseFloat(item.value) || 2000);
        if (item.key === 'delivery_charge_brahmanbaria') setBrahmanbariaCharge(parseFloat(item.value) || 60);
        if (item.key === 'delivery_charge_dhaka') setDhakaCharge(parseFloat(item.value) || 80);
        if (item.key === 'delivery_charge_outside') setOutsideCharge(parseFloat(item.value) || 100);
        if (item.key === 'extra_item_charge') setExtraItemCharge(parseFloat(item.value) || 0);
      });
    }

    setLoading(false);
  };

  // রিস্ক লিমিট সেভ করার ফাংশন
  const handleSaveRiskLimit = async () => {
    setSavingRiskLimit(true);
    setSaveSuccessMsg(false);

    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key: 'max_allowed_risk_rate', value: maxAllowedRiskRate.toString(), updated_at: new Date().toISOString() }, { onConflict: 'key' });

    setSavingRiskLimit(false);

    if (error) {
      alert('রিস্ক লিমিট সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } else {
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }
  };

  // ম্যানুয়াল অর্ডার ফর্মে মোবাইল নাম্বার লেখার সাথে সাথে লাইভ চেক করার লজিক
  const handleManualPhoneChange = (val) => {
    setMPhone(val);
    const query = val.trim();
    if (!query || query.length < 5) {
      setManualPhoneRiskInfo(null);
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
      setManualPhoneRiskInfo({ isRisky: false, text: 'নতুন কাস্টমার (কোনো পূর্বের হিস্ট্রি নেই)' });
      return;
    }

    const delivered = customerOrders.filter(o => (o.order_status || o.status) === 'Delivered').length;
    const returned = customerOrders.filter(o => (o.order_status || o.status) === 'Returned').length;
    const cancelled = customerOrders.filter(o => (o.order_status || o.status) === 'Cancelled').length;

    const validTotal = delivered + returned + cancelled;
    const riskRate = validTotal > 0 ? Math.round(((returned + cancelled) / validTotal) * 100) : 0;
    const isRisky = riskRate >= maxAllowedRiskRate;

    setManualPhoneRiskInfo({
      isRisky,
      riskRate,
      delivered,
      returned,
      cancelled,
      total: validTotal
    });
  };

  const getUniqueCustomersSummary = () => {
    const customerMap = {};

    allSystemOrders.forEach(o => {
      const phone = (o.phone || '').trim();
      const mobile = (o.mobile || '').trim();
      const whatsapp = (o.whatsapp || '').trim();
      
      const primaryKey = phone || mobile || whatsapp || 'N/A';
      if (primaryKey === 'N/A') return;

      if (!customerMap[primaryKey]) {
        customerMap[primaryKey] = {
          identifier: primaryKey,
          customer_name: o.customer_name || 'Unknown',
          phonesList: new Set([phone, mobile, whatsapp].filter(Boolean)),
          address: o.address || o.delivery_address || 'N/A',
          district: o.district || 'N/A',
          delivered: 0,
          returned: 0,
          cancelled: 0,
          ordersList: []
        };
      } else {
        if (phone) customerMap[primaryKey].phonesList.add(phone);
        if (mobile) customerMap[primaryKey].phonesList.add(mobile);
        if (whatsapp) customerMap[primaryKey].phonesList.add(whatsapp);
      }

      customerMap[primaryKey].ordersList.push(o);

      const status = (o.order_status || o.status || 'Pending');
      if (status === 'Delivered') {
        customerMap[primaryKey].delivered += 1;
      } else if (status === 'Returned') {
        customerMap[primaryKey].returned += 1;
      } else if (status === 'Cancelled') {
        customerMap[primaryKey].cancelled += 1;
      }
    });

    return Object.values(customerMap).map(c => {
      const validTotalOrders = c.delivered + c.returned + c.cancelled;
      const successRate = validTotalOrders > 0 ? Math.round((c.delivered / validTotalOrders) * 100) : 0;
      const riskRate = validTotalOrders > 0 ? Math.round(((c.returned + c.cancelled) / validTotalOrders) * 100) : 0;
      const isRisky = riskRate >= maxAllowedRiskRate;

      return {
        ...c,
        phonesStr: Array.from(c.phonesList).join(', '),
        validTotalOrders,
        successRate,
        riskRate,
        isRisky
      };
    });
  };

  const uniqueCustomers = getUniqueCustomersSummary();

  const handleAddProductToManualOrder = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id.toString() === selectedProductId.toString());
    if (!product) return;

    const existing = mSelectedItems.find(item => item.product.id === product.id);
    if (existing) {
      setMSelectedItems(mSelectedItems.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setMSelectedItems([...mSelectedItems, { product, quantity: 1 }]);
    }
    setSelectedProductId('');
  };

  const handleUpdateItemQty = (prodId, qty) => {
    const q = parseInt(qty) || 1;
    if (q <= 0) {
      setMSelectedItems(mSelectedItems.filter(item => item.product.id !== prodId));
    } else {
      setMSelectedItems(mSelectedItems.map(item => 
        item.product.id === prodId ? { ...item, quantity: q } : item
      ));
    }
  };

  const handleRemoveItem = (prodId) => {
    setMSelectedItems(mSelectedItems.filter(item => item.product.id !== prodId));
  };

  // লাইভ সাবটোটাল হিসাব
  const subtotal = mSelectedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // মোট প্রোডাক্টের পরিমাণ (Quantity) হিসাব করা
  const totalItemCount = mSelectedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // ডাইনামিক বেস ডেলিভারি চার্জ নির্ধারণ (ডাটাবেজ সেটিংস থেকে ফেচ করা মান অনুযায়ী)
  const baseDeliveryCharge = mDistrict === 'Brahmanbaria' ? brahmanbariaCharge : mDistrict === 'Dhaka' ? dhakaCharge : outsideCharge;

  // অতিরিক্ত পণ্যের জন্য এক্সট্রা চার্জ (প্রথম ১টি প্রোডাক্ট বাদ দিয়ে বাকিগুলোর জন্য)
  const extraProductCharge = totalItemCount > 1 ? (totalItemCount - 1) * extraItemCharge : 0;

  // সাবটোটাল ফ্রি ডেলিভারি থ্রেশহোল্ডের বেশি বা সমান হলে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি (০)
  const deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : (baseDeliveryCharge + extraProductCharge);

  const discountVal = parseFloat(mManualDiscount) || 0;
  const grandTotal = Math.max(0, subtotal + deliveryCharge - discountVal);

  const handleSaveManualOrder = async (e) => {
    e.preventDefault();
    if (!mName.trim() || !mPhone.trim() || !mAddress.trim()) {
      alert('দয়া করে কাস্টমারের নাম, মোবাইল নম্বর এবং ঠিকানা প্রদান করুন!');
      return;
    }
    if (mSelectedItems.length === 0) {
      alert('কমপক্ষে একটি প্রোডাক্ট সিলেক্ট করতে হবে!');
      return;
    }

    const rawId = Math.floor(100000 + Math.random() * 900000);
    const orderId = '#AUR-' + rawId;
    const orderCode = 'AUR-' + rawId;

    const formattedItems = mSelectedItems.map(item => ({
      id: item.product.id,
      title: item.product.title || item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image || item.product.img || (item.product.images && item.product.images[0]) || '',
      customization: null
    }));

    const finalTrxId = mPaymentType.includes('Online') ? (mTransactionId.trim() || 'Online Paid') : 'Manual Order';

    const { error: orderError } = await supabase.from('orders').insert([
      {
        order_id: orderId,
        order_code: orderCode,
        customer_name: mName,
        phone: mPhone,
        mobile: mPhone,
        whatsapp: mWhatsApp || mPhone,
        address: mAddress,
        delivery_address: mAddress,
        district: mDistrict,
        order_source: mOrderSource,
        subtotal: subtotal,
        delivery_charge: deliveryCharge,
        discount_amount: discountVal,
        total_amount: grandTotal,
        grand_total: grandTotal,
        coupon_code: discountVal > 0 ? 'MANUAL_DISCOUNT' : null,
        items: formattedItems,
        custom_engraving_name: 'N/A',
        payment_type: mPaymentType,
        payment_method: mPaymentType,
        transaction_id: finalTrxId,
        status: 'Pending',
        order_status: 'Pending'
      }
    ]);

    if (orderError) {
      alert('ম্যানুয়াল অর্ডার সেভ করতে সমস্যা হয়েছে: ' + orderError.message);
      return;
    }

    for (let item of mSelectedItems) {
      const currentStock = item.product.stock !== undefined ? item.product.stock : 10;
      const currentSales = item.product.sales !== undefined ? item.product.sales : 0;
      await supabase.from('products').update({
        stock: Math.max(0, currentStock - item.quantity),
        sales: currentSales + item.quantity
      }).eq('id', item.product.id);
    }

    alert(`সফলভাবে ম্যানুয়াল অর্ডার তৈরি করা হয়েছে! (${orderId})`);
    setShowManualModal(false);
    setMName(''); setMPhone(''); setMWhatsApp(''); setMAddress('');
    setMSelectedItems([]); setMManualDiscount(''); setMTransactionId('');
    setManualPhoneRiskInfo(null);
    fetchData();
  };

  const handlePrintSticker = (order) => {
    const printWindow = window.open('', '_blank');
    let itemsHtml = '';
    let ordSubtotal = order.subtotal || 0;

    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      order.items.forEach((item) => {
        const itemName = item.name || item.product_name || item.title || item.product_title || 'Item';
        const itemImage = item.image || item.img || item.product_image || '';
        const itemQty = item.quantity || item.qty || 1;
        const itemPrice = item.price || 0;

        itemsHtml += `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px dashed #ccc; padding-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              ${itemImage ? `<img src="${itemImage}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 3px; border: 1px solid #999;" />` : ''}
              <div>
                <strong style="font-size: 11px; display: block;">${itemName}</strong>
                <div style="font-size: 9px; color: #555;">Qty: ${itemQty} pcs</div>
              </div>
            </div>
            <div style="font-size: 11px; font-weight: bold;">৳${itemPrice * itemQty}</div>
          </div>
        `;
      });
    }

    const discountAmount = order.discount_amount || 0;
    const deliveryChargeVal = order.delivery_charge !== undefined ? order.delivery_charge : brahmanbariaCharge;
    const grandTotalVal = order.total_amount || order.grand_total || (ordSubtotal + deliveryChargeVal - discountAmount);
    const paymentDesc = order.payment_method || order.payment_type || 'Cash on Delivery';
    const sourceLabel = order.order_source || 'Local';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Parcel Sticker - ${order.order_id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 20px; color: #000; background: #fff; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          .sticker-box { width: 380px; border: 2px solid #000; padding: 15px; border-radius: 8px; box-sizing: border-box; background: #fff; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px; }
          .brand { font-family: serif; font-size: 18px; font-weight: bold; letter-spacing: 2px; }
          .tagline { font-size: 8px; text-transform: uppercase; color: #555; }
          .section { margin-bottom: 8px; font-size: 11px; }
          .label { font-size: 9px; text-transform: uppercase; color: #666; font-weight: bold; display: block; margin-bottom: 2px; }
          .value { font-size: 13px; font-weight: bold; }
          .address-box { background: #f8f8f8; padding: 8px; border-radius: 4px; border: 1px solid #ddd; }
          .pricing-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; color: #333; }
        </style>
      </head>
      <body>
        <div class="sticker-box">
          <div class="header">
            <div class="brand">AUREVÉ</div>
            <div class="tagline">Source: ${sourceLabel}</div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div><span class="label">Order ID</span><span class="value" style="color: #b8860b;">${order.order_id}</span></div>
            <div style="text-align: right;"><span class="label">Date</span><span style="font-size: 10px;">${new Date(order.created_at).toLocaleDateString()}</span></div>
          </div>
          <div class="section address-box">
            <span class="label">Deliver To (Customer)</span>
            <div class="value" style="font-size: 14px;">${order.customer_name}</div>
            <div style="font-size: 12px; font-weight: bold; margin-top: 2px;">📱 ${order.whatsapp || order.mobile || order.phone}</div>
            <div style="font-size: 11px; margin-top: 2px;">📍 ${order.address}, ${order.district}</div>
          </div>
          <div class="section"><span class="label">Ordered Items</span><div>${itemsHtml}</div></div>
          
          <div style="border-top: 1px solid #ccc; padding-top: 6px; margin-top: 6px;">
            <div class="pricing-row"><span>Subtotal:</span><span>৳${ordSubtotal}</span></div>
            <div class="pricing-row"><span>Delivery Charge:</span><span>৳${deliveryChargeVal}</span></div>
            ${discountAmount > 0 ? `<div class="pricing-row" style="color: #27ae60;"><span>Discount:</span><span>- ৳${discountAmount}</span></div>` : ''}
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 4px; margin-top: 3px; font-weight: bold; font-size: 12px;">
              <span>Total Amount:</span><span>৳${grandTotalVal}</span>
            </div>
            <div style="margin-top: 5px; font-size: 10px; font-weight: bold; text-align: center;">Payment: ${paymentDesc}</div>
          </div>
        </div>
        <script>window.onload = function() { setTimeout(() => window.print(), 300); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

  const filteredOrders = orders.filter(o => {
    const src = o.order_source || 'Local';
    if (filterSource === 'All') return true;
    return src.toLowerCase() === filterSource.toLowerCase();
  }).filter(o => {
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm || (o.order_id && o.order_id.toLowerCase().includes(searchLower)) || (o.customer_name && o.customer_name.toLowerCase().includes(searchLower)) || (o.phone && o.phone.includes(searchTerm));
  });

  return (
    <div style={{ backgroundColor: '#080808', color: '#FAF9F6', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <AdminHeader />

      <main style={{ padding: '30px', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: 0, fontSize: '24px' }}>Manual Orders & Risk Management</h2>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setActiveTab('orders')}
              style={{ backgroundColor: activeTab === 'orders' ? '#D4AF7C' : '#222', color: activeTab === 'orders' ? '#080808' : '#FAF9F6', border: 'none', padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
            >
              📦 Manual Orders List
            </button>
            <button 
              onClick={() => setActiveTab('risk-management')}
              style={{ backgroundColor: activeTab === 'risk-management' ? '#D4AF7C' : '#222', color: activeTab === 'risk-management' ? '#080808' : '#FAF9F6', border: 'none', padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
            >
              🛡️ Risk & Customer Profiles
            </button>
          </div>
        </div>

        {/* ------------------- সেকশন ১: ম্যানুয়াল অর্ডার লিস্ট ------------------- */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '13px', color: '#8A8A8A' }}>আপনার সকল সোশ্যাল ও ম্যানুয়াল অর্ডারের তালিকা:</span>
              <button 
                onClick={() => setShowManualModal(true)}
                style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '10px 20px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                + Create Manual Order
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#111', padding: '15px', borderRadius: '6px', border: '1px solid #222', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#8A8A8A' }}>Source Filter:</span>
                {['All', 'Facebook', 'Instagram', 'WhatsApp', 'Local'].map(source => (
                  <button 
                    key={source} 
                    onClick={() => setFilterSource(source)} 
                    style={{ backgroundColor: filterSource === source ? '#D4AF7C' : '#222', color: filterSource === source ? '#080808' : '#FAF9F6', border: 'none', padding: '6px 12px', fontSize: '11px', borderRadius: '3px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {source}
                  </button>
                ))}
              </div>

              <input 
                type="text" 
                placeholder="Search Order ID, Name, Mobile..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                style={{ backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', width: '240px', outline: 'none' }} 
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#8A8A8A' }}>Loading manual orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#111', borderRadius: '6px', color: '#8A8A8A' }}>কোনো ম্যানুয়াল বা সোশ্যাল অর্ডার পাওয়া যায়নি।</div>
            ) : (
              <div style={{ overflowX: 'auto', backgroundColor: '#111', borderRadius: '6px', border: '1px solid #222' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1a1a1a', color: '#D4AF7C', borderBottom: '1px solid #222', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>
                      <th style={{ padding: '14px' }}>Order ID & Source</th>
                      <th style={{ padding: '14px' }}>Customer Info</th>
                      <th style={{ padding: '14px' }}>Ordered Items</th>
                      <th style={{ padding: '14px' }}>Pricing Breakdown</th>
                      <th style={{ padding: '14px' }}>Status</th>
                      <th style={{ padding: '14px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      const ordSubtotal = order.subtotal || (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);
                      const discountAmount = order.discount_amount || 0;
                      const deliveryChargeVal = order.delivery_charge !== undefined ? order.delivery_charge : brahmanbariaCharge;
                      const grandTotalVal = order.total_amount || order.grand_total || (ordSubtotal + deliveryChargeVal - discountAmount);
                      const orderSource = order.order_source || 'Local';
                      const currentStatus = order.order_status || 'Pending';

                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid #222' }}>
                          <td style={{ padding: '14px', fontWeight: 'bold', color: '#D4AF7C', whiteSpace: 'nowrap' }}>
                            {order.order_id}
                            <span style={{ display: 'inline-block', fontSize: '9px', backgroundColor: '#222', color: '#D4AF7C', padding: '2px 6px', borderRadius: '3px', marginLeft: '6px' }}>{orderSource}</span>
                            <span style={{ display: 'block', fontSize: '10px', color: '#666', marginTop: '4px' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <strong style={{ color: '#FAF9F6', display: 'block' }}>{order.customer_name}</strong>
                            <span style={{ fontSize: '11px', color: '#8A8A8A', display: 'block' }}>📱 {order.whatsapp || order.mobile || order.phone}</span>
                            <span style={{ fontSize: '10px', color: '#666', display: 'block', marginTop: '2px' }}>📍 {order.address}, {order.district}</span>
                          </td>
                          
                          <td style={{ padding: '14px', maxWidth: '280px' }}>
                            {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                              order.items.map((item, idx) => {
                                const itemName = item.name || item.product_name || item.title || item.product_title || 'Item';
                                const itemImage = item.image || item.img || item.product_image || null;
                                return (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px dashed #222', paddingBottom: '6px' }}>
                                    {itemImage ? (
                                      <img src={itemImage} alt={itemName} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #333' }} />
                                    ) : (
                                      <div style={{ width: '36px', height: '36px', backgroundColor: '#222', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#8A8A8A' }}>No Img</div>
                                    )}
                                    <div>
                                      <strong style={{ color: '#FAF9F6', fontSize: '11px', display: 'block' }}>{itemName} (x{item.quantity || 1})</strong>
                                      <span style={{ fontSize: '10px', color: '#8A8A8A' }}>৳{item.price} each</span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <span style={{ color: '#8A8A8A' }}>{order.product_name || 'N/A'}</span>
                            )}
                          </td>

                          <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '11px', color: '#AAA' }}>Subtotal: ৳{ordSubtotal}</div>
                            <div style={{ fontSize: '11px', color: '#AAA' }}>Delivery: ৳{deliveryChargeVal}</div>
                            {discountAmount > 0 && <div style={{ fontSize: '11px', color: '#2ecc71', fontWeight: 'bold' }}>Discount: -৳{discountAmount}</div>}
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#D4AF7C', marginTop: '6px', borderTop: '1px solid #333', paddingTop: '4px' }}>Total: ৳{grandTotalVal}</div>
                            <div style={{ fontSize: '10px', color: '#8A8A8A', marginTop: '2px' }}>{order.payment_method || order.payment_type}</div>
                          </td>

                          <td style={{ padding: '14px' }}>
                            <span style={{ padding: '5px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-block', backgroundColor: 'rgba(212, 175, 124, 0.15)', color: '#D4AF7C', border: '1px solid rgba(212, 175, 124, 0.3)' }}>
                              {currentStatus}
                            </span>
                          </td>

                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button onClick={() => handlePrintSticker(order)} style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '6px 12px', fontSize: '10px', fontWeight: 'bold', borderRadius: '3px', cursor: 'pointer' }}>🖨️ Sticker</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ------------------- সেকশন ২: রিস্ক অর্ডার ম্যানেজমেন্ট ও ইউনিক কাস্টমার প্রোফাইল ------------------- */}
        {activeTab === 'risk-management' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ backgroundColor: '#111', border: '1px solid #333', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: '0 0 4px 0', fontSize: '16px' }}>🛡️ Global COD Risk Threshold Setup</h3>
                <p style={{ fontSize: '11px', color: '#8A8A8A', margin: 0 }}>এখানে রিস্ক পার্সেন্টেজ সেট করে সেভ বাটনে ক্লিক করুন। কাস্টমারের রিটার্ন/ক্যানসেল রেট এর সমান বা বেশি হলে ক্যাশ অন ডেলিভারি ব্লক হবে।</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#FAF9F6' }}>Max Risk Rate (%):</span>
                <input 
                  type="number" 
                  value={maxAllowedRiskRate} 
                  onChange={e => setMaxAllowedRiskRate(parseInt(e.target.value) || 0)} 
                  style={{ width: '70px', padding: '8px', backgroundColor: '#080808', border: '1px solid #D4AF7C', color: '#D4AF7C', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }} 
                />
                <button 
                  onClick={handleSaveRiskLimit}
                  disabled={savingRiskLimit}
                  style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {savingRiskLimit ? 'Saving...' : 'Save Limit'}
                </button>
                {saveSuccessMsg && <span style={{ color: '#2ecc71', fontSize: '11px', fontWeight: 'bold' }}>Saved!</span>}
              </div>
            </div>

            <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: '10px 0 0 0', fontSize: '18px' }}>👥 Unique Customers History & Fraud Risk Analysis</h3>
            
            {uniqueCustomers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#111', borderRadius: '6px', color: '#8A8A8A' }}>কোনো কাস্টমার ডেটা পাওয়া যায়নি।</div>
            ) : (
              <div style={{ overflowX: 'auto', backgroundColor: '#111', borderRadius: '6px', border: '1px solid #222' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1a1a1a', color: '#D4AF7C', borderBottom: '1px solid #222', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>
                      <th style={{ padding: '14px' }}>Customer & Phones</th>
                      <th style={{ padding: '14px' }}>Address</th>
                      <th style={{ padding: '14px' }}>Total Orders</th>
                      <th style={{ padding: '14px' }}>Delivered / Returned / Cancelled</th>
                      <th style={{ padding: '14px' }}>Success & Risk Rate</th>
                      <th style={{ padding: '14px' }}>Risk Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueCustomers.map((cust, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #222', backgroundColor: cust.isRisky ? 'rgba(231, 76, 60, 0.08)' : 'transparent' }}>
                        <td style={{ padding: '14px' }}>
                          <strong style={{ color: '#FAF9F6', display: 'block' }}>{cust.customer_name}</strong>
                          <span style={{ fontSize: '11px', color: '#D4AF7C' }}>📱 {cust.phonesStr}</span>
                        </td>
                        <td style={{ padding: '14px', color: '#8A8A8A' }}>
                          {cust.address}, {cust.district}
                        </td>
                        <td style={{ padding: '14px', fontWeight: 'bold', color: '#FAF9F6' }}>
                          {cust.ordersList.length} orders
                        </td>
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{cust.delivered}</span> / 
                          <span style={{ color: '#e74c3c', fontWeight: 'bold', margin: '0 4px' }}>{cust.returned}</span> / 
                          <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{cust.cancelled}</span>
                        </td>
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '11px', color: '#2ecc71' }}>Success: {cust.successRate}%</div>
                          <div style={{ fontSize: '11px', color: cust.isRisky ? '#e74c3c' : '#8A8A8A', fontWeight: cust.isRisky ? 'bold' : 'normal' }}>Risk: {cust.riskRate}%</div>
                        </td>
                        <td style={{ padding: '14px' }}>
                          {cust.isRisky ? (
                            <span style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                              ⚠️ High Risk (COD Blocked)
                            </span>
                          ) : (
                            <span style={{ backgroundColor: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                              ✓ Safe Customer
                            </span>
                          )}
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

      {/* ------------------- ম্যানুয়াল অর্ডার তৈরি করার মোডাল (Modal) ------------------- */}
      {showManualModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: '20px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #D4AF7C', borderRadius: '8px', width: '100%', maxWidth: '750px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.9)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: 0, fontSize: '18px' }}>Create Manual or Social Order</h3>
              <button onClick={() => setShowManualModal(false)} style={{ backgroundColor: 'transparent', color: '#8A8A8A', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveManualOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '5px' }}>Customer Name *</label>
                  <input type="text" placeholder="e.g. Tanvir Ahmed" value={mName} onChange={e => setMName(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '5px' }}>Mobile / Phone Number *</label>
                  <input type="text" placeholder="e.g. 018XXXXXXXX" value={mPhone} onChange={e => handleManualPhoneChange(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} required />
                </div>
              </div>

              {/* লাইভ কাস্টমার রিস্ক ইনফো বক্স */}
              {manualPhoneRiskInfo && (
                <div style={{ backgroundColor: manualPhoneRiskInfo.isRisky ? 'rgba(231, 76, 60, 0.15)' : 'rgba(46, 204, 113, 0.15)', border: `1px solid ${manualPhoneRiskInfo.isRisky ? '#e74c3c' : '#2ecc71'}`, padding: '10px 14px', borderRadius: '6px', fontSize: '12px' }}>
                  {manualPhoneRiskInfo.isRisky ? (
                    <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                      ⚠️ সতর্কবার্তা: এই কাস্টমারের পূর্বের অর্ডার ইতিহাস ঝুঁকিপূর্ণ! (Risk: {manualPhoneRiskInfo.riskRate}% | Delivered: {manualPhoneRiskInfo.delivered}, Returned: {manualPhoneRiskInfo.returned}, Cancelled: {manualPhoneRiskInfo.cancelled})
                    </span>
                  ) : (
                    <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                      {manualPhoneRiskInfo.text ? `✓ ${manualPhoneRiskInfo.text}` : `✓ নিরাপদ কাস্টমার (Risk: ${manualPhoneRiskInfo.riskRate}% | Success: Delivered ${manualPhoneRiskInfo.delivered} orders)`}
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '5px' }}>WhatsApp Number (Optional)</label>
                  <input type="text" placeholder="e.g. 018XXXXXXXX" value={mWhatsApp} onChange={e => setMWhatsApp(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '5px' }}>Order Source *</label>
                  <select value={mOrderSource} onChange={e => setMOrderSource(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}>
                    <option value="Facebook">Facebook Page / Inbox</option>
                    <option value="Instagram">Instagram DM</option>
                    <option value="WhatsApp">WhatsApp Chat</option>
                    <option value="Local">Local / Phone Call</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '5px' }}>Delivery Address *</label>
                  <input type="text" placeholder="House, Road, Area, Thana..." value={mAddress} onChange={e => setMAddress(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '5px' }}>District / Region *</label>
                  <select value={mDistrict} onChange={e => setMDistrict(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}>
                    <option value="Brahmanbaria">ব্রাহ্মণবাড়িয়া সদর</option>
                    <option value="Dhaka">ঢাকার ভেতরে</option>
                    <option value="Outside">ঢাকার বাইরে (অন্যান্য)</option>
                  </select>
                </div>
              </div>

              {/* প্রোডাক্ট সিলেকশন সেকশন */}
              <div style={{ backgroundColor: '#080808', padding: '15px', borderRadius: '6px', border: '1px solid #222' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#D4AF7C', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Products to Add *</label>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} style={{ flex: 1, padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px' }}>
                    <option value="">-- Choose Product from Inventory --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.title || p.name} (Price: ৳{p.price}, Stock: {p.stock !== undefined ? p.stock : 10})</option>
                    ))}
                  </select>
                  <button type="button" onClick={handleAddProductToManualOrder} style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '0 16px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>+ Add</button>
                </div>

                {/* সিলেক্ট করা প্রোডাক্ট লিস্ট */}
                {mSelectedItems.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {mSelectedItems.map((item, idx) => {
                      const pImg = item.product.image || item.product.img || (item.product.images && item.product.images[0]) || '';
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161616', padding: '8px 12px', borderRadius: '4px', border: '1px solid #2a2a2a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {pImg ? <img src={pImg} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '3px' }} /> : null}
                            <div>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#FAF9F6', display: 'block' }}>{item.product.title || item.product.name}</span>
                              <span style={{ fontSize: '10px', color: '#D4AF7C' }}>৳{item.product.price} each</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                              type="number" 
                              min="1" 
                              value={item.quantity} 
                              onChange={e => handleUpdateItemQty(item.product.id, e.target.value)} 
                              style={{ width: '50px', padding: '4px', backgroundColor: '#080808', border: '1px solid #444', color: '#FAF9F6', textAlign: 'center', borderRadius: '3px', fontSize: '11px' }} 
                            />
                            <button type="button" onClick={() => handleRemoveItem(item.product.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* পেমেন্ট ও ডিসকাউন্ট সেকশন */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '5px' }}>Payment Method</label>
                  <select value={mPaymentType} onChange={e => setMPaymentType(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}>
                    <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                    <option value="bKash Online Paid">bKash (Online Paid)</option>
                    <option value="Nagad Online Paid">Nagad (Online Paid)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '5px' }}>Manual Discount (৳)</label>
                  <input type="number" placeholder="0" value={mManualDiscount} onChange={e => setMManualDiscount(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
                </div>
              </div>

              {mPaymentType.includes('Online') && (
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '5px' }}>Transaction ID / Note</label>
                  <input type="text" placeholder="e.g. 9N87A65B" value={mTransactionId} onChange={e => setMTransactionId(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
                </div>
              )}

              {/* বিল সামারি */}
              <div style={{ backgroundColor: '#161616', padding: '12px 15px', borderRadius: '6px', border: '1px solid #333', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#AAA' }}><span>Subtotal:</span><span>৳{subtotal}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#AAA' }}><span>Delivery Charge ({mDistrict}):</span><span>৳{deliveryCharge} {subtotal >= freeDeliveryThreshold ? '(Free Delivery Applied!)' : ''}</span></div>
                {discountVal > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71' }}><span>Discount:</span><span>- ৳{discountVal}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D4AF7C', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #444', paddingTop: '6px', marginTop: '4px' }}>
                  <span>Grand Total:</span><span>৳{grandTotal}</span>
                </div>
              </div>

              <button 
                type="submit" 
                style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', letterSpacing: '1px' }}
              >
                Confirm & Create Manual Order
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}