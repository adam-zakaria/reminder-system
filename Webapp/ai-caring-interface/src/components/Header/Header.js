// src/components/Header/Header.js

import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../Authcontext';
import './Header.css';

const Header = ({ isCollapsed }) => {
  const { clearAuthData } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuthData();
    navigate('/');
  };

  const handleNavigateReminders = () => {
    navigate('/reminders');
  };

  const handleNavigateAdmin = () => {
    navigate('/admin');
  };

  const noHeaderRoutes = ['/', '/register'];

  if (noHeaderRoutes.includes(location.pathname)) return null;

  return (
    <header className={`header ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="title">
        Meal Prep Reminder Authoring System
      </div>
      {/* <div className="nav-buttons">
        <button className="admin" onClick={handleNavigateAdmin}>Admin</button>
        <button className="reminders" onClick={handleNavigateReminders}>Reminders</button>
        <button className="logout" onClick={handleLogout}>Logout</button>
      </div> */}
    </header>
  );
};

export default Header;
