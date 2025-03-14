import React, { useEffect, useContext, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen/LoginScreen';
import HomeScreen from './screens/HomeScreen/HomeScreen';
import RegisterScreen from './screens/RegisterScreen/RegisterScreen';
import RemindersScreen from './screens/RemindersScreen/RemindersScreen';
import EditReminderScreen from './screens/EditReminderScreen/EditReminderScreen';
import AdminScreen from './screens/AdminScreen/AdminScreen';
import UsersList from './components/UserList/UserList';
import ReminderList from './components/ReminderList/ReminderList';
import ReminderVisibility from './components/ReminderVisibility/ReminderVisibility';
import ReminderLibrary from './screens/ReminderLibrary/ReminderLibrary';
import { AuthProvider } from './Authcontext';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';
import { PopupProvider } from './PopupContext';
import TokenExpiredPopup from './components/TokenExpiredPopup/TokenExpiredPopup';
import { useApiWithAuth } from './utils/api';

const AppContent = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const noHeaderRoutes = ['/', '/register'];

  return (
    <>
      {!noHeaderRoutes.includes(location.pathname) && <Header isCollapsed={isCollapsed} />}
      {!noHeaderRoutes.includes(location.pathname) && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}
      <div className={`main-content ${isCollapsed ? 'main-content-collapsed' : ''}`}>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/reminders" element={<RemindersScreen />} />
          <Route path="/edit-reminder/:reminderId" element={<EditReminderScreen />} />
          <Route path="/admin" element={<AdminScreen />} />
          <Route path="/admin/users" element={<UsersList />} />
          <Route path="/admin/reminders" element={<ReminderList />} />
          <Route path="/admin/reminder-visibility" element={<ReminderVisibility />} />
          <Route path="/reminder-library" element={<ReminderLibrary />} />
        </Routes>
      </div>
    </>
  );
};

function App() {
  //useApiWithAuth();

  return (
    <AuthProvider>
      {/* <PopupProvider> */}
        <Router>
          <AppContent />
          {/* <TokenExpiredPopup /> */}
        </Router>
      {/* </PopupProvider> */}
    </AuthProvider>
  );
}

export default App;
