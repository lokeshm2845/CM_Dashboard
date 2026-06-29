import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, Card, CardContent, Stack, Divider, Chip, Alert, List, ListItem, ListItemText 
} from '@mui/material';
import { FlightTakeoff as FlightIcon, Add as AddIcon, Warning, LocationOn as MapIcon } from '@mui/icons-material';
import { complaintService } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { calculateDistance } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

const DISTRICTS = [
  'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
  'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
  'Shahdara', 'Central Delhi'
];

const DISTRICT_COORDS = {
  'New Delhi': { lat: 28.6129, lng: 77.2295 }, // Connaught Place
  'Central Delhi': { lat: 28.6445, lng: 77.1912 }, // Karol Bagh
  'North Delhi': { lat: 28.6942, lng: 77.2090 }, // Model Town
  'South Delhi': { lat: 28.5621, lng: 77.2056 }, // Saket
  'East Delhi': { lat: 28.6289, lng: 77.2778 }, // Laxmi Nagar
  'West Delhi': { lat: 28.6219, lng: 77.0878 }, // Janakpuri
  'North East Delhi': { lat: 28.6872, lng: 77.2689 }, // Shahdara
  'North West Delhi': { lat: 28.7041, lng: 77.1025 }, // Rohini
  'South East Delhi': { lat: 28.5678, lng: 77.2435 }, // Lajpat Nagar
  'South West Delhi': { lat: 28.5708, lng: 77.0690 }, // Dwarka
  'Shahdara': { lat: 28.6738, lng: 77.2912 }
};

const INITIAL_VISITS = [
  { id: 'v-1', district: 'North Delhi', latitude: 28.6942, longitude: 77.2090, visit_date: '2026-06-25', purpose: 'Surprise inspection of model school and public health dispensary', notes: 'Check sewage overflow complaints registered near Model Town.', complaint_count: 3 },
  { id: 'v-2', district: 'West Delhi', latitude: 28.6185, longitude: 77.0321, visit_date: '2026-06-12', purpose: 'Review meeting of Dwarka water line project', notes: 'Discuss pipeline burst issues with DJB local body representatives.', complaint_count: 5 }
];

const MOCK_VISITS_KEY = 'delhi_cm_visits';

export default function VisitLogs() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t, tDistrict } = useLanguage();
  const [visits, setVisits] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  
  // Form State
  const [district, setDistrict] = useState('');
  const [latitude, setLatitude] = useState('28.6139');
  const [longitude, setLongitude] = useState('77.2090');
  const [visitDate, setVisitDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const allComps = await complaintService.getComplaints();
      setComplaints(allComps);

      let stored = localStorage.getItem(MOCK_VISITS_KEY);
      if (!stored) {
        localStorage.setItem(MOCK_VISITS_KEY, JSON.stringify(INITIAL_VISITS));
        stored = JSON.stringify(INITIAL_VISITS);
      }
      const visitsList = JSON.parse(stored);

      // Recalculate complaint count dynamically based on 2km radius
      const updatedVisits = visitsList.map(v => {
        const count = allComps.filter(c => {
          if (c.status === 'resolved') return false;
          const dist = calculateDistance(
            parseFloat(v.latitude || 28.6139),
            parseFloat(v.longitude || 77.2090),
            parseFloat(c.latitude),
            parseFloat(c.longitude)
          );
          return dist <= 2.0; // 2km
        }).length;
        return { ...v, complaint_count: count };
      });

      setVisits(updatedVisits.sort((a,b) => new Date(a.visit_date) - new Date(b.visit_date)));
      
      if (updatedVisits.length > 0 && !selectedVisit) {
        setSelectedVisit(updatedVisits[0]);
      }
    } catch (err) {
      showNotification('Error loading visits data.', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDistrictSelect = (e) => {
    const val = e.target.value;
    setDistrict(val);
    if (DISTRICT_COORDS[val]) {
      setLatitude(DISTRICT_COORDS[val].lat.toFixed(6));
      setLongitude(DISTRICT_COORDS[val].lng.toFixed(6));
    }
  };

  const handleAddVisit = (e) => {
    e.preventDefault();
    try {
      const vLat = parseFloat(latitude || 28.6139);
      const vLng = parseFloat(longitude || 77.2090);

      // Calculate nearby active complaints
      const activeCount = complaints.filter(c => {
        if (c.status === 'resolved') return false;
        const dist = calculateDistance(vLat, vLng, parseFloat(c.latitude), parseFloat(c.longitude));
        return dist <= 2.0;
      }).length;
      
      const newVisit = {
        id: 'v-' + Date.now(),
        district,
        latitude: vLat,
        longitude: vLng,
        visit_date: visitDate,
        purpose,
        notes,
        complaint_count: activeCount
      };

      const updated = [...visits, newVisit];
      localStorage.setItem(MOCK_VISITS_KEY, JSON.stringify(updated));
      setVisits(updated.sort((a,b) => new Date(a.visit_date) - new Date(b.visit_date)));
      setSelectedVisit(newVisit);
      
      showNotification(`District visit to ${district} scheduled!`, 'success');
      
      // Reset Form
      setDistrict('');
      setVisitDate('');
      setPurpose('');
      setNotes('');
    } catch (err) {
      showNotification('Failed to schedule CM visit.', 'error');
    }
  };

  const getNearbyComplaints = (visit) => {
    if (!visit) return [];
    return complaints.filter(c => {
      if (c.status === 'resolved') return false;
      const dist = calculateDistance(
        parseFloat(visit.latitude || 28.6139),
        parseFloat(visit.longitude || 77.2090),
        parseFloat(c.latitude),
        parseFloat(c.longitude)
      );
      return dist <= 2.0;
    });
  };

  const nearbyIssues = selectedVisit ? getNearbyComplaints(selectedVisit) : [];

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
          CM District Tour & Visit Planner
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Schedule official tours and cross-reference unresolved local grievances in inspection areas.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side: Schedule Form (Admins / CM only) */}
        {['admin', 'cm'].includes(user?.role || '') && (
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
                Schedule Inspection Visit
              </Typography>
              <Box component="form" onSubmit={handleAddVisit}>
                <FormControl fullWidth required sx={{ mb: 2 }}>
                  <InputLabel>{t('delhiDistrictLocation')}</InputLabel>
                  <Select
                    value={district}
                    onChange={handleDistrictSelect}
                    label={t('delhiDistrictLocation')}
                  >
                    {DISTRICTS.map(d => <MenuItem key={d} value={d}>{tDistrict(d)}</MenuItem>)}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Visit Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <TextField
                      label="Latitude"
                      fullWidth
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Longitude"
                      fullWidth
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Purpose of Visit"
                  multiline
                  rows={2}
                  fullWidth
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Inspect model schools..."
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Briefing Notes"
                  multiline
                  rows={2}
                  fullWidth
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional inspection checkpoints..."
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  sx={{ backgroundColor: '#0A2540', fontWeight: 600, textTransform: 'none', borderRadius: '8px' }}
                >
                  Schedule Tour
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Right Side: Log Directory */}
        <Grid item xs={12} md={['admin', 'cm'].includes(user?.role || '') ? 8 : 12}>
          <Stack spacing={3}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
                Scheduled Tour Itinerary
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>District</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Purpose & Coordinates</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#0A2540' }}>Nearby problems</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#64748B' }}>
                          No upcoming tours scheduled at this time.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visits.map((visit) => (
                        <TableRow 
                          key={visit.id} 
                          hover 
                          selected={selectedVisit?.id === visit.id}
                          onClick={() => setSelectedVisit(visit)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>{visit.district}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                            {new Date(visit.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 12, color: '#1E293B' }}>
                              {visit.purpose}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <MapIcon sx={{ fontSize: 12 }} /> GPS: {visit.latitude}, {visit.longitude}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${visit.complaint_count} within 2km`}
                              color={visit.complaint_count > 4 ? 'error' : visit.complaint_count > 0 ? 'warning' : 'success'}
                              size="small"
                              sx={{ fontWeight: 800, fontSize: 10, height: 20 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {visits.some(v => v.complaint_count > 3) && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '8px', display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Warning sx={{ color: '#D97706' }} />
                  <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 600 }}>
                    WARNING: Certain scheduled tour districts have high concentrations of open grievances within 2km of the CM location. Briefing notes have been dispatched.
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Selected Tour: Nearby Unresolved Grievances Details */}
            {selectedVisit && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0', borderTop: '5px solid #0A2540' }}>
                <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 1 }}>
                  Nearby Unresolved Issues (&le; 2km of CM target)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                  Tours scheduled for <b>{selectedVisit.district}</b> on {selectedVisit.visit_date}. Location GPS: {selectedVisit.latitude}, {selectedVisit.longitude}.
                </Typography>

                <Divider sx={{ mb: 2 }} />

                {nearbyIssues.length === 0 ? (
                  <Alert severity="success">All clean! No pending civic grievances within 2km of this visit point.</Alert>
                ) : (
                  <List>
                    {nearbyIssues.map(c => {
                      const dist = calculateDistance(
                        parseFloat(selectedVisit.latitude),
                        parseFloat(selectedVisit.longitude),
                        parseFloat(c.latitude),
                        parseFloat(c.longitude)
                      );
                      return (
                        <ListItem 
                          key={c.id} 
                          sx={{ 
                            mb: 1.5, 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '8px', 
                            backgroundColor: '#fff',
                            borderLeft: c.severity === 'critical' ? '4px solid #B91C1C' : '4px solid #FF9933'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>
                                  {c.tracking_no} | {c.title}
                                </Typography>
                                <Chip 
                                  label={`${dist.toFixed(2)} km away`} 
                                  size="small" 
                                  sx={{ fontWeight: 800, height: 18, fontSize: 10, backgroundColor: '#EFF6FF', color: '#1E40AF' }} 
                                />
                              </Stack>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                                Category: <b>{c.category}</b> | Status: <b>{c.status.toUpperCase()}</b> | Severity: <b>{c.severity.toUpperCase()}</b>
                                <br />
                                <i>Description: {c.description}</i>
                              </Typography>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
