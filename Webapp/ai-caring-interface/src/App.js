import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen/LoginScreen';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import RegisterScreen from './screens/RegisterScreen/RegisterScreen';
import RemindersScreen from './screens/RemindersScreen/RemindersScreen';
import EditReminderScreen from './screens/EditReminderScreen/EditReminderScreen';
import AdminScreen from './screens/AdminScreen/AdminScreen'; // Import the AdminScreen component
import { AuthProvider } from './Authcontext';
import Header from './components/Header/Header';

const AppContent = () => {
  const location = useLocation();
  const noHeaderRoutes = ['/', '/register'];

  return (
    <>
      {!noHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/reminders" element={<RemindersScreen />} />
        <Route path="/edit-reminder/:reminderId" element={<EditReminderScreen />} />
        <Route path="/admin" element={<AdminScreen />} /> {/* Add a route for the AdminScreen */}
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;