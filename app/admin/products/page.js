'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AdminHeader from '../../components/AdminHeader';

export default function AdminProductsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState('Signature Products');
  
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('aureve_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchProducts();
    } else {
      router.push('/admin');
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Fetch Products Error:', error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleMultipleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    let uploadedUrls = [...images];

    for (let file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
    }

    setImages(uploadedUrls);
    setUploadingImage(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleOpenNewModal = () => {
    setEditingProduct(null);
    setTitle('');
    setPrice('');
    setOriginalPrice('');
    setCategory('Signature Products');
    setImages([]);
    setStock('10');
    setDescription('');
    setIsFeatured(false);
    setShowModal(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setTitle(product.title || product.name || '');
    setPrice(product.price || '');
    setOriginalPrice(product.original_price || '');
    setCategory(product.category || 'Signature Products');
    
    let prodImages = [];
    if (product.images && Array.isArray(product.images)) {
      prodImages = product.images;
    } else if (product.image) {
      prodImages = [product.image];
    } else if (product.img) {
      prodImages = [product.img];
    }
    setImages(prodImages);

    setStock(product.stock !== undefined ? product.stock : 10);
    setDescription(product.description || '');
    setIsFeatured(product.is_featured || false);
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price || images.length === 0) {
      alert('অনুগ্রহ করে পণ্যের নাম, দাম এবং কমপক্ষে একটি ছবি প্রদান করুন!');
      return;
    }

    setIsSaving(true);

    const primaryImage = images[0] || '';
    const generatedCode = `AUR-${Math.floor(10000 + Math.random() * 90000)}`;

    const payload = {
      title: title,
      name: title,
      product_id_code: editingProduct ? (editingProduct.product_id_code || generatedCode) : generatedCode,
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      category: category,
      image: primaryImage,
      img: primaryImage,
      images: images,
      stock: parseInt(stock) || 0,
      description: description,
      is_featured: isFeatured
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id);

      if (error) {
        alert('আপডেট ব্যর্থ হয়েছে: ' + error.message);
      } else {
        alert('প্রোডাক্ট সফলভাবে আপডেট করা হয়েছে!');
        setShowModal(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([payload]);

      if (error) {
        alert('নতুন প্রোডাক্ট যোগ করতে সমস্যা হয়েছে: ' + error.message);
      } else {
        alert('নতুন প্রোডাক্ট সফলভাবে যোগ করা হয়েছে!');
        setShowModal(false);
        fetchProducts();
      }
    }

    setIsSaving(false);
  };

  const handleDeleteProduct = async (id, prodTitle) => {
    if (window.confirm(`আপনি কি সত্যিই "${prodTitle}" প্রোডাক্টটি মুছে ফেলতে চান? এর ছবি এবং সকল তথ্য চিরতরে মুছে যাবে।`)) {
      
      const { data: prodData, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!fetchError && prodData) {
        let imgsToDelete = [];
        if (prodData.images && Array.isArray(prodData.images)) {
          imgsToDelete = prodData.images;
        } else if (prodData.image) {
          imgsToDelete = [prodData.image];
        } else if (prodData.img) {
          imgsToDelete = [prodData.img];
        }

        for (let imgUrl of imgsToDelete) {
          try {
            const urlObj = new URL(imgUrl);
            const pathParts = urlObj.pathname.split('/product-images/');
            if (pathParts.length > 1) {
              const filePath = `product-images/${pathParts[1]}`;
              await supabase.storage.from('product-images').remove([filePath]);
            }
          } catch (err) {
            console.error('Image delete error:', err);
          }
        }
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        alert('ডিলিট করতে সমস্যা হয়েছে: ' + error.message);
      } else {
        alert('প্রোডাক্ট এবং এর সাথে সম্পর্কিত ছবি সফলভাবে সম্পূর্ণ ডিলিট করা হয়েছে!');
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  if (!isAuthenticated) return null;

  const filteredProducts = products.filter(p => {
    const prodCategory = p.category || 'Signature Products';
    if (filterCategory !== 'All' && prodCategory !== filterCategory) return false;
    
    const search = searchTerm.toLowerCase();
    const prodTitle = (p.title || p.name || '').toLowerCase();
    return !searchTerm || prodTitle.includes(search);
  });

  return (
    <div style={{ backgroundColor: '#080808', color: '#FAF9F6', minHeight: '100vh', fontFamily: "'Montserrat', sans-serif", display: 'flex', flexDirection: 'column' }}>
      
      <AdminHeader />

      <main style={{ padding: '30px', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* টপ হেডার */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: 0, fontSize: '24px' }}>Product & Inventory Management</h1>
            <p style={{ fontSize: '12px', color: '#8A8A8A', margin: '4px 0 0 0' }}>প্রোডাক্ট ইনভেন্টরি স্টক এবং ক্যাটালগ নিয়ন্ত্রণ করুন</p>
          </div>
          
          <button 
            onClick={handleOpenNewModal}
            style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '10px 20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>✨</span> Add New Product
          </button>
        </div>

        {/* সার্চ ও ফিল্টার বার */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#111', padding: '15px', borderRadius: '6px', border: '1px solid #222', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#8A8A8A' }}>Category:</span>
            {['All', 'Signature Products', 'Custom Products', 'Other Products'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setFilterCategory(cat)} 
                style={{ backgroundColor: filterCategory === cat ? '#D4AF7C' : '#222', color: filterCategory === cat ? '#080808' : '#FAF9F6', border: 'none', padding: '6px 12px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer', fontWeight: '600' }}
              >
                {cat}
              </button>
            ))}
          </div>

          <input 
            type="text" 
            placeholder="Search Product Name..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', width: '250px', outline: 'none' }} 
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8A8A8A' }}>Loading Inventory Products...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#111', borderRadius: '6px', color: '#8A8A8A' }}>কোনো প্রোডাক্ট পাওয়া যায়নি।</div>
        ) : (
          <div style={{ overflowX: 'auto', backgroundColor: '#111', borderRadius: '6px', border: '1px solid #222' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1a1a1a', color: '#D4AF7C', borderBottom: '1px solid #222', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px' }}>
                  <th style={{ padding: '14px' }}>Product</th>
                  <th style={{ padding: '14px' }}>Category</th>
                  <th style={{ padding: '14px' }}>Price (Sale / Original)</th>
                  <th style={{ padding: '14px' }}>Current Stock</th>
                  <th style={{ padding: '14px' }}>Sales Count</th>
                  <th style={{ padding: '14px' }}>Featured</th>
                  <th style={{ padding: '14px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const prodStock = product.stock !== undefined ? product.stock : 10;
                  const isLowStock = prodStock <= 3;
                  const firstImg = product.image || product.img || (product.images && product.images[0]) || '';

                  return (
                    <tr key={product.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {firstImg ? (
                            <img 
                              src={firstImg} 
                              alt={product.title} 
                              style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #D4AF7C' }} 
                            />
                          ) : (
                            <div style={{ width: '45px', height: '45px', backgroundColor: '#222', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '9px' }}>No Img</div>
                          )}
                          <div>
                            <strong style={{ color: '#FAF9F6', fontSize: '12px', display: 'block' }}>{product.title || product.name}</strong>
                            <span style={{ fontSize: '10px', color: '#666' }}>ID: #{product.id} {product.images?.length > 1 && `(${product.images.length} images)`}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px', color: '#8A8A8A' }}>
                        {product.category || 'Signature Products'}
                      </td>

                      <td style={{ padding: '14px' }}>
                        <strong style={{ color: '#D4AF7C', fontSize: '13px' }}>৳{product.price}</strong>
                        {product.original_price && (
                          <span style={{ textDecoration: 'line-through', color: '#666', fontSize: '10px', marginLeft: '6px' }}>৳{product.original_price}</span>
                        )}
                      </td>

                      <td style={{ padding: '14px' }}>
                        <span style={{ 
                          backgroundColor: isLowStock ? 'rgba(231, 76, 60, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                          color: isLowStock ? '#e74c3c' : '#2ecc71',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          border: '1px solid currentColor'
                        }}>
                          {prodStock} pcs {isLowStock && '(Low Stock!)'}
                        </span>
                      </td>

                      <td style={{ padding: '14px', color: '#FAF9F6', fontWeight: 'bold' }}>
                        {product.sales || 0} sold
                      </td>

                      <td style={{ padding: '14px' }}>
                        {product.is_featured ? (
                          <span style={{ color: '#f1c40f', fontSize: '10px', fontWeight: 'bold' }}>★ Featured</span>
                        ) : (
                          <span style={{ color: '#555', fontSize: '10px' }}>Normal</span>
                        )}
                      </td>

                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleEditClick(product)}
                            style={{ backgroundColor: '#222', color: '#FAF9F6', border: '1px solid #444', padding: '6px 12px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer' }}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id, product.title || product.name)}
                            style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 10px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer' }}
                          >
                            🗑️ Delete
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

      </main>

      {/* প্রোডাক্ট এডিট/অ্যাড মোডাল উইন্ডো */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: '20px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #D4AF7C', borderRadius: '8px', width: '100%', maxWidth: '600px', padding: '25px', boxShadow: '0 10px 40px rgba(0,0,0,0.9)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#D4AF7C', margin: 0, fontSize: '18px' }}>
                {editingProduct ? 'Edit Product & Images' : 'Add New Product with Multiple Images'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ backgroundColor: 'transparent', color: '#8A8A8A', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>Product Title / Name *</label>
                <input type="text" placeholder="e.g. Royal Crown Onyx Bracelet" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>Sale Price (৳) *</label>
                  <input type="number" placeholder="450" value={price} onChange={e => setPrice(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>Original / Cut Price (৳)</label>
                  <input type="number" placeholder="600 (Optional)" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>Category *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="Signature Products">Signature Products</option>
                    <option value="Custom Products">Custom Products</option>
                    <option value="Other Products">Other Products</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>Available Stock (Pcs) *</label>
                  <input type="number" placeholder="10" value={stock} onChange={e => setStock(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#D4AF7C', display: 'block', marginBottom: '4px', letterSpacing: '1px', fontWeight: 'bold' }}>Product Images (Multiple Allowed) *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#080808', padding: '12px', borderRadius: '4px', border: '1px dashed #D4AF7C' }}>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleMultipleImageUpload} 
                    style={{ color: '#FAF9F6', fontSize: '11px', cursor: 'pointer' }} 
                  />
                  {uploadingImage && <span style={{ fontSize: '11px', color: '#D4AF7C' }}>Uploading multiple images...</span>}
                  
                  <span style={{ fontSize: '10px', color: '#8A8A8A' }}>Uploaded Images Preview ({images.length}):</span>
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {images.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '55px', height: '55px' }}>
                        <img src={url} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #D4AF7C' }} />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveImage(idx)}
                          style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', textTransform: 'uppercase', color: '#8A8A8A', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>Description</label>
                <textarea rows="3" placeholder="Product details..." value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#080808', border: '1px solid #333', color: '#FAF9F6', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}></textarea>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="featuredCheck" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ accentColor: '#D4AF7C', width: '16px', height: '16px' }} />
                <label htmlFor="featuredCheck" style={{ fontSize: '11px', color: '#FAF9F6', cursor: 'pointer' }}>Mark as Featured Product</label>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                style={{ backgroundColor: '#D4AF7C', color: '#080808', border: 'none', padding: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '4px', cursor: 'pointer', marginTop: '10px', letterSpacing: '1px' }}
              >
                {isSaving ? 'Saving Product...' : (editingProduct ? 'Update Product' : 'Publish Product')}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}