
export type UserRole = 'ADMIN' | 'HEALTH_STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
  result?: string; // 'REACTIVO' | 'NO_REACTIVO'
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
  // Ficha de Identificación
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
  
  // Antecedentes Perinatales
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

  // Criterios de Exclusión Específicos (Validación)
  toxicSubstances: boolean; // Alcohol, tabaco, drogas
  chemicalExposure: boolean; // Exposición ambiental
  recentVaccines: boolean; // Virus vivos ultimas 4 semanas
  bloodTransfusionRisk: boolean; // Transfusión < 5 años

  // Antecedentes Patológicos (Detailed)
  pathologies: PathologyDetail[];
  
  // Tratamiento Farmacológico (Detailed)
  isTakingMedication: boolean;
  medicationsList: MedicationDetail[];

  // Antecedentes Gineco-Obstétricos
  gestations: number;
  deliveries: number;
  cesareans: number;
  abortions: number;
  sexualPartners: number;
  contraceptiveMethod: string;
  anomalies?: string;

  // Laboratorio (Detailed)
  labTests: LabTestDetail[];
  bloodType?: string;

  // Resultado Entrevista
  status: DonorStatus;
  donationType: 'HOMOLOGOUS' | 'HETEROLOGOUS' | 'MIXED' | 'REJECTED';
  rejectionReason?: string;

  // Motivo Donación
  donationReason: 'SURPLUS' | 'DEATH' | 'OTHER';
  
  // Tipo Donadora
  donorCategory: 'INTERNAL' | 'EXTERNAL' | 'HOME' | 'LACTARIUM';

  // Responsables
  interviewerName: string;
  elaboratorName: string;
  
  medicalNotes?: string;
}

export type BatchStatus = 'IN_PROCESS' | 'COMPLETED' | 'PENDING_QC' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PASTEURIZED';
export type BatchType = 'HOMOLOGOUS' | 'HETEROLOGOUS';

export interface Bottle {
  id: string;
  traceabilityCode: string; // [Type][Day][Month][Year][Consec]-[Hospital]
  donorId: string;
  donorName: string; 
  collectionDate: string; // ISO Date String (YYYY-MM-DD)
  volume: number; 
  hospitalInitials: string;
  status: 'COLLECTED' | 'ASSIGNED' | 'DISCARDED';
  batchId?: string;

  // Extended Collection Data (Snapshot at collection time)
  collectionDateTime?: string; // ISO DateTime
  donorAgeSnapshot?: number;
  obstetricEventType?: 'PARTO' | 'CESAREA';
  gestationalAgeSnapshot?: number;
  responsibleName?: string;
  observations?: string;
  storageLocation?: string; // e.g. "Freezer 1"
}

// Nueva estructura para Inspección Física
export interface PhysicalInspectionRecord {
  id: string;
  batchId: string;
  inspectorName: string;
  inspectionDate: string;
  
  // Estado del envase
  containerState: {
    lid: boolean;      // Tapa correcta
    integrity: boolean; // Sin roturas
    seal: boolean;     // Sello intacto
    label: boolean;    // Etiqueta legible
  };
  
  milkState: 'FROZEN' | 'REFRIGERATED' | 'THAWED';
  volumeCheck: number;
  observations?: string;
  
  verdict: 'APPROVED' | 'REJECTED';
  rejectionReasons: string[]; // List of specific reasons if Rejected
}

export interface QualityControlRecord {
  id: string;
  batchId: string;
  inspectorName: string;
  inspectionDate: string;
  
  acidityDornic: number;
  crematocrit: number;
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
  physicalInspectionId?: string; // Reference to new inspection
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

export type NotificationModule = 'INVENTORY' | 'QUALITY' | 'DONORS' | 'ADMINISTRATION' | 'SYSTEM';
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
