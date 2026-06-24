import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  IconButton, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  Chip, 
  Collapse, 
  Zoom, 
  Stack, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Close as CloseIcon, 
  Send as SendIcon, 
  ArrowBack as ArrowBackIcon,
  SupportAgent as AgentIcon,
  TrackChanges as TrackIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import { COMPLAINT_CATEGORIES, DISTRICTS } from '../../utils/constants';

const STEPS = {
  MENU: 'MENU',
  // Intake Process
  INTAKE_TITLE: 'INTAKE_TITLE',
  INTAKE_DESC: 'INTAKE_DESC',
  INTAKE_CATEGORY: 'INTAKE_CATEGORY',
  INTAKE_DISTRICT: 'INTAKE_DISTRICT',
  INTAKE_NAME: 'INTAKE_NAME',
  INTAKE_PHONE: 'INTAKE_PHONE',
  INTAKE_CRITICAL: 'INTAKE_CRITICAL',
  INTAKE_CONFIRM: 'INTAKE_CONFIRM',
  // Tracking Process
  TRACK_ID: 'TRACK_ID',
  // General chat fallback
  CHAT: 'CHAT'
};

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const [currentStep, setCurrentStep] = useState(STEPS.MENU);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Complaint state store during intake
  const [intakeData, setIntakeData] = useState({
    title: '',
    description: '',
    category: '',
    district: '',
    citizen_name: '',
    citizen_phone: '',
    is_critical: false
  });

  const chatEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: `Namaste! I am Delhi Grievance Sahayak, your CM Office AI assistant. I can help you register a grievance, check its live status, or answer Delhi Government policies.`,
          type: 'text'
        },
        {
          id: 'welcome-options',
          sender: 'bot',
          type: 'options',
          options: [
            { label: '📝 File a Grievance', value: 'file_grievance' },
            { label: '🔍 Track Grievance Status', value: 'track_grievance' },
            { label: '❓ View Help & FAQs', value: 'faqs' }
          ]
        }
      ]);
    }
  }, [messages]);

  // Hide badge after opening chatbot once
  useEffect(() => {
    if (isOpen) {
      setShowBadge(false);
    }
  }, [isOpen]);

  const addMessage = (message) => {
    setMessages(prev => [...prev, { ...message, id: `msg-${Date.now()}-${Math.random()}` }]);
  };

  const simulateBotResponse = (text, delay = 800, nextAction = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage({ sender: 'bot', text, type: 'text' });
      if (nextAction) nextAction();
    }, delay);
  };

  const handleQuickOptionSelect = async (value) => {
    // User response
    if (value === 'file_grievance') {
      addMessage({ sender: 'user', text: 'I want to file a new grievance.' });
      setCurrentStep(STEPS.INTAKE_TITLE);
      // Pre-fill user data if logged in
      setIntakeData({
        title: '',
        description: '',
        category: '',
        district: user?.district || '',
        citizen_name: user?.full_name || '',
        citizen_phone: user?.phone || '',
        is_critical: false
      });
      simulateBotResponse("Let's register your grievance. To start, please type a short title/subject of your complaint (e.g., 'Broken water pipe near bus terminal').");
    } 
    else if (value === 'track_grievance') {
      addMessage({ sender: 'user', text: 'I want to track an existing grievance.' });
      setCurrentStep(STEPS.TRACK_ID);
      simulateBotResponse('Please enter your 13-character grievance tracking ID (e.g. CMP-2026-8921):');
    } 
    else if (value === 'faqs') {
      addMessage({ sender: 'user', text: 'Show me Help & FAQs.' });
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage({
          sender: 'bot',
          text: 'Here are answers to the most common queries:',
          type: 'text'
        });
        addMessage({
          sender: 'bot',
          type: 'faqs',
          faqs: [
            { q: 'How long does a resolution take?', a: 'Standard resolution timeframe is within 7 days. If a complaint is not resolved, it auto-escalates to the CM Cell.' },
            { q: 'What is a critical alert?', a: 'Complaints representing immediate hazards or safety threats are tagged critical and alert the CM monitoring cell.' },
            { q: 'How to reopen a complaint?', a: 'If you are unsatisfied with the resolution, rating it 1 or 2 stars will automatically reopen the grievance.' }
          ]
        });
        addMessage({
          sender: 'bot',
          type: 'options',
          options: [{ label: '🔙 Main Menu', value: 'main_menu' }]
        });
      }, 600);
    } 
    else if (value === 'main_menu') {
      addMessage({ sender: 'user', text: 'Go back to Main Menu.' });
      setCurrentStep(STEPS.MENU);
      simulateBotResponse('How else can I assist you?', 400, () => {
        addMessage({
          sender: 'bot',
          type: 'options',
          options: [
            { label: '📝 File a Grievance', value: 'file_grievance' },
            { label: '🔍 Track Grievance Status', value: 'track_grievance' },
            { label: '❓ View Help & FAQs', value: 'faqs' }
          ]
        });
      });
    }
  };

  const handleTextInputSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userInput = inputValue.trim();
    addMessage({ sender: 'user', text: userInput });
    setInputValue('');

    // Handle states
    switch (currentStep) {
      case STEPS.MENU:
      case STEPS.CHAT:
        handleGeneralChat(userInput);
        break;

      case STEPS.INTAKE_TITLE:
        if (userInput.length < 5) {
          simulateBotResponse('The title is too short. Please provide a more descriptive title (at least 5 characters).');
        } else {
          setIntakeData(prev => ({ ...prev, title: userInput }));
          setCurrentStep(STEPS.INTAKE_DESC);
          simulateBotResponse('Got it! Now, please provide a detailed description of the issue.');
        }
        break;

      case STEPS.INTAKE_DESC:
        if (userInput.length < 10) {
          simulateBotResponse('Please enter a longer description describing where and what the issue is (minimum 10 characters).');
        } else {
          setIntakeData(prev => ({ ...prev, description: userInput }));
          setCurrentStep(STEPS.INTAKE_CATEGORY);
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            addMessage({
              sender: 'bot',
              text: 'Please select the most relevant department category from the options below:',
              type: 'text'
            });
            addMessage({
              sender: 'bot',
              type: 'selection_chips',
              items: COMPLAINT_CATEGORIES,
              field: 'category'
            });
          }, 600);
        }
        break;

      case STEPS.INTAKE_NAME:
        if (userInput.length < 2) {
          simulateBotResponse('Please enter a valid name.');
        } else {
          setIntakeData(prev => ({ ...prev, citizen_name: userInput }));
          setCurrentStep(STEPS.INTAKE_PHONE);
          simulateBotResponse('Thank you. What is your 10-digit mobile number? (for SMS tracking notifications)');
        }
        break;

      case STEPS.INTAKE_PHONE:
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(userInput)) {
          simulateBotResponse('Invalid mobile number. Please enter a valid 10-digit Indian phone number (starting with 6-9).');
        } else {
          setIntakeData(prev => {
            const updated = { ...prev, citizen_phone: userInput };
            askForCriticalAlert(updated);
            return updated;
          });
        }
        break;

      case STEPS.TRACK_ID:
        handleTrackLookup(userInput);
        break;

      default:
        handleGeneralChat(userInput);
    }
  };

  const handleSelectionSelect = (field, value) => {
    addMessage({ sender: 'user', text: value });
    setIntakeData(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'category') {
        setCurrentStep(STEPS.INTAKE_DISTRICT);
        simulateBotResponse('Which district in Delhi does this issue fall under?', 500, () => {
          addMessage({
            sender: 'bot',
            type: 'selection_chips',
            items: DISTRICTS,
            field: 'district'
          });
        });
      } 
      else if (field === 'district') {
        // If logged in, we skip name and phone intake
        if (user) {
          askForCriticalAlert(updated);
        } else {
          setCurrentStep(STEPS.INTAKE_NAME);
          simulateBotResponse('Please enter your full name:');
        }
      }
      return updated;
    });
  };

  const askForCriticalAlert = (currentData) => {
    setCurrentStep(STEPS.INTAKE_CRITICAL);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage({
        sender: 'bot',
        text: 'Does this grievance pose an immediate risk or is it a life-threatening situation (critical status)?',
        type: 'text'
      });
      addMessage({
        sender: 'bot',
        type: 'options',
        options: [
          { label: '⚠️ Yes, Critical Risk', value: 'critical_yes' },
          { label: '❌ No, Standard Grievance', value: 'critical_no' }
        ]
      });
    }, 600);
  };

  const handleCriticalSelection = (value) => {
    const isCritical = value === 'critical_yes';
    addMessage({ sender: 'user', text: isCritical ? 'Yes, it is critical.' : 'No, it is a standard issue.' });
    
    setIntakeData(prev => {
      const updated = { ...prev, is_critical: isCritical };
      setCurrentStep(STEPS.INTAKE_CONFIRM);
      
      simulateBotResponse('Please review your details before filing:', 500, () => {
        addMessage({
          sender: 'bot',
          type: 'confirm_card',
          data: updated
        });
        addMessage({
          sender: 'bot',
          type: 'options',
          options: [
            { label: '✅ File Grievance Now', value: 'confirm_submit' },
            { label: '❌ Cancel & Reset', value: 'main_menu' }
          ]
        });
      });
      return updated;
    });
  };

  const submitIntakeGrievance = async () => {
    setIsTyping(true);
    try {
      const payload = {
        title: intakeData.title,
        description: intakeData.description,
        category: intakeData.category,
        district: intakeData.district,
        citizen_name: intakeData.citizen_name,
        citizen_phone: intakeData.citizen_phone,
        is_critical: intakeData.is_critical,
        source: 'web'
      };

      const result = await complaintService.createComplaint(payload, user);
      
      setIsTyping(false);
      addMessage({
        sender: 'bot',
        type: 'success_card',
        data: {
          tracking_no: result.tracking_no,
          category: result.category,
          status: result.status,
          department_name: result.department_name || 'Assigned Department'
        }
      });

      simulateBotResponse('Your grievance has been successfully submitted! A tracking ID has been sent to your phone. What would you like to do next?', 1000, () => {
        setCurrentStep(STEPS.MENU);
        addMessage({
          sender: 'bot',
          type: 'options',
          options: [
            { label: '📝 File Another Grievance', value: 'file_grievance' },
            { label: '🔙 Return to Main Menu', value: 'main_menu' }
          ]
        });
      });
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      simulateBotResponse(`An error occurred while saving your complaint: ${err.message}. Please try again later.`);
      setCurrentStep(STEPS.MENU);
    }
  };

  const handleTrackLookup = async (trackingNo) => {
    setIsTyping(true);
    try {
      const result = await complaintService.trackComplaintByNo(trackingNo);
      setIsTyping(false);

      if (result) {
        addMessage({
          sender: 'bot',
          type: 'track_result',
          data: result
        });
        simulateBotResponse('Grievance details fetched from live database. How else can I help?', 800, () => {
          setCurrentStep(STEPS.MENU);
          addMessage({
            sender: 'bot',
            type: 'options',
            options: [{ label: '🔙 Return to Main Menu', value: 'main_menu' }]
          });
        });
      } else {
        simulateBotResponse('Could not find any grievance with that tracking ID. Please verify the number and try again (e.g. CMP-2026-8921):');
      }
    } catch (err) {
      setIsTyping(false);
      simulateBotResponse(`Database error checking status: ${err.message}. Please try again.`);
    }
  };

  const handleGeneralChat = (text) => {
    const q = text.toLowerCase();
    
    if (q.includes('file') || q.includes('register') || q.includes('complain') || q.includes('grievance')) {
      simulateBotResponse('Would you like to register a new grievance?', 500, () => {
        addMessage({
          sender: 'bot',
          type: 'options',
          options: [
            { label: 'Yes, File Grievance', value: 'file_grievance' },
            { label: 'No, Back to Menu', value: 'main_menu' }
          ]
        });
      });
    } 
    else if (q.includes('status') || q.includes('track') || q.includes('check')) {
      simulateBotResponse('Would you like to track your complaint status?', 500, () => {
        addMessage({
          sender: 'bot',
          type: 'options',
          options: [
            { label: 'Yes, Track Status', value: 'track_grievance' },
            { label: 'No, Back to Menu', value: 'main_menu' }
          ]
        });
      });
    } 
    else if (q.includes('pothole') || q.includes('road')) {
      simulateBotResponse('I see you are inquiring about road issues. PWD and MCD manage roads in Delhi. Would you like to file a road-related grievance?', 600, () => {
        addMessage({
          sender: 'bot',
          type: 'options',
          options: [
            { label: 'Yes, File Complaint', value: 'file_grievance' },
            { label: 'No, Back to Menu', value: 'main_menu' }
          ]
        });
      });
    }
    else if (q.includes('water') || q.includes('leak') || q.includes('djb')) {
      simulateBotResponse('For water leakage or shortages, the Delhi Jal Board (DJB) is responsible. Would you like to register a complaint?', 600, () => {
        addMessage({
          sender: 'bot',
          type: 'options',
          options: [
            { label: 'Yes, File Complaint', value: 'file_grievance' },
            { label: 'No, Back to Menu', value: 'main_menu' }
          ]
        });
      });
    }
    else if (q.includes('garbage') || q.includes('waste') || q.includes('clean')) {
      simulateBotResponse('Sanitation issues are monitored by the Municipal Corporation of Delhi (MCD). Would you like to file a complaint for trash removal?', 600, () => {
        addMessage({
          sender: 'bot',
          type: 'options',
          options: [
            { label: 'Yes, File Complaint', value: 'file_grievance' },
            { label: 'No, Back to Menu', value: 'main_menu' }
          ]
        });
      });
    }
    else {
      simulateBotResponse("I can help you file a grievance, look up tracking records, or answer Delhi Government policies. Please choose one of the options below or specify a department.", 600, () => {
        addMessage({
          sender: 'bot',
          type: 'options',
          options: [
            { label: '📝 File a Grievance', value: 'file_grievance' },
            { label: '🔍 Track Grievance Status', value: 'track_grievance' },
            { label: '❓ View Help & FAQs', value: 'faqs' }
          ]
        });
      });
    }
  };

  const handleOptionBtnClick = (actionValue) => {
    if (actionValue === 'confirm_submit') {
      submitIntakeGrievance();
    } else if (actionValue === 'critical_yes' || actionValue === 'critical_no') {
      handleCriticalSelection(actionValue);
    } else {
      handleQuickOptionSelect(actionValue);
    }
  };

  // Helper to format status text nicely
  const getStatusText = (status) => {
    if (!status) return 'Pending';
    return status.toUpperCase().replace('_', ' ');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return '#10B981';
      case 'escalated': return '#EF4444';
      case 'in_progress': return '#3B82F6';
      case 'assigned': return '#F59E0B';
      default: return '#64748B';
    }
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: '"Inter", sans-serif' }}>
      
      {/* Floating Welcome Badge */}
      {showBadge && (
        <Zoom in={showBadge}>
          <Paper 
            elevation={4}
            sx={{
              position: 'absolute',
              bottom: 72,
              right: 8,
              p: 1.5,
              width: 200,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(226,232,240,0.8)',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setIsOpen(true)}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0A2540', fontSize: 12, textAlign: 'center' }}>
              Delhi Grievance Sahayak
            </Typography>
            <Typography variant="caption" sx={{ color: '#FF9933', fontWeight: 600, fontSize: 10, textAlign: 'center', mt: 0.5 }}>
              Active • Tap to Chat
            </Typography>
            <IconButton 
              size="small" 
              sx={{ position: 'absolute', top: 2, right: 2, p: 0.2, color: '#94A3B8' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowBadge(false);
              }}
            >
              <CloseIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Paper>
        </Zoom>
      )}

      {/* Floating Action Button */}
      <Zoom in={true}>
        <Tooltip title="Chat with Grievance Sahayak" placement="left">
          <IconButton
            onClick={() => setIsOpen(!isOpen)}
            sx={{
              width: 60,
              height: 60,
              background: isOpen 
                ? '#1E293B' 
                : 'linear-gradient(135deg, #0A2540 0%, #FF9933 50%, #138808 100%)',
              color: '#fff',
              boxShadow: '0 10px 15px -3px rgba(10,37,64,0.4), 0 4px 6px -4px rgba(10,37,64,0.4)',
              '&:hover': {
                transform: 'scale(1.08)',
                boxShadow: '0 20px 25px -5px rgba(10,37,64,0.5), 0 8px 10px -6px rgba(10,37,64,0.5)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: !isOpen ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(10, 37, 64, 0.7)'
                },
                '70%': {
                  boxShadow: '0 0 0 15px rgba(10, 37, 64, 0)'
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(10, 37, 64, 0)'
                }
              }
            }}
          >
            {isOpen ? <CloseIcon /> : <ChatIcon />}
          </IconButton>
        </Tooltip>
      </Zoom>

      {/* Main Chat Dialog Drawer */}
      <Collapse in={isOpen} orientation="vertical">
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            bottom: 80,
            right: 0,
            width: { xs: 'calc(100vw - 48px)', sm: 380 },
            height: 520,
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(226,232,240,0.8)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}
        >
          {/* Header */}
          <Box 
            sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, #0A2540 0%, #1E293B 100%)', 
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 2
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar 
                sx={{ 
                  bgcolor: '#FF9933', 
                  width: 38, 
                  height: 38,
                  border: '2px solid rgba(255,255,255,0.8)'
                }}
              >
                <AgentIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', lineHeight: 1.1 }}>
                  Grievance Sahayak
                </Typography>
                <Typography variant="caption" sx={{ color: '#138808', fontWeight: 600, display: 'block', mt: 0.2 }}>
                  Hon'ble Delhi CM Cell • Active
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={0.5}>
              {currentStep !== STEPS.MENU && (
                <IconButton 
                  size="small" 
                  onClick={() => {
                    setCurrentStep(STEPS.MENU);
                    simulateBotResponse('Returned to main menu. What would you like to do?', 300, () => {
                      addMessage({
                        sender: 'bot',
                        type: 'options',
                        options: [
                          { label: '📝 File a Grievance', value: 'file_grievance' },
                          { label: '🔍 Track Grievance Status', value: 'track_grievance' },
                          { label: '❓ View Help & FAQs', value: 'faqs' }
                        ]
                      });
                    });
                  }}
                  sx={{ color: '#fff' }}
                >
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: '#fff' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* Scrollable Messages Pane */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              p: 2, 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              backgroundColor: '#F8FAFC',
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E1', borderRadius: '4px' }
            }}
          >
            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <Box key={msg.id} sx={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
                    <Paper 
                      sx={{ 
                        p: 1.5, 
                        bgcolor: '#0A2540', 
                        color: '#fff',
                        borderRadius: '16px 16px 2px 16px',
                        boxShadow: 1
                      }}
                    >
                      <Typography variant="body2">{msg.text}</Typography>
                    </Paper>
                  </Box>
                );
              }

              // Bot Message Types
              if (msg.type === 'text') {
                return (
                  <Box key={msg.id} sx={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                    <Paper 
                      sx={{ 
                        p: 1.5, 
                        bgcolor: '#fff', 
                        color: '#1E293B',
                        borderRadius: '16px 16px 16px 2px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{msg.text}</Typography>
                    </Paper>
                  </Box>
                );
              }

              if (msg.type === 'options') {
                return (
                  <Box key={msg.id} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 0.5, alignSelf: 'flex-start', width: '100%' }}>
                    {msg.options.map((opt) => (
                      <Chip
                        key={opt.value}
                        label={opt.label}
                        clickable
                        onClick={() => handleOptionBtnClick(opt.value)}
                        sx={{
                          borderColor: '#FF9933',
                          color: '#0A2540',
                          fontWeight: 600,
                          fontSize: 12,
                          background: '#fff',
                          '&:hover': {
                            background: 'rgba(255, 153, 51, 0.1)',
                            borderColor: '#FF9933'
                          }
                        }}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                );
              }

              if (msg.type === 'selection_chips') {
                return (
                  <Box key={msg.id} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, my: 0.5, alignSelf: 'flex-start', width: '100%', maxHeight: 150, overflowY: 'auto', p: 0.5 }}>
                    {msg.items.map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        clickable
                        onClick={() => handleSelectionSelect(msg.field, item)}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(19, 136, 8, 0.08)',
                          color: '#138808',
                          borderColor: '#138808',
                          fontWeight: 500,
                          '&:hover': {
                            bgcolor: 'rgba(19, 136, 8, 0.2)'
                          }
                        }}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                );
              }

              if (msg.type === 'confirm_card') {
                const info = msg.data;
                return (
                  <Paper 
                    key={msg.id}
                    elevation={2}
                    sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0', alignSelf: 'flex-start', width: '90%', bgcolor: '#fff' }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', mb: 1 }}>
                      📋 Confirm Details
                    </Typography>
                    <List dense disablePadding>
                      <ListItem disableGutters>
                        <ListItemText 
                          primary={<Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>Title</Typography>} 
                          secondary={<Typography variant="body2" sx={{ color: '#1E293B' }}>{info.title}</Typography>}
                        />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemText 
                          primary={<Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>Category</Typography>} 
                          secondary={<Chip label={info.category} size="small" sx={{ bgcolor: 'rgba(255, 153, 51, 0.1)', color: '#FF9933', height: 20, fontSize: 10, fontWeight: 700 }} />}
                        />
                      </ListItem>
                      <ListItem disableGutters>
                        <ListItemText 
                          primary={<Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>District</Typography>} 
                          secondary={<Typography variant="body2" sx={{ color: '#1E293B' }}>{info.district}</Typography>}
                        />
                      </ListItem>
                      {!user && (
                        <>
                          <ListItem disableGutters>
                            <ListItemText 
                              primary={<Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>Citizen Name</Typography>} 
                              secondary={<Typography variant="body2" sx={{ color: '#1E293B' }}>{info.citizen_name}</Typography>}
                            />
                          </ListItem>
                          <ListItem disableGutters>
                            <ListItemText 
                              primary={<Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>Phone Number</Typography>} 
                              secondary={<Typography variant="body2" sx={{ color: '#1E293B' }}>{info.citizen_phone}</Typography>}
                            />
                          </ListItem>
                        </>
                      )}
                      <ListItem disableGutters>
                        <ListItemText 
                          primary={<Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>Severity</Typography>} 
                          secondary={
                            <Chip 
                              label={info.is_critical ? '⚠️ Critical' : 'Standard'} 
                              size="small" 
                              color={info.is_critical ? 'error' : 'default'} 
                              sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                            />
                          }
                        />
                      </ListItem>
                    </List>
                  </Paper>
                );
              }

              if (msg.type === 'success_card') {
                const info = msg.data;
                return (
                  <Paper 
                    key={msg.id}
                    elevation={3}
                    sx={{
                      p: 2, 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #138808 0%, #1E293B 100%)',
                      color: '#fff',
                      alignSelf: 'flex-start',
                      width: '90%',
                      boxShadow: 2
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <SuccessIcon sx={{ color: '#4ADE80' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Grievance Registered Successfully
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                      GRIEVANCE ID (TRACKING NO):
                    </Typography>
                    <Typography variant="h6" sx={{ letterSpacing: 1, fontWeight: 800, color: '#FF9933', mb: 1.5 }}>
                      {info.tracking_no}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ fontSize: 12, mb: 0.5 }}>
                      <strong>Category:</strong> {info.category}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: 12 }}>
                      <strong>Department:</strong> {info.department_name}
                    </Typography>
                  </Paper>
                );
              }

              if (msg.type === 'faqs') {
                return (
                  <Stack key={msg.id} spacing={1} sx={{ alignSelf: 'flex-start', width: '90%', mb: 0.5 }}>
                    {msg.faqs.map((faq, index) => (
                      <Paper 
                        key={index} 
                        sx={{ p: 1.2, borderRadius: '8px', border: '1px solid #E2E8F0', bgcolor: '#fff' }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <HelpIcon sx={{ fontSize: 14, color: '#FF9933' }} /> {faq.q}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: 11, mt: 0.5, pl: 2 }}>
                          {faq.a}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                );
              }

              if (msg.type === 'track_result') {
                const info = msg.data;
                return (
                  <Paper 
                    key={msg.id}
                    elevation={2}
                    sx={{ p: 2, borderRadius: '12px', border: '1px solid #E2E8F0', alignSelf: 'flex-start', width: '90%', bgcolor: '#fff' }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrackIcon sx={{ color: '#FF9933' }} /> Grievance Status
                    </Typography>
                    
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>ID: {info.tracking_no}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>
                      {info.title}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontSize: 11, color: '#64748B' }}>Status</Typography>
                        <Chip 
                          label={getStatusText(info.status)} 
                          size="small"
                          sx={{ 
                            bgcolor: `${getStatusColor(info.status)}20`, 
                            color: getStatusColor(info.status), 
                            fontWeight: 700,
                            height: 20,
                            fontSize: 10
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontSize: 11, color: '#64748B' }}>Department</Typography>
                        <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 600, color: '#1E293B' }}>{info.department_code || 'Unassigned'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontSize: 11, color: '#64748B' }}>District</Typography>
                        <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 600, color: '#1E293B' }}>{info.district}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontSize: 11, color: '#64748B' }}>Assigned Officer</Typography>
                        <Typography variant="body2" sx={{ fontSize: 11, fontWeight: 600, color: '#1E293B' }}>{info.assigned_officer_name || 'System Assigning'}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                );
              }

              return null;
            })}

            {/* Simulated Typing Indicator */}
            {isTyping && (
              <Box sx={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                <Paper 
                  sx={{ 
                    px: 2, 
                    py: 1, 
                    bgcolor: '#fff', 
                    borderRadius: '16px 16px 16px 2px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <CircularProgress size={12} thickness={5} sx={{ color: '#FF9933' }} />
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>Sahayak is typing...</Typography>
                </Paper>
              </Box>
            )}

            <div ref={chatEndRef} />
          </Box>

          {/* User Text Input Area */}
          <Box 
            component="form" 
            onSubmit={handleTextInputSubmit}
            sx={{ 
              p: 1.5, 
              borderTop: '1px solid #E2E8F0', 
              bgcolor: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder={
                currentStep === STEPS.TRACK_ID 
                  ? "Enter Tracking ID (e.g. CMP-2026-8921)" 
                  : "Ask Sahayak or type details..."
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={
                currentStep === STEPS.INTAKE_CATEGORY ||
                currentStep === STEPS.INTAKE_DISTRICT ||
                currentStep === STEPS.INTAKE_CRITICAL ||
                currentStep === STEPS.INTAKE_CONFIRM
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  bgcolor: '#F8FAFC',
                  fontSize: 13,
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' },
                  '&.Mui-focused fieldset': { borderColor: '#FF9933' }
                }
              }}
            />
            <IconButton 
              type="submit" 
              color="primary"
              disabled={
                !inputValue.trim() ||
                currentStep === STEPS.INTAKE_CATEGORY ||
                currentStep === STEPS.INTAKE_DISTRICT ||
                currentStep === STEPS.INTAKE_CRITICAL ||
                currentStep === STEPS.INTAKE_CONFIRM
              }
              sx={{
                bgcolor: '#0A2540',
                color: '#fff',
                '&:hover': { bgcolor: '#1E293B' },
                '&.Mui-disabled': { bgcolor: '#F1F5F9', color: '#94A3B8' },
                width: 36,
                height: 36
              }}
            >
              <SendIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
}
