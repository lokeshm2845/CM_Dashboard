import { isMock, supabase } from './supabaseClient';
import { MOCK_USERS } from '../context/AuthContext';
import { routingService } from './routingService';
import { generateTrackingId, verifyGPSProximity, sendMockSMS, sendMockEmail } from '../utils/helpers';

const MOCK_COMPLAINTS_KEY = 'delhi_complaints';
const MOCK_TIMELINE_KEY = 'delhi_complaint_timeline';
const MOCK_RE_INSPECTIONS_KEY = 'delhi_re_inspections';

// Helper to get officers for mock
const getMockOfficers = () => {
  const registered = JSON.parse(localStorage.getItem('delhi_registered_users') || '[]');
  const mockOfficers = MOCK_USERS.filter(u => u.role === 'officer');
  const customOfficers = registered.filter(u => u.role === 'officer');
  return [...mockOfficers, ...customOfficers];
};

const INITIAL_COMPLAINTS = [
  {
    id: 'comp-1',
    tracking_no: 'CMP-2026-8921',
    title: 'Severe pothole cluster on Ring Road near Lajpat Nagar',
    description: 'A cluster of deep potholes is causing severe traffic congestion and minor accidents. Needs immediate resurfacing.',
    category: 'Roads / Potholes',
    department_code: 'PWD',
    department_name: 'Public Works Department (PWD)',
    status: 'assigned',
    severity: 'high',
    district: 'South East Delhi',
    latitude: 28.5678,
    longitude: 77.2435,
    photo_before: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    photo_after: null,
    citizen_name: 'Amit Verma',
    citizen_phone: '9876543210',
    citizen_email: 'amit@gmail.com',
    citizen_id: 'citizen-user-id',
    assigned_officer_id: 'pwd-officer-id',
    assigned_officer_name: 'S.K. Sharma (EE, PWD)',
    is_critical: false,
    source: 'web',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'comp-2',
    tracking_no: 'CMP-2026-4421',
    title: 'Major water pipe burst near Dwarka Mor Metro',
    description: 'Drinking water has been leaking continuously from an underground main line, flooding the main corridor.',
    category: 'Water Leakage / Shortage',
    department_code: 'DJB',
    department_name: 'Delhi Jal Board (DJB)',
    status: 'escalated',
    severity: 'critical',
    district: 'West Delhi',
    latitude: 28.6185,
    longitude: 77.0321,
    photo_before: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    photo_after: null,
    citizen_name: 'Vikram Singh',
    citizen_phone: '9876543209',
    citizen_email: 'vikram@gmail.com',
    citizen_id: 'temp-citizen',
    assigned_officer_id: 'djb-officer-id',
    assigned_officer_name: 'Meena Das (AE, DJB)',
    is_critical: true,
    source: 'mcd311',
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago (Escalated!)
    updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'comp-3',
    tracking_no: 'CMP-2026-3091',
    title: 'Garbage dump near primary school in Karol Bagh',
    description: 'An unauthorized trash dumping spot has developed directly adjacent to the MCD Primary School, creating severe hygienic risks.',
    category: 'Garbage / Waste Pile',
    department_code: 'MCD',
    department_name: 'MCD Garbage & Sanitation',
    status: 'resolved',
    severity: 'medium',
    district: 'Central Delhi',
    latitude: 28.6445,
    longitude: 77.1912,
    photo_before: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
    photo_after: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80',
    resolution_notes: 'Area cleared of all debris, bleaching powder applied, and warning banners installed.',
    citizen_name: 'Rohan Mehra',
    citizen_phone: '9876543208',
    citizen_email: 'rohan@gmail.com',
    citizen_id: 'citizen-user-id',
    assigned_officer_id: 'mcd-officer-id',
    assigned_officer_name: 'Rakesh Yadav (SI, MCD)',
    is_critical: false,
    source: 'twitter',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    resolved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'comp-4',
    tracking_no: 'CMP-2026-7788',
    title: 'Frequent voltage fluctuations & cable spark in Okhla Phase 3',
    description: 'Transformer overhead lines spark during peak hours, shutting down office blocks.',
    category: 'Streetlight / Power Outage',
    department_code: 'DISCOM',
    department_name: 'Power & Electricity (DISCOMs)',
    status: 'in_progress',
    severity: 'high',
    district: 'South Delhi',
    latitude: 28.5355,
    longitude: 77.2652,
    photo_before: null,
    photo_after: null,
    citizen_name: 'Karan Malhotra',
    citizen_phone: '9876543207',
    citizen_email: 'karan@gmail.com',
    citizen_id: 'citizen-user-id',
    assigned_officer_id: 'discom-officer-id',
    assigned_officer_name: 'Anil Gupta (SE, DISCOM)',
    is_critical: false,
    source: 'whatsapp',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'comp-5',
    tracking_no: 'CMP-2026-1211',
    title: 'Lack of policing & lighting in Connaught Place outer circle pocket',
    description: 'Multiple streetlights are broken. Anti-social elements gather after dark, making it unsafe for pedestrians.',
    category: 'Public Nuisance / Safety',
    department_code: 'POLICE',
    department_name: 'Delhi Police & Security',
    status: 'pending',
    severity: 'medium',
    district: 'New Delhi',
    latitude: 28.6304,
    longitude: 77.2177,
    photo_before: null,
    photo_after: null,
    citizen_name: 'Sanya Sen',
    citizen_phone: '9876543206',
    citizen_email: 'sanya@gmail.com',
    citizen_id: 'citizen-user-id',
    assigned_officer_id: 'police-officer-id',
    assigned_officer_name: 'SHO Amit Singh',
    is_critical: false,
    source: 'call',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago (Escalated!)
    updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_TIMELINE = [
  { id: 't-1', complaint_id: 'comp-1', status: 'pending', description: 'Complaint submitted by Amit Verma.', action_by_name: 'Citizen Portal', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-2', complaint_id: 'comp-1', status: 'assigned', description: 'Assigned automatically to Executive Engineer (PWD) S.K. Sharma.', action_by_name: 'System Auto-Router', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  
  { id: 't-3', complaint_id: 'comp-2', status: 'pending', description: 'Water main line leak report logged.', action_by_name: 'Citizen Portal', created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-4', complaint_id: 'comp-2', status: 'assigned', description: 'Assigned to Assistant Engineer (DJB) Meena Das.', action_by_name: 'System Auto-Router', created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-5', complaint_id: 'comp-2', status: 'escalated', description: 'Auto-escalated by CM Office. No action taken by department within 7 days.', action_by_name: 'System Monitor', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },

  { id: 't-6', complaint_id: 'comp-3', status: 'pending', description: 'Garbage dump complaint registered.', action_by_name: 'Citizen Portal', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-7', complaint_id: 'comp-3', status: 'assigned', description: 'Assigned to MCD Officer Rakesh Yadav.', action_by_name: 'System Auto-Router', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-8', complaint_id: 'comp-3', status: 'resolved', description: 'Debris removed and sanitation warning boards erected.', action_by_name: 'Rakesh Yadav (SI, MCD)', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

export const complaintService = {
  // Setup database
  initLocalDatabase: () => {
    if (!localStorage.getItem(MOCK_COMPLAINTS_KEY)) {
      localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(INITIAL_COMPLAINTS));
      localStorage.setItem(MOCK_TIMELINE_KEY, JSON.stringify(INITIAL_TIMELINE));
      localStorage.setItem(MOCK_RE_INSPECTIONS_KEY, JSON.stringify([]));
    }
    // Auto-escalation run
    complaintService.runAutoEscalations();
  },

  runAutoEscalations: () => {
    if (isMock) {
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      let changed = false;

      const updatedComplaints = complaints.map(c => {
        // If pending/assigned/in_progress and older than 7 days
        if (['pending', 'assigned', 'in_progress'].includes(c.status)) {
          const createdDate = new Date(c.created_at);
          const diffDays = (Date.now() - createdDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) {
            c.status = 'escalated';
            c.severity = 'critical';
            c.updated_at = new Date().toISOString();
            changed = true;

            // Add timeline event
            timelines.push({
              id: 't-auto-' + Math.random().toString(36).substr(2, 9),
              complaint_id: c.id,
              status: 'escalated',
              description: 'Complaint auto-escalated to CM Cell. Resolution threshold (7 days) breached.',
              action_by_name: 'System Monitor',
              created_at: new Date().toISOString()
            });

            // CM Alert Log
            sendMockSMS('9876543201', `[CRITICAL ALERT] Escalated complaint ${c.tracking_no} on category: "${c.category}" has breached 7-day SLA.`);
          }
        }
        return c;
      });

      if (changed) {
        localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(updatedComplaints));
        localStorage.setItem(MOCK_TIMELINE_KEY, JSON.stringify(timelines));
      }
    } else {
      // Live Supabase auto-escalation check (simulated locally upon fetch to ensure DB sync)
      (async () => {
        try {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          
          // Select complaints violating the SLA
          const { data, error } = await supabase
            .from('complaints')
            .select('*')
            .in('status', ['pending', 'assigned', 'in_progress'])
            .lt('created_at', sevenDaysAgo);

          if (error) throw error;

          for (const c of data) {
            await supabase
              .from('complaints')
              .update({ status: 'escalated', severity: 'critical', updated_at: new Date().toISOString() })
              .eq('id', c.id);

            await supabase
              .from('complaint_timeline')
              .insert([{
                complaint_id: c.id,
                status: 'escalated',
                description: 'Complaint auto-escalated to CM Cell. Resolution threshold (7 days) breached.',
                action_by_name: 'System Monitor'
              }]);
            
            sendMockSMS('9876543201', `[CRITICAL ALERT] Live complaint ${c.tracking_no} on category: "${c.category}" auto-escalated (SLA breach).`);
          }
        } catch (e) {
          console.error('Error running live auto escalations check:', e);
        }
      })();
    }
  },

  getComplaints: async (filters = {}) => {
    // Run SLA auto-escalation check
    complaintService.runAutoEscalations();

    if (isMock) {
      complaintService.initLocalDatabase();
      let complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');

      // Apply Filters
      if (filters.district && filters.district !== 'All') {
        complaints = complaints.filter(c => c.district === filters.district);
      }
      if (filters.status && filters.status !== 'All') {
        complaints = complaints.filter(c => c.status === filters.status);
      }
      if (filters.severity && filters.severity !== 'All') {
        complaints = complaints.filter(c => c.severity === filters.severity);
      }
      if (filters.department && filters.department !== 'All') {
        complaints = complaints.filter(c => c.department_code === filters.department);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        complaints = complaints.filter(c => 
          c.title.toLowerCase().includes(q) || 
          c.tracking_no.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }

      // Sort by newest first
      return complaints.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      let query = supabase.from('complaints').select('*, departments(*)');
      
      if (filters.district && filters.district !== 'All') {
        query = query.eq('district', filters.district);
      }
      if (filters.status && filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }
      if (filters.severity && filters.severity !== 'All') {
        query = query.eq('severity', filters.severity);
      }
      if (filters.department && filters.department !== 'All') {
        // Resolve code to ID first
        const { data: dept } = await supabase
          .from('departments')
          .select('id')
          .eq('code', filters.department)
          .single();
        if (dept) {
          query = query.eq('department_id', dept.id);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      // Perform frontend search query matching for client ease
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return data.filter(c => 
          c.title.toLowerCase().includes(q) || 
          c.tracking_no.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      
      // Map live rows for UI code consistency
      return data.map(c => ({
        ...c,
        department_code: c.departments?.code,
        department_name: c.departments?.name
      }));
    }
  },

  getComplaintById: async (id) => {
    if (isMock) {
      complaintService.initLocalDatabase();
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      const complaint = complaints.find(c => c.id === id);
      
      if (!complaint) return null;
      
      const history = timelines
        .filter(t => t.complaint_id === id)
        .sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
      
      return { ...complaint, timeline: history };
    } else {
      const { data: complaint, error: compErr } = await supabase
        .from('complaints')
        .select('*, departments(*), users(*)')
        .eq('id', id)
        .single();
      if (compErr) throw compErr;

      const { data: timeline, error: timeErr } = await supabase
        .from('complaint_timeline')
        .select('*')
        .eq('complaint_id', id)
        .order('created_at', { ascending: true });
      if (timeErr) throw timeErr;

      return { 
        ...complaint, 
        department_code: complaint.departments?.code,
        department_name: complaint.departments?.name,
        timeline 
      };
    }
  },

  trackComplaintByNo: async (trackingNo) => {
    if (isMock) {
      complaintService.initLocalDatabase();
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      const complaint = complaints.find(c => c.tracking_no.trim().toUpperCase() === trackingNo.trim().toUpperCase());
      
      if (!complaint) return null;
      
      const history = timelines
        .filter(t => t.complaint_id === complaint.id)
        .sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
      
      return { ...complaint, timeline: history };
    } else {
      const { data: complaint, error: compErr } = await supabase
        .from('complaints')
        .select('*, departments(*)')
        .eq('tracking_no', trackingNo.trim().toUpperCase())
        .single();
      
      if (compErr || !complaint) return null;

      const { data: timeline } = await supabase
        .from('complaint_timeline')
        .select('*')
        .eq('complaint_id', complaint.id)
        .order('created_at', { ascending: true });

      return { 
        ...complaint, 
        department_code: complaint.departments?.code,
        department_name: complaint.departments?.name,
        timeline 
      };
    }
  },

  createComplaint: async (complaintData, currentUser = null) => {
    const trackingNo = generateTrackingId();
    
    // Resolve dynamic routing values using routingService
    const route = await routingService.resolveRoute(complaintData.category);

    const newRecord = {
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      severity: complaintData.is_critical ? 'critical' : (complaintData.severity || 'medium'),
      district: complaintData.district,
      latitude: parseFloat(complaintData.latitude || 28.6139),
      longitude: parseFloat(complaintData.longitude || 77.2090),
      photo_before: complaintData.photo_before || 'https://images.unsplash.com/photo-1599740831464-bf3e970a2569?auto=format&fit=crop&w=600&q=80',
      photo_after: null,
      citizen_id: currentUser?.id || null,
      citizen_name: currentUser?.full_name || complaintData.citizen_name || 'Guest Citizen',
      citizen_phone: currentUser?.phone || complaintData.citizen_phone || '9876543208',
      citizen_email: currentUser?.email || complaintData.citizen_email || 'citizen.guest@gmail.com',
      is_critical: complaintData.is_critical || false,
      source: complaintData.source || 'web',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tracking_no: trackingNo
    };

    if (isMock) {
      complaintService.initLocalDatabase();
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      
      newRecord.id = 'comp-' + Date.now();
      newRecord.department_code = route.department_code;
      newRecord.department_name = route.department_name;
      newRecord.assigned_officer_id = route.assigned_officer_id;
      newRecord.assigned_officer_name = route.assigned_officer_name;
      newRecord.status = route.status;

      complaints.push(newRecord);
      localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(complaints));

      // Append Timeline
      const timelineEntries = [
        {
          id: 't-new-' + Date.now(),
          complaint_id: newRecord.id,
          status: 'pending',
          description: `Grievance submitted by ${newRecord.citizen_name} in ${newRecord.district}. Source: ${newRecord.source.toUpperCase()}`,
          action_by_name: 'Citizen Portal',
          created_at: newRecord.created_at
        }
      ];

      if (route.assigned_officer_id) {
        timelineEntries.push({
          id: 't-new-assign-' + Date.now(),
          complaint_id: newRecord.id,
          status: 'assigned',
          description: `Assigned automatically to ${route.assigned_officer_name} due to low active workload.`,
          action_by_name: 'System Auto-Router',
          created_at: newRecord.created_at
        });
      }

      const updatedTimelines = [...timelines, ...timelineEntries];
      localStorage.setItem(MOCK_TIMELINE_KEY, JSON.stringify(updatedTimelines));

      // SMS/Email acknowledgments
      sendMockSMS(newRecord.citizen_phone, `Dear ${newRecord.citizen_name}, your complaint titled "${newRecord.title}" has been registered. Tracking ID: ${trackingNo}. Status: ${newRecord.status.toUpperCase()}`);
      sendMockEmail(newRecord.citizen_email, 'Grievance Registered - Government of Delhi', `Hello ${newRecord.citizen_name},\n\nYour complaint has been successfully logged with tracking ID ${trackingNo}. Status: ${newRecord.status.toUpperCase()}. You can track updates at /track.`);

      // Life threatening CM alert
      if (newRecord.is_critical) {
        sendMockSMS('9876543201', `[LIFE THREATENING ALERT] Critical grievance ${trackingNo} registered in ${newRecord.district}. Category: "${newRecord.category}". Needs immediate CM Cell intervention!`);
      }

      return { ...newRecord, timeline: timelineEntries };
    } else {
      // Live Supabase path
      newRecord.department_id = route.department_id;
      newRecord.assigned_officer_id = route.assigned_officer_id;
      newRecord.status = route.status;

      const { data, error } = await supabase
        .from('complaints')
        .insert([newRecord])
        .select()
        .single();
      
      if (error) throw error;

      // SMS/Email acknowledgments
      sendMockSMS(newRecord.citizen_phone, `Dear ${newRecord.citizen_name}, your live complaint "${newRecord.title}" has been registered. Tracking ID: ${trackingNo}.`);
      sendMockEmail(newRecord.citizen_email, 'Grievance Registered - Government of Delhi', `Hello ${newRecord.citizen_name},\n\nYour complaint has been registered. Tracking ID: ${trackingNo}.`);

      if (newRecord.is_critical) {
        sendMockSMS('9876543201', `[LIFE THREATENING ALERT] Live critical grievance ${trackingNo} registered in ${newRecord.district}. Category: "${newRecord.category}".`);
      }

      return data;
    }
  },

  updateComplaintStatus: async (complaintId, updates, activeUser) => {
    if (updates.status === 'resolved') {
      // 1. Mandatory Photo Proof
      if (!updates.photo_after) {
        throw new Error('Mandatory Verification Failed: Resolution photo proof is required to resolve complaints (anti-corruption policy).');
      }

      // 2. Mandatory GPS verification
      // Extract officer current coordinates (mock standard coordinates inside Delhi region)
      const officerLat = parseFloat(updates.officer_latitude || 28.6139);
      const officerLng = parseFloat(updates.officer_longitude || 77.2090);

      // Retrieve complaint coordinates
      const currentComp = await complaintService.getComplaintById(complaintId);
      if (!currentComp) throw new Error('Complaint not found.');

      const isClose = verifyGPSProximity(officerLat, officerLng, currentComp.latitude, currentComp.longitude);
      if (!isClose) {
        throw new Error('Mandatory Verification Failed: GPS Audit indicates you are too far from the grievance site. Please report from the actual location.');
      }
    }

    if (isMock) {
      complaintService.initLocalDatabase();
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      const reInspections = JSON.parse(localStorage.getItem(MOCK_RE_INSPECTIONS_KEY) || '[]');

      const idx = complaints.findIndex(c => c.id === complaintId);
      if (idx === -1) throw new Error('Complaint not found');

      const oldComp = complaints[idx];
      
      // Keep assigned_officer_name matching the updates if reassigning
      let officerName = oldComp.assigned_officer_name;
      if (updates.assigned_officer_id) {
        const officers = getMockOfficers();
        const matched = officers.find(o => o.id === updates.assigned_officer_id);
        officerName = matched?.full_name || 'Assigned Officer';
      }

      const updatedComp = { 
        ...oldComp, 
        ...updates, 
        assigned_officer_name: officerName,
        updated_at: new Date().toISOString() 
      };

      if (updates.status === 'resolved') {
        updatedComp.resolved_at = new Date().toISOString();
        updatedComp.photo_after = updates.photo_after;
        updatedComp.resolution_notes = updates.resolution_notes;
      }

      complaints[idx] = updatedComp;
      localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(complaints));

      // Append Timeline
      let description = `Complaint updated by ${activeUser?.full_name || 'Officer'}.`;
      if (updates.status === 'resolved') {
        description = `Grievance resolved. Verification proof uploaded. Notes: "${updates.resolution_notes || ''}"`;
      } else if (updates.status === 'in_progress') {
        description = 'Investigation started. Ground crew dispatched.';
      } else if (updates.status === 'assigned' && updates.assigned_officer_id) {
        description = `Reassigned to ${officerName}.`;
      } else if (updates.status === 'reopened') {
        description = 'Grievance reopened. Recalculating workloads.';
      }

      const timelineId = 't-upd-' + Date.now();
      timelines.push({
        id: timelineId,
        complaint_id: complaintId,
        status: updates.status || oldComp.status,
        description,
        action_by: activeUser?.id,
        action_by_name: activeUser?.full_name || 'Department Officer',
        created_at: new Date().toISOString()
      });

      // Handle 10% random quality inspection audit
      if (updates.status === 'resolved' && Math.random() < 0.10) {
        reInspections.push({
          id: 're-' + Date.now(),
          complaint_id: complaintId,
          status: 'pending',
          notes: 'Random 10% quality audit verification.',
          created_at: new Date().toISOString()
        });
        localStorage.setItem(MOCK_RE_INSPECTIONS_KEY, JSON.stringify(reInspections));

        timelines.push({
          id: 't-audit-' + Date.now(),
          complaint_id: complaintId,
          status: 'resolved',
          description: 'Grievance flag marked for random 10% quality audit re-inspection.',
          action_by_name: 'System Audit',
          created_at: new Date().toISOString()
        });
      }

      localStorage.setItem(MOCK_TIMELINE_KEY, JSON.stringify(timelines));
      return updatedComp;
    } else {
      // Live Supabase update
      const cleanedUpdates = { ...updates };
      delete cleanedUpdates.officer_latitude;
      delete cleanedUpdates.officer_longitude;

      if (updates.status === 'resolved') {
        cleanedUpdates.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('complaints')
        .update(cleanedUpdates)
        .eq('id', complaintId)
        .select()
        .single();
      
      if (error) throw error;

      // Log timeline
      let description = `Complaint updated. Status: ${updates.status}`;
      if (updates.status === 'resolved') {
        description = `Grievance resolved. Proof uploaded. Notes: "${updates.resolution_notes || ''}"`;
      }
      
      await supabase
        .from('complaint_timeline')
        .insert([{
          complaint_id: complaintId,
          status: updates.status,
          description,
          action_by: activeUser?.id,
          action_by_name: activeUser?.full_name || 'Officer'
        }]);

      return data;
    }
  },

  submitFeedback: async (complaintId, feedbackData) => {
    if (isMock) {
      complaintService.initLocalDatabase();
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      const index = complaints.findIndex(c => c.id === complaintId);

      if (index === -1) throw new Error('Complaint not found');

      const complaint = complaints[index];
      
      // Auto reopen logic if rating is poor (< 3)
      if (feedbackData.rating < 3) {
        complaint.status = 'reopened';
        complaint.updated_at = new Date().toISOString();
        complaints[index] = complaint;
        localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(complaints));

        // Add to timeline
        timelines.push({
          id: 't-fb-' + Date.now(),
          complaint_id: complaintId,
          status: 'reopened',
          description: `Citizen submitted poor rating: ${feedbackData.rating}/5. Grievance auto-reopened. Comment: "${feedbackData.comments || ''}"`,
          action_by_name: 'Citizen Feedback Loop',
          created_at: new Date().toISOString()
        });

        // Trigger SMS notification to HOD
        sendMockSMS(complaint.citizen_phone, `Your complaint ${complaint.tracking_no} has been auto-reopened due to a poor resolution rating (${feedbackData.rating}/5) and assigned back to the department.`);
      } else {
        timelines.push({
          id: 't-fb-' + Date.now(),
          complaint_id: complaintId,
          status: complaint.status,
          description: `Citizen submitted positive feedback: ${feedbackData.rating}/5. Comment: "${feedbackData.comments || ''}"`,
          action_by_name: 'Citizen Feedback Loop',
          created_at: new Date().toISOString()
        });
      }

      localStorage.setItem(MOCK_TIMELINE_KEY, JSON.stringify(timelines));
      return { success: true };
    } else {
      // Live Supabase path
      const { error } = await supabase
        .from('feedback')
        .insert([{ complaint_id: complaintId, ...feedbackData }]);
      
      if (error) throw error;

      // Note: Triggers on Supabase will automatically handle setting the status 
      // back to 'reopened' and recalculating the officer average ratings (see init_schema.sql trigger reopen_on_low_rating).
      return { success: true };
    }
  }
};
