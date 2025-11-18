import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Box, Typography, Grid, Card, CardContent, CardMedia, Chip, Button, Rating, Select, MenuItem, InputLabel, FormControl, Avatar } from '@mui/material';
import axios from 'axios';
// Removed local Navbar to avoid duplicate nav bars
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';

// Helper to normalize image urls
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop&crop=center';
  if (imagePath.startsWith('http')) return imagePath;
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
  const backendOrigin = API_BASE.startsWith('http')
    ? new URL(API_BASE).origin
    : 'http://127.0.0.1:3001';
  return `${backendOrigin}/${String(imagePath).replace(/^\/+/, '')}`;
};

const VendorStore = () => {
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`vendors/${id}`);
        setVendor(res.data?.vendor || null);
        setProducts(res.data?.products || []);
      } catch (err) {
        console.error('Failed to load vendor', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]);

  const defaultCategories = ['All','Burgers','Pizza','Sandwiches','Drinks','Desserts','South Indian','North Indian','Chinese','Snacks','Breakfast','Salads'];
  const availableCategories = useMemo(() => {
    const found = new Set(
      (products || [])
        .map(p => (p.category || '').toString())
        .filter(Boolean)
    );
    // Merge with defaults ensuring 'All' first
    const merged = ['All', ...defaultCategories.filter(c => c !== 'All'), ...Array.from(found)];
    return Array.from(new Set(merged));
  }, [products]);

  const visibleProducts = useMemo(() => {
    let list = products.slice();
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter(p => (p.category || '').toString().toLowerCase() === selectedCategory.toLowerCase());
    }
    switch (sortBy) {
      case 'priceLow':
        list.sort((a,b) => (a.price||0) - (b.price||0));
        break;
      case 'priceHigh':
        list.sort((a,b) => (b.price||0) - (a.price||0));
        break;
      case 'rating':
        list.sort((a,b) => (b.rating?.average||0) - (a.rating?.average||0));
        break;
      default:
        // popular (fallback to rating count then rating)
        list.sort((a,b) => (b.rating?.count||0) - (a.rating?.count||0));
        break;
    }
    return list;
  }, [products, selectedCategory, sortBy]);

  

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #CD1C18 0%, #FFA896 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated background overlay, matches other pages */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `
              radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
            `,
            animation: 'float 20s ease-in-out infinite'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-50%',
            right: '-30%',
            width: '160%',
            height: '160%',
            background: `
              radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.07) 0%, transparent 50%),
              radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.06) 0%, transparent 50%)
            `,
            animation: 'float 26s ease-in-out infinite reverse'
          }
        }}
      />

      <Container maxWidth="lg" sx={{ py: 4, position: 'relative' }}>
        {vendor && (
          <Box mb={3}>
            {/* Vendor header with avatar */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.2)' : 'none'
              }}
            >
              <Avatar
                src={getImageUrl(vendor.profileImage)}
                alt={vendor.vendorDetails?.businessName || vendor.name}
                sx={{ width: 72, height: 72 }}
              />
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                  {vendor.vendorDetails?.businessName || vendor.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {vendor.vendorDetails?.location || 'On-campus vendor'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Menu controls */}
        <Box display="flex" flexWrap="wrap" gap={1.5} alignItems="center" mb={3}>
          {availableCategories.slice(0, 12).map(cat => (
            <Chip
              key={cat}
              label={cat}
              color={selectedCategory === cat ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(cat)}
              sx={{ fontWeight: 600 }}
            />
          ))}
          <Box sx={{ ml: 'auto', minWidth: { xs: '100%', sm: 220 } }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="sort-by-label">Sort by</InputLabel>
              <Select
                labelId="sort-by-label"
                label="Sort by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="popular">Most popular</MenuItem>
                <MenuItem value="rating">Top rated</MenuItem>
                <MenuItem value="priceLow">Price: Low to High</MenuItem>
                <MenuItem value="priceHigh">Price: High to Low</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {visibleProducts.map(p => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={p._id}>
              <Card
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  height: 300,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={getImageUrl((p.images && p.images[0]) || '')}
                  alt={p.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, pb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1} gap={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</Typography>
                    <Chip label={`₹${p.price}`} color="primary" sx={{ fontWeight: 700, flexShrink: 0 }} />
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Rating value={p.rating?.average || 0} precision={0.5} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary">({p.rating?.count || 0})</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </Typography>
                  <Box display="flex" gap={1} mt="auto">
                    <Button
                      variant="contained"
                      onClick={() => addToCart({
                        _id: p._id,
                        title: p.name,
                        price: p.price,
                        images: p.images,
                        type: 'product',
                        vendor: vendor?._id || (vendor && vendor.id) || p.vendor
                      })}
                      fullWidth
                    >
                      Add to Cart
                    </Button>
                    <Button variant="outlined" href={`/product/${p._id}`} fullWidth>Details</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {!loading && products.length === 0 && (
            <Box px={2}>
              <Typography>No products yet.</Typography>
            </Box>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default VendorStore;