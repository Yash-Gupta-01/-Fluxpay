import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

const Footer = () => {
  return (
    <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 3, mt: 8 }}>
      <Container maxWidth="lg">
        <Box textAlign="center">
          <Typography variant="body1" gutterBottom>
            &copy; 2024 FlexiWallet. All rights reserved.
          </Typography>
          <Typography variant="body2" gutterBottom>
            Made by Yash
          </Typography>
          <Typography variant="body2">
            Connect on{' '}
            <Link
              href="https://www.linkedin.com/in/yash-gupta-62a192228/"
              color="inherit"
              underline="hover"
            >
              LinkedIn
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
