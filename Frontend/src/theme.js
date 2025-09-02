


import { createTheme } from '@mui/material/styles';
export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#90caf9' : '#1976d2', // Adjust for dark mode
    },
    secondary: {
      main: mode === 'dark' ? '#f48fb1' : '#dc004e',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#ffffff',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Red Hat Display", "Tektur", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Tektur", sans-serif',
    },
    h2: {
      fontFamily: '"Tektur", sans-serif',
    },
    h3: {
      fontFamily: '"Tektur", sans-serif',
    },
  },
});

const lightTheme = getTheme('light');
const darkTheme = getTheme('dark');

export { lightTheme, darkTheme };

