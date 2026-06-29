import { isMock, supabase } from './supabaseClient';
import { MOCK_USERS } from '../context/AuthContext';
import { departmentService } from './departmentService';

const MOCK_REGISTERED_USERS_KEY = 'delhi_registered_users';

export const officerService = {
  createOfficer: async (officerData) => {
    if (isMock) {
      const registered = JSON.parse(localStorage.getItem(MOCK_REGISTERED_USERS_KEY) || '[]');
      
      // Check if duplicate email
      const allOfficers = await departmentService.getOfficers();
      if (allOfficers.some(o => o.email.toLowerCase() === officerData.email.toLowerCase())) {
        throw new Error('An officer with this email address already exists.');
      }

      const departments = await departmentService.getDepartments();
      const matchedDept = departments.find(d => d.code === officerData.department_code) || {};

      const newOfficerUser = {
        id: 'officer-' + Date.now(),
        email: officerData.email.toLowerCase(),
        password: 'password', // default password
        role: 'officer',
        full_name: officerData.name,
        phone: officerData.phone || '',
        district: officerData.district || 'New Delhi',
        department_code: officerData.department_code,
        department_name: matchedDept.name || '',
        max_workload: parseInt(officerData.max_workload || 15)
      };

      registered.push(newOfficerUser);
      localStorage.setItem(MOCK_REGISTERED_USERS_KEY, JSON.stringify(registered));
      return newOfficerUser;
    } else {
      // Find department ID by code
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('code', officerData.department_code)
        .single();
      
      if (!dept) throw new Error('Selected department code not found.');

      const officerUserId = genUUID();

      // Insert into public.users
      const { error: userErr } = await supabase
        .from('users')
        .insert([{
          id: officerUserId,
          email: officerData.email.toLowerCase(),
          role: 'officer',
          phone: officerData.phone || null,
          district: officerData.district || null,
          full_name: officerData.name,
          department_id: dept.id
        }]);

      if (userErr) throw userErr;

      // Update max workload on public.officers if specified (trigger automatically creates the row)
      if (officerData.max_workload) {
        const { error: offErr } = await supabase
          .from('officers')
          .update({ max_workload: parseInt(officerData.max_workload) })
          .eq('user_id', officerUserId);
        
        if (offErr) console.warn('Could not update max workload on auto-created officer:', offErr);
      }

      return { id: officerUserId, ...officerData };
    }
  },

  updateOfficer: async (id, officerData) => {
    if (isMock) {
      const registered = JSON.parse(localStorage.getItem(MOCK_REGISTERED_USERS_KEY) || '[]');
      const idx = registered.findIndex(u => u.id === id);
      
      if (idx !== -1) {
        const departments = await departmentService.getDepartments();
        const matchedDept = departments.find(d => d.code === officerData.department_code) || {};

        registered[idx] = {
          ...registered[idx],
          email: officerData.email.toLowerCase(),
          full_name: officerData.name,
          phone: officerData.phone || '',
          district: officerData.district || 'New Delhi',
          department_code: officerData.department_code,
          department_name: matchedDept.name || '',
          max_workload: parseInt(officerData.max_workload || 15)
        };
        localStorage.setItem(MOCK_REGISTERED_USERS_KEY, JSON.stringify(registered));
        return registered[idx];
      }
      throw new Error('Officer not found in local registration.');
    } else {
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('code', officerData.department_code)
        .single();
      
      if (!dept) throw new Error('Selected department code not found.');

      // Update user details
      const { error: userErr } = await supabase
        .from('users')
        .update({
          email: officerData.email.toLowerCase(),
          full_name: officerData.name,
          phone: officerData.phone || null,
          district: officerData.district || null,
          department_id: dept.id
        })
        .eq('id', id);

      if (userErr) throw userErr;

      // Update officer workload details
      const { error: offErr } = await supabase
        .from('officers')
        .update({ 
          max_workload: parseInt(officerData.max_workload || 15)
        })
        .eq('user_id', id);
      
      if (offErr) throw offErr;
      return { id, ...officerData };
    }
  },

  deleteOfficer: async (id) => {
    if (isMock) {
      const registered = JSON.parse(localStorage.getItem(MOCK_REGISTERED_USERS_KEY) || '[]');
      const updated = registered.filter(u => u.id !== id);
      localStorage.setItem(MOCK_REGISTERED_USERS_KEY, JSON.stringify(updated));
      return { success: true };
    } else {
      // Deleting from users cascades to officers due to FK constraint ON DELETE CASCADE
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    }
  }
};

// Simple random UUID generator helper for mock setup
function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
