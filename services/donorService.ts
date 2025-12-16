
import { Donor, DashboardStats } from '../types';
import { MOCK_DONORS } from './mockData';
import { batchService } from './batchService';
import { recipientService } from './recipientService';

const STORAGE_KEY = 'blh_donors';

// Initialize mock data in local storage if empty
if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DONORS));
}

const getStoredDonors = (): Donor[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveDonors = (donors: Donor[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
};

// --- ELIGIBILITY VALIDATION LOGIC ---
const validateEligibility = (donor: Partial<Donor>): { status: 'ACTIVE' | 'REJECTED'; reasons: string[] } => {
  const reasons: string[] = [];
  
  // 1. Toxic Substances (Alcohol, drugs, tobacco)
  if (donor.toxicSubstances) reasons.push("Consumo de sustancias tóxicas (alcohol, tabaco, drogas).");

  // 2. Chemical Exposure
  if (donor.chemicalExposure) reasons.push("Exposición ambiental a compuestos químicos.");

  // 3. Recent Vaccines (Live virus < 4 weeks)
  if (donor.recentVaccines) reasons.push("Vacunación con virus vivos en las últimas 4 semanas.");

  // 4. Blood Transfusion Risk (< 5 years)
  if (donor.bloodTransfusionRisk) reasons.push("Transfusión sanguínea en los últimos 5 años.");

  // 5. Pathologies (Specific checks)
  const tatuajes = donor.pathologies?.find(p => p.name === 'Tatuajes');
  const piercings = donor.pathologies?.find(p => p.name === 'Piercings');
  const acupuntura = donor.pathologies?.find(p => p.name === 'Acupuntura');
  const punzocortante = donor.pathologies?.find(p => p.name === 'Contacto con material punzocortante');

  // Logic: Check timeElapsed strings for keywords or assume manual check. 
  // For automation, if they are 'present', we rely on the interviewer checking dates.
  // BUT, to be strict: if present, mark for REVIEW or Reject if < 1 year.
  // Here we simplify: If flagged present by user in the 'Exclusive' section of UI (which maps to boolean below), we reject.
  // The UI fields toxicSubstances etc handle the aggregate logic, but let's check structured data too.

  if (tatuajes?.present) reasons.push("Tatuajes registrados (Validar antigüedad > 1 año).");
  if (piercings?.present) reasons.push("Perforaciones registradas (Validar antigüedad > 1 año).");
  
  // 6. Serology Results (Critical)
  // Check 'after' pregnancy or 'lastResultDate'
  const hiv = donor.labTests?.find(t => t.name === 'Prueba de VIH');
  const vdrl = donor.labTests?.find(t => t.name === 'VDRL');
  const hepB = donor.labTests?.find(t => t.name === 'Hepatitis B');
  const hepC = donor.labTests?.find(t => t.name === 'Hepatitis C');

  // If any result says "REACTIVO" or "POSITIVO"
  const checkReactive = (test: any) => {
     const res = test?.after?.result?.toUpperCase() || '';
     return res.includes('REACTIVO') || res.includes('POSITIVO') || res.includes('+');
  };

  if (checkReactive(hiv)) reasons.push("Prueba VIH Reactiva.");
  if (checkReactive(vdrl)) reasons.push("Prueba VDRL Reactiva (Sífilis).");
  if (checkReactive(hepB)) reasons.push("Hepatitis B Reactiva.");
  if (checkReactive(hepC)) reasons.push("Hepatitis C Reactiva.");

  return {
    status: reasons.length > 0 ? 'REJECTED' : 'ACTIVE',
    reasons
  };
};

export const donorService = {
  getAll: async (): Promise<Donor[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate latency
    return getStoredDonors();
  },

  getById: async (id: string): Promise<Donor | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const donors = getStoredDonors();
    return donors.find(d => d.id === id);
  },

  create: async (donorData: Omit<Donor, 'id' | 'registrationDate'>): Promise<Donor> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Auto-validate Eligibility
    const validation = validateEligibility(donorData);
    
    const newDonor: Donor = {
      ...donorData,
      id: Math.random().toString(36).substr(2, 9),
      registrationDate: new Date().toISOString().split('T')[0],
      status: validation.status, // Overwrite status based on logic
      rejectionReason: validation.reasons.join(' | ') || donorData.rejectionReason,
      // If rejected, donation type forces to REJECTED
      donationType: validation.status === 'REJECTED' ? 'REJECTED' : donorData.donationType
    };
    
    const donors = getStoredDonors();
    saveDonors([...donors, newDonor]);
    return newDonor;
  },

  update: async (id: string, updates: Partial<Donor>): Promise<Donor> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const donors = getStoredDonors();
    const index = donors.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Donor not found');

    // Re-validate if clinical data changes
    let validationStatus = donors[index].status;
    let validationReasons = donors[index].rejectionReason;

    if (updates.labTests || updates.toxicSubstances || updates.pathologies) {
         const merged = { ...donors[index], ...updates };
         const validation = validateEligibility(merged);
         validationStatus = validation.status;
         validationReasons = validation.reasons.join(' | ');
    }

    const updatedDonor = { 
        ...donors[index], 
        ...updates,
        status: validationStatus,
        rejectionReason: validationReasons
    };

    donors[index] = updatedDonor;
    saveDonors(donors);
    return updatedDonor;
  },

  getStats: async (): Promise<DashboardStats> => {
    const donors = getStoredDonors();
    const batches = await batchService.getAll();
    const recipients = await recipientService.getAll();
    
    const availableVolume = batches
      .filter(b => b.status === 'APPROVED')
      .reduce((sum, b) => sum + b.currentVolume, 0);

    return {
      totalDonors: donors.length,
      activeDonors: donors.filter(d => d.status === 'ACTIVE').length,
      pendingScreening: donors.filter(d => d.status === 'SCREENING').length,
      newDonorsThisMonth: donors.filter(d => {
        const dDate = new Date(d.registrationDate);
        const now = new Date();
        return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
      }).length,
      batchesInProcess: batches.filter(b => b.status === 'IN_PROCESS').length,
      batchesPendingQC: batches.filter(b => b.status === 'COMPLETED' || b.status === 'PENDING_QC').length,
      activeRecipients: recipients.filter(r => r.status === 'ACTIVE').length,
      availableMilkVolume: availableVolume
    };
  }
};
