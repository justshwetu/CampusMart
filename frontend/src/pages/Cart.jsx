import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';

const Cart = () => {
  const { isDarkMode } = useTheme();

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
              radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 50% 90%, rgba(255, 255, 255, 0.06) 0%, transparent 50%)
            `,
            animation: 'cartFloat 22s ease-in-out infinite'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: `
              radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.07) 0%, transparent 50%)
            `,
            animation: 'cartFloat 28s ease-in-out infinite reverse'
          },
          '@keyframes cartFloat': {
            '0%, 100%': {
              transform: 'translate(0px, 0px) rotate(0deg)'
            },
            '25%': {
              transform: 'translate(25px, -25px) rotate(90deg)'
            },
            '50%': {
              transform: 'translate(-15px, -35px) rotate(180deg)'
            },
            '75%': {
              transform: 'translate(-30px, 20px) rotate(270deg)'
            }
          }
        }}
      />
      
      {/* Floating Geometric Shapes - Triangles, Hexagons, Diamonds */}
      {[...Array(7)].map((_, index) => {
        const shapeType = index % 3; // 0: triangle, 1: hexagon, 2: diamond
        return (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              width: { xs: '50px', md: '70px' },
              height: { xs: '50px', md: '70px' },
              background: `rgba(255, 255, 255, ${0.04 + (index * 0.015)})`,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              top: `${8 + (index * 13)}%`,
              right: `${3 + (index * 14)}%`,
              animation: `cartShape${index} ${16 + index * 2.5}s ease-in-out infinite`,
              zIndex: 1,
              // Triangle shape
              ...(shapeType === 0 && {
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              }),
              // Hexagon shape
              ...(shapeType === 1 && {
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
              }),
              // Diamond shape
              ...(shapeType === 2 && {
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              }),
              '@keyframes cartShape0': {
                '0%, 100%': { transform: 'translateX(0px) rotate(0deg)' },
                '50%': { transform: 'translateX(-25px) rotate(120deg)' }
              },
              '@keyframes cartShape1': {
                '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                '50%': { transform: 'translateY(20px) rotate(-120deg)' }
              },
              '@keyframes cartShape2': {
                '0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
                '50%': { transform: 'translate(18px, -18px) rotate(180deg)' }
              },
              '@keyframes cartShape3': {
                '0%, 100%': { transform: 'translateX(0px) scale(1)' },
                '50%': { transform: 'translateX(22px) scale(1.15)' }
              },
              '@keyframes cartShape4': {
                '0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
                '50%': { transform: 'translate(-12px, 15px) rotate(-90deg)' }
              },
              '@keyframes cartShape5': {
                '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                '50%': { transform: 'translateY(-28px) rotate(240deg)' }
              },
              '@keyframes cartShape6': {
                '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
                '50%': { transform: 'translate(15px, 25px) scale(0.9)' }
              }
            }}
          />
        );
      })}
      
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 10 }}>
        <Box textAlign="center">
          <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
            Shopping Cart
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Review your selected items before checkout.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Cart;