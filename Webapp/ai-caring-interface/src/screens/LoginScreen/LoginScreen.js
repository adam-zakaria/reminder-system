import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../Authcontext';
import { api } from '../../utils/api';
import AICaringLogo from '../../assests/AICaringLogo.png';
import NortheasternLogo from '../../assests/Northeastern-university-logo.svg';
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
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#D4AF37',
    },
    secondary: {
      main: '#000000',
    },
    error: {
      main: '#FF0000',
    },
    success: {
      main: '#008000',
    },
    info: {
      main: '#0000FF',
    },
    warning: {
      main: '#FFA500',
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

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { setToken, setIsAuthenticated, setUserId, setRole, setUsername } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAuthentication = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', { email, password });
      const data = response.data;
      if (response.status === 200) {
        console.log('Login response data:', data);
        setToken(data.token, data.userId, data.username, data.role); // Ensure all parameters are passed
        setUserId(data.userId);
        setRole(data.role);
        setUsername(data.username);
        setIsAuthenticated(true);
        navigate('/home');
      } else {
        alert('Login failed. Please check your email and password and try again.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Login failed. An error occurred. Please try again or contact support if the problem persists.');
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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
              <img src={NortheasternLogo} alt="Northeastern University Logo" style={{ width: '200px', marginBottom: '20px' }} />
              <img src={AICaringLogo} alt="AI CARING Logo" style={{ width: '200px', marginBottom: '20px' }} />
            </Box>
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
              Login to Your Account
            </Typography>
            <Box component="form" onSubmit={handleAuthentication} noValidate sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
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
                autoComplete="current-password"
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
                Sign In
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Typography variant="body1">
                  Need an account?{' '}
                  <Link 
                    component="button" 
                    variant="body1" 
                    onClick={() => navigate('/register')}
                    sx={{ fontWeight: 'bold', color: 'primary.main' }}
                  >
                    Sign Up Here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default LoginScreen;
