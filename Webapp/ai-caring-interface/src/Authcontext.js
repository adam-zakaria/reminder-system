import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  return (
    <AuthContext.Provider value={{ token, userId, isAuthenticated, setToken: saveAuthData, setUserId, setIsAuthenticated, clearAuthData }}>
      {children}
    </AuthContext.Provider>
  );
};