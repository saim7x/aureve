'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AdminHeader from '../../components/AdminHeader';

export default function ExpensesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]); // কাঁচামাল ও সাপ্লায়ার ডেটা স্টেট
  const [loading, setLoading] = useState(true);

  // পেজের ভেতর ট্যাব স্যুইচ করার স্টেট ('expenses' অথবা 'raw-materials')
  const [activeTab, setActiveTab] = useState('expenses');

  // কাঁচামাল ফিল্টার স্টেট ('All', 'Paid', 'Due')
  const [materialFilter, setMaterialFilter] = useState('All');

  // নতুন খরচ (Expense) ফর্মের স্টেট
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Raw Materials');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseMethod, setExpenseMethod] = useState('Cash');
  const [expenseTrxId, setExpenseTrxId] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);

  // নতুন কাঁচামাল ও সাপ্লায়ার ফর্মের স্টেট
  const [materialName, setMaterialName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [materialQty, setMaterialQty] = useState('');
  const [materialUnit, setMaterialUnit] = useState('Pcs');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [addingMaterial, setAddingMaterial] = useState(false);

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
    
    // ১. অর্ডার ফেচ করা
    const { data: ordData, error: ordErr } = await supabase
      .from('orders')
      .select('*');

    if (ordErr) console.error('Orders Fetch Error:', ordErr.message);
    else setOrders(ordData || []);

    // ২. খরচ (Expenses) ফেচ করা
    const { data: expData, error: expErr } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (expErr) setExpenses([]);
    else setExpenses(expData || []);

    // ৩. কাঁচামাল ও সাপ্লায়ার ডেটা ফেচ করা (raw_materials টেবিল থেকে)
    const { data: matData, error: matErr } = await supabase
      .from('raw_materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (matErr) setRawMaterials([]);
    else setRawMaterials(matData || []);

    setLoading(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) {
      alert('অনুগ্রহ করে খরচের নাম এবং পরিমাণ দিন!');
      return;
    }

    if ((expenseMethod === 'bKash' || expenseMethod === 'Nagad') && !expenseTrxId) {
      alert('দয়া করে বিকাশ/নগদ Transaction ID (TrxID) প্রদান করুন!');
      return;
    }

    setAddingExpense(true);
    const newExpense = {
      title: expenseTitle,
      category: expenseCategory,
      amount: parseFloat(expenseAmount),
      payment_method: expenseMethod,
      transaction_id: (expenseMethod === 'bKash' || expenseMethod === 'Nagad') ? expenseTrxId : 'N/A',
      note: expenseNote,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert([newExpense])
      .select();

    setAddingExpense(false);

    if (error) {
      alert('খরচ সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } else {
      alert('খরচ সফলভাবে যুক্ত হয়েছে!');
      setExpenses(prev => [data[0], ...prev]);
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseTrxId('');
      setExpenseNote('');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('আপনি কি এই খরচটি মুছে ফেলতে চান?')) return;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      alert('ডিলিট করতে সমস্যা হয়েছে: ' + error.message);
    } else {
      setExpenses(prev => prev.filter(item => item.id !== id));
    }
  };

  // কাঁচামাল ও সাপ্লায়ার যুক্ত করার হ্যান্ডলার
  const handleAddRawMaterial = async (e) => {
    e.preventDefault();
    if (!materialName || !purchaseCost) {
      alert('অনুগ্রহ করে কাঁচামালের নাম এবং ক্রয়মূল্য দিন!');
      return;
    }

    setAddingMaterial(true);
    const costValue = parseFloat(purchaseCost);
    const newMaterial = {
      material_name: materialName,
      supplier_name: supplierName || 'General Supplier',
      quantity: parseFloat(materialQty) || 0,
      unit: materialUnit,
      purchase_cost: costValue,
      payment_status: paymentStatus,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('raw_materials')
      .insert([newMaterial])
      .select();

    // যদি সরাসরি Paid সিলেক্ট করে এন্ট্রি করা হয়, তবে সাথে সাথে খরচের টেবিলে যোগ হবে
    if (!error && paymentStatus === 'Paid') {
      const autoExpense = {
        title: `Raw Material: ${materialName} (${supplierName || 'General'})`,
        category: 'Raw Materials',
        amount: costValue,
        payment_method: 'Cash',
        transaction_id: 'N/A',
        note: 'Paid automatically on raw material purchase',
        created_at: new Date().toISOString()
      };
      const { data: expRes } = await supabase.from('expenses').insert([autoExpense]).select();
      if (expRes) setExpenses(prev => [expRes[0], ...prev]);
    }

    setAddingMaterial(false);

    if (error) {
      alert('কাঁচামাল সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } else {
      alert('কাঁচামাল ও সাপ্লায়ার তথ্য সফলভাবে যুক্ত হয়েছে!');
      setRawMaterials(prev => [data[0], ...prev]);
      setMaterialName('');
      setSupplierName('');
      setMaterialQty('');
      setPurchaseCost('');
    }
  };

  // বকেয়া (Due) থেকে পরিশোধিত (Paid) করলে স্বয়ংক্রিয়ভাবে এক্সপেন্সে যুক্ত হওয়া
  const handleTogglePaymentStatus = async (material) => {
    const newStatus = material.payment_status === 'Due' ? 'Paid' : 'Due';
    const { error } = await supabase.from('raw_materials').update({ payment_status: newStatus }).eq('id', material.id);
    
    if (!error) {
      setRawMaterials(prev => prev.map(m => m.id === material.id ? { ...m, payment_status: newStatus } : m));

      if (newStatus === 'Paid') {
        const autoExpense = {
          title: `Cleared Due: ${material.material_name} (${material.supplier_name})`,
          category: 'Raw Materials',
          amount: parseFloat(material.purchase_cost) || 0,
          payment_method: 'Cash',
          transaction_id: 'N/A',
          note: 'Supplier due cleared and auto-added to expense',
          created_at: new Date().toISOString()
        };
        const { data: expRes } = await supabase.from('expenses').insert([autoExpense]).select();
        if (expRes) setExpenses(prev => [expRes[0], ...prev]);
        alert('বকেয়া পরিশোধ সম্পন্ন! এটি এখন সরাসরি আপনার খরচের হিস্ট্রিতে (Expenses) যুক্ত হয়ে গেছে।');
      } else {
        alert('স্ট্যাটাস আবার Due করা হয়েছে।');
      }
    }
  };

  const handleDeleteRawMaterial = async (id) => {
    if (!window.confirm('আপনি কি এই কাঁচামালের রেকর্ডটি মুছে ফেলতে চান?')) return;

    const { error } = await supabase
      .from('raw_materials')
      .delete()
      .eq('id', id);

    if (error) {
      alert('ডিলিট করতে সমস্যা হয়েছে: ' + error.message);
    } else {
      setRawMaterials(prev => prev.filter(item => item.id !== id));
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: '#080808', color: '#FAF9F6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Montserrat', sans-serif" }}>
        <div style={{ backgroundColor: '#111', border: '1px solid #D4AF7C', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '380px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: '0 0 10px 0', letterSpacing: '2px' }}>AUREVÉ ADMIN</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <input 
              type="password" 
              placeholder="Enter Password" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)} 
              style={{ backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '12px', borderRadius: '4px', textAlign: 'center', outline: 'none' }}
            />
            {passwordError && <span style={{ color: '#e74c3c', fontSize: '11px' }}>{passwordError}</span>}
            <button type="submit" style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '12px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>Unlock Panel</button>
          </form>
        </div>
      </div>
    );
  }

  // --- হিসাব-নিকাশ ---
  const totalOrdersCount = orders.length;

  const pendingProcessingList = orders.filter(o => {
    const status = o.order_status || 'Pending';
    return status !== 'Delivered' && status !== 'Returned' && status !== 'Cancelled';
  });
  const pendingProcessingCount = pendingProcessingList.length;
  const pendingProcessingValue = pendingProcessingList.reduce((sum, o) => sum + (o.total_amount || o.grand_total || 0), 0);
  const pendingProcessingDeliveryCharge = pendingProcessingList.reduce((sum, o) => sum + (parseFloat(o.delivery_charge) || 0), 0);

  const deliveredOrdersList = orders.filter(o => o.order_status === 'Delivered');
  const deliveredOrdersCount = deliveredOrdersList.length;
  
  const deliveredProductsCount = deliveredOrdersList.reduce((sum, o) => {
    if (o.items && Array.isArray(o.items)) {
      return sum + o.items.reduce((iSum, item) => iSum + (parseInt(item.quantity) || 1), 0);
    }
    return sum + (parseInt(o.quantity) || 1);
  }, 0);

  const deliveredRevenue = deliveredOrdersList.reduce((sum, o) => sum + (o.total_amount || o.grand_total || 0), 0);
  const deliveredDeliveryCharge = deliveredOrdersList.reduce((sum, o) => sum + (parseFloat(o.delivery_charge) || 0), 0);

  const returnedOrdersList = orders.filter(o => o.order_status === 'Returned');
  const cancelledOrdersList = orders.filter(o => o.order_status === 'Cancelled');
  
  const returnedCount = returnedOrdersList.length;
  const cancelledCount = cancelledOrdersList.length;
  
  // শুধুমাত্র রিটার্ন ডেলিভারি লস হিসাব করা হচ্ছে
  const returnedDeliveryLoss = returnedOrdersList.reduce((sum, o) => sum + (parseFloat(o.delivery_charge) || 0), 0);
  const totalDeliveryLoss = returnedDeliveryLoss; // বাতিল ডেলিভারি লস বাদ দেওয়া হয়েছে

  const totalExpensesAmount = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const grossProfit = deliveredRevenue - deliveredDeliveryCharge - totalDeliveryLoss;
  const netProfit = grossProfit - totalExpensesAmount;

  // বকেয়া (Due) ও পরিশোধিত (Paid) হিসাব
  const totalDueAmount = rawMaterials.filter(m => m.payment_status === 'Due').reduce((sum, m) => sum + (parseFloat(m.purchase_cost) || 0), 0);
  const totalPaidAmount = rawMaterials.filter(m => m.payment_status === 'Paid').reduce((sum, m) => sum + (parseFloat(m.purchase_cost) || 0), 0);

  const filteredMaterials = rawMaterials.filter(m => {
    if (materialFilter === 'All') return true;
    return m.payment_status === materialFilter;
  });

  return (
    <div style={{ backgroundColor: '#080808', color: '#FAF9F6', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      <AdminHeader />

      <div style={{ backgroundColor: '#111', borderBottom: '1px solid #222', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: 0, fontSize: '18px' }}>💰 Accounts, Expenses & Raw Materials Management</h2>
        
        {/* দুটি আলাদা সেকশনে যাওয়ার ট্যাব সুইচ বাটন */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('expenses')} 
            style={{ backgroundColor: activeTab === 'expenses' ? '#D4AF7C' : '#222', color: activeTab === 'expenses' ? '#080808' : '#FAF9F6', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            📊 Expenses & Profits
          </button>
          <button 
            onClick={() => setActiveTab('raw-materials')} 
            style={{ backgroundColor: activeTab === 'raw-materials' ? '#D4AF7C' : '#222', color: activeTab === 'raw-materials' ? '#080808' : '#FAF9F6', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🧵 Raw Materials & Suppliers
          </button>
          <Link href="/admin" style={{ backgroundColor: '#222', color: '#FAF9F6', padding: '8px 15px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Back to Orders
          </Link>
        </div>
      </div>

      <main style={{ padding: '30px', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#8A8A8A' }}>Loading financial data...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            {/* প্রথম ট্যাব: এক্সপেন্স ও প্রফিট ম্যানেজমেন্ট */}
            {activeTab === 'expenses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* ওপরের ৩টি কার্ড */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  
                  <div style={{ backgroundColor: '#111', border: '1px solid #333', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ color: '#D4AF7C', marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid #222', paddingBottom: '8px' }}>⏳ Pending / Processing Orders</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8A8A' }}>মোট অর্ডার সংখ্যা (যাবتীয়):</span>
                        <strong style={{ color: '#FAF9F6' }}>{totalOrdersCount} টি</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8A8A' }}>প্রক্রিয়াধীন অর্ডার সংখ্যা:</span>
                        <strong style={{ color: '#f39c12' }}>{pendingProcessingCount} টি</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8A8A' }}>এই অর্ডারগুলোর মোট মূল্য:</span>
                        <strong style={{ color: '#FAF9F6' }}>৳ {pendingProcessingValue}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8A8A' }}>এই অর্ডারগুলোর মোট ডেলিভারি চার্জ:</span>
                        <strong style={{ color: '#FAF9F6' }}>৳ {pendingProcessingDeliveryCharge}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#111', border: '1px solid #2ecc71', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ color: '#2ecc71', marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid #222', paddingBottom: '8px' }}>✨ Delivered & Success Summary</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8A8A' }}>সফল ডেলিভারি অর্ডার:</span>
                        <strong style={{ color: '#2ecc71' }}>{deliveredOrdersCount} টি</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8A8A' }}>সফল ডেলিভারি প্রোডাক্ট সংখ্যা:</span>
                        <strong style={{ color: '#FAF9F6' }}>{deliveredProductsCount} টি</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8A8A' }}>সফল ডেলিভারি রেভিনিউ:</span>
                        <strong style={{ color: '#2ecc71' }}>৳ {deliveredRevenue}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8A8A' }}>সফল ডেলিভারির চার্জ (মাইনাসযোগ্য):</span>
                        <strong style={{ color: '#e74c3c' }}>৳ {deliveredDeliveryCharge}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#111', border: '1px solid #e74c3c', padding: '20px', borderRadius: '8px' }}>
                    <h4 style={{ color: '#e74c3c', marginBottom: '12px', fontSize: '14px', borderBottom: '1px solid #222', paddingBottom: '8px' }}>❌ Returns & Cancellations Risk</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8A8A' }}>রিটার্নড অর্ডার সংখ্যা:</span>
                        <strong style={{ color: '#e74c3c' }}>{returnedCount} টি (৳ {returnedDeliveryLoss})</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8A8A' }}>বাতিল (Cancelled) অর্ডার সংখ্যা:</span>
                        <strong style={{ color: '#95a5a6' }}>{cancelledCount} টি</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #333', paddingTop: '6px', marginTop: '4px' }}>
                        <span style={{ color: '#8A8A8A', fontWeight: 'bold' }}>রিটার্ন ডেলিভারি লস:</span>
                        <strong style={{ color: '#e74c3c' }}>৳ {totalDeliveryLoss}</strong>
                      </div>
                    </div>
                  </div>

                </div>

                {/* মূল ফর্ম ও প্রফিট ব্রেকডাউন */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '25px', alignItems: 'start' }}>
                  
                  {/* খরচ এন্ট্রি ফর্ম */}
                  <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '20px', borderRadius: '6px' }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', marginBottom: '15px', fontSize: '16px' }}>➕ নতুন খরচ যুক্ত করুন (Add Expense)</h3>
                    <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>খরচের নাম বা বিবরণ *</label>
                        <input 
                          type="text" 
                          placeholder="যেমন: র ম্যাটেরিয়াল কেনা, ফেসবুক অ্যাডস..." 
                          value={expenseTitle} 
                          onChange={e => setExpenseTitle(e.target.value)} 
                          style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>ক্যাটাগরি</label>
                        <select 
                          value={expenseCategory} 
                          onChange={e => setExpenseCategory(e.target.value)}
                          style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="Raw Materials">Raw Materials (কাঁচামাল)</option>
                          <option value="Packaging">Packaging (প্যাকেজিং)</option>
                          <option value="Advertising">Advertising (ফেসবুক/ইন্সটাগ্রাম অ্যাডস)</option>
                          <option value="Delivery Expense">Delivery Expense (ডেলিভারি খরচ)</option>
                          <option value="Website & Software">Website & Software</option>
                          <option value="Other">Other Expenses (অন্যান্য)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>পরিমাণ (টাকা) *</label>
                        <input 
                          type="number" 
                          placeholder="যেমন: ৫০০" 
                          value={expenseAmount} 
                          onChange={e => setExpenseAmount(e.target.value)} 
                          style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>পেমেন্ট মাধ্যম</label>
                        <select 
                          value={expenseMethod} 
                          onChange={e => setExpenseMethod(e.target.value)}
                          style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="Cash">Cash (নগদ)</option>
                          <option value="bKash">bKash (বিকাশ)</option>
                          <option value="Nagad">Nagad (নগদ)</option>
                          <option value="Bank">Bank Account</option>
                        </select>
                      </div>

                      {(expenseMethod === 'bKash' || expenseMethod === 'Nagad') && (
                        <div style={{ backgroundColor: '#161616', padding: '10px', borderRadius: '4px', border: '1px dashed #D4AF7C' }}>
                          <label style={{ fontSize: '10px', color: '#D4AF7C', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Transaction ID (TrxID) *</label>
                          <input 
                            type="text" 
                            placeholder="যেমন: 7G8H9K2L1" 
                            value={expenseTrxId} 
                            onChange={e => setExpenseTrxId(e.target.value)} 
                            style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #444', color: '#FAF9F6', padding: '8px', borderRadius: '4px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>নোট (ঐচ্ছিক)</label>
                        <input 
                          type="text" 
                          placeholder="অতিরিক্ত কোনো তথ্য..." 
                          value={expenseNote} 
                          onChange={e => setExpenseNote(e.target.value)} 
                          style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={addingExpense}
                        style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '12px', fontWeight: 'bold', fontSize: '12px', borderRadius: '4px', cursor: 'pointer', marginTop: '5px', textTransform: 'uppercase' }}
                      >
                        {addingExpense ? 'Saving...' : 'খরচ সেভ করুন'}
                      </button>
                    </form>
                  </div>

                  {/* প্রফিট ও এক্সপেন্স সামারি */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '20px', borderRadius: '6px' }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', marginBottom: '15px', fontSize: '16px' }}>📊 Net Profit & Expense Breakdown</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', fontSize: '12px' }}>
                        <div style={{ backgroundColor: '#161616', padding: '12px', borderRadius: '4px', border: '1px solid #222' }}>
                          <span style={{ color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>সফল ডেলিভারি রেভিনিউ:</span>
                          <strong style={{ fontSize: '15px', color: '#2ecc71' }}>৳ {deliveredRevenue}</strong>
                        </div>
                        <div style={{ backgroundColor: '#161616', padding: '12px', borderRadius: '4px', border: '1px solid #222' }}>
                          <span style={{ color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>মোট অপারেশনাল খরচ:</span>
                          <strong style={{ fontSize: '15px', color: '#e67e22' }}>৳ {totalExpensesAmount}</strong>
                        </div>
                        <div style={{ backgroundColor: '#161616', padding: '12px', borderRadius: '4px', border: '1px solid #222' }}>
                          <span style={{ color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>সফল ডেলিভারি চার্জ (মাইনাস):</span>
                          <strong style={{ fontSize: '15px', color: '#3498db' }}>৳ {deliveredDeliveryCharge}</strong>
                        </div>
                        <div style={{ backgroundColor: '#161616', padding: '12px', borderRadius: '4px', border: '1px solid #222' }}>
                          <span style={{ color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>রিটার্ন ডেলিভারি লস:</span>
                          <strong style={{ fontSize: '15px', color: '#e74c3c' }}>৳ {totalDeliveryLoss}</strong>
                        </div>

                        {/* গ্রস প্রফিট কার্ড */}
                        <div style={{ backgroundColor: '#161616', padding: '12px', borderRadius: '4px', border: '1px solid #3498db' }}>
                          <span style={{ color: '#3498db', display: 'block', marginBottom: '4px' }}>📈 গ্রস প্রফিট (Gross Profit):</span>
                          <strong style={{ fontSize: '16px', color: grossProfit >= 0 ? '#2ecc71' : '#e74c3c' }}>৳ {grossProfit}</strong>
                        </div>

                        {/* নিট প্রফিট কার্ড */}
                        <div style={{ backgroundColor: '#161616', padding: '12px', borderRadius: '4px', border: '1px solid #D4AF7C' }}>
                          <span style={{ color: '#D4AF7C', display: 'block', marginBottom: '4px' }}>✨ নিট প্রফিট (Net Profit):</span>
                          <strong style={{ fontSize: '16px', color: netProfit >= 0 ? '#2ecc71' : '#e74c3c' }}>৳ {netProfit}</strong>
                        </div>
                      </div>
                    </div>

                    {/* খরচের তালিকা টেবিল */}
                    <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '20px', borderRadius: '6px' }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', marginBottom: '15px', fontSize: '16px' }}>📋 খরচের হিস্ট্রি (Expense Records)</h3>
                      {expenses.length === 0 ? (
                        <div style={{ color: '#8A8A8A', fontSize: '12px', padding: '20px', textAlign: 'center' }}>এখনো কোনো খরচ এন্ট্রি করা হয়নি।</div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#1a1a1a', color: '#D4AF7C', borderBottom: '1px solid #222', fontSize: '10px' }}>
                                <th style={{ padding: '10px' }}>তারিখ</th>
                                <th style={{ padding: '10px' }}>বিবরণ</th>
                                <th style={{ padding: '10px' }}>ক্যাটাগরি</th>
                                <th style={{ padding: '10px' }}>মেথড ও ট্রানজ্যাকশন আইডি</th>
                                <th style={{ padding: '10px' }}>পরিমাণ</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>অ্যাকশন</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expenses.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                                  <td style={{ padding: '10px', fontSize: '11px', color: '#8A8A8A' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                                  <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                    {item.title}
                                    {item.note && <div style={{ fontSize: '10px', color: '#8A8A8A', fontWeight: 'normal' }}>{item.note}</div>}
                                  </td>
                                  <td style={{ padding: '10px' }}><span style={{ backgroundColor: '#222', padding: '2px 6px', borderRadius: '3px', fontSize: '10px' }}>{item.category}</span></td>
                                  <td style={{ padding: '10px', fontSize: '11px' }}>
                                    {item.payment_method}
                                    {item.transaction_id && item.transaction_id !== 'N/A' && (
                                      <div style={{ fontSize: '10px', color: '#D4AF7C', fontWeight: 'bold' }}>TrxID: {item.transaction_id}</div>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#e74c3c' }}>৳ {item.amount}</td>
                                  <td style={{ padding: '10px', textAlign: 'right' }}>
                                    <button onClick={() => handleDeleteExpense(item.id)} style={{ backgroundColor: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* দ্বিতীয় ট্যাব: কাঁচামাল ও সাপ্লায়ার ম্যানেজমেন্ট সেকশন (বকেয়া ও পরিশোধ হিসাবসহ) */}
            {activeTab === 'raw-materials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                {/* মোট বকেয়া ও পরিশোধিত অ্যামাউন্ট সামারি কার্ড */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div style={{ backgroundColor: '#111', border: '1px solid #e74c3c', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: '#e74c3c', margin: '0 0 5px 0', fontSize: '14px' }}>🚨 মোট বকেয়া পাওনা (Total Due):</h4>
                      <p style={{ fontSize: '11px', color: '#8A8A8A', margin: 0 }}>সাপ্লায়ারদের পরিশোধ করতে হবে</p>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', padding: '8px 15px', borderRadius: '6px', border: '1px solid #e74c3c' }}>
                      ৳ {totalDueAmount}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#111', border: '1px solid #2ecc71', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: '#2ecc71', margin: '0 0 5px 0', fontSize: '14px' }}>✅ মোট পরিশোধিত (Total Paid):</h4>
                      <p style={{ fontSize: '11px', color: '#8A8A8A', margin: 0 }}>ইতিমধ্যে পেমেন্ট করা হয়েছে</p>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: '8px 15px', borderRadius: '6px', border: '1px solid #2ecc71' }}>
                      ৳ {totalPaidAmount}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '25px', alignItems: 'start' }}>
                  
                  {/* কাঁচামাল যোগ করার ফর্ম */}
                  <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '20px', borderRadius: '6px' }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', marginBottom: '15px', fontSize: '16px' }}>🧵 কাঁচামাল ও সাপ্লায়ার এন্ট্রি</h3>
                    <form onSubmit={handleAddRawMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>কাঁচামালের নাম (Material Name) *</label>
                        <input 
                          type="text" 
                          placeholder="যেমন: ব্ল্যাক ন্যাম কর্ড, অ্যালফাবেট বিডস..." 
                          value={materialName} 
                          onChange={e => setMaterialName(e.target.value)} 
                          style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>সাপ্লায়ারের নাম (Supplier Name)</label>
                        <input 
                          type="text" 
                          placeholder="যেমন: চকবাজার হোলসেল শপ..." 
                          value={supplierName} 
                          onChange={e => setSupplierName(e.target.value)} 
                          style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>পরিমাণ (Quantity)</label>
                          <input 
                            type="number" 
                            placeholder="যেমন: ১০০" 
                            value={materialQty} 
                            onChange={e => setMaterialQty(e.target.value)} 
                            style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>একক</label>
                          <select 
                            value={materialUnit} 
                            onChange={e => setMaterialUnit(e.target.value)}
                            style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                          >
                            <option value="Pcs">Pcs</option>
                            <option value="Pack">Pack</option>
                            <option value="Bundle">Bundle</option>
                            <option value="Gram">Gram</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>ক্রয় খরচ (Purchase Cost ৳) *</label>
                        <input 
                          type="number" 
                          placeholder="যেমন: ১২০০" 
                          value={purchaseCost} 
                          onChange={e => setPurchaseCost(e.target.value)} 
                          style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#8A8A8A', display: 'block', marginBottom: '4px' }}>পেমেন্ট স্ট্যাটাস</label>
                        <select 
                          value={paymentStatus} 
                          onChange={e => setPaymentStatus(e.target.value)}
                          style={{ width: '100%', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="Due">Due (বকেয়া রাখুন)</option>
                          <option value="Paid">Paid (পরিশোধিত - সাথে সাথে খরচে যোগ হবে)</option>
                        </select>
                      </div>

                      <button 
                        type="submit" 
                        disabled={addingMaterial}
                        style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '12px', fontWeight: 'bold', fontSize: '12px', borderRadius: '4px', cursor: 'pointer', marginTop: '5px', textTransform: 'uppercase' }}
                      >
                        {addingMaterial ? 'Saving...' : 'কাঁচামাল সেভ করুন'}
                      </button>
                    </form>
                  </div>

                  {/* কাঁচামাল ও সাপ্লায়ার লেজার টেবিল */}
                  <div style={{ backgroundColor: '#111', border: '1px solid #222', padding: '20px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: 0, fontSize: '16px' }}>📦 Raw Materials Inventory & Supplier Ledger</h3>
                      
                      {/* ফিল্টার বাটন */}
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {['All', 'Due', 'Paid'].map(filter => (
                          <button 
                            key={filter} 
                            onClick={() => setMaterialFilter(filter)} 
                            style={{ backgroundColor: materialFilter === filter ? '#D4AF7C' : '#222', color: materialFilter === filter ? '#080808' : '#FAF9F6', border: 'none', padding: '5px 10px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredMaterials.length === 0 ? (
                      <div style={{ color: '#8A8A8A', fontSize: '12px', padding: '30px', textAlign: 'center' }}>এখনো কোনো কাঁচামাল বা সাপ্লায়ারের তথ্য যুক্ত করা হয়নি।</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#1a1a1a', color: '#D4AF7C', borderBottom: '1px solid #222', fontSize: '10px' }}>
                              <th style={{ padding: '10px' }}>তারিখ</th>
                              <th style={{ padding: '10px' }}>কাঁচামালের নাম</th>
                              <th style={{ padding: '10px' }}>সাপ্লায়ার</th>
                              <th style={{ padding: '10px' }}>পরিমাণ</th>
                              <th style={{ padding: '10px' }}>ক্রয় খরচ</th>
                              <th style={{ padding: '10px' }}>স্ট্যাটাস (ক্লিক করে পেমেন্ট করুন)</th>
                              <th style={{ padding: '10px', textAlign: 'right' }}>অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredMaterials.map((mat) => (
                              <tr key={mat.id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#8A8A8A' }}>{new Date(mat.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#FAF9F6' }}>{mat.material_name}</td>
                                <td style={{ padding: '10px', color: '#8A8A8A' }}>{mat.supplier_name}</td>
                                <td style={{ padding: '10px' }}>{mat.quantity} {mat.unit}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#D4AF7C' }}>৳ {mat.purchase_cost}</td>
                                <td style={{ padding: '10px' }}>
                                  <button 
                                    onClick={() => handleTogglePaymentStatus(mat)} 
                                    style={{ backgroundColor: mat.payment_status === 'Paid' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)', color: mat.payment_status === 'Paid' ? '#2ecc71' : '#e74c3c', border: `1px solid ${mat.payment_status === 'Paid' ? '#2ecc71' : '#e74c3c'}`, padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                                  >
                                    {mat.payment_status === 'Due' ? '⚠️ Due (Click to Pay)' : '✓ Paid (Click to Due)'}
                                  </button>
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                  <button onClick={() => handleDeleteRawMaterial(mat.id)} style={{ backgroundColor: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}