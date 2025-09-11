import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ProductDetails = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Product Details
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View detailed information about food items.
        </Typography>
      </Box>
    </Container>
  );
};

export default ProductDetails;