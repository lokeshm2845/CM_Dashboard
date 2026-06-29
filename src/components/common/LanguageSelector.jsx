import React, { useState } from 'react';
import { Button, Menu, MenuItem, Typography, Box } from '@mui/material';
import { Translate as TranslateIcon, ArrowDropDown as ArrowDropDownIcon } from '@mui/icons-material';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSelector({ color = 'inherit', sx = {} }) {
  const { language, setLanguage, LANGUAGES } = useLanguage();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (langCode) => {
    setLanguage(langCode);
    handleClose();
  };

  const currentLangName = LANGUAGES.find(l => l.code === language)?.name || 'Language';

  return (
    <Box sx={{ display: 'inline-block', ...sx }}>
      <Button
        color={color}
        onClick={handleClick}
        startIcon={<TranslateIcon sx={{ fontSize: 18 }} />}
        endIcon={<ArrowDropDownIcon sx={{ opacity: 0.8 }} />}
        sx={{ 
          textTransform: 'none', 
          fontWeight: 600,
          fontFamily: '"Inter", sans-serif',
          fontSize: '0.875rem',
          borderRadius: '8px',
          px: 1.5,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)'
          }
        }}
      >
        {currentLangName.split(' ')[0]} {/* Shorten name (e.g., 'हिन्दी (Hindi)' -> 'हिन्दी') */}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            minWidth: 160,
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              fontWeight: 500,
              fontFamily: '"Inter", sans-serif',
              py: 1,
              px: 2,
              '&.Mui-selected': {
                backgroundColor: 'rgba(10, 37, 64, 0.08)',
                fontWeight: 700,
                color: '#0A2540'
              }
            }
          }
        }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === language}
            onClick={() => handleSelect(lang.code)}
          >
            {lang.name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
