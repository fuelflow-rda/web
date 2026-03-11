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

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

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
- **Live Station Overview** — Real-time stats, pump status, revenue charts
- **Transaction Log** — Filterable, sortable, exportable transaction table
- **Attendant Reports** — Performance breakdown with comparison mode
- **Pump Reports** — Daily/weekly/monthly pump metrics with discrepancy tracking
- **Reconciliation** — End-of-day expected vs recorded revenue reports
- **Fuel Prices** — Price management with history and trend charts
- **Notifications** — Alert system with read/unread management

### Admin Dashboard
- **Company Overview** — Cross-station performance comparison
- **Station Management** — CRUD operations for stations
- **User Management** — Create/edit managers and attendants, role assignment
- **Pump Management** — Manage pumps across all stations

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
