// src/PopupContext.js
import React, { createContext, useState } from 'react';

export const PopupContext = createContext();

export const PopupProvider = ({ children }) => {
  const [isPopupVisible, setPopupVisible] = useState(false);

  console.log('PopupProvider rendered', { isPopupVisible });

  return (
    <PopupContext.Provider value={{ isPopupVisible, setPopupVisible }}>
      {children}
    </PopupContext.Provider>
  );
};
