import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null); // Add role state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedRole = await AsyncStorage.getItem('role'); // Load role from storage
        if (storedToken && storedUserId && storedRole) {
          setToken(storedToken);
          setUserId(storedUserId);
          setRole(storedRole);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
      }
    };

    loadAuthData();
  }, []);

  const saveAuthData = async (token, userId, role) => { // Add role parameter
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('role', role); // Save role to storage
      setToken(token);
      setUserId(userId);
      setRole(role); // Set role state
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save auth data', error);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('role'); // Clear role from storage
      setToken(null);
      setUserId(null);
      setRole(null); // Clear role state
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
        await saveAuthData(newToken, userId, role); // Include role when refreshing token
      } else {
        console.error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, userId, role, isAuthenticated, setToken: saveAuthData, setUserId, setIsAuthenticated, clearAuthData, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};
