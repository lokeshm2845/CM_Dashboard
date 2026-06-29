import { isMock, supabase } from './supabaseClient';
import { DEFAULT_MAPPINGS } from '../utils/departmentConstants';
import { departmentService } from './departmentService';

const MOCK_MAPPING_KEY = 'delhi_category_mappings';

export const routingService = {
  initLocalMappings: () => {
    if (isMock && !localStorage.getItem(MOCK_MAPPING_KEY)) {
      localStorage.setItem(MOCK_MAPPING_KEY, JSON.stringify(DEFAULT_MAPPINGS));
    }
  },

  getMappings: async () => {
    if (isMock) {
      routingService.initLocalMappings();
      const mappings = JSON.parse(localStorage.getItem(MOCK_MAPPING_KEY) || '[]');
      const departments = await departmentService.getDepartments();
      
      return mappings.map((m, idx) => {
        const dept = departments.find(d => d.code === m.department_code) || {};
        return {
          id: m.id || `map-${idx}`,
          category: m.category,
          department_id: dept.id || 'dept-pwd',
          department_code: m.department_code,
          department_name: dept.name || 'Public Works Department (PWD)',
          priority: m.priority || 1
        };
      });
    } else {
      const { data, error } = await supabase
        .from('category_department_mapping')
        .select('*, departments(*)');
      if (error) throw error;
      
      return data.map(m => ({
        id: m.id,
        category: m.category,
        department_id: m.department_id,
        department_code: m.departments?.code,
        department_name: m.departments?.name,
        priority: m.priority
      }));
    }
  },

  createMapping: async (mappingData) => {
    if (isMock) {
      routingService.initLocalMappings();
      const mappings = JSON.parse(localStorage.getItem(MOCK_MAPPING_KEY) || '[]');
      
      // Check if duplicate category
      if (mappings.some(m => m.category.toLowerCase() === mappingData.category.toLowerCase())) {
        throw new Error('Mapping for this category already exists.');
      }

      const newMap = {
        id: 'map-' + Date.now(),
        category: mappingData.category,
        department_code: mappingData.department_code,
        priority: parseInt(mappingData.priority || 1)
      };
      
      mappings.push(newMap);
      localStorage.setItem(MOCK_MAPPING_KEY, JSON.stringify(mappings));
      return newMap;
    } else {
      // Find department ID by code
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('code', mappingData.department_code)
        .single();

      if (!dept) throw new Error('Department not found.');

      const { data, error } = await supabase
        .from('category_department_mapping')
        .insert([{
          category: mappingData.category,
          department_id: dept.id,
          priority: parseInt(mappingData.priority || 1)
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  updateMapping: async (id, mappingData) => {
    if (isMock) {
      routingService.initLocalMappings();
      const mappings = JSON.parse(localStorage.getItem(MOCK_MAPPING_KEY) || '[]');
      const index = mappings.findIndex(m => m.id === id || `map-${mappings.indexOf(m)}` === id);
      
      if (index === -1) throw new Error('Mapping not found');

      mappings[index] = {
        ...mappings[index],
        category: mappingData.category,
        department_code: mappingData.department_code,
        priority: parseInt(mappingData.priority || 1)
      };

      localStorage.setItem(MOCK_MAPPING_KEY, JSON.stringify(mappings));
      return mappings[index];
    } else {
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('code', mappingData.department_code)
        .single();

      if (!dept) throw new Error('Department not found.');

      const { data, error } = await supabase
        .from('category_department_mapping')
        .update({
          category: mappingData.category,
          department_id: dept.id,
          priority: parseInt(mappingData.priority || 1)
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  deleteMapping: async (id) => {
    if (isMock) {
      routingService.initLocalMappings();
      const mappings = JSON.parse(localStorage.getItem(MOCK_MAPPING_KEY) || '[]');
      const updated = mappings.filter(m => m.id !== id && `map-${mappings.indexOf(m)}` !== id);
      localStorage.setItem(MOCK_MAPPING_KEY, JSON.stringify(updated));
      return { success: true };
    } else {
      const { error } = await supabase
        .from('category_department_mapping')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    }
  },

  /**
   * Resolves the routed department and dynamic officer for a complaint category.
   */
  resolveRoute: async (category) => {
    const mappings = await routingService.getMappings();
    const matchedMapping = mappings.find(m => m.category === category);
    
    if (!matchedMapping) {
      // Default to CM cell / admin manual routing if no mapping exists
      return {
        department_id: null,
        department_code: null,
        department_name: null,
        assigned_officer_id: null,
        assigned_officer_name: null,
        status: 'pending'
      };
    }

    // Find the officers in this department
    const officers = await departmentService.getOfficers();
    const deptOfficers = officers.filter(
      o => o.department_code === matchedMapping.department_code && o.is_active
    );

    // Dynamic routing: route to officer with minimum active workload
    if (deptOfficers.length > 0) {
      const sortedOfficers = deptOfficers.sort((a, b) => a.workload_count - b.workload_count);
      const chosenOfficer = sortedOfficers[0];

      return {
        department_id: matchedMapping.department_id,
        department_code: matchedMapping.department_code,
        department_name: matchedMapping.department_name,
        assigned_officer_id: chosenOfficer.id,
        assigned_officer_name: chosenOfficer.name,
        status: 'assigned'
      };
    } else {
      // No active officers, assign to department but keep status pending
      return {
        department_id: matchedMapping.department_id,
        department_code: matchedMapping.department_code,
        department_name: matchedMapping.department_name,
        assigned_officer_id: null,
        assigned_officer_name: null,
        status: 'pending'
      };
    }
  }
};
