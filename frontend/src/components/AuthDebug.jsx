import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Button, Paper } from '@mui/material';

const AuthDebug = () => {
  const { user } = useAuth();

  const checkToken = () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    console.log('Token:', token);
    console.log('Saved User:', savedUser);
    console.log('Current User:', user);
    
    // Test API call with current token
    if (token) {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('API Test Result:', data);
      })
      .catch(error => {
        console.error('API Test Error:', error);
      });
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const loginAsAdmin = async () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@campusmart.com',
          password: 'admin123'
        })
      });
      
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.reload();
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Typography variant="h6">Authentication Debug</Typography>
      <Typography>User: {user ? user.email : 'Not logged in'}</Typography>
      <Typography>Token exists: {localStorage.getItem('token') ? 'Yes' : 'No'}</Typography>
      <Box sx={{ mt: 2 }}>
        <Button onClick={checkToken} variant="outlined" sx={{ mr: 1 }}>
          Test Token
        </Button>
        <Button onClick={loginAsAdmin} variant="outlined" sx={{ mr: 1 }}>
          Login as Admin
        </Button>
        <Button onClick={clearAuth} variant="outlined" color="error">
          Clear Auth
        </Button>
      </Box>
    </Paper>
  );
};

export default AuthDebug;