import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import AICaringLogo from '../../AICaringLogo.png';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  ThemeProvider,
  createTheme,
  Link,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { Email, Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material';

// Use the same theme as in LoginScreen
const theme = createTheme({
  palette: {
    primary: {
      main: '#D4AF37', // Light beige/gold color
    },
    secondary: {
      main: '#000000', // Black
    },
    error: {
      main: '#FF0000', // Red
    },
    background: {
      default: '#F5F5F5',
    },
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
  },
});

function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const regist_body = {
        username,
        email,
        password,
        role: 'user' // Set role to 'user' by default
      };

      const response = await api.post('/register', regist_body);

      if (response.status === 201) {
        setOpenSnackbar(true);
        setTimeout(() => navigate('/'), 2000); // Navigate to login after 2 seconds
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.error);
      } else {
        setError('An error occurred during registration. Please try again.');
      }
      setOpenSnackbar(true);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <img src={AICaringLogo} alt="AI CARING Logo" style={{ width: '200px', marginBottom: '20px' }} />
            <Typography variant="h5" sx={{ color: 'secondary.main' }}>
              Meal Prep Reminder
            </Typography>
          </Box>
          <Paper elevation={3} sx={{ 
            width: '100%',
            maxWidth: '400px',
            p: 4, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: '15px',
            background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
            boxShadow: '20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff',
          }}>
            <Typography component="h2" variant="h5" sx={{ mb: 3, color: 'secondary.main' }}>
              Create an Account
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, borderRadius: '25px', py: 1.5, backgroundColor: 'primary.main', color: 'secondary.main' }}
              >
                Register
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Typography variant="body1">
                  Already have an account?{' '}
                  <Link 
                    component="button" 
                    variant="body1" 
                    onClick={() => navigate('/')}
                    sx={{ fontWeight: 'bold', color: 'primary.main' }}
                  >
                    Sign In Here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
          <Alert onClose={() => setOpenSnackbar(false)} severity={error ? "error" : "success"} sx={{ width: '100%' }}>
            {error || "Registration successful! Redirecting to login..."}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default RegisterScreen;