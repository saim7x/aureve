export const metadata = {
  title: 'AUREVÉ – Elegance in Every Detail',
  description: 'Handcrafted luxury accessories and custom base lights.',
  icons: {
    icon: '/images/logo.png', // public ফোল্ডারের ভেতরের লোগোর ফাইল পাথ
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Playfair+Display:wght@400;500;700&display=swap" rel="stylesheet" />
        
        {/* Netlify Badge Hide CSS */}
        <style>{`
          a[href*="netlify.com"][target="_blank"],
          div[id*="netlify-badge"],
          iframe[title*="Netlify"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Montserrat', sans-serif", backgroundColor: '#FAF9F6', color: '#080808' }}>
        {children}
      </body>
    </html>
  );
}
