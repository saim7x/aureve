'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('aureve_admin_auth');
    if (authStatus !== 'true') {
      router.push('/admin');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('aureve_admin_auth');
    router.push('/admin');
  };

  if (!authorized) return null;

  return (
    <header style={{ backgroundColor: '#111', borderBottom: '1px solid #222', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#D4AF7C', margin: 0, letterSpacing: '2px' }}>AUREVÉ ADMIN</h1>
        <span style={{ backgroundColor: '#D4AF7C', color: '#080808', fontSize: '9px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '3px', textTransform: 'uppercase' }}>Secure Control</span>
      </div>

      {/* সমস্ত অ্যাডমিন পেজের নেভিগেশন বাটন */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/admin" style={{ backgroundColor: pathname === '/admin' ? '#D4AF7C' : 'transparent', color: pathname === '/admin' ? '#080808' : '#FAF9F6', border: '1px solid #D4AF7C', padding: '6px 12px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', borderRadius: '4px', textDecoration: 'none' }}>
          Orders
        </Link>
        <Link href="/admin/products" style={{ backgroundColor: pathname === '/admin/products' ? '#D4AF7C' : 'transparent', color: pathname === '/admin/products' ? '#080808' : '#FAF9F6', border: '1px solid #D4AF7C', padding: '6px 12px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', borderRadius: '4px', textDecoration: 'none' }}>
          Products
        </Link>
        <Link href="/admin/manual-orders" style={{ backgroundColor: pathname === '/admin/manual-orders' ? '#D4AF7C' : 'transparent', color: pathname === '/admin/manual-orders' ? '#080808' : '#FAF9F6', border: '1px solid #D4AF7C', padding: '6px 12px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', borderRadius: '4px', textDecoration: 'none' }}>
          Manual Order
        </Link>
        <Link href="/admin/expenses" style={{ backgroundColor: pathname === '/admin/expenses' ? '#D4AF7C' : 'transparent', color: pathname === '/admin/expenses' ? '#080808' : '#FAF9F6', border: '1px solid #D4AF7C', padding: '6px 12px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', borderRadius: '4px', textDecoration: 'none' }}>
          Accounting
        </Link>
        <Link href="/admin/reviews" style={{ backgroundColor: pathname === '/admin/reviews' ? '#D4AF7C' : 'transparent', color: pathname === '/admin/reviews' ? '#080808' : '#FAF9F6', border: '1px solid #D4AF7C', padding: '6px 12px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', borderRadius: '4px', textDecoration: 'none' }}>
          Reviews
        </Link>
        <Link href="/admin/settings" style={{ backgroundColor: pathname === '/admin/settings' ? '#D4AF7C' : 'transparent', color: pathname === '/admin/settings' ? '#080808' : '#FAF9F6', border: '1px solid #D4AF7C', padding: '6px 12px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', borderRadius: '4px', textDecoration: 'none' }}>
          Settings
        </Link>
        <button onClick={handleLogout} style={{ backgroundColor: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 10px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>
          Lock
        </button>
      </div>
    </header>
  );
}