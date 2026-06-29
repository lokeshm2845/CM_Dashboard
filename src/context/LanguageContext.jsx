import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, LANGUAGES } from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('delhi_cm_dashboard_lang') || 'en';
  });

  const setLanguage = (langCode) => {
    if (translations[langCode]) {
      setLanguageState(langCode);
      localStorage.setItem('delhi_cm_dashboard_lang', langCode);
    }
  };

  const t = (key, defaultText = '') => {
    if (!translations[language]) return defaultText || key;
    return translations[language][key] || translations['en'][key] || defaultText || key;
  };

  // Helper translations for constants
  const tCategory = (categoryName) => {
    return translations[language]?.[categoryName] || translations['en']?.[categoryName] || categoryName;
  };

  const tDistrict = (districtName) => {
    return translations[language]?.[districtName] || translations['en']?.[districtName] || districtName;
  };

  const tStatus = (statusName) => {
    return translations[language]?.[statusName] || translations['en']?.[statusName] || statusName;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      LANGUAGES, 
      t, 
      tCategory, 
      tDistrict, 
      tStatus 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
