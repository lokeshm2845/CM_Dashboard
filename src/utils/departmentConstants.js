export const DEPARTMENTS = [
  // Core Administrative
  { name: 'Public Works Department (PWD)', code: 'PWD', category: 'Infrastructure', hod_name: 'Sh. Anoop Kumar', hod_phone: '9876543203', hod_email: 'pwd.hod@delhi.gov.in', district: 'All' },
  { name: 'Delhi Jal Board (DJB)', code: 'DJB', category: 'Infrastructure', hod_name: 'Smt. Ritu Arora', hod_phone: '9876543204', hod_email: 'djb.hod@delhi.gov.in', district: 'All' },
  { name: 'MCD Garbage & Sanitation', code: 'MCD', category: 'Autonomous', hod_name: 'Sh. Vikas Dev', hod_phone: '9876543205', hod_email: 'mcd.hod@delhi.gov.in', district: 'All' },
  { name: 'Power & Electricity (DISCOMs)', code: 'DISCOM', category: 'Infrastructure', hod_name: 'Sh. A.K. Singhal', hod_phone: '9876543212', hod_email: 'discom.hod@delhi.gov.in', district: 'All' },
  { name: 'Delhi Police & Security', code: 'POLICE', category: 'Law & Safety', hod_name: 'Sh. Balaji Srivastava', hod_phone: '9876543213', hod_email: 'police.hod@delhi.gov.in', district: 'All' },
  { name: 'Administrative Reforms', code: 'AR', category: 'Core Administrative', hod_name: 'Sh. P.K. Gupta', hod_phone: '9810012345', hod_email: 'ar.hod@delhi.gov.in', district: 'Central Delhi' },
  { name: 'Archaeology & Delhi Gazetteer', code: 'ARCH', category: 'Core Administrative', hod_name: 'Dr. Sanjay Garg', hod_phone: '9810012346', hod_email: 'arch.hod@delhi.gov.in', district: 'New Delhi' },
  { name: 'Archives', code: 'ARCHIVES', category: 'Core Administrative', hod_name: 'Smt. Neha Sharma', hod_phone: '9810012347', hod_email: 'archives.hod@delhi.gov.in', district: 'South Delhi' },
  { name: 'Audit', code: 'AUDIT', category: 'Core Administrative', hod_name: 'Sh. R.K. Singla', hod_phone: '9810012348', hod_email: 'audit.hod@delhi.gov.in', district: 'Central Delhi' },
  { name: 'Chief Electoral Officer', code: 'CEO', category: 'Core Administrative', hod_name: 'Dr. Ranbir Singh', hod_phone: '9810012349', hod_email: 'ceo.hod@delhi.gov.in', district: 'New Delhi' },
  { name: 'Development Department & its Units', code: 'DEV', category: 'Core Administrative', hod_name: 'Sh. Madhup Vyas', hod_phone: '9810012350', hod_email: 'dev.hod@delhi.gov.in', district: 'North Delhi' },
  { name: 'Finance', code: 'FIN', category: 'Core Administrative', hod_name: 'Smt. Alice Vaz', hod_phone: '9810012351', hod_email: 'finance.hod@delhi.gov.in', district: 'Central Delhi' },
  { name: 'General Administration', code: 'GAD', category: 'Core Administrative', hod_name: 'Sh. Manoj Dwivedi', hod_phone: '9810012352', hod_email: 'gad.hod@delhi.gov.in', district: 'New Delhi' },
  { name: 'Information and Public Relations', code: 'IPR', category: 'Core Administrative', hod_name: 'Sh. Rahul Singh', hod_phone: '9810012353', hod_email: 'ipr.hod@delhi.gov.in', district: 'New Delhi' },
  { name: 'Planning', code: 'PLAN', category: 'Core Administrative', hod_name: 'Sh. Nila Mohanan', hod_phone: '9810012354', hod_email: 'planning.hod@delhi.gov.in', district: 'Central Delhi' },
  { name: 'Services', code: 'SERVICES', category: 'Core Administrative', hod_name: 'Sh. Ashish More', hod_phone: '9810012355', hod_email: 'services.hod@delhi.gov.in', district: 'New Delhi' },
  { name: 'Vigilance', code: 'VIG', category: 'Core Administrative', hod_name: 'Sh. Rajasekhar A.', hod_phone: '9810012356', hod_email: 'vigilance.hod@delhi.gov.in', district: 'New Delhi' },
  { name: 'Weights & Measures', code: 'WM', category: 'Core Administrative', hod_name: 'Sh. G. Sudhakar', hod_phone: '9810012357', hod_email: 'wm.hod@delhi.gov.in', district: 'West Delhi' },

  // Infrastructure & Public Works
  { name: 'Urban Development Department', code: 'UD', category: 'Infrastructure', hod_name: 'Sh. D.N. Singh', hod_phone: '9810012358', hod_email: 'ud.hod@delhi.gov.in', district: 'All' },
  { name: 'Irrigation & Flood Control', code: 'IFC', category: 'Infrastructure', hod_name: 'Sh. K.S. Jayachandran', hod_phone: '9810012359', hod_email: 'ifc.hod@delhi.gov.in', district: 'All' },
  { name: 'Power', code: 'POWER', category: 'Infrastructure', hod_name: 'Sh. Shurbir Singh', hod_phone: '9810012360', hod_email: 'power.hod@delhi.gov.in', district: 'All' },
  { name: 'Water', code: 'WATER', category: 'Infrastructure', hod_name: 'Sh. Jitendra Kumar', hod_phone: '9810012361', hod_email: 'water.hod@delhi.gov.in', district: 'All' },

  // Health & Social Welfare
  { name: 'Aruna Asaf Ali Hospital', code: 'AAAH', category: 'Health', hod_name: 'Dr. Sunita Bansal', hod_phone: '9810012362', hod_email: 'aaah.hod@delhi.gov.in', district: 'North Delhi' },
  { name: 'Ayurvedic and Unani Tibbia College', code: 'AUTC', category: 'Health', hod_name: 'Dr. Mohd. Sikandar', hod_phone: '9810012363', hod_email: 'autc.hod@delhi.gov.in', district: 'Central Delhi' },
  { name: 'Board of Ayurvedic and Unani System of Medicine', code: 'BAUSM', category: 'Health', hod_name: 'Dr. R.N. Sharma', hod_phone: '9810012364', hod_email: 'bausm.hod@delhi.gov.in', district: 'New Delhi' },
  { name: 'Central Accident and Trauma Service', code: 'CATS', category: 'Health', hod_name: 'Smt. Shilpa Shinde', hod_phone: '9810012365', hod_email: 'cats.hod@delhi.gov.in', district: 'All' },
  { name: 'Deen Dayal Upadhyay Hospital', code: 'DDUH', category: 'Health', hod_name: 'Dr. B.L. Chaudhary', hod_phone: '9810012366', hod_email: 'dduh.hod@delhi.gov.in', district: 'West Delhi' },
  { name: 'Delhi College of Engineering', code: 'DCE', category: 'Health', hod_name: 'Prof. J.P. Saini', hod_phone: '9810012367', hod_email: 'dce.hod@delhi.gov.in', district: 'North West Delhi' },
  { name: 'Directorate of Family Welfare', code: 'DFW', category: 'Health', hod_name: 'Dr. Nutan Mundeja', hod_phone: '9810012368', hod_email: 'dfw.hod@delhi.gov.in', district: 'All' },
  { name: 'Directorate of Health Services (DHS)', code: 'DHS', category: 'Health', hod_name: 'Dr. Shruti Sharma', hod_phone: '9810012369', hod_email: 'dhs.hod@delhi.gov.in', district: 'All' },
  { name: 'Social Welfare Department', code: 'SWD', category: 'Social Welfare', hod_name: 'Sh. H. Rajesh Prasad', hod_phone: '9810012370', hod_email: 'swd.hod@delhi.gov.in', district: 'All' },
  { name: 'Welfare of Scheduled Castes/Scheduled Tribes/OBC/Minorities', code: 'WSCST', category: 'Social Welfare', hod_name: 'Sh. S.S. Gill', hod_phone: '9810012371', hod_email: 'wscst.hod@delhi.gov.in', district: 'All' },
  { name: 'Women & Child Development', code: 'WCD', category: 'Social Welfare', hod_name: 'Sh. Kranti Kumar', hod_phone: '9810012372', hod_email: 'wcd.hod@delhi.gov.in', district: 'All' },

  // Education & Training
  { name: 'Education Department', code: 'EDU', category: 'Education', hod_name: 'Sh. Himanshu Gupta', hod_phone: '9810012373', hod_email: 'edu.hod@delhi.gov.in', district: 'All' },
  { name: 'Higher Education', code: 'HEDU', category: 'Education', hod_name: 'Sh. R.U. Malik', hod_phone: '9810012374', hod_email: 'hedu.hod@delhi.gov.in', district: 'All' },
  { name: 'Training & Technical Education', code: 'TTE', category: 'Education', hod_name: 'Smt. Azimul K. G.', hod_phone: '9810012375', hod_email: 'tte.hod@delhi.gov.in', district: 'All' },
  { name: 'Directorate of Training, UTCS', code: 'DT_UTCS', category: 'Education', hod_name: 'Sh. K.D. Dogra', hod_phone: '9810012376', hod_email: 'dtutcs.hod@delhi.gov.in', district: 'East Delhi' },
  { name: 'College of Art', code: 'COA', category: 'Education', hod_name: 'Prof. B.S. Chauhan', hod_phone: '9810012377', hod_email: 'coa.hod@delhi.gov.in', district: 'New Delhi' },

  // Law, Safety & Justice
  { name: 'Central Jail', code: 'JAIL', category: 'Law & Safety', hod_name: 'Sh. Sandeep Goel', hod_phone: '9810012378', hod_email: 'jail.hod@delhi.gov.in', district: 'West Delhi' },
  { name: 'Chit Fund', code: 'CF', category: 'Law & Safety', hod_name: 'Sh. R.C. Gupta', hod_phone: '9810012379', hod_email: 'cf.hod@delhi.gov.in', district: 'Central Delhi' },
  { name: 'Consumer Affairs', code: 'CA', category: 'Law & Safety', hod_name: 'Smt. Shalini Singh', hod_phone: '9810012380', hod_email: 'ca.hod@delhi.gov.in', district: 'All' },
  { name: 'Drug Control', code: 'DC', category: 'Law & Safety', hod_name: 'Sh. K.R. Chawla', hod_phone: '9810012381', hod_email: 'dc.hod@delhi.gov.in', district: 'All' },
  { name: 'Excise', code: 'EXCISE', category: 'Law & Safety', hod_name: 'Sh. Krishna Mohan', hod_phone: '9810012382', hod_email: 'excise.hod@delhi.gov.in', district: 'All' },
  { name: 'Home', code: 'HOME', category: 'Law & Safety', hod_name: 'Sh. Bhupinder S. Bhalla', hod_phone: '9810012383', hod_email: 'home.hod@delhi.gov.in', district: 'All' },
  { name: 'Legislative Affairs', code: 'LA', category: 'Law & Safety', hod_name: 'Smt. Sunita Dev', hod_phone: '9810012384', hod_email: 'la.hod@delhi.gov.in', district: 'New Delhi' },
  { name: 'Lok Shikayat Ayog (Public Grievance Commission)', code: 'LSA', category: 'Law & Safety', hod_name: 'Justice S.P. Garg', hod_phone: '9810012385', hod_email: 'lsa.hod@delhi.gov.in', district: 'New Delhi' },
  { name: 'State Election Commission', code: 'SEC', category: 'Law & Safety', hod_name: 'Sh. S.K. Srivastava', hod_phone: '9810012386', hod_email: 'sec.hod@delhi.gov.in', district: 'New Delhi' },

  // Transport & Infrastructure
  { name: 'Delhi Transport Corporation (DTC)', code: 'DTC', category: 'Transport', hod_name: 'Sh. Vijay Bidhuri', hod_phone: '9810012387', hod_email: 'dtc.hod@delhi.gov.in', district: 'All' },
  { name: 'Delhi Transco Ltd', code: 'TRANSCO', category: 'Transport', hod_name: 'Smt. Padmini Singla', hod_phone: '9810012388', hod_email: 'transco.hod@delhi.gov.in', district: 'All' },
  { name: 'Transport Department', code: 'TRANS', category: 'Transport', hod_name: 'Sh. Ashish Kundra', hod_phone: '9810012389', hod_email: 'trans.hod@delhi.gov.in', district: 'All' },

  // Environment & Agriculture
  { name: 'Agricultural Marketing (Directorate)', code: 'AM', category: 'Environment', hod_name: 'Sh. G.S. Meena', hod_phone: '9810012390', hod_email: 'am.hod@delhi.gov.in', district: 'All' },
  { name: 'Agriculture Department', code: 'AGRI', category: 'Environment', hod_name: 'Sh. Devendra Singh', hod_phone: '9810012391', hod_email: 'agri.hod@delhi.gov.in', district: 'All' },
  { name: 'Conservator of Forest', code: 'CFOREST', category: 'Environment', hod_name: 'Sh. Amit Anand', hod_phone: '9810012392', hod_email: 'cforest.hod@delhi.gov.in', district: 'All' },
  { name: 'Environment Department', code: 'ENV', category: 'Environment', hod_name: 'Sh. Anil Kumar Singh', hod_phone: '9810012393', hod_email: 'env.hod@delhi.gov.in', district: 'All' },
  { name: 'Forest Department', code: 'FOREST', category: 'Environment', hod_name: 'Sh. Nisheeth Saxena', hod_phone: '9810012394', hod_email: 'forest.hod@delhi.gov.in', district: 'All' },
  { name: 'Food Safety (Department of)', code: 'FOODS', category: 'Environment', hod_name: 'Smt. Neha Bansal', hod_phone: '9810012395', hod_email: 'foods.hod@delhi.gov.in', district: 'All' },
  { name: 'Food & Supplies', code: 'FOOD_SUPP', category: 'Environment', hod_name: 'Sh. Yatendra Kumar', hod_phone: '9810012396', hod_email: 'foodsupp.hod@delhi.gov.in', district: 'All' },

  // Revenue & Finance
  { name: 'Revenue Department', code: 'REV', category: 'Revenue', hod_name: 'Sh. Sanjeev Khirwar', hod_phone: '9810012397', hod_email: 'revenue.hod@delhi.gov.in', district: 'All' },
  { name: 'Trade and Taxes Department', code: 'TAX', category: 'Revenue', hod_name: 'Sh. Ankur Garg', hod_phone: '9810012398', hod_email: 'tax.hod@delhi.gov.in', district: 'All' },
  { name: 'Cooperative Societies (Registrar)', code: 'RCS', category: 'Revenue', hod_name: 'Sh. Jitendra Narayan', hod_phone: '9810012399', hod_email: 'rcs.hod@delhi.gov.in', district: 'All' },
  { name: 'Delhi Disaster Management Authority (DDMA)', code: 'DDMA', category: 'Revenue', hod_name: 'Sh. Sandeep Mishra', hod_phone: '9810012400', hod_email: 'ddma.hod@delhi.gov.in', district: 'All' },

  // Other Departments
  { name: 'Delhi Fire Service', code: 'FIRE', category: 'Other', hod_name: 'Dr. Atul Garg', hod_phone: '9810012401', hod_email: 'fire.hod@delhi.gov.in', district: 'All' },
  { name: 'Employment', code: 'EMP', category: 'Other', hod_name: 'Sh. S.K. Gupta', hod_phone: '9810012402', hod_email: 'employment.hod@delhi.gov.in', district: 'All' },
  { name: 'Industries Department', code: 'IND', category: 'Other', hod_name: 'Sh. Rajesh Kumar', hod_phone: '9810012403', hod_email: 'industries.hod@delhi.gov.in', district: 'All' },
  { name: 'Tourism Department', code: 'TOUR', category: 'Other', hod_name: 'Smt. Geetika Sharma', hod_phone: '9810012404', hod_email: 'tourism.hod@delhi.gov.in', district: 'All' },
  { name: 'Union Territory Civil Services (UTCS)', code: 'UTCS', category: 'Other', hod_name: 'Sh. K.S. Verma', hod_phone: '9810012405', hod_email: 'utcs.hod@delhi.gov.in', district: 'East Delhi' },
  { name: 'Delhi Archives', code: 'D_ARCHIVES', category: 'Other', hod_name: 'Smt. Savita Rani', hod_phone: '9810012406', hod_email: 'delhiarchives.hod@delhi.gov.in', district: 'South Delhi' },
  { name: 'Food & Supply', code: 'FOOD_SUPPLY', category: 'Other', hod_name: 'Sh. Yatendra Kumar', hod_phone: '9810012407', hod_email: 'foodsupply.hod@delhi.gov.in', district: 'All' },

  // Autonomous Bodies
  { name: 'New Delhi Municipal Council (NDMC)', code: 'NDMC', category: 'Autonomous', hod_name: 'Sh. Amit Singla', hod_phone: '9810012408', hod_email: 'ndmc.hod@delhi.gov.in', district: 'New Delhi' }
];

export const DEFAULT_MAPPINGS = [
  { category: 'Roads / Potholes', department_code: 'PWD', priority: 1 },
  { category: 'Water Leakage / Shortage', department_code: 'DJB', priority: 1 },
  { category: 'Garbage / Waste Pile', department_code: 'MCD', priority: 1 },
  { category: 'Streetlight / Power Outage', department_code: 'DISCOM', priority: 1 },
  { category: 'Public Nuisance / Safety', department_code: 'POLICE', priority: 1 },
  { category: 'Sewage Overflow', department_code: 'DJB', priority: 1 },
  { category: 'Road Damage', department_code: 'PWD', priority: 1 },
  { category: 'Tree Fall / Trimming', department_code: 'FOREST', priority: 1 },
  { category: 'Stray Animals', department_code: 'MCD', priority: 1 },
  { category: 'Traffic Violation', department_code: 'POLICE', priority: 1 }
];
