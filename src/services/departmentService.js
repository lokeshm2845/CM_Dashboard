import { isMock, supabase } from './supabaseClient';
import { MOCK_USERS } from '../context/AuthContext';
import { DEPARTMENTS } from '../utils/departmentConstants';

const MOCK_DEPARTMENTS_KEY = 'delhi_departments';

export const departmentService = {
  initLocalDepartments: () => {
    if (isMock && !localStorage.getItem(MOCK_DEPARTMENTS_KEY)) {
      // Map constant departments to include rating and active count
      const initialDepts = DEPARTMENTS.map((d, idx) => ({
        id: d.id || `dept-${d.code.toLowerCase()}`,
        name: d.name,
        code: d.code,
        rating: 4.0 + (idx % 10) * 0.1, // mock realistic ratings
        active_officers_count: d.code === 'PWD' || d.code === 'DJB' || d.code === 'MCD' || d.code === 'DISCOM' || d.code === 'POLICE' ? 1 : 0
      }));
      localStorage.setItem(MOCK_DEPARTMENTS_KEY, JSON.stringify(initialDepts));
    }
  },

  getDepartments: async () => {
    if (isMock) {
      departmentService.initLocalDepartments();
      return JSON.parse(localStorage.getItem(MOCK_DEPARTMENTS_KEY) || '[]');
    } else {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    }
  },

  createDepartment: async (deptData) => {
    if (isMock) {
      departmentService.initLocalDepartments();
      const depts = JSON.parse(localStorage.getItem(MOCK_DEPARTMENTS_KEY) || '[]');
      
      // Check if duplicate code or name
      if (depts.some(d => d.code.toLowerCase() === deptData.code.toLowerCase() || d.name.toLowerCase() === deptData.name.toLowerCase())) {
        throw new Error('A department with this name or code already exists.');
      }

      const newDept = {
        id: 'dept-' + Date.now(),
        name: deptData.name,
        code: deptData.code.toUpperCase(),
        rating: 5.0,
        active_officers_count: 0
      };

      depts.push(newDept);
      localStorage.setItem(MOCK_DEPARTMENTS_KEY, JSON.stringify(depts));
      return newDept;
    } else {
      const { data, error } = await supabase
        .from('departments')
        .insert([{
          name: deptData.name,
          code: deptData.code.toUpperCase()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  updateDepartment: async (id, deptData) => {
    if (isMock) {
      departmentService.initLocalDepartments();
      const depts = JSON.parse(localStorage.getItem(MOCK_DEPARTMENTS_KEY) || '[]');
      const index = depts.findIndex(d => d.id === id);
      
      if (index === -1) throw new Error('Department not found.');

      depts[index] = {
        ...depts[index],
        name: deptData.name,
        code: deptData.code.toUpperCase()
      };

      localStorage.setItem(MOCK_DEPARTMENTS_KEY, JSON.stringify(depts));
      return depts[index];
    } else {
      const { data, error } = await supabase
        .from('departments')
        .update({
          name: deptData.name,
          code: deptData.code.toUpperCase()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  deleteDepartment: async (id) => {
    if (isMock) {
      departmentService.initLocalDepartments();
      const depts = JSON.parse(localStorage.getItem(MOCK_DEPARTMENTS_KEY) || '[]');
      const updated = depts.filter(d => d.id !== id);
      localStorage.setItem(MOCK_DEPARTMENTS_KEY, JSON.stringify(updated));
      return { success: true };
    } else {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    }
  },

  getOfficers: async () => {
    if (isMock) {
      const complaints = JSON.parse(localStorage.getItem('delhi_complaints') || '[]');
      const registered = JSON.parse(localStorage.getItem('delhi_registered_users') || '[]');
      const mockOfficers = MOCK_USERS.filter(u => u.role === 'officer');
      const customOfficers = registered.filter(u => u.role === 'officer');
      const officers = [...mockOfficers, ...customOfficers];
      
      return officers.map(o => {
        // Recalculate workload count in local storage
        const activeCount = complaints.filter(c => c.assigned_officer_id === o.id && c.status !== 'resolved').length;
        
        let avgRating = 4.2;
        if (o.department_code === 'PWD') avgRating = 3.8;
        if (o.department_code === 'DJB') avgRating = 3.2;
        if (o.department_code === 'MCD') avgRating = 3.5;
        if (o.department_code === 'DISCOM') avgRating = 4.5;
        if (o.department_code === 'POLICE') avgRating = 4.1;

        return {
          id: o.id,
          name: o.full_name,
          email: o.email,
          phone: o.phone || '9876543200',
          district: o.district || 'New Delhi',
          department_name: o.department_name,
          department_code: o.department_code,
          workload_count: activeCount,
          max_workload: o.max_workload || 15,
          avg_rating: avgRating,
          is_active: true
        };
      });
    } else {
      const { data, error } = await supabase
        .from('officers')
        .select('*, users(*), departments(*)');
      if (error) throw error;
      return data.map(o => ({
        id: o.id,
        name: o.users?.full_name,
        email: o.users?.email,
        phone: o.users?.phone || '9876543200',
        district: o.users?.district || 'New Delhi',
        department_name: o.departments?.name,
        department_code: o.departments?.code,
        workload_count: o.workload_count,
        max_workload: o.max_workload,
        avg_rating: o.avg_rating,
        is_active: o.is_active
      }));
    }
  }
};
