import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  School,
  LocationOn,
  CalendarToday,
  Badge
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    studentId: '',
    year: '',
    department: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        college: user.college || '',
        studentId: user.studentId || '',
        year: user.year || '',
        department: user.department || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        emergencyContact: user.emergencyContact || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.put('/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      updateUser(response.data.user);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        college: user.college || '',
        studentId: user.studentId || '',
        year: user.year || '',
        department: user.department || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        emergencyContact: user.emergencyContact || '',
        bio: user.bio || ''
      });
    }
    setIsEditing(false);
    setError('');
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const textFieldSx = {
    '& .MuiInputLabel-root': {
      color: isDarkMode ? 'rgba(255,255,255,0.7)' : undefined
    },
    '& .MuiInputBase-input': {
      color: isDarkMode ? 'white' : undefined
    },
    '& .MuiFilledInput-root': {
      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : undefined,
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : undefined
      }
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : undefined
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? 'rgba(255,255,255,0.5)' : undefined
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #B71C1C 0%, #D32F2F 100%)',
        py: 4,
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
              radial-gradient(circle at 25% 75%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 45% 55%, rgba(255, 255, 255, 0.06) 0%, transparent 50%)
            `,
            animation: 'profileFloat 24s ease-in-out infinite'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: `
              radial-gradient(circle at 65% 35%, rgba(255, 255, 255, 0.09) 0%, transparent 50%),
              radial-gradient(circle at 85% 85%, rgba(255, 255, 255, 0.07) 0%, transparent 50%)
            `,
            animation: 'profileFloat 28s ease-in-out infinite reverse'
          },
          '@keyframes profileFloat': {
            '0%, 100%': {
              transform: 'translate(0px, 0px) rotate(0deg)'
            },
            '25%': {
              transform: 'translate(20px, -30px) rotate(90deg)'
            },
            '50%': {
              transform: 'translate(-25px, -20px) rotate(180deg)'
            },
            '75%': {
              transform: 'translate(-15px, 25px) rotate(270deg)'
            }
          }
        }}
      />
      
      {/* Floating Geometric Shapes - Profile themed */}
      {[...Array(9)].map((_, index) => {
        const shapeType = index % 3; // 0: circle, 1: square, 2: diamond
        return (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              width: { xs: '40px', md: '55px' },
              height: { xs: '40px', md: '55px' },
              background: `rgba(255, 255, 255, ${0.04 + (index * 0.01)})`,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              top: `${5 + (index * 10)}%`,
              right: `${2 + (index * 11)}%`,
              animation: `profileShape${index} ${14 + index * 1.8}s ease-in-out infinite`,
              zIndex: 0,
              // Circle shape
              ...(shapeType === 0 && {
                borderRadius: '50%',
              }),
              // Square shape
              ...(shapeType === 1 && {
                borderRadius: '15%',
              }),
              // Diamond shape
              ...(shapeType === 2 && {
                borderRadius: '10%',
                transform: 'rotate(45deg)',
              }),
              [`@keyframes profileShape${index}`]: {
                '0%, 100%': { 
                  transform: shapeType === 2 
                    ? 'rotate(45deg) translateY(0px)' 
                    : 'translateY(0px) rotate(0deg)' 
                },
                '33%': { 
                  transform: shapeType === 2 
                    ? 'rotate(45deg) translateY(-15px)' 
                    : 'translateY(-15px) rotate(120deg)' 
                },
                '66%': { 
                  transform: shapeType === 2 
                    ? 'rotate(45deg) translateY(10px)' 
                    : 'translateY(10px) rotate(240deg)' 
                }
              }
            }}
          />
        );
      })}
       
       {/* Content Wrapper */}
       <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              color: 'white', 
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            My Profile
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 2
            }}
          >
            Manage your account settings and personal information
          </Typography>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={4} justifyContent="center" alignItems="flex-start">
          {/* Profile Card */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{
                p: 3,
                background: isDarkMode 
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.7)',
                borderRadius: 2,
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 3, 
                  color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'primary.main',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Person sx={{ mr: 1 }} />
                Profile Information
              </Typography>
              
              <Grid container spacing={3} alignItems="center">
                {/* Avatar Section */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 100,
                        height: 100,
                        mx: 'auto',
                        mb: 2,
                        background: 'linear-gradient(135deg, #B71C1C, #D32F2F)',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 20px rgba(183, 28, 28, 0.3)'
                      }}
                    >
                      {getInitials(formData.name)}
                    </Avatar>
                    
                    <Chip 
                      icon={<Badge />}
                      label="Student"
                      color="primary"
                      size="small"
                      sx={{ 
                        color: 'white',
                        '& .MuiChip-icon': {
                          color: 'white'
                        }
                      }}
                    />
                  </Box>
                </Grid>
                
                {/* Name and Bio Section */}
                <Grid item xs={12} md={5}>
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600,
                      color: isDarkMode ? 'white' : 'inherit',
                      mb: 1
                    }}
                  >
                    {formData.name || 'Student Name'}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                      lineHeight: 1.6
                    }}
                  >
                    {formData.bio || 'No bio available. Click edit to add your personal description.'}
                  </Typography>
                </Grid>
                
                {/* Action Button Section */}
                <Grid item xs={12} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      variant={isEditing ? "outlined" : "contained"}
                      startIcon={isEditing ? <Cancel /> : <Edit />}
                      onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                      fullWidth
                      sx={{
                        background: isEditing ? 'transparent' : 'linear-gradient(135deg, #B71C1C, #D32F2F)',
                        '&:hover': {
                          background: isEditing ? 'rgba(183, 28, 28, 0.1)' : 'linear-gradient(135deg, #D32F2F, #B71C1C)'
                        }
                      }}
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Profile Information */}
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                background: isDarkMode 
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(15px)',
                borderRadius: 3,
                boxShadow: isDarkMode
                  ? '0 8px 32px rgba(0,0,0,0.3)'
                  : '0 8px 32px rgba(0,0,0,0.1)',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.2)' : 'none'
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: isDarkMode ? 'white' : 'inherit'
                    }}
                  >
                    Personal Information
                  </Typography>
                  {isEditing && (
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSave}
                      disabled={loading}
                      sx={{
                        background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #45a049, #4CAF50)'
                        }
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </Box>

                <Grid container spacing={4}>
                  {/* Basic Information Section */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0}
                      sx={{
                        p: 3,
                        background: isDarkMode 
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(255,255,255,0.7)',
                        borderRadius: 2,
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 3, 
                          color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'primary.main',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Person sx={{ mr: 1 }} />
                        Basic Information
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            variant={isEditing ? "outlined" : "filled"}
                            sx={textFieldSx}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            variant={isEditing ? "outlined" : "filled"}
                            sx={textFieldSx}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Phone Number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            variant={isEditing ? "outlined" : "filled"}
                            sx={textFieldSx}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Date of Birth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            variant={isEditing ? "outlined" : "filled"}
                            InputLabelProps={{ shrink: true }}
                            sx={textFieldSx}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Academic Information Section */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0}
                      sx={{
                        p: 3,
                        background: isDarkMode 
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(255,255,255,0.7)',
                        borderRadius: 2,
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 3, 
                          color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'primary.main',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <School sx={{ mr: 1 }} />
                        Academic Information
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="College/University"
                            name="college"
                            value={formData.college}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            variant={isEditing ? "outlined" : "filled"}
                            sx={textFieldSx}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Student ID"
                            name="studentId"
                            value={formData.studentId}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            variant={isEditing ? "outlined" : "filled"}
                            sx={textFieldSx}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth disabled={!isEditing} sx={{ ...textFieldSx, minWidth: '200px' }}>
                            <InputLabel sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : undefined }}>Academic Year</InputLabel>
                            <Select
                              name="year"
                              value={formData.year}
                              onChange={handleInputChange}
                              label="Academic Year"
                              variant={isEditing ? "outlined" : "filled"}
                              sx={{
                                color: isDarkMode ? 'white' : undefined,
                                minWidth: '100%',
                                '& .MuiSelect-select': {
                                  paddingRight: '32px !important',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  minWidth: 'auto'
                                },
                                '& .MuiSelect-icon': {
                                  color: isDarkMode ? 'rgba(255,255,255,0.7)' : undefined
                                }
                              }}
                            >
                              <MenuItem value="1st Year">1st Year</MenuItem>
                              <MenuItem value="2nd Year">2nd Year</MenuItem>
                              <MenuItem value="3rd Year">3rd Year</MenuItem>
                              <MenuItem value="4th Year">4th Year</MenuItem>
                              <MenuItem value="Graduate">Graduate</MenuItem>
                              <MenuItem value="Postgraduate">Postgraduate</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Department/Major"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            variant={isEditing ? "outlined" : "filled"}
                            sx={textFieldSx}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Contact Information Section */}
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0}
                      sx={{
                        p: 3,
                        background: isDarkMode 
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(255,255,255,0.7)',
                        borderRadius: 2,
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 3, 
                          color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'primary.main',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <LocationOn sx={{ mr: 1 }} />
                        Contact Information
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            variant={isEditing ? "outlined" : "filled"}
                            multiline
                            rows={2}
                            sx={textFieldSx}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Emergency Contact"
                            name="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            variant={isEditing ? "outlined" : "filled"}
                            sx={textFieldSx}
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            variant={isEditing ? "outlined" : "filled"}
                            multiline
                            rows={3}
                            placeholder="Tell us about yourself..."
                            sx={textFieldSx}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
       </Container>
       </Box>
     </Box>
   );
 };

export default Profile;