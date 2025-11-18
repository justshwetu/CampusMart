import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, IconButton, TextField, Typography, Divider, Button, Chip, Stack } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';

const bubble = (bg, color) => ({
  px: 1.5,
  py: 1,
  my: 0.5,
  maxWidth: '80%',
  borderRadius: 2,
  backgroundColor: bg,
  color
});

const SupportChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your Campus Mart assistant. How can I help today?' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions] = useState([
    'Track my order',
    'Cancel an order',
    'Payment issue',
    'Become a vendor',
    'Edit my shop photo',
    'Update vendor bio',
    'Browse vendors',
    'Account help'
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    const userMsg = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    if (!overrideText) setInput('');
    setSending(true);
    try {
      // Use a dedicated axios instance with the same baseURL strategy as AuthContext
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
        withCredentials: false
      });
      const res = await api.post('chat/message', { messages: [...messages, userMsg] });
      const reply = res.data?.reply || "I'm not sure yet. Could you rephrase that?";
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I had trouble responding just now.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1500 }}>
        {!open && (
          <IconButton color="primary" size="large" onClick={() => setOpen(true)} sx={{
            backgroundColor: '#e23744', color: 'white', '&:hover': { backgroundColor: '#d32f2f' }
          }}>
            <ChatIcon />
          </IconButton>
        )}
      </Box>
      {open && (
        <Paper elevation={12} sx={{ position: 'fixed', bottom: 24, right: 24, width: 360, height: 460, display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden', zIndex: 1600 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, background: 'linear-gradient(135deg, #e23744, #ff6b75)', color: 'white' }}>
            <Typography variant="subtitle1" fontWeight={700}>Support</Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <Box ref={listRef} sx={{ flex: 1, overflowY: 'auto', p: 2, backgroundColor: '#fafafa' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
              {suggestions.map((s, i) => (
                <Chip key={i} label={s} size="small" onClick={() => send(s)} sx={{ mb: 1 }} />
              ))}
            </Stack>
            {messages.map((m, i) => (
              <Box key={i} display="flex" justifyContent={m.role === 'user' ? 'flex-end' : 'flex-start'}>
                <Box sx={m.role === 'user' ? bubble('#e8f5e9', '#1b5e20') : bubble('white', '#333')}>
                  <Typography variant="body2">{m.content}</Typography>
                </Box>
              </Box>
            ))}
            {sending && (
              <Box display="flex" justifyContent="flex-start">
                <Box sx={bubble('white', '#666')}>
                  <Typography variant="body2">Typing…</Typography>
                </Box>
              </Box>
            )}
          </Box>
          <Divider />
          <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Type your message..."
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Button variant="contained" disabled={sending || !input.trim()} onClick={send} sx={{ minWidth: 48, background: 'linear-gradient(135deg, #e23744, #ff6b75)' }}>
              <SendIcon fontSize="small" />
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default SupportChatWidget;