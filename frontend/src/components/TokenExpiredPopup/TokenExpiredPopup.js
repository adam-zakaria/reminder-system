import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PopupContext } from '../../PopupContext';
import './TokenExpiredPopup.css'; // Make sure to create appropriate styles

const TokenExpiredPopup = () => {   
  const { isPopupVisible, setPopupVisible } = useContext(PopupContext);
  const navigate = useNavigate();

  const handleClose = () => {
    setPopupVisible(false);
    navigate('/');
  };

  if (!isPopupVisible) return null;

  return (
    <div className="popup">
      <div className="popup-content">
        <h2>Session Expired</h2>
        <p>Your session has expired. Please log in again.</p>
        <button onClick={handleClose}>Go to Login</button>
      </div>
    </div>
  );
};

export default TokenExpiredPopup;
