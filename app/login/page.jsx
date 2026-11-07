'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/orders');

  // ইউজারের আগের পেজ বা যেখান থেকে লগইন পেজে এসেছে তা ট্র্যাক করা
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextUrl = params.get('next');
    if (nextUrl) {
      setRedirectPath(nextUrl);
    } else if (document.referrer && document.referrer.startsWith(window.location.origin)) {
      try {
        const urlObj = new URL(document.referrer);
        // যদি পেজটি লগইন পেজ না হয়, তবে সেই পেজেই ফেরত পাঠাবে
        if (!urlObj.pathname.includes('/login')) {
          setRedirectPath(urlObj.pathname + urlObj.search);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // গুগল দিয়ে লগইন করার ডাইনামিক হ্যান্ডলার
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Login error:', err.message);
      alert('Failed to login with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#FAF9F6', color: '#080808', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: "'Montserrat', sans-serif" }}>
      
      {/* Simple Header */}
      <header style={{ backgroundColor: '#080808', padding: '20px', textAlign: 'center', borderBottom: '1px solid #222' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', textDecoration: 'none', color: '#D4AF7C' }}>
          AUREVÉ
        </Link>
      </header>

      {/* Login Box Container */}
      <main style={{ maxWidth: '400px', width: '90%', margin: 'auto', padding: '40px 30px', backgroundColor: '#FFFFFF', border: '1px solid #EDE6D9', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', marginBottom: '10px', color: '#080808' }}>
          Welcome Back
        </h2>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '30px' }}>
          Sign in to access your orders and manage your profile seamlessly.
        </p>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: '#080808',
            color: '#FAF9F6',
            border: 'none',
            padding: '14px',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            transition: 'background 0.3s'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#D4AF7C" d="M21.35 11.1h-9.17v2.73h5.51c-.24 1.35-1.5 3.96-5.51 3.96-3.32 0-6.03-2.75-6.03-6.13s2.71-6.13 6.03-6.13c1.89 0 3.16.81 3.89 1.5l2.08-2.01C16.07 3.39 14.34 2.6 12.18 2.6 6.91 2.6 2.64 6.87 2.64 12.14s4.27 9.54 9.54 9.54c5.51 0 9.16-3.88 9.16-9.35 0-.64-.07-1.12-.19-1.23z"/>
          </svg>
          {loading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div style={{ marginTop: '25px', fontSize: '12px', color: '#888' }}>
          <Link href="/" style={{ color: '#D4AF7C', textDecoration: 'none', fontWeight: '600' }}>
            &larr; Back to Home
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '20px', fontSize: '10px', color: '#888', borderTop: '1px solid #EDE6D9' }}>
        © 2026 AUREVÉ. All rights reserved.
      </footer>

    </div>
  );
}