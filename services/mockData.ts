import { Donor, Batch, Bottle, QualityControlRecord, Recipient, AdministrationRecord, PathologyDetail, LabTestDetail } from '../types';

const getDefaultPathologies = (): PathologyDetail[] => [
  { name: 'Transfusión de sangre (últimos 5 años)', present: false },
  { name: 'Tatuajes', present: false },
  { name: 'Piercings', present: false },
  { name: 'Acupuntura', present: false },
  { name: 'Contacto con material punzocortante', present: false },
  { name: 'Otros', present: false }
];

const getDefaultLabTests = (date: string = ''): LabTestDetail[] => [
  'Hematocrito', 'Hemoglobina', 'Prueba de VIH', 'VDRL', 'Hepatitis C', 'Hepatitis B', 'Otros'
].map(name => ({
  name,
  before: { performed: false },
  during: { performed: false },
  after: { performed: !!date, date: date, result: date ? 'Negativo' : undefined },
  lastResultDate: date
}));

export const MOCK_DONORS: Donor[] = [
  {
    id: '1',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.g@example.com',
    phone: '555-0101',
    address: 'Av. Reforma 123, Ciudad',
    birthDate: '1995-05-15',
    registrationDate: '2023-08-01',
    status: 'ACTIVE',
    bloodType: 'O+',
    medicalNotes: 'Salud excelente. Lactancia establecida.',
    folio: 'BLH-001',
    fileNumber: 'EXP-001',
    occupation: 'Hogar',
    religion: 'Católica',
    addressReferences: 'Casa blanca portón negro',
    prenatalControlEntity: 'Centro de Salud A',
    deliveryDate: '2023-05-01',
    infantAgeWeeks: 12,
    gestationalAgeWeeks: 39,
    infantHospitalized: false,
    weightPreGestational: 60,
    weightCurrent: 65,
    height: 160,
    bmi: 25.4,
    pregnancyInfections: false,
    
    // New validation fields
    toxicSubstances: false,
    chemicalExposure: false,
    recentVaccines: false,
    bloodTransfusionRisk: false,
    
    pathologies: getDefaultPathologies(),
    isTakingMedication: false,
    medicationsList: [],
    labTests: getDefaultLabTests('2023-08-01'),

    gestations: 2,
    deliveries: 2,
    cesareans: 0,
    abortions: 0,
    sexualPartners: 1,
    contraceptiveMethod: 'DIU',
    
    donationType: 'HOMOLOGOUS',
    donationReason: 'SURPLUS',
    donorCategory: 'EXTERNAL',
    interviewerName: 'Enf. Carla Ruiz',
    elaboratorName: 'Enf. Carla Ruiz'
  },
  {
    id: '2',
    firstName: 'Ana',
    lastName: 'López',
    email: 'ana.lopez@example.com',
    phone: '555-0202',
    address: 'Calle 10 Norte, Colonia Centro',
    birthDate: '1998-11-20',
    registrationDate: '2023-10-15',
    status: 'SCREENING',
    bloodType: 'A+',
    medicalNotes: 'Pendiente resultados de serología.',
    folio: 'BLH-002',
    fileNumber: 'EXP-002',
    occupation: 'Estudiante',
    religion: 'Ninguna',
    addressReferences: 'Frente a la escuela',
    prenatalControlEntity: 'Centro de Salud B',
    deliveryDate: '2023-09-20',
    infantAgeWeeks: 3,
    gestationalAgeWeeks: 38,
    infantHospitalized: false,
    weightPreGestational: 58,
    weightCurrent: 62,
    height: 165,
    bmi: 22.8,
    pregnancyInfections: false,

    // New validation fields
    toxicSubstances: false,
    chemicalExposure: false,
    recentVaccines: false,
    bloodTransfusionRisk: false,

    pathologies: getDefaultPathologies().map(p => 
        p.name === 'Piercings' ? { ...p, present: true, specification: 'Oreja', timeElapsed: '2 años' } : p
    ),
    isTakingMedication: false,
    medicationsList: [],
    labTests: getDefaultLabTests(),

    gestations: 1,
    deliveries: 1,
    cesareans: 0,
    abortions: 0,
    sexualPartners: 1,
    contraceptiveMethod: 'Condón',

    donationType: 'HETEROLOGOUS',
    donationReason: 'SURPLUS',
    donorCategory: 'EXTERNAL',
    interviewerName: 'Enf. Carla Ruiz',
    elaboratorName: 'Enf. Carla Ruiz'
  },
  {
    id: '3',
    firstName: 'Lucía',
    lastName: 'Méndez',
    email: 'lucia.m@example.com',
    phone: '555-0303',
    address: 'Residencial Los Pinos, Casa 4',
    birthDate: '1992-02-10',
    registrationDate: '2023-09-05',
    status: 'INACTIVE',
    bloodType: 'B-',
    medicalNotes: 'Suspendida temporalmente por tratamiento antibiótico.',
    folio: 'BLH-003',
    fileNumber: 'EXP-003',
    occupation: 'Abogada',
    religion: 'Cristiana',
    addressReferences: 'Portón eléctrico',
    prenatalControlEntity: 'Hospital Privado',
    deliveryDate: '2023-08-15',
    infantAgeWeeks: 8,
    gestationalAgeWeeks: 40,
    infantHospitalized: false,
    weightPreGestational: 70,
    weightCurrent: 72,
    height: 170,
    bmi: 24.9,
    pregnancyInfections: false,

    // New validation fields
    toxicSubstances: false,
    chemicalExposure: false,
    recentVaccines: false,
    bloodTransfusionRisk: false,

    pathologies: getDefaultPathologies(),
    isTakingMedication: true,
    medicationsList: [{
        name: 'Antibiótico',
        dosage: '500mg',
        reason: 'Mastitis',
        startDate: '2023-09-05',
        endDate: '2023-09-12'
    }],
    labTests: getDefaultLabTests('2023-09-01'),

    gestations: 2,
    deliveries: 2,
    cesareans: 0,
    abortions: 0,
    sexualPartners: 1,
    contraceptiveMethod: 'Implante',

    donationType: 'HETEROLOGOUS',
    donationReason: 'SURPLUS',
    donorCategory: 'HOME',
    interviewerName: 'Dra. Elena Torres',
    elaboratorName: 'Dra. Elena Torres'
  },
  {
    id: '4',
    firstName: 'Carmen',
    lastName: 'Ramírez',
    email: 'carmen.r@example.com',
    phone: '555-0404',
    address: 'Blvd. Aeropuerto 500',
    birthDate: '2000-07-30',
    registrationDate: '2023-11-01',
    status: 'ACTIVE',
    bloodType: 'O+',
    folio: 'BLH-004',
    fileNumber: 'EXP-004',
    occupation: 'Comerciante',
    religion: 'Católica',
    addressReferences: 'Local comercial',
    prenatalControlEntity: 'Centro de Salud',
    deliveryDate: '2023-10-01',
    infantAgeWeeks: 4,
    gestationalAgeWeeks: 39,
    infantHospitalized: false,
    weightPreGestational: 65,
    weightCurrent: 68,
    height: 158,
    bmi: 27.2,
    pregnancyInfections: false,

    // New validation fields
    toxicSubstances: false,
    chemicalExposure: false,
    recentVaccines: false,
    bloodTransfusionRisk: false,

    pathologies: getDefaultPathologies(),
    isTakingMedication: false,
    medicationsList: [],
    labTests: getDefaultLabTests('2023-10-30'),

    gestations: 3,
    deliveries: 3,
    cesareans: 0,
    abortions: 0,
    sexualPartners: 1,
    contraceptiveMethod: 'OTB',

    donationType: 'HETEROLOGOUS',
    donationReason: 'SURPLUS',
    donorCategory: 'EXTERNAL',
    interviewerName: 'Enf. Carla Ruiz',
    elaboratorName: 'Enf. Carla Ruiz'
  },
  {
    id: '5',
    firstName: 'Sofia',
    lastName: 'Vergara',
    email: 'sofia.v@example.com',
    phone: '555-0505',
    address: 'Calle 5 Sur',
    birthDate: '1996-03-22',
    registrationDate: '2023-12-10',
    status: 'ACTIVE',
    bloodType: 'A-',
    folio: 'BLH-005',
    fileNumber: 'EXP-005',
    occupation: 'Ingeniera',
    religion: 'Atea',
    addressReferences: 'Edificio A depto 2',
    prenatalControlEntity: 'ISSSTE',
    deliveryDate: '2023-11-15',
    infantAgeWeeks: 4,
    gestationalAgeWeeks: 38,
    infantHospitalized: true,
    infantHospitalService: 'UCIN',
    weightPreGestational: 55,
    weightCurrent: 58,
    height: 162,
    bmi: 22.1,
    pregnancyInfections: false,

    // New validation fields
    toxicSubstances: false,
    chemicalExposure: false,
    recentVaccines: false,
    bloodTransfusionRisk: false,

    pathologies: getDefaultPathologies(),
    isTakingMedication: false,
    medicationsList: [],
    labTests: getDefaultLabTests('2023-12-05'),

    gestations: 1,
    deliveries: 0,
    cesareans: 1,
    abortions: 0,
    sexualPartners: 1,
    contraceptiveMethod: 'Ninguno',

    donationType: 'HOMOLOGOUS',
    donationReason: 'SURPLUS',
    donorCategory: 'INTERNAL',
    interviewerName: 'Dra. Elena Torres',
    elaboratorName: 'Dra. Elena Torres'
  }
];

export const MOCK_BOTTLES: Bottle[] = [
  { 
    id: 'b1', 
    donorId: '1', 
    donorName: 'María González', 
    collectionDate: '2023-12-20', 
    volume: 150, 
    status: 'ASSIGNED', 
    batchId: 'l2',
    traceabilityCode: 'HE20L23001-HMPMPS',
    hospitalInitials: 'HMPMPS'
  },
  { 
    id: 'b2', 
    donorId: '1', 
    donorName: 'María González', 
    collectionDate: '2023-12-21', 
    volume: 180, 
    status: 'COLLECTED',
    traceabilityCode: 'HE21L23002-HMPMPS',
    hospitalInitials: 'HMPMPS' 
  },
  { 
    id: 'b3', 
    donorId: '4', 
    donorName: 'Carmen Ramírez', 
    collectionDate: '2023-12-22', 
    volume: 200, 
    status: 'ASSIGNED', 
    batchId: 'l2',
    traceabilityCode: 'HE22L23003-HMPMPS',
    hospitalInitials: 'HMPMPS'
  },
  { 
    id: 'b4', 
    donorId: '4', 
    donorName: 'Carmen Ramírez', 
    collectionDate: '2023-12-23', 
    volume: 160, 
    status: 'COLLECTED',
    traceabilityCode: 'HE23L23004-HMPMPS',
    hospitalInitials: 'HMPMPS' 
  },
  { 
    id: 'b5', 
    donorId: '1', 
    donorName: 'María González', 
    collectionDate: '2023-11-10', 
    volume: 150, 
    status: 'ASSIGNED', 
    batchId: 'l1',
    traceabilityCode: 'HE10K23005-HMPMPS',
    hospitalInitials: 'HMPMPS' 
  },
  { 
    id: 'b6', 
    donorId: '5', 
    donorName: 'Sofia Vergara', 
    collectionDate: '2023-10-05', 
    volume: 220, 
    status: 'ASSIGNED', 
    batchId: 'l3',
    traceabilityCode: 'HO05J23006-HMPMPS',
    hospitalInitials: 'HMPMPS' 
  },
  { 
    id: 'b7', 
    donorId: '3', 
    donorName: 'Lucía Méndez', 
    collectionDate: '2023-09-15', 
    volume: 190, 
    status: 'ASSIGNED', 
    batchId: 'l4',
    traceabilityCode: 'HE15I23007-HMPMPS',
    hospitalInitials: 'HMPMPS' 
  },
];

export const MOCK_QC_RECORDS: QualityControlRecord[] = [
  {
    id: 'qc1',
    batchId: 'l1',
    inspectorName: 'Q.F.B. Ricardo Perez',
    inspectionDate: '2023-11-16',
    acidityDornic: 4,
    crematocrit: 700,
    flavor: 'NORMAL',
    color: 'Blanco amarillento',
    packagingState: 'OK',
    coliformsPresence: false,
    verdict: 'APPROVED',
    notes: 'Lote de excelente calidad.'
  },
  {
    id: 'qc3',
    batchId: 'l3',
    inspectorName: 'Q.F.B. Ricardo Perez',
    inspectionDate: '2023-10-08',
    acidityDornic: 3,
    crematocrit: 680,
    flavor: 'NORMAL',
    color: 'Blanco',
    packagingState: 'OK',
    coliformsPresence: false,
    verdict: 'APPROVED',
  },
  {
    id: 'qc4',
    batchId: 'l4',
    inspectorName: 'Q.F.B. Ricardo Perez',
    inspectionDate: '2023-09-18',
    acidityDornic: 9, // Rejected
    crematocrit: 600,
    flavor: 'OFF_FLAVOR',
    color: 'Amarillo intenso',
    packagingState: 'OK',
    coliformsPresence: false,
    verdict: 'REJECTED',
    notes: 'Acidez elevada.'
  }
];

export const MOCK_BATCHES: Batch[] = [
  {
    id: 'l1',
    batchNumber: 'LOTE-202311-001',
    creationDate: '2023-11-15',
    expirationDate: '2024-05-15',
    type: 'HETEROLOGOUS',
    status: 'APPROVED',
    totalVolume: 150,
    currentVolume: 120, // 30ml used
    bottleCount: 1,
    bottles: ['b5'],
    qualityControlId: 'qc1'
  },
  {
    id: 'l2',
    batchNumber: 'LOTE-202312-002',
    creationDate: '2023-12-24',
    expirationDate: '2024-06-24',
    type: 'HETEROLOGOUS',
    status: 'COMPLETED', // Ready for QC
    totalVolume: 350,
    currentVolume: 350,
    bottleCount: 2,
    bottles: ['b1', 'b3']
  },
  {
    id: 'l3',
    batchNumber: 'LOTE-202310-003',
    creationDate: '2023-10-06',
    expirationDate: '2024-04-06',
    type: 'HOMOLOGOUS',
    status: 'APPROVED',
    totalVolume: 220,
    currentVolume: 0, // Fully used
    bottleCount: 1,
    bottles: ['b6'],
    qualityControlId: 'qc3'
  },
  {
    id: 'l4',
    batchNumber: 'LOTE-202309-004',
    creationDate: '2023-09-16',
    expirationDate: '2024-03-16',
    type: 'HETEROLOGOUS',
    status: 'REJECTED',
    totalVolume: 190,
    currentVolume: 190,
    bottleCount: 1,
    bottles: ['b7'],
    qualityControlId: 'qc4'
  }
];

export const MOCK_RECIPIENTS: Recipient[] = [
  {
    id: 'r1',
    fullName: 'Recién Nacido Hernández',
    birthDate: '2023-11-20',
    gender: 'MALE',
    hospitalService: 'UCIN',
    doctorName: 'Dr. Fernando Vega',
    diagnosis: 'Prematurez extrema (28 SDG)',
    weightGrams: 1200,
    status: 'ACTIVE',
    registrationDate: '2023-11-21'
  },
  {
    id: 'r2',
    fullName: 'Recién Nacido Torres',
    birthDate: '2023-12-25',
    gender: 'FEMALE',
    hospitalService: 'Cuneros Patológicos',
    doctorName: 'Dra. Sofia Martinez',
    diagnosis: 'Intolerancia a fórmula',
    weightGrams: 2100,
    status: 'ACTIVE',
    registrationDate: '2023-12-26'
  }
];

export const MOCK_ADMINISTRATIONS: AdministrationRecord[] = [
  {
    id: 'adm1',
    recipientId: 'r1',
    recipientName: 'Recién Nacido Hernández',
    batchId: 'l1',
    batchNumber: 'LOTE-202311-001',
    volumeAdministered: 30,
    date: '2023-11-22T10:00:00',
    administeredBy: 'Enf. Carla Ruiz',
    notes: 'Primera toma tolerada.'
  },
  {
    id: 'adm2',
    recipientId: 'r1',
    recipientName: 'Recién Nacido Hernández',
    batchId: 'l3',
    batchNumber: 'LOTE-202310-003',
    volumeAdministered: 100,
    date: '2023-10-20T14:00:00',
    administeredBy: 'Enf. Carla Ruiz',
    notes: ''
  },
  {
    id: 'adm3',
    recipientId: 'r1',
    recipientName: 'Recién Nacido Hernández',
    batchId: 'l3',
    batchNumber: 'LOTE-202310-003',
    volumeAdministered: 120,
    date: '2023-10-21T09:00:00',
    administeredBy: 'Enf. Carla Ruiz',
    notes: 'Fin de lote'
  }
];