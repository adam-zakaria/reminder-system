// src/api.js
import axios from 'axios';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PopupContext } from '../PopupContext'; // Make sure the path is correct

const api = axios.create({
  //baseURL: 'http://localhost:7628/', // Update with your backend server URL
  baseURL: 'https://gateway.parcs.northeastern.edu/ai-caring/api/', // Update with your backend server URL
  timeout: 10000, // Set a timeout for requests
  headers: {
    'Content-Type': 'application/json',
  }
});

let isInterceptorsSet = false;

const useApiWithAuth = () => {
  const context = useContext(PopupContext);
  console.log('useApiWithAuth context:', context);
  const { setPopupVisible } = context;
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInterceptorsSet) {
      // Request interceptor
      api.interceptors.request.use(
        (config) => {
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Response interceptor
      api.interceptors.response.use(
        (response) => {
          return response;
        },
        (error) => {
          if (error.response) {
            console.error('Error response:', error.response);
            if (error.response.status === 401) {
              setPopupVisible(true);
              navigate('/');
            }
            if (error.response.status === 403) {
            }
          } else if (error.request) {
            console.error('Error request:', error.request);
          } else {
            console.error('Error message:', error.message);
          }
          return Promise.reject(error);
        }
      );

      isInterceptorsSet = true;
    }
  }, [navigate, setPopupVisible]);

  return api;
};

export { api, useApiWithAuth };
