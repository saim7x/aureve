'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export default function BottomNav() {
  const pathname = usePathname();
  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#D4AF7C" : "none"} stroke={active ? "#D4AF7C" : "#8A8A8A"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    {
      name: 'Shop',
      href: '/shop',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#D4AF7C" : "none"} stroke={active ? "#D4AF7C" : "#8A8A8A"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      )
    },
    {
      name: 'Cart',
      href: '/cart',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "#D4AF7C" : "none"} stroke={active ? "#D4AF7C" : "#8A8A8A"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      )
    }
  ];
  return (
    <>
      <div className="mobile-bottom-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} style={{ textDecoration: 'none', color: isActive ? '#D4AF7C' : '#8A8A8A', fontSize: '10px', textTransform: 'uppercase', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              {item.icon(isActive)}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      <style jsx global>{`
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 65px;
          background-color: rgba(8, 8, 8, 0.96);
          backdrop-filter: blur(8px);
          border-top: 1px solid #222222;
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 100;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.4);
        }
        @media (min-width: 768px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}