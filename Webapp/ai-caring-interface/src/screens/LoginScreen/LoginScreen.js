import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../Authcontext';
import api from '../../utils/api';
import './LoginScreen.css';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setToken, setIsAuthenticated, setUserId } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAuthentication = async () => {
    try {
      const body = JSON.stringify({ email, password });
      const response = await api.post('/login', body, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = response.data;
      if (response.status === 200) {
        console.log('Token value:', data.token);
        console.log("user id", data.userId);
        setToken(data.token, data.userId); // Use setToken correctly
        setIsAuthenticated(true);
        navigate('/home');
      } else {
        alert('Login failed', data.error);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Login failed', 'An error occurred. Please try again.');
    }
  };

  const handleNavigateToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="login-input"
      />
      <input
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="login-input"
      />
      <button onClick={handleAuthentication} className="login-button">
        Login
      </button>
      <p className="register-text">Don't have an account?</p>
      <button onClick={handleNavigateToRegister} className="register-button">
        Register
      </button>
    </div>
  );
}

export default LoginScreen;