import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Rating,
  IconButton,
  Skeleton,
  Alert
} from '@mui/material';
import {
  Search,
  Restaurant,
  ShoppingCart,
  Store,
  ShoppingBag,
  LocationOn,
  AccessTime,
  Star,
  Add,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const Dashboard = () => {
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch vendors
      const vendorsResponse = await axios.get('/vendors');
      setVendors(vendorsResponse.data.vendors.slice(0, 6)); // Show top 6
      
      // Fetch featured products
      const productsResponse = await axios.get('/products/featured');
      setProducts(productsResponse.data.products.slice(0, 8)); // Show top 8
      
      // Fetch recent marketplace items (for students)
      if (user?.role === 'student') {
        const marketplaceResponse = await axios.get('/marketplace/recent');
        setMarketplaceItems(marketplaceResponse.data.items.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleVendorClick = (vendorId) => {
    navigate(`/vendor/${vendorId}`);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const renderWelcomeSection = () => (
    <Box
      sx={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #CD1C18 0%, #FFA896 100%)',
        color: 'white',
        borderRadius: 3,
        p: 4,
        mb: 4,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome back, {user?.name}! 👋
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
          {user?.role === 'student' 
            ? 'Discover delicious food and great deals on campus'
            : user?.role === 'vendor'
            ? 'Manage your business and reach more customers'
            : 'Oversee the campus marketplace'
          }
        </Typography>
        
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search for food, vendors, or items..."
          value={searchTerm}
          onChange={handleSearch}
          sx={{
            maxWidth: 500,
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDarkMode 
                ? 'rgba(255, 255, 255, 0.15)' 
                : 'rgba(255, 255, 255, 0.9)',
              borderRadius: 2,
              color: isDarkMode ? '#ffffff' : '#333333',
              '& fieldset': {
                border: 'none'
              },
              '& input::placeholder': {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                opacity: 1
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          zIndex: 0
        }}
      />
    </Box>
  );

  const renderQuickActions = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <Card
          sx={{
            height: '100%',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(226, 55, 68, 0.2)'
            }
          }}
          onClick={() => navigate('/vendors')}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e23744, #ff6b75)',
                mx: 'auto',
                mb: 2
              }}
            >
              <Restaurant sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Local Vendors
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Discover food outlets and restaurants on campus
            </Typography>
            <Chip
              label={`${vendors.length}+ Vendors`}
              color="primary"
              size="small"
            />
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card
          sx={{
            height: '100%',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 32px rgba(255, 152, 0, 0.2)'
            }
          }}
          onClick={() => navigate('/marketplace')}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                mx: 'auto',
                mb: 2
              }}
            >
              <ShoppingBag sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Student Marketplace
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Buy and sell second-hand items with fellow students
            </Typography>
            <Chip
              label={`${marketplaceItems.length}+ Items`}
              sx={{ bgcolor: '#ff9800', color: 'white' }}
              size="small"
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFeaturedProducts = () => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
          Featured Food Items
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/products')}
          sx={{ borderRadius: 2 }}
        >
          View All
        </Button>
      </Box>
      
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={24} />
                  <Skeleton variant="text" height={20} width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={3} key={product._id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleProductClick(product._id)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={product.images?.[0] || '/placeholder-food.jpg'}
                  alt={product.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {product.vendor?.vendorDetails?.businessName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                      ₹{product.price}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Star sx={{ fontSize: 16, color: '#ffc107', mr: 0.5 }} />
                      <Typography variant="caption">
                        {product.rating?.average?.toFixed(1) || '0.0'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderTopVendors = () => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <Store sx={{ mr: 1, color: 'primary.main' }} />
          Popular Vendors
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/vendors')}
          sx={{ borderRadius: 2 }}
        >
          View All
        </Button>
      </Box>
      
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="circular" width={60} height={60} />
                  <Skeleton variant="text" height={24} sx={{ mt: 1 }} />
                  <Skeleton variant="text" height={20} width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {vendors.map((vendor) => (
            <Grid item xs={12} md={4} key={vendor._id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleVendorClick(vendor._id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e23744, #ff6b75)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}
                    >
                      <Restaurant sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {vendor.vendorDetails?.businessName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vendor.name}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {vendor.vendorDetails?.location}
                    </Typography>
                  </Box>
                  <Chip
                    label={vendor.vendorDetails?.businessType}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: isDarkMode
              ? `
                radial-gradient(circle at 20% 80%, rgba(155, 19, 19, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(205, 28, 24, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(56, 0, 10, 0.05) 0%, transparent 50%)
              `
              : `
                radial-gradient(circle at 20% 80%, rgba(205, 28, 24, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 168, 150, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(155, 19, 19, 0.05) 0%, transparent 50%)
              `,
            animation: 'backgroundFloat 25s ease-in-out infinite'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: isDarkMode
              ? `
                radial-gradient(circle at 60% 60%, rgba(56, 0, 10, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 90% 10%, rgba(155, 19, 19, 0.06) 0%, transparent 50%)
              `
              : `
                radial-gradient(circle at 60% 60%, rgba(255, 168, 150, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 90% 10%, rgba(205, 28, 24, 0.06) 0%, transparent 50%)
              `,
            animation: 'backgroundFloat 30s ease-in-out infinite reverse'
          },
          '@keyframes backgroundFloat': {
            '0%, 100%': {
              transform: 'translate(0px, 0px) rotate(0deg)'
            },
            '33%': {
              transform: 'translate(20px, -20px) rotate(120deg)'
            },
            '66%': {
              transform: 'translate(-15px, 15px) rotate(240deg)'
            }
          }
        }}
      />
      
      {/* Floating Geometric Shapes */}
      {[...Array(8)].map((_, index) => (
        <Box
          key={index}
          sx={{
             position: 'absolute',
             width: { xs: '40px', md: '60px' },
             height: { xs: '40px', md: '60px' },
             borderRadius: index % 3 === 0 ? '50%' : index % 3 === 1 ? '20%' : '0%',
             background: isDarkMode
               ? `rgba(255, 168, 150, ${0.03 + (index * 0.01)})`
               : `rgba(205, 28, 24, ${0.05 + (index * 0.01)})`,
             backdropFilter: 'blur(5px)',
             border: isDarkMode 
               ? '1px solid rgba(255, 168, 150, 0.1)'
               : '1px solid rgba(205, 28, 24, 0.1)',
             top: `${5 + (index * 12)}%`,
             left: `${2 + (index * 12)}%`,
             animation: `dashboardFloat${index} ${18 + index * 3}s ease-in-out infinite`,
             zIndex: 1,
            '@keyframes dashboardFloat0': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-15px) rotate(180deg)' }
            },
            '@keyframes dashboardFloat1': {
              '0%, 100%': { transform: 'translateX(0px) rotate(0deg)' },
              '50%': { transform: 'translateX(15px) rotate(-180deg)' }
            },
            '@keyframes dashboardFloat2': {
              '0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
              '50%': { transform: 'translate(-10px, -10px) rotate(90deg)' }
            },
            '@keyframes dashboardFloat3': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(12px) scale(1.05)' }
            },
            '@keyframes dashboardFloat4': {
              '0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
              '50%': { transform: 'translate(8px, -8px) rotate(-90deg)' }
            },
            '@keyframes dashboardFloat5': {
              '0%, 100%': { transform: 'translateX(0px) rotate(0deg)' },
              '50%': { transform: 'translateX(-18px) rotate(270deg)' }
            },
            '@keyframes dashboardFloat6': {
              '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
              '50%': { transform: 'translate(10px, 10px) scale(0.95)' }
            },
            '@keyframes dashboardFloat7': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-20px) rotate(360deg)' }
            }
          }}
        />
      ))}
      
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 10 }}>
        {renderWelcomeSection()}
        {renderQuickActions()}
        {renderFeaturedProducts()}
        {renderTopVendors()}
      </Container>
    </Box>
  );
};

export default Dashboard;