export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  id: string;
  companyId: string;
  name: string;
  location: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FuelType = 'PETROL' | 'DIESEL';
/** Pump dispenses one fuel type or both */
export type PumpFuelType = 'PETROL' | 'DIESEL' | 'BOTH';
export type PumpStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export interface Pump {
  id: string;
  stationId: string;
  pumpNumber: number;
  fuelType: PumpFuelType;
  status: PumpStatus;
  currentAttendantId?: string;
  currentAttendant?: User;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'ATTENDANT';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  stationId?: string;
  station?: Station;
  companyId?: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  attendantId: string;
  attendant?: User;
  stationId: string;
  pumpId: string;
  pump?: Pump;
  startTime: string;
  endTime?: string;
  startMeterReading: number;
  endMeterReading?: number;
  status: 'ACTIVE' | 'COMPLETED';
  totalLiters?: number;
  totalRevenue?: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'MOMO' | 'CREDIT';

export interface Transaction {
  id: string;
  stationId: string;
  pumpId: string;
  pump?: Pump;
  attendantId: string;
  attendant?: User;
  shiftId?: string;
  vehiclePlate?: string;
  customerPhone?: string;
  fuelType: FuelType;
  liters: number;
  pricePerLiter: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FuelPrice {
  id: string;
  stationId?: string;
  companyId?: string;
  fuelType: FuelType;
  price: number;
  previousPrice?: number;
  effectiveDate: string;
  changedById: string;
  changedBy?: { id: string; name: string };
  createdAt: string;
}

export interface AttendantReconciliation {
  attendantId: string;
  attendantName: string;
  transactionCount: number;
  liters: number;
  revenue: number;
}

export interface ReconciliationReport {
  id: string;
  stationId: string;
  station?: Station;
  date: string;
  expectedRevenue: number;
  recordedRevenue: number;
  difference: number;
  status: 'BALANCED' | 'DISCREPANCY';
  pumpBreakdown: PumpReconciliation[];
  paymentBreakdown: PaymentBreakdown[];
  attendantBreakdown?: AttendantReconciliation[];
  generatedAt?: string;
  generatedById?: string;
  generatedBy?: User;
  notes?: string;
  createdAt?: string;
}

export interface PumpReconciliation {
  pumpId: string;
  pumpNumber: number;
  fuelType: FuelType;
  litersDispensed: number;
  expectedRevenue: number;
  recordedRevenue: number;
  difference: number;
  status: 'BALANCED' | 'DISCREPANCY';
}

export interface PaymentBreakdown {
  method: PaymentMethod;
  count: number;
  amount: number;
}

export interface Notification {
  id: string;
  userId: string;
  stationId?: string;
  type: 'ALERT' | 'INFO' | 'WARNING' | 'SUCCESS';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalLiters: number;
  totalTransactions: number;
  activePumps: number;
  totalPumps: number;
  revenueByHour: { hour: string; revenue: number; liters: number }[];
}

export interface AttendantReport {
  attendantId: string;
  attendantName: string;
  assignedPumpId?: string | null;
  assignedPumpLabel?: string | null;
  /** Short label for table (e.g. "#6") to keep row compact */
  assignedPumpShort?: string | null;
  totalTransactions: number;
  totalLiters: number;
  totalRevenue: number;
  cashAmount: number;
  cardAmount: number;
  momoAmount: number;
}

export interface PumpReport {
  date: string;
  pumpId: string;
  pumpNumber: number;
  fuelType: PumpFuelType;
  litersDispensed: number;
  expectedRevenue: number;
  recordedRevenue: number;
  discrepancy: number;
}

export interface StationOverview {
  stationId: string;
  stationName: string;
  todayRevenue: number;
  todayTransactions: number;
  todayLiters: number;
  activePumps: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
