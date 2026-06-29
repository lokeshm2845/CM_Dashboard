import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, LinearProgress, Stack, Chip, Divider, Rating, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, IconButton 
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Phone as PhoneIcon, 
  Email as EmailIcon,
  LocationOn as MapIcon
} from '@mui/icons-material';
import { useNotification } from '../context/NotificationContext';
import { departmentService } from '../services/departmentService';
import { officerService } from '../services/officerService';
import { useAuth } from '../context/AuthContext';
import { DISTRICTS } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';

export default function Officers() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t, tDistrict } = useLanguage();
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [open, setOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null); // null for Add, officer object for Edit
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('New Delhi');
  const [departmentCode, setDepartmentCode] = useState('');
  const [maxWorkload, setMaxWorkload] = useState('15');

  const loadData = async () => {
    setLoading(true);
    try {
      const roster = await departmentService.getOfficers();
      setOfficers(roster);

      const depts = await departmentService.getDepartments();
      setDepartments(depts);
    } catch (err) {
      showNotification('Error loading officers directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (officer = null) => {
    if (officer) {
      setSelectedOfficer(officer);
      setName(officer.name);
      setEmail(officer.email);
      setPhone(officer.phone || '');
      setDistrict(officer.district || 'New Delhi');
      setDepartmentCode(officer.department_code);
      setMaxWorkload(officer.max_workload.toString());
    } else {
      setSelectedOfficer(null);
      setName('');
      setEmail('');
      setPhone('');
      setDistrict('New Delhi');
      setDepartmentCode('');
      setMaxWorkload('15');
    }
    setOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !email || !departmentCode) {
      showNotification('Please fill in Name, Email, and Department.', 'warning');
      return;
    }
    try {
      const payload = {
        name,
        email,
        phone,
        district,
        department_code: departmentCode,
        max_workload: parseInt(maxWorkload)
      };

      if (selectedOfficer) {
        await officerService.updateOfficer(selectedOfficer.id, payload);
        showNotification('Officer updated successfully.', 'success');
      } else {
        await officerService.createOfficer(payload);
        showNotification('New officer registered successfully.', 'success');
      }
      setOpen(false);
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to save officer.', 'error');
    }
  };

  const handleDelete = async (officerId) => {
    if (window.confirm('Are you sure you want to remove this officer? All workload logs will remain but assignment references will be cleared.')) {
      try {
        await officerService.deleteOfficer(officerId);
        showNotification('Officer profile removed.', 'success');
        loadData();
      } catch (err) {
        showNotification('Failed to remove officer profile.', 'error');
      }
    }
  };

  const getLoadColor = (current, max) => {
    const pct = (current / max) * 100;
    if (pct > 80) return '#B91C1C'; // Red overloaded
    if (pct > 50) return '#FF9933'; // Orange warning
    return '#138808'; // Green safe
  };

  const isAdmin = ['admin', 'cm'].includes(user?.role || '');

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
            Department Officers Directory
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Monitor officer workloads, response efficiency ratings, and contact details.
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ backgroundColor: '#0A2540', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
          >
            Add Officer
          </Button>
        )}
      </Stack>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {officers.map((officer) => {
            const isOverloaded = officer.workload_count >= officer.max_workload;
            return (
              <Grid item xs={12} sm={6} md={4} key={officer.id}>
                <Card elevation={2} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', position: 'relative' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: '#0A2540', fontWeight: 700, width: 44, height: 44 }}>
                          {officer.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0A2540', lineHeight: 1.2 }}>
                            {officer.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {officer.department_code} Department
                          </Typography>
                        </Box>
                      </Stack>
                      {isAdmin && (
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={() => handleOpenDialog(officer)} color="primary">
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(officer.id)} color="error">
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      )}
                    </Stack>

                    <Box sx={{ mb: 2 }}>
                      <Rating value={parseFloat(officer.avg_rating)} precision={0.1} readOnly size="small" />
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.2 }}>
                        Average rating based on citizen feedback
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Workload Indicator */}
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>ACTIVE WORKLOAD</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {officer.workload_count} / {officer.max_workload} Cases
                        </Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={(officer.workload_count / officer.max_workload) * 100} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3, 
                          backgroundColor: '#F1F5F9',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getLoadColor(officer.workload_count, officer.max_workload)
                          }
                        }} 
                      />
                    </Box>

                    <Stack spacing={0.8} sx={{ mt: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>CONTACT DETAILS</Typography>
                      <Typography variant="body2" sx={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: 14 }} /> {officer.email}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 14 }} /> {officer.phone}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MapIcon sx={{ fontSize: 14 }} /> District: <b>{officer.district || 'All'}</b>
                      </Typography>
                    </Stack>

                    {isOverloaded && (
                      <Chip 
                        label="OVERLOADED" 
                        color="error" 
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          top: 16, 
                          right: isAdmin ? 68 : 16, 
                          fontWeight: 800, 
                          fontSize: 9,
                          height: 20
                        }} 
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* OFFICER ADD/EDIT MODAL FORM */}
      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: '12px' } }}>
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle sx={{ backgroundColor: '#0A2540', color: '#fff' }}>
            {selectedOfficer ? 'Modify Officer Roster' : 'Register New Officer'}
          </DialogTitle>
          <DialogContent sx={{ py: 3, minWidth: 340 }}>
            <Stack spacing={2.5} sx={{ mt: 1.5 }}>
              <TextField
                label="Full Name"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. S.K. Sharma"
              />
              <TextField
                label="Official Email"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. sksharma@delhi.gov.in"
              />
              <TextField
                label="Mobile Phone"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543203"
              />
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
              <FormControl fullWidth required>
                <InputLabel>Department Organization</InputLabel>
                <Select
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value)}
                  label="Department Organization"
                >
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.code}>{dept.name} ({dept.code})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Max Caseload Capacity"
                type="number"
                fullWidth
                required
                value={maxWorkload}
                onChange={(e) => setMaxWorkload(e.target.value)}
                placeholder="15"
                InputProps={{ inputProps: { min: 5, max: 40 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setOpen(false)} variant="outlined" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: '#0A2540', textTransform: 'none' }}>
              Register
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
