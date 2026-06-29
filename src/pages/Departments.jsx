import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, LinearProgress, Stack, Chip, Divider, Rating, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';
import { 
  Business as BusinessIcon, 
  People as PeopleIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { departmentService } from '../services/departmentService';
import { analyticsService } from '../services/analyticsService';
import { routingService } from '../services/routingService';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export default function Departments() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null); // null for Add, dept object for Edit
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState(null);
  const [mapCategory, setMapCategory] = useState('');
  const [mapDeptCode, setMapDeptCode] = useState('');
  const [mapPriority, setMapPriority] = useState('1');

  const loadData = async () => {
    setLoading(true);
    try {
      const details = await departmentService.getDepartments();
      const analyticsList = await analyticsService.getDepartmentMetrics();
      const mappingsList = await routingService.getMappings();
      
      // Merge rating data and logs
      const mergedDepts = details.map(d => {
        const metric = analyticsList.find(m => m.code === d.code) || {};
        return {
          ...d,
          total: metric.total || 0,
          resolved: metric.resolved || 0,
          rate: metric.rate || 0,
          rating: metric.rating || d.rating || 5.0
        };
      });

      setDepartments(mergedDepts);
      setMappings(mappingsList);
    } catch (err) {
      showNotification('Error loading departments data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Department CRUD triggers
  const handleOpenDeptDialog = (dept = null) => {
    if (dept) {
      setSelectedDept(dept);
      setDeptName(dept.name);
      setDeptCode(dept.code);
    } else {
      setSelectedDept(null);
      setDeptName('');
      setDeptCode('');
    }
    setDeptDialogOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    if (!deptName || !deptCode) {
      showNotification('Please fill all department fields.', 'warning');
      return;
    }
    try {
      const payload = { name: deptName, code: deptCode };
      if (selectedDept) {
        await departmentService.updateDepartment(selectedDept.id, payload);
        showNotification('Department updated successfully.', 'success');
      } else {
        await departmentService.createDepartment(payload);
        showNotification('New department registered successfully.', 'success');
      }
      setDeptDialogOpen(false);
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to save department.', 'error');
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (window.confirm('Are you sure you want to delete this department? This will also remove associated officers.')) {
      try {
        await departmentService.deleteDepartment(deptId);
        showNotification('Department deleted successfully.', 'success');
        loadData();
      } catch (err) {
        showNotification('Failed to delete department.', 'error');
      }
    }
  };

  // Mappings CRUD triggers
  const handleOpenMapDialog = (mapping = null) => {
    if (mapping) {
      setSelectedMap(mapping);
      setMapCategory(mapping.category);
      setMapDeptCode(mapping.department_code);
      setMapPriority(mapping.priority.toString());
    } else {
      setSelectedMap(null);
      setMapCategory('');
      setMapDeptCode('');
      setMapPriority('1');
    }
    setMapDialogOpen(true);
  };

  const handleSaveMapping = async (e) => {
    e.preventDefault();
    if (!mapCategory || !mapDeptCode) {
      showNotification('Please fill all mapping fields.', 'warning');
      return;
    }
    try {
      const payload = { category: mapCategory, department_code: mapDeptCode, priority: parseInt(mapPriority) };
      if (selectedMap) {
        await routingService.updateMapping(selectedMap.id, payload);
        showNotification('Route mapping updated successfully.', 'success');
      } else {
        await routingService.createMapping(payload);
        showNotification('New category-to-department route mapping created.', 'success');
      }
      setMapDialogOpen(false);
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to save mapping.', 'error');
    }
  };

  const handleDeleteMapping = async (mapId) => {
    if (window.confirm('Delete this grievance category auto-routing mapping?')) {
      try {
        await routingService.deleteMapping(mapId);
        showNotification('Route mapping deleted successfully.', 'success');
        loadData();
      } catch (err) {
        showNotification('Failed to delete mapping.', 'error');
      }
    }
  };

  const isAdmin = ['admin', 'cm'].includes(user?.role || '');

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header and Actions */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
            Government Service Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Configure active Delhi departments, manage routing rules, and audit department performance.
          </Typography>
        </Box>

        {isAdmin && (
          <Stack direction="row" spacing={1.5}>
            {activeTab === 0 ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDeptDialog()}
                sx={{ backgroundColor: '#0A2540', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Add Department
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenMapDialog()}
                sx={{ backgroundColor: '#FF9933', textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
              >
                Map Category
              </Button>
            )}
          </Stack>
        )}
      </Stack>

      <Paper sx={{ width: '100%', mb: 4, borderRadius: '12px', overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{
            borderBottom: 1, 
            borderColor: 'divider',
            backgroundColor: '#0A2540',
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 600 },
            '& .Mui-selected': { color: '#fff !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#FF9933', height: 3 }
          }}
        >
          <Tab label="Delhi Departments Directory" />
          <Tab label="Auto-Routing Mappings" />
        </Tabs>

        {loading ? (
          <Box sx={{ p: 4 }}><LinearProgress /></Box>
        ) : (
          <Box sx={{ p: 3 }}>
            {/* TAB 0: Departments List */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                {departments.map((dept) => (
                  <Grid item xs={12} sm={6} md={4} key={dept.id}>
                    <Card elevation={2} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', height: '100%', position: 'relative' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1} sx={{ mb: 2 }}>
                          <Box sx={{ p: 1.2, borderRadius: '10px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center' }}>
                            <BusinessIcon sx={{ color: '#0A2540' }} />
                          </Box>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Chip 
                              label={dept.code} 
                              size="small" 
                              sx={{ fontWeight: 800, backgroundColor: '#FF9933', color: '#fff', fontSize: 10 }} 
                            />
                            {isAdmin && (
                              <>
                                <IconButton size="small" onClick={() => handleOpenDeptDialog(dept)} color="primary">
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleDeleteDepartment(dept.id)} color="error">
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </>
                            )}
                          </Stack>
                        </Stack>

                        <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', height: 48, overflow: 'hidden', lineHeight: 1.2, mb: 1 }}>
                          {dept.name}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Rating value={parseFloat(dept.rating)} precision={0.1} readOnly size="small" />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                            {parseFloat(dept.rating).toFixed(1)} / 5.0
                          </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>RESOLUTION RATING</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{dept.rate}%</Typography>
                        </Stack>
                        <LinearProgress 
                          variant="determinate" 
                          value={dept.rate} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3, 
                            backgroundColor: '#F1F5F9',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: dept.rate > 70 ? '#138808' : '#FF9933'
                            }
                          }} 
                        />

                        <Grid container spacing={1} sx={{ mt: 2.5 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>TOTAL LOGGED</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{dept.total} Cases</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>RESOLVED</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#138808' }}>{dept.resolved} Cases</Typography>
                          </Grid>
                        </Grid>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, pt: 2, borderTop: '1px solid #F1F5F9', color: '#64748B' }}>
                          <PeopleIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            Active Staff: <b>{dept.active_officers_count || 0} Officers</b>
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* TAB 1: Category Mapping Manager */}
            {activeTab === 1 && (
              <Box>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Complaint Type (Category)</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Routed Department</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Department Code</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#0A2540' }}>Routing Priority</TableCell>
                        {isAdmin && <TableCell align="right" sx={{ fontWeight: 700, color: '#0A2540' }}>Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mappings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#64748B' }}>
                            No category-to-department mappings defined.
                          </TableCell>
                        </TableRow>
                      ) : (
                        mappings.map((m) => (
                          <TableRow key={m.id} hover>
                            <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>{m.category}</TableCell>
                            <TableCell>{m.department_name}</TableCell>
                            <TableCell>
                              <Chip label={m.department_code} size="small" sx={{ fontWeight: 700, backgroundColor: '#E0F2FE', color: '#0369A1' }} />
                            </TableCell>
                            <TableCell align="center">{m.priority}</TableCell>
                            {isAdmin && (
                              <TableCell align="right">
                                <IconButton size="small" color="primary" onClick={() => handleOpenMapDialog(m)}>
                                  <EditIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDeleteMapping(m.id)}>
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 3, p: 2, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <SettingsIcon sx={{ color: '#1E40AF' }} />
                  <Typography variant="caption" sx={{ color: '#1E3A8A', fontWeight: 600 }}>
                    SYSTEM LOGIC: Incoming grievances are matched on complaint categories. The auto-router assigns issues based on these mapping rules, filtering tasks to active engineers with the least workload.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* DEPARTMENT MODAL FORM */}
      <Dialog open={deptDialogOpen} onClose={() => setDeptDialogOpen(false)} PaperProps={{ sx: { borderRadius: '12px' } }}>
        <Box component="form" onSubmit={handleSaveDepartment}>
          <DialogTitle sx={{ backgroundColor: '#0A2540', color: '#fff' }}>
            {selectedDept ? 'Edit Delhi Department' : 'Add New Delhi Department'}
          </DialogTitle>
          <DialogContent sx={{ py: 3, minWidth: 320 }}>
            <Stack spacing={2.5} sx={{ mt: 1.5 }}>
              <TextField
                label="Department Name"
                fullWidth
                required
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g. Health Department"
              />
              <TextField
                label="Unique Short Code"
                fullWidth
                required
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                placeholder="e.g. HEALTH"
                disabled={!!selectedDept}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setDeptDialogOpen(false)} variant="outlined" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: '#0A2540', textTransform: 'none' }}>
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* MAPPING MODAL FORM */}
      <Dialog open={mapDialogOpen} onClose={() => setMapDialogOpen(false)} PaperProps={{ sx: { borderRadius: '12px' } }}>
        <Box component="form" onSubmit={handleSaveMapping}>
          <DialogTitle sx={{ backgroundColor: '#FF9933', color: '#fff' }}>
            {selectedMap ? 'Modify Grievance Route' : 'Map New Category Route'}
          </DialogTitle>
          <DialogContent sx={{ py: 3, minWidth: 320 }}>
            <Stack spacing={2.5} sx={{ mt: 1.5 }}>
              <TextField
                label="Complaint Category / Type"
                fullWidth
                required
                value={mapCategory}
                onChange={(e) => setMapCategory(e.target.value)}
                placeholder="e.g. Sewage Backflow"
                disabled={!!selectedMap}
              />
              <FormControl fullWidth required>
                <InputLabel>Routed Department</InputLabel>
                <Select
                  value={mapDeptCode}
                  onChange={(e) => setMapDeptCode(e.target.value)}
                  label="Routed Department"
                >
                  {departments.map(d => (
                    <MenuItem key={d.id} value={d.code}>{d.name} ({d.code})</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Routing Priority Rank"
                type="number"
                fullWidth
                required
                value={mapPriority}
                onChange={(e) => setMapPriority(e.target.value)}
                placeholder="1 (Highest)"
                InputProps={{ inputProps: { min: 1, max: 10 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setMapDialogOpen(false)} variant="outlined" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: '#FF9933', textTransform: 'none' }}>
              Save Route
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
