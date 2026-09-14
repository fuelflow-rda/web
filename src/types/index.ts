export interface Company {
  id: string;
  name: string;
  country?: string;
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
  /** Present when API joins companies (e.g. superadmin list). */
  companyName?: string;
  name: string;
  location: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  /** What the site sells: liquid fuel, EV charging, or both. */
  stationType?: StationType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StationType = 'FUEL' | 'EV' | 'HYBRID';

export type FuelType = 'GASOLINE' | 'DIESEL';

/** EV charge tiers. Each is priced separately — fast charging costs more per kWh. */
export type EvProductType = 'EV_AC' | 'EV_DC_FAST' | 'EV_DC_ULTRA';

/** Anything a station sells, measured in liters (fuel) or kWh (EV). */
export type ProductType = FuelType | EvProductType;
export type ProductUnit = 'L' | 'KWH';

export type ConnectorType = 'TYPE2' | 'CCS' | 'CHADEMO' | 'GBT' | 'TESLA';

export type PumpFuelType = ProductType;
export type PumpStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export interface Pump {
  id: string;
  stationId: string;
  pumpNumber: number;
  productType: ProductType;
  /** Legacy alias for productType. */
  fuelType: ProductType;
  /** EV charge points only. */
  connectorType?: ConnectorType | null;
  /** EV charge points only: rated output in kW. */
  powerKw?: number | null;
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
  /** When API joins companies (e.g. superadmin user list). */
  companyName?: string;
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
  totalKwh?: number;
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
  productType: ProductType;
  /** Legacy alias for productType. */
  fuelType: ProductType;
  unit: ProductUnit;
  /** Liters dispensed or kWh delivered — read together with `unit`. */
  quantity: number;
  unitPrice: number;
  /** Legacy aliases; equal to quantity/unitPrice. */
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
  productType: ProductType;
  /** Legacy alias for productType. */
  fuelType: ProductType;
  unit: ProductUnit;
  /** RWF per liter, or per kWh for an EV tier. */
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
  kwh: number;
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
  totalLiters?: number;
  totalKwh?: number;
  generatedAt?: string;
  generatedById?: string;
  generatedBy?: User;
  notes?: string;
  createdAt?: string;
}

export interface PumpReconciliation {
  pumpId: string;
  pumpNumber: number;
  productType: ProductType;
  /** Legacy alias for productType. */
  fuelType: ProductType;
  unit: ProductUnit;
  /** Liters or kWh — read together with `unit`. */
  quantity: number;
  litersDispensed: number;
  kwhDelivered: number;
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
  /** Liters from gasoline-class fuel (API aggregates non-diesel as gasoline). */
  gasolineLiters: number;
  dieselLiters: number;
  /** Electricity delivered. Kept apart from liters — different unit. */
  totalKwh: number;
  totalTransactions: number;
  activePumps: number;
  totalPumps: number;
  revenueByHour: { hour: string; revenue: number; liters: number; kwh: number }[];
}

export interface AttendantReport {
  attendantId: string;
  attendantName: string;
  phone?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  assignedPumpId?: string | null;
  assignedPumpLabel?: string | null;
  assignedPumpShort?: string | null;
  totalTransactions: number;
  totalLiters: number;
  totalKwh: number;
  totalRevenue: number;
  cashAmount: number;
  cardAmount: number;
  momoAmount: number;
}

export interface PumpReport {
  date: string;
  pumpId: string;
  pumpNumber: number;
  productType: ProductType;
  /** Legacy alias for productType. */
  fuelType: ProductType;
  unit: ProductUnit;
  /** Liters or kWh — read together with `unit`. */
  quantityDispensed: number;
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
  todayKwh: number;
  activePumps: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
