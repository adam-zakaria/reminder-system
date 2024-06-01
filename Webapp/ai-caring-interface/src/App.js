import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen/LoginScreen';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import RegisterScreen from './screens/RegisterScreen/RegisterScreen';
import RemindersScreen from './screens/RemindersScreen/RemindersScreen';
import { AuthProvider } from './Authcontext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/reminders" element={<RemindersScreen />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;