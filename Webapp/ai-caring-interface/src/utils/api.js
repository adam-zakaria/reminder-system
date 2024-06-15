import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:7628/', // Update with your backend server URL
  //baseURL: 'https://gateway.parcs.northeastern.edu/ai-caring/api/'
});

export default api;
