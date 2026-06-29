# 📋 CM Grievance Redressal Dashboard

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://cm-dashboard-lovat.vercel.app)
[![Built with Supabase](https://img.shields.io/badge/Supabase-Powered-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

---

## 🏛️ About The Project

An interactive, **role-based public grievance management and resolution dashboard** for the **Government of Delhi**. This portal connects citizens reporting local infrastructure issues (roads, water, waste, power, safety) directly to regional department engineers with:

- ✅ Automated routing  
- ✅ Full audit logs  
- ✅ Quality assurance triggers  
- ✅ Chief Minister's Cell oversight  

### 🎯 The Problem We’re Solving

Delhi citizens file **thousands of grievances daily** across multiple departments. Currently, the resolution process is:

| Issue | Impact |
| :--- | :--- |
| ❌ **Fragmented** | No single view for CM or citizens |
| ❌ **Opaque** | No real‑time tracking |
| ❌ **Corrupt** | False closures are common |
| ❌ **Slow** | Complaints take weeks to resolve |
| ❌ **Unaccountable** | No performance tracking for departments |

### 💡 Our Solution

We built a **unified, real‑time grievance management system** that gives the Chief Minister’s office complete visibility and control over every complaint in Delhi.

---

## ✨ Key Features

### 🔐 Role‑Based Access Control (RBAC)

| Role | Access Level |
| :--- | :--- |
| 👑 **Chief Minister (CM) Cell** | Full oversight, analytics, escalations |
| ⚙️ **State Administrator** | Department management, officer assignment |
| 👷 **Department Officers** (PWD, DJB, MCD, etc.) | Only their assigned complaints |
| 👤 **Citizens** | Raise complaints, track status, give feedback |

### 🤖 Intelligent Auto‑Routing

New complaints are **automatically assigned** to the engineer in the correct department with the **lowest current workload**.

```text
Category → Department → Officer with Least Workload
```

### 🗺️ GIS Mapping & Analytics

- Interactive **Leaflet** maps showing complaint hot spots  
- Regional analytics scorecards  
- Historical grievance trend charts  

### 📜 Resolution Audit Timeline

Full history trail:

```text
Registration → Dispatch → In‑Progress → Inspection → Proof Upload → Citizen Rating
```

### ✅ Quality Assurance Triggers

| Trigger | How It Works |
| :--- | :--- |
| **Auto‑Reopen** | Citizen rating < 3 stars → ticket reopens automatically |
| **10% Random Audits** | Random selection of resolved cases for physical validation |
| **Photo Proof** | After‑photo mandatory for resolution |
| **GPS Verification** | Officer location captured when marking resolved |

### 📱 CM Tour Planner

Integrates the Chief Minister’s surprise local tour schedules with grievance density mapping to brief field workers automatically.

### 🚨 Critical Alerts

- Life‑threatening complaints highlighted in **red**  
- Auto‑SMS/Email alert to CM’s office

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
| :--- | :--- |
| **React.js** (v18) | UI framework |
| **Vite** | Build tool |
| **Material‑UI (MUI v5)** | UI components & styling |
| **React Router DOM** | Navigation & routing |
| **React Leaflet / Leaflet.js** | Interactive maps |
| **Recharts** | Data visualisation |
| **React Hook Form** | Form validation |
| **React Hot Toast** | Notifications |
| **React Icons** | Icon library |

### Backend & Database

| Technology | Purpose |
| :--- | :--- |
| **Supabase** | Backend‑as‑a‑Service |
| **PostgreSQL** | Relational database |
| **PostGIS** | Geospatial queries |
| **Supabase Auth (GoTrue)** | Authentication & RBAC |
| **Supabase Realtime** | Live updates |
| **Row Level Security (RLS)** | Data access control |

### External Integrations

| Service | Purpose |
| :--- | :--- |
| **Twilio** | SMS notifications |
| **Firebase Cloud Messaging** | Push notifications |
| **Bhashini / Google Translate** | Multi‑language support |

### Hosting & Deployment

| Service | Purpose |
| :--- | :--- |
| **Vercel** | Frontend hosting & CI/CD |
| **Supabase Cloud** | Database hosting |
| **GitHub** | Version control |

---

## 🚀 Live Demo

| Environment | URL |
| :--- | :--- |
| **Production** | [https://cm-dashboard-lovat.vercel.app](https://cm-dashboard-lovat.vercel.app) |
| **GitHub Repository** | [https://github.com/lokeshm2845/cm-dashboard](https://github.com/lokeshm2845/cm-dashboard) |

---

## 📋 Getting Started

### 1. Prerequisites

- **Node.js** (v18+)
- **npm** (comes with Node)

```bash
node --version
npm --version
```

### 2. Clone the Repository

```bash
git clone https://github.com/lokeshm2845/cm-dashboard.git
cd cm-dashboard
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Twilio Configuration (Optional – for SMS)
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Firebase Configuration (Optional – for Push Notifications)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

### 5. Database Setup

Copy the contents of `supabase/supabase_editor_setup.sql`

Paste and execute it in your Supabase SQL Editor.

**Troubleshooting:** If you encounter GoTrue schema issues, run this fix:

```sql
UPDATE auth.users
SET confirmation_token = '', recovery_token = '', email_change_token_new = '', email_change = '', phone_change_token = ''
WHERE confirmation_token IS NULL OR recovery_token IS NULL OR email_change_token_new IS NULL OR email_change IS NULL OR phone_change_token IS NULL;
```

### 6. Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 to view it in your browser.

### 7. Build for Production

```bash
npm run build
```

---

## 🔐 Quick Demo Logins

Use the pre‑seeded demo accounts (all share the password `password`):

| 👤 Role | 📧 Email |
| :--- | :--- |
| 👑 Chief Minister | `cm@delhi.gov.in` |
| ⚙️ State Administrator | `admin@delhi.gov.in` |
| 👷 PWD Engineer | `pwd.officer@delhi.gov.in` |
| 👷 DJB Engineer | `djb.officer@delhi.gov.in` |
| 👷 MCD Engineer | `mcd.officer@delhi.gov.in` |
| 👤 Citizen | `priya@gmail.com` |

---

## 🗂️ Project Structure

```text
cm-dashboard/
├── src/
│   ├── components/
│   │   ├── admin/          # CM & Admin components
│   │   ├── complaints/     # Complaint management
│   │   ├── departments/    # Department management
│   │   ├── officers/       # Officer management
│   │   ├── common/         # Shared components
│   │   └── tracking/       # Citizen tracking portal
│   ├── context/            # React Context providers
│   ├── services/           # API & Supabase services
│   ├── utils/              # Helper functions
│   ├── pages/              # Page components
│   └── App.jsx
├── public/
│   ├── _redirects          # Netlify redirects
│   └── favicon.ico
├── supabase/
│   └── supabase_editor_setup.sql
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

---

## ☁️ Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub.
2. Go to vercel.com → Add New Project → import your repo.
3. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. Click Deploy.

| Setting | Value |
| :--- | :--- |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Deploy to Netlify

1. Connect your GitHub repo.
2. Set:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Add environment variables and deploy.

---

## 📊 Database Schema

### Core Tables

| Table | Purpose |
| :--- | :--- |
| `users` | User profiles with role‑based access |
| `departments` | All 47+ Delhi government departments |
| `officers` | Department officers with workload tracking |
| `complaints` | Core complaint data with geospatial support |
| `complaint_timeline` | Audit log of all actions |
| `visit_logs` | CM visit tracking |
| `feedback` | Citizen ratings & comments |
| `re_inspections` | Random audit tracking |

### Key Database Features

- **PostGIS** – Geospatial queries (`ST_Within`, `ST_MakePoint`)
- **Row Level Security (RLS)** – Role‑based data access
- **Auto‑Reopen Triggers** – On poor citizen feedback
- **Auto‑Escalation** – After 7 days pending

---

## 🔒 Security & Anti‑Corruption Features

| Feature | How It Works |
| :--- | :--- |
| **Photo Proof** | After‑photo mandatory before marking resolved |
| **GPS Verification** | Officer location captured when marking resolved |
| **Random Re‑Inspection** | 10% of resolved cases auto‑selected for inspection |
| **Citizen Feedback** | 1‑5 stars; <3 stars → auto‑reopen |
| **Audit Log** | Every action logged with timestamp and user ID |
| **Auto‑Escalation** | Pending > 7 days → escalate to CM |
| **RLS Policies** | Role‑based data access control |

---

## 🔮 Future Roadmap

| Phase | Timeline | Features |
| :--- | :--- | :--- |
| **Phase 2** | Q3 2026 | AI‑powered categorisation & sentiment analysis |
| **Phase 3** | Q4 2026 | MCD311, CPGRAMS integration |
| **Phase 4** | Q1 2027 | Voice‑based filing + WhatsApp Bot |
| **Phase 5** | Q2 2027 | Predictive analytics for proactive governance |

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 👥 Team Vertex Vectors

| Name | Role | Expertise |
| :--- | :--- | :--- |
| **Parth Bhoi** | Team Leader | Full‑Stack, System Architecture |
| **Lokesh Magare** | Full‑Stack Developer | React, Supabase, PostGIS, UI/UX |
| **Vivek Borse** | Backend Developer | Database Design, APIs, Security |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- **Delhi Government** – For the opportunity
- **Supabase** – For the backend platform
- **Vercel** – For seamless deployment
- **OpenStreetMap** – For free maps
- **Twilio** – For SMS integration

---

## 📧 Contact

Project Maintainer: **Lokesh Magare**

- **Email**: Lokeshmagare28@gmail.com
- **GitHub**: [lokeshm2845](https://github.com/lokeshm2845)
- **Live Demo**: [https://cm-dashboard-lovat.vercel.app](https://cm-dashboard-lovat.vercel.app)

---

> Democracy dies in darkness. We bring the light to every complaint.
