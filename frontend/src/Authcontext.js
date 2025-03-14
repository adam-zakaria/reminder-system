import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUsername = await AsyncStorage.getItem('username');
        const storedRole = await AsyncStorage.getItem('role');
        console.log('Loaded auth data:', { storedToken, storedUserId, storedUsername, storedRole });
        if (storedToken && storedUserId && storedUsername && storedRole) {
          setToken(storedToken);
          setUserId(storedUserId);
          setUsername(storedUsername);
          setRole(storedRole);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
      }
    };

    loadAuthData();
  }, []);

  const saveAuthData = async (token, userId, username, role) => {
    try {
      console.log('Saving auth data:', { token, userId, username, role });
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('role', role);
      setToken(token);
      setUserId(userId);
      setUsername(username);
      setRole(role);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save auth data', error);
    }
  };

  const clearAuthData = async () => {
    try {
      console.log('Clearing auth data');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('role');
      setToken(null);
      setUserId(null);
      setUsername(null);
      setRole(null);
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
        console.log('Refreshing token:', newToken);
        await saveAuthData(newToken, userId, username, role);
      } else {
        console.error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, userId, username, role, isAuthenticated, setToken: saveAuthData, setUserId, setRole, setIsAuthenticated, clearAuthData, refreshToken, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};
