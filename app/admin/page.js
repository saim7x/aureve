'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import AdminHeader from '../components/AdminHeader';

export default function AdminPanel() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

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
    
    const { data: ordData, error: ordErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordErr) {
      console.error('Orders Fetch Error:', ordErr.message);
    } else {
      setOrders(ordData || []);
    }

    const { data: prodData, error: prodErr } = await supabase
      .from('products')
      .select('*');

    if (prodErr) {
      console.error('Products Fetch Error:', prodErr.message);
    } else {
      setProducts(prodData || []);
    }

    setLoading(false);
  };

  // একক পার্সেল স্টিকার প্রিন্ট করার ফাংশন
  const handlePrintSticker = (order) => {
    const printWindow = window.open('', '_blank');
    
    let itemsHtml = '';
    let subtotal = order.subtotal || 0;

    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      if (!subtotal) {
        order.items.forEach(item => { subtotal += (item.price || 0) * (item.quantity || 1); });
      }
      order.items.forEach((item) => {
        const itemName = item.name || item.product_name || item.title || item.product_title || 'Handcrafted Item';
        const itemImage = item.image || item.img || item.product_image || '';
        const itemQty = item.quantity || item.qty || 1;
        const itemPrice = item.price || 0;
        const customText = item.customization || order.custom_engraving_name || '';

        itemsHtml += `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px dashed #ccc; padding-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              ${itemImage ? `<img src="${itemImage}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 3px; border: 1px solid #999;" />` : ''}
              <div>
                <strong style="font-size: 11px; display: block;">${itemName}</strong>
                ${customText && customText !== 'N/A' ? `<div style="font-size: 9px; color: #b8860b; font-weight: bold; background: #fff8dc; padding: 1px 4px; border-radius: 2px; margin-top: 2px; display: inline-block;">Custom Name: "${customText}"</div>` : ''}
                <div style="font-size: 9px; color: #555;">Qty: ${itemQty} pcs</div>
              </div>
            </div>
            <div style="font-size: 11px; font-weight: bold;">৳${itemPrice * itemQty}</div>
          </div>
        `;
      });
    } else if (order.product_name) {
      const singlePrice = order.price || order.total_amount || 0;
      subtotal = singlePrice;
      const customText = order.custom_engraving_name || '';
      itemsHtml = `
        <div style="font-size: 11px;">
          <strong>${order.product_name}</strong> (x${order.quantity || 1})
          ${customText && customText !== 'N/A' ? `<div style="color: #b8860b; font-weight: bold; margin-top: 2px;">Custom Name: "${customText}"</div>` : ''}
          <div style="font-weight: bold; margin-top: 2px;">৳${singlePrice}</div>
        </div>
      `;
    }

    const discountAmount = order.discount_amount || 0;
    const deliveryCharge = order.delivery_charge !== undefined ? order.delivery_charge : Math.max(0, (order.total_amount || order.grand_total || subtotal) - subtotal + discountAmount);
    const grandTotal = order.total_amount || order.grand_total || (subtotal + deliveryCharge - discountAmount);
    const paymentDesc = order.payment_method || order.payment_type || 'Cash on Delivery';
    const transactionId = order.transaction_id || order.trx_id || 'N/A';

    let couponHtml = '';
    if (order.applied_coupons && Array.isArray(order.applied_coupons) && order.applied_coupons.length > 0) {
      couponHtml = order.applied_coupons.map(c => `<span style="background: #D4AF7C; color: #000; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: bold; margin-right: 4px;">${c.code}</span>`).join('');
    } else if (order.coupon_code) {
      couponHtml = `<span style="background: #D4AF7C; color: #000; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: bold;">${order.coupon_code}</span>`;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Parcel Sticker - ${order.order_id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 20px; color: #000; background: #fff; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          .sticker-box { width: 380px; border: 2px solid #000; padding: 15px; border-radius: 8px; box-sizing: border-box; background: #fff; page-break-inside: avoid; break-inside: avoid; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px; }
          .brand { font-family: serif; font-size: 18px; font-weight: bold; letter-spacing: 2px; }
          .tagline { font-size: 8px; text-transform: uppercase; color: #555; }
          .section { margin-bottom: 8px; font-size: 11px; }
          .label { font-size: 9px; text-transform: uppercase; color: #666; font-weight: bold; display: block; margin-bottom: 2px; }
          .value { font-size: 13px; font-weight: bold; }
          .address-box { background: #f8f8f8; padding: 8px; border-radius: 4px; border: 1px solid #ddd; }
          .pricing-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; color: #333; }
          .footer { text-align: center; font-size: 9px; border-top: 1px solid #ccc; padding-top: 6px; margin-top: 10px; }
          @media print {
            body { padding: 0; background: none; display: block; }
            .sticker-box { border: 2px solid #000; width: 100%; max-width: 400px; margin: 0 auto; page-break-inside: avoid; break-inside: avoid; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="sticker-box">
          <div class="header">
            <div class="brand">AUREVÉ</div>
            <div class="tagline">Elegance in Every Detail</div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div><span class="label">Order ID</span><span class="value" style="color: #b8860b;">${order.order_id}</span></div>
            <div style="text-align: right;"><span class="label">Date</span><span style="font-size: 10px;">${new Date(order.created_at).toLocaleDateString()}</span></div>
          </div>
          <div class="section address-box">
            <span class="label">Deliver To (Customer)</span>
            <div class="value" style="font-size: 14px;">${order.customer_name}</div>
            <div style="font-size: 12px; font-weight: bold; margin-top: 2px;">📱 Phone: ${order.phone || 'N/A'} | WhatsApp: ${order.whatsapp || 'N/A'}</div>
            <div style="font-size: 11px; margin-top: 2px;">📍 ${order.address}, ${order.district}</div>
          </div>
          <div class="section"><span class="label">Ordered Items & Customization</span><div>${itemsHtml}</div></div>
          
          <div style="border-top: 1px solid #ccc; padding-top: 6px; margin-top: 6px;">
            <div class="pricing-row"><span>Subtotal:</span><span>৳${subtotal}</span></div>
            <div class="pricing-row"><span>Delivery Charge:</span><span>৳${deliveryCharge}</span></div>
            ${discountAmount > 0 ? `<div class="pricing-row" style="color: #27ae60;"><span>Discount (${couponHtml}):</span><span>- ৳${discountAmount}</span></div>` : ''}
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 4px; margin-top: 3px; font-weight: bold; font-size: 12px;">
              <span>Total Amount:</span><span>৳${grandTotal}</span>
            </div>
            <div style="margin-top: 5px; font-size: 10px; font-weight: bold; color: ${paymentDesc.includes('Online') ? '#27ae60' : '#d35400'}; background: ${paymentDesc.includes('Online') ? 'rgba(39, 174, 96, 0.1)' : 'rgba(211, 84, 0, 0.1)'}; padding: 4px 6px; border-radius: 3px; text-align: center;">
              Payment: ${paymentDesc} ${transactionId && transactionId !== 'N/A' ? `<br/>TrxID: <strong>${transactionId}</strong>` : ''}
            </div>
          </div>

          <div class="footer">Thank you for shopping with AUREVÉ!</div>
        </div>
        <div class="no-print" style="margin-top: 15px; text-align: center;">
          <button onclick="window.print()" style="background: #000; color: #fff; border: none; padding: 8px 20px; font-size: 13px; font-weight: bold; cursor: pointer; border-radius: 4px;">🖨️ Confirm & Print</button>
        </div>
        <script>window.onload = function() { setTimeout(() => window.print(), 300); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // প্রসেসিং অর্ডারের জন্য একসাথে A4 পেপারে একাধিক স্টিকার গ্রিড আকারে প্রিন্ট করার ফাংশন
  const handlePrintAllProcessingA4 = (processingOrders) => {
    if (!processingOrders || processingOrders.length === 0) {
      alert('প্রিন্ট করার মতো কোনো "Processing" অর্ডার নেই!');
      return;
    }

    const printWindow = window.open('', '_blank');
    let allStickersHtml = '';

    processingOrders.forEach((order) => {
      let itemsHtml = '';
      let subtotal = order.subtotal || 0;

      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        if (!subtotal) {
          order.items.forEach(item => { subtotal += (item.price || 0) * (item.quantity || 1); });
        }
        order.items.forEach((item) => {
          const itemName = item.name || item.product_name || item.title || item.product_title || 'Handcrafted Item';
          const itemImage = item.image || item.img || item.product_image || '';
          const itemQty = item.quantity || item.qty || 1;
          const itemPrice = item.price || 0;
          const customText = item.customization || order.custom_engraving_name || '';

          itemsHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px dashed #ddd; padding-bottom: 3px;">
              <div style="display: flex; align-items: center; gap: 5px;">
                ${itemImage ? `<img src="${itemImage}" style="width: 28px; height: 28px; object-fit: cover; border-radius: 3px; border: 1px solid #999;" />` : ''}
                <div>
                  <strong style="font-size: 10px; display: block; line-height: 1.1;">${itemName}</strong>
                  ${customText && customText !== 'N/A' ? `<div style="font-size: 8px; color: #b8860b; font-weight: bold; background: #fff8dc; padding: 1px 3px; border-radius: 2px; margin-top: 1px; display: inline-block;">Custom: "${customText}"</div>` : ''}
                  <span style="font-size: 8px; color: #555;">Qty: ${itemQty} pcs</span>
                </div>
              </div>
              <div style="font-size: 10px; font-weight: bold;">৳${itemPrice * itemQty}</div>
            </div>
          `;
        });
      } else if (order.product_name) {
        const singlePrice = order.price || order.total_amount || 0;
        subtotal = singlePrice;
        const customText = order.custom_engraving_name || '';
        itemsHtml = `<div style="font-size: 10px;"><strong>${order.product_name}</strong> (x${order.quantity || 1}) ${customText && customText !== 'N/A' ? `<br/><span style="color: #b8860b; font-weight: bold;">Custom: "${customText}"</span>` : ''}<br/>৳${singlePrice}</div>`;
      }

      const discountAmount = order.discount_amount || 0;
      const deliveryCharge = order.delivery_charge !== undefined ? order.delivery_charge : Math.max(0, (order.total_amount || order.grand_total || subtotal) - subtotal + discountAmount);
      const grandTotal = order.total_amount || order.grand_total || (subtotal + deliveryCharge - discountAmount);
      const paymentDesc = order.payment_method || order.payment_type || 'Cash on Delivery';
      const transactionId = order.transaction_id || order.trx_id || 'N/A';

      let couponHtml = '';
      if (order.applied_coupons && Array.isArray(order.applied_coupons) && order.applied_coupons.length > 0) {
        couponHtml = order.applied_coupons.map(c => `<span style="background: #D4AF7C; color: #000; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: bold; margin-right: 3px;">${c.code}</span>`).join('');
      } else if (order.coupon_code) {
        couponHtml = `<span style="background: #D4AF7C; color: #000; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: bold;">${order.coupon_code}</span>`;
      }

      allStickersHtml += `
        <div class="sticker-card">
          <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 6px;">
            <div style="font-family: serif; font-size: 15px; font-weight: bold; letter-spacing: 1px;">AUREVÉ</div>
            <div style="font-size: 7px; text-transform: uppercase; color: #555;">Elegance in Every Detail</div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px;">
            <div><strong>ID:</strong> <span style="color: #b8860b;">${order.order_id}</span></div>
            <div><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</div>
          </div>
          <div style="background: #f9f9f9; padding: 6px; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 6px; font-size: 10px;">
            <div style="font-size: 12px; font-weight: bold;">${order.customer_name}</div>
            <div style="font-weight: bold;">📱 Phone: ${order.phone || 'N/A'} | WA: ${order.whatsapp || 'N/A'}</div>
            <div>📍 ${order.address}, ${order.district}</div>
          </div>
          <div style="margin-bottom: 6px;">${itemsHtml}</div>
          <div style="border-top: 1px solid #ccc; padding-top: 4px; font-size: 10px;">
            <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>৳${subtotal}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Delivery:</span><span>৳${deliveryCharge}</span></div>
            ${discountAmount > 0 ? `<div style="display: flex; justify-content: space-between; color: #27ae60;"><span>Discount (${couponHtml}):</span><span>- ৳${discountAmount}</span></div>` : ''}
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 3px; margin-top: 2px; font-weight: bold; font-size: 11px;">
              <span>Total Amount:</span><span>৳${grandTotal}</span>
            </div>
            <div style="margin-top: 4px; font-size: 9px; font-weight: bold; color: ${paymentDesc.includes('Online') ? '#27ae60' : '#d35400'}; background: ${paymentDesc.includes('Online') ? 'rgba(39, 174, 96, 0.1)' : 'rgba(211, 84, 0, 0.1)'}; padding: 3px; border-radius: 2px; text-align: center;">
              Payment: ${paymentDesc} ${transactionId && transactionId !== 'N/A' ? `<br/>TrxID: <strong>${transactionId}</strong>` : ''}
            </div>
          </div>
        </div>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Processing Stickers - A4 Grid</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; margin: 0; padding: 0; color: #000; }
          .a4-container { width: 190mm; margin: 0 auto; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10mm; align-content: start; }
          .sticker-card { border: 2px solid #000; padding: 12px; border-radius: 6px; background: #fff; box-sizing: border-box; height: fit-content; page-break-inside: avoid; break-inside: avoid; }
          .no-print { position: fixed; bottom: 20px; right: 20px; background: #000; color: #fff; padding: 12px 25px; border-radius: 6px; font-weight: bold; cursor: pointer; border: none; z-index: 1000; }
          @media print {
            .no-print { display: none; }
            .sticker-card { page-break-inside: avoid; break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="a4-container">
          ${allStickersHtml}
        </div>
        <button class="no-print" onclick="window.print()">🖨️ Print All on A4</button>
        <script>
          window.onload = function() {
            setTimeout(() => window.print(), 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const sendWhatsAppNotification = (order) => {
    const phone = order.whatsapp || order.mobile || order.phone;
    if (!phone) {
      alert('কাস্টমারের হোয়াটসঅ্যাপ বা মোবাইল নম্বর পাওয়া যায়নি!');
      return;
    }

    let cleanPhone = phone.toString().replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '88' + cleanPhone;
    }

    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http://' : 'https://';
    
    const cleanOrderCode = order.order_code || (order.order_id ? order.order_id.replace('#', '') : '');
    const trackingLink = `${protocol}${host}/track?orderId=${cleanOrderCode}`;
    const reviewLink = `${protocol}${host}/review?order_id=${order.id}`;

    let productTitle = order.product_name || '';
    if (!productTitle && order.items && Array.isArray(order.items) && order.items.length > 0) {
      productTitle = order.items.map(i => i.name || i.product_name || i.title || i.product_title).filter(Boolean).join(', ');
    }
    if (!productTitle) {
      productTitle = 'Aurevé Handcrafted Item';
    }

    const currentStatus = order.order_status || 'Pending';
    let msg = `✨ *AUREVÉ* | *Elegance in Every Detail* ✨\n\n`;
    msg += `Dear *${order.customer_name}*,\n\n`;

    if (currentStatus === 'Pending') {
      msg += `আমরা আপনার অর্ডারটি সফলভাবে গ্রহণ করেছি। অর্ডারের নাম: *${productTitle}* (অর্ডার আইডি: *${order.order_id}*)\n\n`;
      msg += `📦 *Order Summary:*\n`;
      msg += `• Total Amount: ৳${order.total_amount || order.grand_total}\n\n`;
      msg += `❓ আপনি কি সত্যিই এই পার্সেলটি গ্রহণ করতে চান? আপনি যদি নিতে ইচ্ছুক হন, তবে অনুগ্রহ করে এই চ্যাটে শুধু **"Yes"** বা **"Confirm"** লিখে রিপ্লাই দিন!\n\n`;
      msg += `🔍 Track Your Order:\n${trackingLink}\n\n`;
      msg += `Thank you for choosing AUREVÉ.`;
    } else if (currentStatus === 'Processing') {
      msg += `আপনার অর্ডারটি (*${productTitle}*) সফলভাবে **কনফার্ম ও প্রসেসিং** করা হয়েছে। খুব শীঘ্রই আপনার এক্সক্লুসিভ পার্সেলটি নিখুঁতভাবে প্যাক করা হবে। ✨\n\n`;
      msg += `🔍 Track Order Live:\n${trackingLink}\n\n`;
      msg += `আমাদের সাথে থাকার জন্য আপনাকে অসংখ্য ধন্যবাদ।`;
    } else if (currentStatus === 'Shipped') {
      msg += `সুসংবাদ! আপনার এক্সক্লুসিভ পার্সেলটি (*${productTitle}*) এখন আপনার ঠিকানার উদ্দেশ্যে ডিসপ্যাচ বা **Shipped** করা হয়েছে। 🚚✨\n\n`;
      msg += `🔍 Live Tracking:\n${trackingLink}\n\n`;
      msg += `অনুগ্রহ করে ডেলিভারি প্রতিনিধির জন্য আপনার ফোনটি সচল রাখুন।`;
    } else if (currentStatus === 'Delivered') {
      msg += `আপনার পার্সেলটি (*${productTitle}*) সফলভাবে আপনার হাতে পৌঁছে গেছে (**Delivered**)!\n\n`;
      msg += `আমাদের এক্সক্লুসিভ কালেকশনটি আপনার কেমন লাগলো, সে বিষয়ে একটি সুন্দর রিভিউ দিয়ে আমাদের সাথে আপনার অভিজ্ঞতা শেয়ার করার জন্য বিনম্র অনুরোধ জানাচ্ছি। আপনার মূল্যবান রিভিউটি আমাদের পেজে যোগ করতে নিচের লিঙ্কে ক্লিক করুন:\n\n`;
      msg += `⭐ *Give Your Review:*\n${reviewLink}\n\n`;
      msg += `রয়্যাল এলিগেন্স বজায় রাখতে আবার আপনাকে আমন্ত্রণ জানাচ্ছি। ধন্যবাদ!`;
    } else {
      msg += `আপনার অর্ডার (*${productTitle}*)-এর বর্তমান আপডেট: *${currentStatus}*。\n\n`;
      msg += `স্ট্যটাস চেক করুন: ${trackingLink}`;
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const updateOrderStatus = async (order, newStatus) => {
    if (!order.id) {
      alert('অর্ডারটির ইউনিক আইডি (id) পাওয়া যায়নি!');
      return;
    }

    setUpdatingId(order.id);

    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', order.id)
      .select();

    setUpdatingId(null);

    if (error) {
      console.error('Supabase Update Error:', error);
      alert('ডাটাবেজ আপডেট ব্যর্থ হয়েছে: ' + error.message);
    } else {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, order_status: newStatus } : o));
      alert(`অর্ডার স্ট্যাটাস সফলভাবে '${newStatus}' এ আপডেট ও ডেটাবেজে সেভ হয়েছে!`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: '#080808', color: '#FAF9F6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Montserrat', sans-serif" }}>
        <div style={{ backgroundColor: '#111', border: '1px solid #D4AF7C', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: '0 0 10px 0', letterSpacing: '2px' }}>AUREVÉ ADMIN</h2>
          <p style={{ fontSize: '12px', color: '#8A8A8A', marginBottom: '25px' }}>অ্যাডমিন প্যানেলে প্রবেশ করতে সিকিউরিটি পাসওয়ার্ড প্রদান করুন</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="password" 
              placeholder="Enter Password" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)} 
              style={{ backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '12px', borderRadius: '4px', fontSize: '13px', outline: 'none', textAlign: 'center' }}
            />
            {passwordError && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{passwordError}</span>}
            
            <button 
              type="submit" 
              style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Unlock Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(o => {
    const currentStatus = o.order_status || 'Pending';
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Pending') return currentStatus === 'Pending';
    if (filterStatus === 'Processing') return currentStatus === 'Processing' || currentStatus === 'Admin Verified' || currentStatus === 'Confirmed';
    if (filterStatus === 'Shipped') return currentStatus === 'Shipped';
    if (filterStatus === 'Delivered') return currentStatus === 'Delivered';
    if (filterStatus === 'Returned') return currentStatus === 'Returned';
    if (filterStatus === 'Cancelled') return currentStatus === 'Cancelled';
    return currentStatus === filterStatus;
  }).filter(o => {
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm || 
      (o.order_id && o.order_id.toLowerCase().includes(searchLower)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchLower)) ||
      (o.phone && o.phone.includes(searchTerm)) ||
      (o.whatsapp && o.whatsapp.includes(searchTerm));
  });

  const totalRevenue = orders.reduce((sum, o) => {
    const status = o.order_status || 'Pending';
    if (status === 'Returned' || status === 'Cancelled') {
      return sum;
    }
    return sum + (o.total_amount || o.grand_total || 0);
  }, 0);

  const pendingCount = orders.filter(o => !o.order_status || o.order_status === 'Pending').length;
  const processingCount = orders.filter(o => o.order_status === 'Processing' || o.order_status === 'Admin Verified' || o.order_status === 'Confirmed').length;
  const shippedCount = orders.filter(o => o.order_status === 'Shipped').length;
  const deliveredCount = orders.filter(o => o.order_status === 'Delivered').length;
  const returnedOrdersList = orders.filter(o => o.order_status === 'Returned');
  const cancelledOrdersList = orders.filter(o => o.order_status === 'Cancelled');

  const returnedCount = returnedOrdersList.length;
  const cancelledCount = cancelledOrdersList.length;

  const returnedDeliveryLoss = returnedOrdersList.reduce((sum, o) => sum + (parseFloat(o.delivery_charge) || 0), 0);
  const cancelledDeliveryLoss = cancelledOrdersList.reduce((sum, o) => sum + (parseFloat(o.delivery_charge) || 0), 0);

  return (
    <div style={{ backgroundColor: '#080808', color: '#FAF9F6', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      <AdminHeader />

      <main style={{ padding: '30px', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* মেট্রিকস কার্ড */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '15px 10px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>পেন্ডিং</span>
            <strong style={{ fontSize: '20px', color: '#e67e22' }}>{pendingCount}</strong>
          </div>
          <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '15px 10px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>প্রসেসিং</span>
            <strong style={{ fontSize: '20px', color: '#2ecc71' }}>{processingCount}</strong>
          </div>
          <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '15px 10px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>শিফটেড</span>
            <strong style={{ fontSize: '20px', color: '#f1c40f' }}>{shippedCount}</strong>
          </div>
          <div style={{ backgroundColor: '#111', border: '1px solid #e74c3c', padding: '15px 10px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: '#e74c3c', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>রিটার্নড ({returnedCount})</span>
            <strong style={{ fontSize: '13px', color: '#e74c3c' }}>৳ {returnedDeliveryLoss}</strong>
            <span style={{ fontSize: '7px', color: '#8A8A8A', display: 'block', marginTop: '2px' }}>লস</span>
          </div>
          <div style={{ backgroundColor: '#111', border: '1px solid #95a5a6', padding: '15px 10px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>বাতিল ({cancelledCount})</span>
            <strong style={{ fontSize: '13px', color: '#95a5a6' }}>৳ {cancelledDeliveryLoss}</strong>
            <span style={{ fontSize: '7px', color: '#8A8A8A', display: 'block', marginTop: '2px' }}>লস</span>
          </div>
          <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '15px 10px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>ডেলিভার্ড</span>
            <strong style={{ fontSize: '20px', color: '#2ecc71' }}>{deliveredCount}</strong>
          </div>
          <div style={{ backgroundColor: '#111', border: '1px solid #D4AF7C', padding: '15px 10px', borderRadius: '6px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', color: '#D4AF7C', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>মোট সেলস</span>
            <strong style={{ fontSize: '13px', color: '#D4AF7C' }}>&#2547; {totalRevenue}</strong>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#111', padding: '15px', borderRadius: '6px', border: '1px solid #222', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#8A8A8A' }}>Filter:</span>
              {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Returned', 'Cancelled'].map(status => (
                <button 
                  key={status} 
                  onClick={() => setFilterStatus(status)} 
                  style={{ backgroundColor: filterStatus === status ? '#D4AF7C' : '#222', color: filterStatus === status ? '#080808' : '#FAF9F6', border: 'none', padding: '6px 10px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {status}
                </button>
              ))}
            </div>

            {filterStatus === 'Processing' && (
              <button 
                onClick={() => handlePrintAllProcessingA4(filteredOrders)}
                style={{ backgroundColor: '#2ecc71', color: '#000', border: 'none', padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>🖨️</span> Print All Processing Stickers (A4 Grid)
              </button>
            )}

            <input 
              type="text" 
              placeholder="Search Order ID, Name, Mobile..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={{ backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', width: '240px', outline: 'none' }} 
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#8A8A8A' }}>Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#111', borderRadius: '6px', color: '#8A8A8A' }}>কোনো অর্ডার পাওয়া যায়নি।</div>
          ) : (
            <div style={{ overflowX: 'auto', backgroundColor: '#111', borderRadius: '6px', border: '1px solid #222' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a1a', color: '#D4AF7C', borderBottom: '1px solid #222', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>
                    <th style={{ padding: '14px' }}>Order ID</th>
                    <th style={{ padding: '14px' }}>Customer Info (Name, Phone, Address)</th>
                    <th style={{ padding: '14px' }}>Ordered Items & Customization</th>
                    <th style={{ padding: '14px' }}>Amount & TrxID / Payment</th>
                    <th style={{ padding: '14px' }}>Status</th>
                    <th style={{ padding: '14px' }}>Change Status</th>
                    <th style={{ padding: '14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const currentStatus = order.order_status || 'Pending';
                    const items = order.items || [];

                    let subtotal = order.subtotal || 0;
                    if (items.length > 0 && !subtotal) {
                      items.forEach(i => { subtotal += (i.price || 0) * (i.quantity || 1); });
                    }
                    const discountAmt = order.discount_amount || 0;
                    const deliveryChg = order.delivery_charge !== undefined ? order.delivery_charge : Math.max(0, (order.total_amount || order.grand_total || subtotal) - subtotal + discountAmt);
                    const grandTot = order.total_amount || order.grand_total || (subtotal + deliveryChg - discountAmt);
                    const transactionId = order.transaction_id || order.trx_id || 'N/A';

                    const statusLower = currentStatus.toLowerCase();
                    const isConfirmed = statusLower === 'processing' || statusLower === 'admin verified' || statusLower === 'confirmed' || statusLower === 'delivered';

                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #222', transition: 'background 0.2s' }}>
                        <td style={{ padding: '14px', fontWeight: 'bold' }}>
                          <span style={{ color: isConfirmed ? '#2ecc71' : '#D4AF7C' }}>
                            {order.order_id}
                          </span>
                          <div style={{ fontSize: '9px', color: '#8A8A8A', fontWeight: 'normal', marginTop: '2px' }}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        
                        {/* কাস্টমারের পূর্ণাঙ্গ নাম, ফোন, হোয়াটসঅ্যাপ ও ঠিকানা */}
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: 'bold', color: '#FAF9F6', fontSize: '13px' }}>{order.customer_name}</div>
                          <div style={{ fontSize: '11px', color: '#2ecc71', fontWeight: '600', marginTop: '2px' }}>📱 Phone: {order.phone || order.mobile || 'N/A'}</div>
                          <div style={{ fontSize: '11px', color: '#3498db', fontWeight: '600' }}>💬 WhatsApp: {order.whatsapp || 'N/A'}</div>
                          <div style={{ fontSize: '11px', color: '#FAF9F6', marginTop: '3px', background: '#1a1a1a', padding: '4px 6px', borderRadius: '3px', border: '1px solid #333' }}>
                            📍 <strong>ঠিকানা:</strong> {order.address}, {order.district}
                          </div>
                        </td>

                        {/* প্রোডাক্ট ও কাস্টমাইজড নাম */}
                        <td style={{ padding: '14px', maxWidth: '300px' }}>
                          {items.length > 0 ? (
                            items.map((item, iIdx) => {
                              const iName = item.name || item.product_name || item.title || item.product_title || 'Item';
                              const iImg = item.image || item.img || item.product_image || '';
                              const iQty = item.quantity || item.qty || 1;
                              const cText = item.customization || order.custom_engraving_name || '';
                              return (
                                <div key={iIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', background: '#161616', padding: '6px 8px', borderRadius: '4px', border: '1px solid #222' }}>
                                  {iImg && <img src={iImg} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '3px' }} />}
                                  <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{iName} (x{iQty})</div>
                                    {cText && cText !== 'N/A' && (
                                      <div style={{ fontSize: '10px', color: '#D4AF7C', fontWeight: 'bold', backgroundColor: 'rgba(212, 175, 124, 0.1)', padding: '2px 5px', borderRadius: '2px', marginTop: '2px', display: 'inline-block' }}>
                                        🎨 Custom Name: "{cText}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div style={{ fontSize: '11px' }}>
                              <strong style={{ color: '#fff' }}>{order.product_name}</strong> (x{order.quantity || 1})
                              {order.custom_engraving_name && order.custom_engraving_name !== 'N/A' && (
                                <div style={{ fontSize: '10px', color: '#D4AF7C', fontWeight: 'bold', marginTop: '3px' }}>
                                  🎨 Custom Name: "{order.custom_engraving_name}"
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* পেমেন্ট পদ্ধতি, অ্যামাউন্ট ও ট্রানজেকশন আইডি (TrxID) */}
                        <td style={{ padding: '14px', fontSize: '11px' }}>
                          <div>Sub: ৳{subtotal}</div>
                          <div>Delivery: ৳{deliveryChg}</div>
                          {discountAmt > 0 && <div style={{ color: '#27ae60' }}>Disc: -৳{discountAmt}</div>}
                          <div style={{ fontWeight: 'bold', color: '#D4AF7C', marginTop: '2px', fontSize: '12px' }}>Total: ৳{grandTot}</div>
                          <div style={{ marginTop: '6px', padding: '4px 6px', backgroundColor: '#1a1a1a', borderRadius: '3px', border: '1px solid #333' }}>
                            <div style={{ color: '#2ecc71', fontWeight: 'bold' }}>{order.payment_method || order.payment_type || 'COD'}</div>
                            {transactionId && transactionId !== 'N/A' && (
                              <div style={{ fontSize: '10px', color: '#f39c12', marginTop: '2px', fontWeight: 'bold' }}>
                                TrxID: <span style={{ color: '#fff', background: '#333', padding: '1px 4px', borderRadius: '2px' }}>{transactionId}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '14px' }}>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
                            backgroundColor: isConfirmed ? 'rgba(46, 204, 113, 0.1)' : currentStatus === 'Shipped' ? 'rgba(241, 196, 15, 0.1)' : currentStatus === 'Delivered' ? 'rgba(46, 204, 113, 0.1)' : currentStatus === 'Returned' ? 'rgba(231, 76, 60, 0.1)' : currentStatus === 'Cancelled' ? 'rgba(149, 165, 166, 0.1)' : 'rgba(230, 126, 34, 0.1)',
                            color: isConfirmed ? '#2ecc71' : currentStatus === 'Shipped' ? '#f1c40f' : currentStatus === 'Delivered' ? '#2ecc71' : currentStatus === 'Returned' ? '#e74c3c' : currentStatus === 'Cancelled' ? '#95a5a6' : '#e67e22',
                            border: `1px solid ${isConfirmed ? '#2ecc71' : currentStatus === 'Shipped' ? '#f1c40f' : currentStatus === 'Delivered' ? '#2ecc71' : currentStatus === 'Returned' ? '#e74c3c' : currentStatus === 'Cancelled' ? '#95a5a6' : '#e67e22'}`
                          }}>
                            {currentStatus}
                          </span>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <select 
                            value={order.order_status || 'Pending'}
                            disabled={updatingId === order.id}
                            onChange={(e) => updateOrderStatus(order, e.target.value)}
                            style={{ backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '6px', borderRadius: '4px', fontSize: '11px', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Returned">Returned</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button 
                              onClick={() => sendWhatsAppNotification(order)}
                              title="Send WhatsApp Message"
                              style={{ backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              💬 WA
                            </button>
                            <button 
                              onClick={() => handlePrintSticker(order)}
                              style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '6px 10px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              🖨️ Sticker
                            </button>
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

      </main>
    </div>
  );
}
