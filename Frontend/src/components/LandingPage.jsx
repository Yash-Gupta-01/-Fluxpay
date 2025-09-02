import React from 'react';
import image from '../assets/E-Wallet.png';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Grid, Box } from '@mui/material';

const LandingPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={6}>
          <Box
            component="img"
            src={image}
            alt="E-Wallet"
            sx={{ width: '100%', height: 'auto' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Welcome to FlexiWallet
          </Typography>
          <Typography variant="h5" paragraph>
            FlexiWallet is a cutting-edge digital wallet solution designed to streamline your financial transactions.
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/FirstUser"
            sx={{ mt: 2 }}
          >
            Get Started
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LandingPage;
