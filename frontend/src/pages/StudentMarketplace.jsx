import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Divider
} from '@mui/material';
import {
  Add,
  PhotoCamera,
  Delete,
  Edit,
  ShoppingCart,
  Visibility,
  LocationOn,
  AttachMoney,
  Category,
  Person,
  Phone,
  Email
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const StudentMarketplace = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [items, setItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: '',
    isNegotiable: true,
    contactInfo: {
      phone: '',
      email: user?.email || '',
      preferredContact: 'both'
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const categories = [
    'books', 'electronics', 'furniture', 'clothing', 
    'sports', 'stationery', 'gadgets', 'other'
  ];

  const conditions = [
    'new', 'like-new', 'good', 'fair', 'poor'
  ];

  useEffect(() => {
    fetchMarketplaceItems();
    if (user) {
      fetchMyItems();
    }
  }, [user]);

  const fetchMarketplaceItems = async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      
      const response = await axios.get(`/marketplace?page=${pageNum}&limit=10`);
      const newItems = response.data.items || [];
      
      if (append) {
        setItems(prev => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }
      
      setHasMore(newItems.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      setError('Failed to load marketplace items');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreItems = () => {
    if (!loadingMore && hasMore) {
      fetchMarketplaceItems(page + 1, true);
    }
  };

  const fetchMyItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/marketplace/my-items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching my items:', error);
    }
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + selectedImages.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
  };

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('contactInfo.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        contactInfo: {
          ...formData.contactInfo,
          [field]: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem && selectedImages.length === 0) {
      setError('Please select at least one image');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'contactInfo') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      selectedImages.forEach(image => {
        formDataToSend.append('images', image);
      });

      const token = localStorage.getItem('token');
      
      if (editingItem) {
        // Update existing item
        await axios.put(`/marketplace/${editingItem._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        setSuccess('Item updated successfully!');
      } else {
        // Create new item
        await axios.post('/marketplace', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        setSuccess('Item uploaded successfully! It will be visible after admin approval.');
      }

      setOpenDialog(false);
      resetForm();
      fetchMyItems();
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${editingItem ? 'update' : 'upload'} item`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      condition: '',
      location: '',
      isNegotiable: true,
      contactInfo: {
        phone: '',
        email: user?.email || '',
        preferredContact: 'both'
      }
    });
    setSelectedImages([]);
    setEditingItem(null);
  };

  const handleInterest = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/marketplace/${itemId}/interest`, {
        message: 'I am interested in this item'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Interest shown! Seller will be notified.');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to show interest');
    }
  };

  const handleEditItem = (item) => {
    // Pre-fill form with existing item data
    setFormData({
      title: item.title,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      condition: item.condition,
      location: item.location,
      contactInfo: item.contactInfo || { phone: '', email: '', preferredMethod: 'both' },
      isNegotiable: item.isNegotiable || false
    });
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/marketplace/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Item deleted successfully!');
        fetchMyItems();
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete item');
      }
    }
  };

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
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
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
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: `
              radial-gradient(circle at 60% 60%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.06) 0%, transparent 50%)
            `,
            animation: 'float 25s ease-in-out infinite reverse'
          },
          '@keyframes float': {
            '0%, 100%': {
              transform: 'translate(0px, 0px) rotate(0deg)'
            },
            '33%': {
              transform: 'translate(30px, -30px) rotate(120deg)'
            },
            '66%': {
              transform: 'translate(-20px, 20px) rotate(240deg)'
            }
          }
        }}
      />
      
      {/* Floating Geometric Shapes */}
      {[...Array(6)].map((_, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            width: { xs: '60px', md: '80px' },
            height: { xs: '60px', md: '80px' },
            borderRadius: index % 2 === 0 ? '50%' : '20%',
            background: `rgba(255, 255, 255, ${0.05 + (index * 0.02)})`,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            top: `${10 + (index * 15)}%`,
            left: `${5 + (index * 15)}%`,
            animation: `floatShape${index} ${15 + index * 2}s ease-in-out infinite`,
            '@keyframes floatShape0': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-20px) rotate(180deg)' }
            },
            '@keyframes floatShape1': {
              '0%, 100%': { transform: 'translateX(0px) rotate(0deg)' },
              '50%': { transform: 'translateX(20px) rotate(-180deg)' }
            },
            '@keyframes floatShape2': {
              '0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
              '50%': { transform: 'translate(-15px, -15px) rotate(90deg)' }
            },
            '@keyframes floatShape3': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(15px) scale(1.1)' }
            },
            '@keyframes floatShape4': {
              '0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
              '50%': { transform: 'translate(10px, -10px) rotate(-90deg)' }
            },
            '@keyframes floatShape5': {
              '0%, 100%': { transform: 'translateX(0px) rotate(0deg)' },
              '50%': { transform: 'translateX(-25px) rotate(270deg)' }
            }
          }}
        />
      ))}
      
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
            Student Marketplace
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 3 }}>
            Buy and sell second-hand items with fellow students
          </Typography>
          
          {/* Add Item Button */}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #9B1313, #38000A)',
              '&:hover': {
                background: 'linear-gradient(135deg, #38000A, #9B1313)'
              }
            }}
          >
            Sell an Item
          </Button>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.2)', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
              '& .Mui-selected': { color: 'white !important' },
              '& .MuiTabs-indicator': { backgroundColor: 'white' }
            }}
          >
            <Tab label="Browse Items" />
            <Tab label={`My Items (${myItems.length})`} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box sx={{ maxWidth: '800px', margin: '0 auto' }}>
            {items.map((item) => (
              <Box key={item._id} sx={{ mb: 3 }}>
                <Card 
                  sx={{ 
                    background: isDarkMode 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.2)' : 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: isDarkMode 
                        ? '0 8px 32px rgba(255,255,255,0.1)'
                        : '0 8px 32px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                    {/* Image Section */}
                    <Box
                      sx={{
                        width: { xs: '100%', sm: '300px' },
                        height: '200px',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: { xs: '4px 4px 0 0', sm: '4px 0 0 4px' }
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={item.images?.[0] ? `http://localhost:3001/${item.images[0]}` : '/placeholder.jpg'}
                        alt={item.title}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                    
                    {/* Content Section */}
                    <CardContent sx={{ flex: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            color: isDarkMode ? 'white' : 'inherit',
                            fontWeight: 600,
                            flex: 1,
                            mr: 2
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: isDarkMode ? '#4CAF50' : 'primary.main',
                            fontWeight: 700
                          }}
                        >
                          ₹{item.price}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 2,
                          color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.primary',
                          lineHeight: 1.6
                        }}
                      >
                        {item.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Category 
                            fontSize="small" 
                            sx={{ 
                              color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'action.active'
                            }}
                          />
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                            }}
                          >
                            {item.category}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                            }}
                          >
                            Condition: {item.condition}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LocationOn 
                            fontSize="small" 
                            sx={{ 
                              color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'action.active'
                            }}
                          />
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                            }}
                          >
                            {item.location}
                          </Typography>
                        </Box>
                        
                        {item.isNegotiable && (
                          <Chip 
                            label="Negotiable" 
                            size="small" 
                            sx={{
                              backgroundColor: isDarkMode ? 'rgba(76, 175, 80, 0.2)' : undefined,
                              color: isDarkMode ? '#4CAF50' : undefined
                            }}
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                        <Button
                          variant="contained"
                          startIcon={<ShoppingCart />}
                          onClick={() => handleInterest(item._id)}
                          sx={{
                            background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #1565c0, #1976d2)'
                            },
                            px: 3,
                            py: 1
                          }}
                        >
                          Show Interest
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Visibility />}
                          sx={{
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : undefined,
                            color: isDarkMode ? 'rgba(255,255,255,0.8)' : undefined,
                            '&:hover': {
                              borderColor: isDarkMode ? 'rgba(255,255,255,0.5)' : undefined,
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : undefined
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Box>
                </Card>
              </Box>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={loadMoreItems}
                  disabled={loadingMore}
                  sx={{
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : undefined,
                    color: isDarkMode ? 'rgba(255,255,255,0.8)' : undefined,
                    '&:hover': {
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.5)' : undefined,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : undefined
                    },
                    px: 4,
                    py: 1.5
                  }}
                >
                  {loadingMore ? 'Loading...' : 'Load More Items'}
                </Button>
              </Box>
            )}
            
            {!hasMore && items.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'text.secondary',
                    fontStyle: 'italic'
                  }}
                >
                  You've reached the end of the marketplace
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ maxWidth: '800px', margin: '0 auto' }}>
            {myItems.map((item) => (
              <Box key={item._id} sx={{ mb: 3 }}>
                <Card 
                  sx={{ 
                    background: isDarkMode 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.2)' : 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: isDarkMode 
                        ? '0 8px 32px rgba(255,255,255,0.1)'
                        : '0 8px 32px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                    {/* Image Section */}
                    <Box
                      sx={{
                        width: { xs: '100%', sm: '300px' },
                        height: '200px',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: { xs: '4px 4px 0 0', sm: '4px 0 0 4px' }
                      }}
                    >
                      <CardMedia
                           component="img"
                           image={item.images?.[0] ? `http://localhost:3001/${item.images[0]}` : '/placeholder.jpg'}
                           alt={item.title}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                    
                    {/* Content Section */}
                    <CardContent sx={{ flex: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            color: isDarkMode ? 'white' : 'inherit',
                            fontWeight: 600,
                            flex: 1,
                            mr: 2
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: 1 }}>
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              color: isDarkMode ? '#4CAF50' : 'primary.main',
                              fontWeight: 700
                            }}
                          >
                            ₹{item.price}
                          </Typography>
                          <Chip 
                            label={item.status} 
                            size="small"
                            color={item.status === 'approved' ? 'success' : 
                                   item.status === 'pending' ? 'warning' : 'error'}
                            sx={{
                              color: isDarkMode ? 'white' : undefined,
                              '& .MuiChip-label': {
                                color: isDarkMode && item.status === 'pending' ? '#000' : undefined
                              }
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mb: 2,
                          color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.primary',
                          lineHeight: 1.6
                        }}
                      >
                        {item.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Category 
                            fontSize="small" 
                            sx={{ 
                              color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'action.active'
                            }}
                          />
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                            }}
                          >
                            {item.category}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                            }}
                          >
                            Condition: {item.condition}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <LocationOn 
                            fontSize="small" 
                            sx={{ 
                              color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'action.active'
                            }}
                          />
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.secondary'
                            }}
                          >
                            {item.location}
                          </Typography>
                        </Box>
                        
                        {item.interestedBuyers?.length > 0 && (
                          <Chip 
                            label={`${item.interestedBuyers.length} interested`}
                            size="small"
                            color="info"
                            sx={{
                              backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.2)' : undefined,
                              color: isDarkMode ? '#2196F3' : undefined
                            }}
                          />
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                        <Button
                          variant="contained"
                          startIcon={<Edit />}
                          onClick={() => handleEditItem(item)}
                          sx={{
                            background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #f57c00, #ff9800)'
                            },
                            px: 3,
                            py: 1
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteItem(item._id)}
                          sx={{
                            borderColor: '#f44336',
                            color: '#f44336',
                            '&:hover': {
                              borderColor: '#d32f2f',
                              backgroundColor: 'rgba(244, 67, 54, 0.1)'
                            }
                          }}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Visibility />}
                          sx={{
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : undefined,
                            color: isDarkMode ? 'rgba(255,255,255,0.8)' : undefined,
                            '&:hover': {
                              borderColor: isDarkMode ? 'rgba(255,255,255,0.5)' : undefined,
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : undefined
                            }
                          }}
                        >
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Box>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Container>

      {/* Upload Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editingItem ? 'Edit Item' : 'Sell an Item'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Price ($)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    label="Category"
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    label="Condition"
                  >
                    {conditions.map(cond => (
                      <MenuItem key={cond} value={cond}>
                        {cond.charAt(0).toUpperCase() + cond.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Phone (Optional)"
                  name="contactInfo.phone"
                  value={formData.contactInfo.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="contactInfo.email"
                  value={formData.contactInfo.email}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Images (Max 5)
                  </Typography>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="image-upload"
                    multiple
                    type="file"
                    onChange={handleImageSelect}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<PhotoCamera />}
                    >
                      Add Images
                    </Button>
                  </label>
                  <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                    {selectedImages.map((image, index) => (
                      <Box key={index} position="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index}`}
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeImage(index)}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Uploading...' : 'Submit for Approval'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StudentMarketplace;