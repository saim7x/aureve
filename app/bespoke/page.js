'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminHeader() {
  const pathname = usePathname();

  const navLinks = [
    { name: '📊 Dashboard', href: '/admin' },
    { name: '📦 Orders', href: '/admin/orders' },
    { name: '🏷️ Products', href: '/admin/products' },
    { name: '👥 Customers', href: '/admin/customers' },
    { name: '💰 Accounting', href: '/admin/accounting' },
    { name: '📢 Marketing', href: '/admin/marketing' },
    { name: '⚙️ Settings', href: '/admin/settings' }, // এখানে নতুন সেটিংস ট্যাব যুক্ত করা হলো
  ];

  return (
    <header style={{ backgroundColor: '#111', borderBottom: '1px solid #222', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', fontFamily: "'Montserrat', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Link href="/admin" style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 'bold', color: '#D4AF7C', textDecoration: 'none', letterSpacing: '1px' }}>
          AUREVÉ ADMIN
        </Link>
      </div>

      <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              style={{
                backgroundColor: isActive ? '#D4AF7C' : '#1a1a1a',
                color: isActive ? '#080808' : '#FAF9F6',
                padding: '8px 14px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                border: isActive ? '1px solid #D4AF7C' : '1px solid #333'
              }}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}