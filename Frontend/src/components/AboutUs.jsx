import React from 'react';
import aboutImage from '../assets/AboutUs.png';
import { Container, Typography, Grid, Box, Card, CardContent } from '@mui/material';

const AboutUs = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                About FlexiWallet
              </Typography>
              <Typography variant="h6" paragraph>
                FlexiWallet simplifies financial management with robust features for secure transactions, comprehensive account management,
                and user-friendly navigation, making it an essential tool for modern financial needs.
              </Typography>
              <Typography variant="h6" paragraph>
                With FlexiWallet, you can securely manage your funds, make payments, and transfer money effortlessly.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box
            component="img"
            src={aboutImage}
            alt="About Us"
            sx={{ width: '100%', height: 'auto', borderRadius: 2 }}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default AboutUs;
