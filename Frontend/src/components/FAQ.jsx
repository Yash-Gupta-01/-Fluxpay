import React from 'react';
import Faq from '../assets/FAQ.svg';
import { Container, Typography, Grid, Box, Card, CardContent, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const FAQ = () => {
  const faqs = [
    {
      question: 'What is the user flow in FlexiWallet?',
      answer: 'The user flow in FlexiWallet starts with user registration, followed by account verification. They can manage their finances through a dashboard and transfer money. The application provides a seamless and intuitive interface for easy navigation and usage.'
    },
    {
      question: 'Why did you choose React for the frontend?',
      answer: 'React is chosen for its component-based architecture, which makes it easier to manage and scale the application. It also offers excellent performance and a rich ecosystem of tools and libraries.'
    },
    {
      question: 'How do you ensure the security of the application?',
      answer: 'Security is ensured through the use of HTTPS, end-to-end encryption, and implementation of best security practices such as input validation, authentication, and authorization mechanisms.'
    },
    {
      question: 'What technologies are used in FlexiWallet?',
      answer: 'FlexiWallet is built using modern web technologies including React for the frontend, Node.js and Express for the backend, and MongoDB for the database. Material UI is used for styling.'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={6}>
          <Box
            component="img"
            src={Faq}
            alt="FAQ"
            sx={{ width: '100%', height: 'auto' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Clearing common queries about FlexiWallet
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${index}-content`}
                id={`panel${index}-header`}
              >
                <Typography variant="h6">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>
      </Grid>
    </Container>
  );
};

export default FAQ;
