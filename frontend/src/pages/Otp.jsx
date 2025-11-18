import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert, InputAdornment } from '@mui/material';
import { Email, Restaurant } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

const OtpPage = () => {
  const { requestOtp, verifyOtp, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [localError, setLocalError] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(10);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [resendAvailableAt, setResendAvailableAt] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Initialize from navigation state when coming from the login page
  useEffect(() => {
    const s = location.state || {};
    if (s.email) {
      setEmail(s.email);
      setOtpMode(true);
      if (typeof s.expiresInMinutes === 'number') setOtpExpiresIn(s.expiresInMinutes);
      if (s.otpExpiresAt) setOtpExpiresAt(s.otpExpiresAt);
      if (s.resendAvailableAt) setResendAvailableAt(s.resendAvailableAt);
      if (s.devFallback) {
        setLocalError('OTP sent. SMTP not configured: check backend server logs for the code.');
      }
    }
  }, [location.state]);

  if (loading) {
    return <LoadingSpinner message="Just a moment..." />;
  }

  const expirySecondsLeft = useMemo(() => {
    if (!otpExpiresAt) return null;
    const diff = new Date(otpExpiresAt).getTime() - nowTs;
    return Math.max(0, Math.floor(diff / 1000));
  }, [otpExpiresAt, nowTs]);

  const resendSecondsLeft = useMemo(() => {
    if (!resendAvailableAt) return 0;
    const diff = new Date(resendAvailableAt).getTime() - nowTs;
    return Math.max(0, Math.floor(diff / 1000));
  }, [resendAvailableAt, nowTs]);

  const formatMMSS = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    const em = email.trim();
    if (!em) {
      setLocalError('Enter your email to get an OTP');
      return;
    }
    const res = await requestOtp(em);
    if (res.success) {
      setOtpMode(true);
      setLocalError(res.devFallback ? 'OTP sent. SMTP not configured: check backend server logs for the code.' : '');
      if (res.expiresInMinutes) setOtpExpiresIn(res.expiresInMinutes);
      if (res.otpExpiresAt) setOtpExpiresAt(res.otpExpiresAt);
      if (res.resendAvailableAt) setResendAvailableAt(res.resendAvailableAt);
    } else if (res.error) {
      setLocalError(res.error);
      if (res.resendAvailableAt) setResendAvailableAt(res.resendAvailableAt);
    }
    if (error) clearError();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email || !code) {
      setLocalError('Enter the code sent to your email');
      return;
    }
    const res = await verifyOtp(email, code);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setLocalError(res.error || 'Invalid or expired code');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #CD1C18 0%, #FFA896 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box textAlign="center" mb={3}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: isDarkMode
                ? 'linear-gradient(135deg, #9B1313, #38000A)'
                : 'linear-gradient(135deg, #CD1C18, #FFA896)',
              mb: 2,
              boxShadow: '0 8px 32px rgba(226, 55, 68, 0.3)'
            }}
          >
            <Restaurant sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              background: isDarkMode
                ? 'linear-gradient(135deg, #FFA896, #CD1C18)'
                : 'linear-gradient(135deg, #CD1C18, #FFA896)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Campus Mart
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary'
            }}
          >
            One-Time Code Login
          </Typography>
        </Box>
        {(error || localError) && <Alert severity="error" sx={{ mb: 2 }}>{error || localError}</Alert>}

        {!otpMode && (
          <Box>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e)=> setEmail(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" fullWidth onClick={handleSendCode} disabled={loading} sx={{ mt: 2 }}>
              {loading ? 'Sending...' : 'Send Code'}
            </Button>
          </Box>
        )}

        {otpMode && (
          <Box component="form" onSubmit={handleVerify}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e)=> setEmail(e.target.value)}
              margin="normal"
              helperText={expirySecondsLeft != null ? `Expires in ${formatMMSS(expirySecondsLeft)}` : `Expires in ${otpExpiresIn} minutes`}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Verification Code"
              value={code}
              onChange={(e)=> setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              margin="normal"
              placeholder="Enter 6-digit code"
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 }}
              required
              helperText={code && code.length !== 6 ? 'Enter exactly 6 digits.' : 'Do not share this one-time code with anyone.'}
            />
            <Button type="submit" variant="contained" fullWidth disabled={loading || code.length !== 6 || (expirySecondsLeft !== null && expirySecondsLeft <= 0)} sx={{ mt: 2 }}>
              {loading ? 'Verifying...' : (expirySecondsLeft !== null && expirySecondsLeft <= 0 ? 'Code Expired' : 'Verify & Sign In')}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {resendSecondsLeft > 0 ? `Resend available in ${formatMMSS(resendSecondsLeft)}` : 'You can resend a new code.'}
              </Typography>
              <Button variant="text" size="small" onClick={handleSendCode} disabled={resendSecondsLeft > 0 || loading} sx={{ textTransform: 'none' }}>
                Resend Code
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      </Container>
    </Box>
  );
};

export default OtpPage;