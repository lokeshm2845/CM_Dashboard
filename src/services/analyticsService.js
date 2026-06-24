import { isMock, supabase } from './supabaseClient';
import { complaintService } from './complaintService';
import { departmentService } from './departmentService';

export const analyticsService = {
  getDashboardKPIs: async (filters = {}) => {
    // Make sure db is loaded in mock
    if (isMock) {
      complaintService.initLocalDatabase();
    }
    const complaints = await complaintService.getComplaints(filters);
    
    const total = complaints.length;
    const resolvedObj = complaints.filter(c => c.status === 'resolved');
    const resolved = resolvedObj.length;
    const escalated = complaints.filter(c => c.status === 'escalated').length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const assigned = complaints.filter(c => c.status === 'assigned').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const reopened = complaints.filter(c => c.status === 'reopened').length;

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    
    // Average resolution time (mock 2.4 days)
    const avgResolutionTime = '2.4 Days';

    return {
      total,
      resolved,
      escalated,
      pending,
      assigned,
      inProgress,
      reopened,
      resolutionRate,
      avgResolutionTime,
      activeUnresolved: total - resolved
    };
  },

  getDistrictMetrics: async (filters = {}) => {
    const complaints = await complaintService.getComplaints(filters);
    const districts = [
      'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
      'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
      'Shahdara', 'Central Delhi'
    ];

    return districts.map(district => {
      const distComps = complaints.filter(c => c.district === district);
      const total = distComps.length;
      const resolved = distComps.filter(c => c.status === 'resolved').length;
      const escalated = distComps.filter(c => c.status === 'escalated').length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      
      return {
        name: district,
        total,
        resolved,
        escalated,
        rate
      };
    }).sort((a, b) => b.total - a.total);
  },

  getDepartmentMetrics: async (filters = {}) => {
    const complaints = await complaintService.getComplaints(filters);
    
    // Fetch all active departments dynamically
    let depts = [];
    try {
      depts = await departmentService.getDepartments();
    } catch (e) {
      console.warn('Error fetching dynamic departments for analytics, using fallback:', e);
      depts = [
        { code: 'PWD', name: 'Public Works Department (PWD)', rating: 3.8 },
        { code: 'DJB', name: 'Delhi Jal Board (DJB)', rating: 3.2 },
        { code: 'MCD', name: 'MCD Garbage & Sanitation', rating: 3.5 },
        { code: 'DISCOM', name: 'Power & Electricity (DISCOMs)', rating: 4.5 },
        { code: 'POLICE', name: 'Delhi Police & Security', rating: 4.1 }
      ];
    }

    return depts.map(dept => {
      // Filter complaints matching this department
      const deptComps = complaints.filter(c => 
        c.department_code === dept.code || 
        c.departments?.code === dept.code ||
        c.department_id === dept.id
      );
      const total = deptComps.length;
      const resolved = deptComps.filter(c => c.status === 'resolved').length;
      const escalated = deptComps.filter(c => c.status === 'escalated').length;
      const pending = deptComps.filter(c => c.status === 'pending').length;
      const inProgress = deptComps.filter(c => c.status === 'in_progress' || c.status === 'assigned' || c.status === 'reopened').length;
      const unresolved = total - resolved;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      return {
        code: dept.code,
        name: dept.name,
        total,
        resolved,
        unresolved,
        escalated,
        pending,
        inProgress,
        rate,
        rating: dept.rating || 5.0
      };
    }).sort((a, b) => {
      // Sort by total complaints descending, then by name alphabetically
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      return a.name.localeCompare(b.name);
    });
  },

  getTimelineMetrics: async () => {
    // Generate complaints trends for Recharts
    // Returns last 7 days of data
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const label = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      
      // Seed realistic wave
      const dayFactor = date.getDay();
      const submitted = Math.floor(10 + Math.sin(dayFactor) * 5 + Math.random() * 4);
      const resolved = Math.floor(8 + Math.cos(dayFactor) * 4 + Math.random() * 3);
      
      data.push({
        name: label,
        Submitted: submitted,
        Resolved: resolved
      });
    }
    return data;
  }
};
