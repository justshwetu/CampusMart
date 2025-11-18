import React, { useEffect, useState, useCallback } from 'react';
import { Container, Box, Typography, TextField, Grid, Card, CardContent, Button, Alert, CardMedia, Chip, Stack } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { Store } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Removed local Navbar to avoid duplicate nav bars

const VendorsList = () => {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Helper to normalize backend file paths to full URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (String(imagePath).startsWith('http')) return imagePath;
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
    const backendOrigin = API_BASE.startsWith('http')
      ? new URL(API_BASE).origin
      : 'http://127.0.0.1:3001';
    return `${backendOrigin}/${String(imagePath).replace(/^\/+/, '')}`;
  };

  // Fallback: pick a shop photo based on vendor name/business type
  const getNameBasedPhoto = (title, businessType) => {
    const name = String(title || '').toLowerCase();
    const type = String(businessType || '').toLowerCase();

    const keywordMatch = (kw) => name.includes(kw) || type.includes(kw);

    let query = 'restaurant,food';
    if (keywordMatch('pizza')) query = 'pizza,restaurant';
    else if (keywordMatch('burger')) query = 'burger,restaurant';
    else if (keywordMatch('cafe') || keywordMatch('coffee')) query = 'cafe,coffee,shop';
    else if (keywordMatch('chai') || keywordMatch('tea')) query = 'tea,chai,stall';
    else if (keywordMatch('bakery')) query = 'bakery,shop';
    else if (keywordMatch('juice')) query = 'juice,bar,shop';
    else if (keywordMatch('sandwich')) query = 'sandwich,shop';
    else if (keywordMatch('chinese')) query = 'chinese,restaurant';
    else if (keywordMatch('south indian') || keywordMatch('dosa')) query = 'south%20indian,restaurant';
    else if (keywordMatch('north indian') || keywordMatch('biryani')) query = 'north%20indian,restaurant';

    // Use Unsplash featured image by query. As a deterministic fallback, seed by name via picsum.
    const unsplash = `https://source.unsplash.com/featured/?${query}`;
    const seed = encodeURIComponent(name || type || 'vendor');
    const picsum = `https://picsum.photos/seed/${seed}/800/400`;
    // Prefer Unsplash; picsum ensures uniqueness when Unsplash blocks repeated loads
    return unsplash || picsum;
  };

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const res = await axios.get('vendors', { params });
      setVendors(res.data?.vendors || []);
    } catch {
      setError('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

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
      {/* Animated background overlay for consistency */}
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
          }
        }}
      />
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative' }}>
        {error && (
          <Box mb={2}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Store color="primary" />
          <Typography variant="h5" fontWeight={600}>All Vendors</Typography>
        </Box>

        <Box display="flex" gap={2} mb={3}>
          <TextField
            placeholder="Search vendors by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={fetchVendors} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>

        <Grid container spacing={3}>
          {vendors.map((v) => {
            const title = v.vendorDetails?.businessName || v.name;
            const location = v.vendorDetails?.location;
            const businessType = v.vendorDetails?.businessType;
            const banner = getImageUrl(v.profileImage) || getNameBasedPhoto(title, businessType);
            return (
              <Grid item xs={12} sm={6} md={4} key={v._id}>
                <Card
                  onClick={() => navigate(`/vendor/${v._id}`)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: isDarkMode
                      ? '0 12px 28px rgba(0,0,0,0.35)'
                      : '0 12px 28px rgba(0,0,0,0.15)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: isDarkMode
                        ? '0 18px 40px rgba(0,0,0,0.45)'
                        : '0 18px 40px rgba(0,0,0,0.25)'
                    }
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      image={banner || (isDarkMode ? undefined : undefined)}
                      alt={title}
                      sx={{
                        height: { xs: 180, md: 180 },
                        width: '100%',
                        objectFit: 'cover',
                        background: !banner
                          ? (isDarkMode
                              ? 'linear-gradient(135deg,#1f1f1f,#2f2f2f)'
                              : 'linear-gradient(135deg,#FFE4E1,#FFD1C9)')
                          : undefined
                      }}
                    />
                    {/* Gradient overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.55) 100%)'
                      }}
                    />
                    <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
                      <Typography
                        variant="h6"
                        sx={{ color: 'white', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                      >
                        {title}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        {businessType && (
                          <Chip size="small" label={businessType} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(6px)' }} />
                        )}
                        {location && (
                          <Chip size="small" label={location} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(6px)' }} />
                        )}
                      </Stack>
                    </Box>
                  </Box>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Visit shop for menu and timings
                    </Typography>
                    <Button size="small" variant="contained">View Shop</Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default VendorsList;