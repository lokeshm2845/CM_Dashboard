import React, { useState } from 'react';
import { 
  Box, Container, Typography, Tab, Tabs, Paper, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Divider, Rating, Alert, Stack, Checkbox, FormControlLabel
} from '@mui/material';
import { 
  Send as SendIcon, 
  Search as SearchIcon, 
  CheckCircle as SuccessIcon, 
  Timeline as TimelineIcon 
} from '@mui/icons-material';
import { complaintService } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import StatusBadge from '../components/common/StatusBadge';
import SocialShare from '../components/common/SocialShare';
import { useLanguage } from '../context/LanguageContext';

import { DISTRICTS, COMPLAINT_CATEGORIES as CATEGORIES } from '../utils/constants';

export default function TrackComplaint() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t, tCategory, tDistrict } = useLanguage();
  const [tabValue, setTabValue] = useState(0);

  // Intake state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [district, setDistrict] = useState('');
  const [photoBefore, setPhotoBefore] = useState('');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');
  const [submittedId, setSubmittedId] = useState(null);
  const [isCritical, setIsCritical] = useState(false);

  // Tracking State
  const [trackNo, setTrackNo] = useState('');
  const [trackedComp, setTrackedComp] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Feedback State
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSubmittedId(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        description,
        category,
        district,
        photo_before: photoBefore,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        is_critical: isCritical
      };

      const result = await complaintService.createComplaint(payload, user);
      setSubmittedId(result.tracking_no);
      showNotification(`Grievance submitted successfully! Tracking No: ${result.tracking_no}`, 'success');
      loadMyComplaints();
      
      // Reset form fields
      setTitle('');
      setDescription('');
      setCategory('');
      setDistrict('');
      setPhotoBefore('');
      setIsCritical(false);
    } catch (err) {
      showNotification('Error creating complaint. Please verify your fields.', 'error');
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setHasSearched(true);
    try {
      const result = await complaintService.trackComplaintByNo(trackNo);
      setTrackedComp(result);
      setFeedbackSubmitted(false);
      if (result) {
        showNotification('Grievance details loaded.', 'info');
      } else {
        showNotification('No matching tracking number found.', 'warning');
      }
    } catch (err) {
      showNotification('Error tracking grievance.', 'error');
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!trackedComp) return;
    try {
      await complaintService.submitFeedback(trackedComp.id, { rating, comments });
      setFeedbackSubmitted(true);
      showNotification('Thank you! Your feedback has been registered.', 'success');
      
      // Reload tracked complaint to see reopened status if rating < 3
      const updated = await complaintService.trackComplaintByNo(trackedComp.tracking_no);
      setTrackedComp(updated);
      loadMyComplaints();
    } catch (err) {
      showNotification('Failed to submit feedback.', 'error');
    }
  };

  const [myComplaints, setMyComplaints] = useState([]);

  const loadMyComplaints = async () => {
    if (!user) return;
    try {
      const all = await complaintService.getComplaints();
      const filtered = all.filter(c => c.citizen_id === user.id || c.citizen_name === user.full_name);
      setMyComplaints(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (user && user.role === 'citizen') {
      loadMyComplaints();
    }
  }, [user]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }} className="fade-in">
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
          {t('citizenRedressalDesk')}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
          {t('citizenRedressalSubtitle')}
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 4, borderRadius: '14px', overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          centered
          sx={{
            backgroundColor: '#0A2540',
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontFamily: 'Inter' },
            '& .Mui-selected': { color: '#fff !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#FF9933', height: 3 }
          }}
        >
          <Tab label={t('submitNewGrievance')} />
          <Tab label={t('trackStatusFeedback')} />
          {user && user.role === 'citizen' && <Tab label={t('myFiledGrievances')} />}
        </Tabs>

        <Box sx={{ p: 4 }}>
          {/* TAB 0: Intake Form */}
          {tabValue === 0 && (
            <Box>
              {submittedId ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SuccessIcon sx={{ fontSize: 60, color: '#138808', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0A2540', mb: 1 }}>
                    {t('grievanceRegistered')}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#475569', mb: 3 }}>
                    {t('trackingRefId')} <b style={{ color: '#FF9933', fontSize: 20 }}>{submittedId}</b>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                    {t('workloadDetail')}
                  </Typography>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button 
                      variant="contained" 
                      onClick={() => setSubmittedId(null)}
                      sx={{ textTransform: 'none', backgroundColor: '#0A2540' }}
                    >
                      {t('fileAnotherGrievance')}
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        setTrackNo(submittedId);
                        setTabValue(1);
                        setTimeout(() => {
                          const fakeEvent = { preventDefault: () => {} };
                          handleTrack(fakeEvent);
                        }, 50);
                      }}
                      sx={{ textTransform: 'none' }}
                    >
                      {t('trackProgress')}
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleCreate}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        label={t('grievanceTitle')}
                        fullWidth
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('titlePlaceholder')}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label={t('detailedDescription')}
                        multiline
                        rows={4}
                        fullWidth
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('descriptionPlaceholder')}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>{t('categoryServiceArea')}</InputLabel>
                        <Select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          label={t('categoryServiceArea')}
                        >
                          {CATEGORIES.map(c => <MenuItem key={c} value={c}>{tCategory(c)}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>{t('delhiDistrictLocation')}</InputLabel>
                        <Select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          label={t('delhiDistrictLocation')}
                        >
                          {DISTRICTS.map(d => <MenuItem key={d} value={d}>{tDistrict(d)}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={t('gpsLatitude')}
                        fullWidth
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label={t('gpsLongitude')}
                        fullWidth
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label={t('uploadPhotoUrl')}
                        fullWidth
                        value={photoBefore}
                        onChange={(e) => setPhotoBefore(e.target.value)}
                        placeholder={t('photoPlaceholder')}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isCritical}
                            onChange={(e) => setIsCritical(e.target.checked)}
                            color="error"
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#B91C1C' }}>
                            {t('isLifeThreatening')}
                          </Typography>
                        }
                      />
                      {isCritical && (
                        <Alert severity="error" sx={{ mt: 1, fontWeight: 600 }}>
                          {t('warningFalseAlert')}
                        </Alert>
                      )}
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        startIcon={<SendIcon />}
                        sx={{
                          py: 1.5,
                          backgroundColor: '#0A2540',
                          fontWeight: 700,
                          fontSize: 16,
                          borderRadius: '10px',
                          textTransform: 'none',
                          '&:hover': { backgroundColor: '#1E40AF' }
                        }}
                      >
                        {t('submitGrievance')}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}

          {/* TAB 1: Tracking / Feedback */}
          {tabValue === 1 && (
            <Box>
              <Box component="form" onSubmit={handleTrack} sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <TextField
                  label={t('enterTrackingRef')}
                  variant="outlined"
                  fullWidth
                  required
                  value={trackNo}
                  onChange={(e) => setTrackNo(e.target.value)}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={<SearchIcon />}
                  sx={{ backgroundColor: '#0A2540', textTransform: 'none', px: 4 }}
                >
                  {t('search')}
                </Button>
              </Box>

              {hasSearched && !trackedComp && (
                <Alert severity="error">{t('noRecordFound')}</Alert>
              )}

              {trackedComp && (
                <Box className="fade-in">
                  {/* Status Banner */}
                  <Card variant="outlined" sx={{ mb: 4, borderRadius: '10px', borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <CardContent>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                            {t('grievanceId')} {trackedComp.tracking_no}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0A2540' }}>
                            {trackedComp.title}
                          </Typography>
                        </Box>
                        <Box sx={{ alignSelf: { xs: 'start', sm: 'center' } }}>
                          <StatusBadge status={trackedComp.status} />
                        </Box>
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>{t('departmentLabel')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{trackedComp.department_name}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>{t('districtLabel')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{tDistrict(trackedComp.district)}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>{t('reportedDateLabel')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {new Date(trackedComp.created_at).toLocaleDateString('en-IN')}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>{t('severityLabel')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#B91C1C' }}>
                            {trackedComp.severity.toUpperCase()}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />
                      
                      {/* Social sharing links */}
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>{t('sharePublicLink')}</Typography>
                        <SocialShare trackingNo={trackedComp.tracking_no} title={trackedComp.title} status={trackedComp.status} />
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Audit Logs / Timeline */}
                  <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon /> {t('progressLogs')}
                  </Typography>

                  <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: '10px' }}>
                    <Grid container spacing={3}>
                      {trackedComp.timeline?.map((entry) => (
                        <Grid item xs={12} key={entry.id}>
                          <Box sx={{ pl: 2, borderLeft: '4px solid #0A2540' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {entry.description}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                              Logged: {new Date(entry.created_at).toLocaleString('en-IN')} | By: {entry.action_by_name}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>

                  {/* Feedback Form (Visible if status = resolved) */}
                  {trackedComp.status === 'resolved' && !feedbackSubmitted && (
                    <Paper elevation={3} sx={{ p: 4, borderRadius: '12px', border: '1px solid #A7F3D0', backgroundColor: '#F0FDF4' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#065F46', mb: 1 }}>
                        {t('rateResolution')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#047857', mb: 3 }}>
                        {t('rateSubtitle')}
                      </Typography>

                      <Box component="form" onSubmit={handleFeedback}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ color: '#065F46' }}>{t('ratingLabel')}</Typography>
                          <Rating 
                            name="resolution-rating" 
                            value={rating} 
                            onChange={(event, newValue) => setRating(newValue || 5)} 
                          />
                        </Box>
                        <TextField
                          label={t('commentsIssues')}
                          multiline
                          rows={2}
                          fullWidth
                          required={rating < 3}
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder={t('commentsPlaceholder')}
                          sx={{ mb: 2, backgroundColor: '#fff' }}
                        />
                        <Button 
                          type="submit" 
                          variant="contained" 
                          color="success"
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          {t('submitReview')}
                        </Button>
                      </Box>
                    </Paper>
                  )}

                  {feedbackSubmitted && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      {t('feedbackSuccess')}
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* TAB 2: My Filed Grievances */}
          {tabValue === 2 && user && user.role === 'citizen' && (
            <Box>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
                {t('myHistoryTitle')}
              </Typography>
              {myComplaints.length === 0 ? (
                <Alert severity="info">{t('noGrievances')}</Alert>
              ) : (
                <Grid container spacing={2}>
                  {myComplaints.map((c) => (
                    <Grid item xs={12} key={c.id}>
                      <Card variant="outlined" sx={{ borderRadius: '10px', '&:hover': { borderColor: '#FF9933', boxShadow: 1 } }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540' }}>
                              ID: {c.tracking_no} | {c.title}
                            </Typography>
                            <StatusBadge status={c.status} />
                          </Stack>
                          <Typography variant="body2" sx={{ color: '#64748B', mb: 1.5, fontSize: 13 }}>
                            {c.description.length > 120 ? c.description.substring(0, 117) + '...' : c.description}
                          </Typography>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                              {t('districtLabel')}: <b>{tDistrict(c.district)}</b> | {t('categoryServiceArea')}: <b>{tCategory(c.category)}</b>
                            </Typography>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => {
                                setTrackNo(c.tracking_no);
                                setTabValue(1);
                                setTimeout(() => {
                                  const fakeEvent = { preventDefault: () => {} };
                                  handleTrack(fakeEvent);
                                }, 50);
                              }}
                              sx={{ textTransform: 'none', py: 0.2, fontSize: 11 }}
                            >
                              {t('trackReviewBtn')}
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
