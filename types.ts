
export type UserRole = 
  | 'ADMIN' 
  | 'SUPERVISOR' 
  | 'CAPTURA' 
  | 'RESPONSABLE_BLH' 
  | 'CAPTACION_DONADORAS' 
  | 'VERIFICACION_LOGISTICA' 
  | 'ADMINISTRATIVO';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  sector: string;
  coordination: string;
  area: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  registrationDate: string;
  lastAccess?: string;
  avatarUrl?: string;
}

export interface Hospital {
  name: string;
  initials: string;
  city: string;
}

export type DonorStatus = 'ACTIVE' | 'INACTIVE' | 'SCREENING' | 'SUSPENDED' | 'REJECTED';

// Clinical Data Structures
export interface LabResult {
  performed: boolean;
  date?: string;
  result?: string;
}

export interface LabTestDetail {
  name: string;
  before: LabResult;
  during: LabResult;
  after: LabResult;
  lastResultDate?: string;
}

export interface PathologyDetail {
  name: string;
  present: boolean;
  specification?: string;
  timeElapsed?: string;
}

export interface MedicationDetail {
  name: string;
  dosage: string;
  reason: string;
  startDate: string;
  endDate: string;
}

export interface Donor {
  id: string;
  folio: string;
  fileNumber: string;
  registrationDate: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  age?: number;
  occupation: string;
  religion: string;
  address: string;
  addressReferences: string;
  phone: string;
  email: string;
  prenatalControlEntity: string;
  deliveryDate: string;
  infantAgeWeeks: number;
  gestationalAgeWeeks: number;
  infantHospitalized: boolean;
  infantHospitalService?: string;
  weightPreGestational: number;
  weightCurrent: number;
  height: number;
  bmi: number;
  pregnancyInfections: boolean;
  infectionTrimester?: string;
  pregnancyComplications?: string;
  toxicSubstances: boolean;
  chemicalExposure: boolean;
  recentVaccines: boolean;
  bloodTransfusionRisk: boolean;
  pathologies: PathologyDetail[];
  isTakingMedication: boolean;
  medicationsList: MedicationDetail[];
  gestations: number;
  deliveries: number;
  cesareans: number;
  abortions: number;
  sexualPartners: number;
  contraceptiveMethod: string;
  anomalies?: string;
  labTests: LabTestDetail[];
  bloodType?: string;
  status: DonorStatus;
  donationType: 'HOMOLOGOUS' | 'HETEROLOGOUS' | 'MIXED' | 'REJECTED';
  rejectionReason?: string;
  donationReason: 'SURPLUS' | 'DEATH' | 'OTHER';
  donorCategory: 'INTERNAL' | 'EXTERNAL' | 'HOME' | 'LACTARIUM';
  interviewerName: string;
  elaboratorName: string;
  medicalNotes?: string;
  obstetricEventType: 'PARTO' | 'CESAREA';
}

export type BatchStatus = 'IN_PROCESS' | 'COMPLETED' | 'PENDING_QC' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PASTEURIZED';
export type BatchType = 'HOMOLOGOUS' | 'HETEROLOGOUS';
export type MilkType = 'PRECALOSTRO' | 'CALOSTRO' | 'TRANSICION' | 'MADURA';

export interface Bottle {
  id: string;
  traceabilityCode: string;
  donorId: string;
  donorName: string; 
  collectionDate: string;
  volume: number; 
  hospitalInitials: string;
  status: 'COLLECTED' | 'ASSIGNED' | 'DISCARDED';
  milkType: MilkType;
  batchId?: string;
  collectionDateTime?: string;
  donorAgeSnapshot?: number;
  obstetricEventType?: 'PARTO' | 'CESAREA';
  gestationalAgeSnapshot?: number;
  responsibleName?: string;
  observations?: string;
  storageLocation?: string;
}

export interface PhysicalInspectionRecord {
  id: string;
  batchId: string;
  inspectorName: string;
  inspectionDate: string;
  containerState: {
    lid: boolean;
    integrity: boolean;
    seal: boolean;
    label: boolean;
  };
  milkState: 'FROZEN' | 'REFRIGERATED' | 'THAWED';
  volumeCheck: number;
  observations?: string;
  verdict: 'APPROVED' | 'REJECTED';
  rejectionReasons: string[];
}

export interface QualityControlRecord {
  id: string;
  batchId: string;
  inspectorName: string;
  inspectionDate: string;
  acidityDornic: number;
  crematocrit: number;
  caloricClassification: 'HIPOCALÓRICA' | 'NORMOCALÓRICA' | 'HIPERCALÓRICA';
  flavor: 'NORMAL' | 'OFF_FLAVOR';
  color: string;
  packagingState: 'OK' | 'DAMAGED';
  coliformsPresence: boolean;
  verdict: 'APPROVED' | 'REJECTED';
  notes?: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  creationDate: string;
  expirationDate: string;
  type: BatchType;
  status: BatchStatus;
  totalVolume: number;
  currentVolume: number;
  bottleCount: number;
  bottles: string[];
  qualityControlId?: string;
  physicalInspectionId?: string;
}

export interface Recipient {
  id: string;
  fullName: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  hospitalService: string;
  doctorName: string;
  diagnosis: string;
  weightGrams?: number;
  status: 'ACTIVE' | 'DISCHARGED';
  registrationDate: string;
}

export interface AdministrationRecord {
  id: string;
  recipientId: string;
  recipientName: string;
  batchId: string;
  batchNumber: string;
  volumeAdministered: number;
  date: string;
  administeredBy: string;
  notes?: string;
}

export interface DiscardRecord {
  id: string;
  batchId: string;
  volumeDiscarded: number;
  reason: 'EXPIRATION' | 'CONTAMINATION' | 'DOSAGE_ERROR' | 'OTHER';
  date: string;
  discardedBy: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface DashboardStats {
  totalDonors: number;
  activeDonors: number;
  newDonorsThisMonth: number;
  pendingScreening: number;
  batchesInProcess: number;
  batchesPendingQC: number;
  activeRecipients: number;
  availableMilkVolume: number;
}

export interface KPIMetrics {
  activeDonorsCount: number;
  qualityApprovalRate: number;
  avgProcessingTimeHours: number;
  wasteRate: number;
}

export interface TrendPoint {
  date: string;
  collectedVolume: number;
  administeredVolume: number;
}

export interface QualityStats {
  approvedCount: number;
  rejectedCount: number;
  rejectionReasons: { reason: string; count: number }[];
}

export interface ReportFilter {
  startDate: string;
  endDate: string;
}

export type NotificationModule = 'INVENTORY' | 'QUALITY' | 'DONORS' | 'ADMINISTRATION' | 'SYSTEM' | 'USERS';
export type NotificationPriority = 'HIGH' | 'NORMAL' | 'LOW';

export interface SystemNotification {
  id: string;
  module: NotificationModule;
  title: string;
  description: string;
  timestamp: string;
  priority: NotificationPriority;
  link?: string;
  isRead: boolean;
}
