import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedToken && storedUserId) {
          setToken(storedToken);
          setUserId(storedUserId);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
      }
    };

    loadAuthData();
  }, []);

  const saveAuthData = async (token, userId) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', userId);
      setToken(token);
      setUserId(userId);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save auth data', error);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      setToken(null);
      setUserId(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to clear auth data', error);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('/refresh-token', { token });
      if (response.status === 200) {
        const newToken = response.data.token;
        await saveAuthData(newToken, userId);
      } else {
        console.error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, userId, isAuthenticated, setToken: saveAuthData, setUserId, setIsAuthenticated, clearAuthData, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};