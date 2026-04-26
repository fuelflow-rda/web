# FuelFlow Web Dashboard

A comprehensive fuel station management dashboard built with **Next.js 14**, **Tailwind CSS**, **Ant Design**, and **Recharts**.

This is the **Manager and Admin** web portal for the FuelFlow platform.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI Components:** Ant Design 5
- **Styling:** Tailwind CSS 3
- **Charts:** Recharts
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Auth:** Supabase
- **Export:** ExcelJS, jsPDF

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running at `http://localhost:3000`

### Installation

```bash
cd fuelflow-web
npm install
```

### Environment Variables

**Recommended for local dev (API + staging Supabase):**

```bash
cp .env.staging.local.example .env.local
```

Or use the generic template:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (use **staging** with `.env.staging.local.example`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (same **staging** project as the API) |

Do not use production Supabase keys in `.env.local` for day-to-day development.

### Running the App

```bash
npm run dev
```

The dashboard will be available at [http://localhost:3001](http://localhost:3001).

### Building for Production

```bash
npm run build
npm start
```

## Features

### Manager Dashboard
- **Live Station Overview:** real-time stats, pump status, revenue charts
- **Transaction Log:** filterable, sortable, exportable transaction table
- **Attendant Reports:** performance breakdown with comparison mode
- **Pump Reports:** daily/weekly/monthly pump metrics with discrepancy tracking
- **Reconciliation:** end-of-day expected vs recorded revenue reports
- **Fuel Prices:** price management with history and trend charts
- **Notifications:** alert system with read/unread management

### Admin Dashboard
- **Company Overview:** cross-station performance comparison
- **Station Management:** CRUD operations for stations
- **User Management:** create/edit managers and attendants, role assignment
- **Pump Management:** manage pumps across all stations

### Export
- PDF and Excel export on all major tables

## Project Structure

```
src/
├── app/
│   ├── (admin)/         # Admin-only pages
│   ├── (dashboard)/     # Manager dashboard pages
│   ├── login/           # Authentication
│   └── layout.tsx       # Root layout
├── components/
│   ├── charts/          # Recharts wrappers
│   ├── ExportButton.tsx
│   ├── PumpCard.tsx
│   ├── StatsCard.tsx
│   └── TransactionFeed.tsx
├── lib/
│   ├── api.ts           # Axios client
│   ├── format.ts        # Formatting helpers
│   └── supabase.ts      # Supabase client
├── store/
│   ├── auth-store.ts    # Authentication state
│   └── station-store.ts # Station selection state
└── types/
    └── index.ts         # TypeScript interfaces
```
