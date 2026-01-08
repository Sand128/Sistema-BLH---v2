
import { Batch, Bottle, BatchStatus, QualityControlRecord, DiscardRecord, PhysicalInspectionRecord, MilkType } from '../types';
import { MOCK_BATCHES, MOCK_BOTTLES, MOCK_QC_RECORDS } from './mockData';

const BATCH_STORAGE_KEY = 'blh_batches';
const BOTTLE_STORAGE_KEY = 'blh_bottles';
const QC_STORAGE_KEY = 'blh_qc_records';
const PHYSICAL_QC_STORAGE_KEY = 'blh_physical_qc_records';

// Initialize mock data
if (!localStorage.getItem(BATCH_STORAGE_KEY)) {
  localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(MOCK_BATCHES));
}
if (!localStorage.getItem(BOTTLE_STORAGE_KEY)) {
  localStorage.setItem(BOTTLE_STORAGE_KEY, JSON.stringify(MOCK_BOTTLES));
}
if (!localStorage.getItem(QC_STORAGE_KEY)) {
  localStorage.setItem(QC_STORAGE_KEY, JSON.stringify(MOCK_QC_RECORDS));
}

const getStoredBatches = (): Batch[] => {
  const data = localStorage.getItem(BATCH_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const getStoredBottles = (): Bottle[] => {
  const data = localStorage.getItem(BOTTLE_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const getStoredQC = (): QualityControlRecord[] => {
  const data = localStorage.getItem(QC_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const getStoredPhysicalQC = (): PhysicalInspectionRecord[] => {
    const data = localStorage.getItem(PHYSICAL_QC_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

const saveBatches = (batches: Batch[]) => {
  localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(batches));
};

const saveBottles = (bottles: Bottle[]) => {
  localStorage.setItem(BOTTLE_STORAGE_KEY, JSON.stringify(bottles));
};

const saveQC = (records: QualityControlRecord[]) => {
  localStorage.setItem(QC_STORAGE_KEY, JSON.stringify(records));
};

const savePhysicalQC = (records: PhysicalInspectionRecord[]) => {
    localStorage.setItem(PHYSICAL_QC_STORAGE_KEY, JSON.stringify(records));
};

// --- TRACEABILITY LOGIC ---
const generateTraceabilityCode = (
    type: 'HOMOLOGOUS' | 'HETEROLOGOUS', 
    date: Date, 
    hospitalInitials: string,
    dailyCount: number
): string => {
    // Component 1: Type
    const typeCode = type === 'HOMOLOGOUS' ? 'HO' : 'HE';
    
    // Component 2: Day (01-31)
    const day = date.getDate().toString().padStart(2, '0');
    
    // Component 3: Month Code (A-L)
    const months = "ABCDEFGHIJKL";
    const monthCode = months[date.getMonth()];
    
    // Component 4: Year (2 digits)
    const year = date.getFullYear().toString().substr(-2);
    
    // Component 5: Consecutive (3 digits)
    const consec = dailyCount.toString().padStart(3, '0');
    
    // Format: [Type][Day][Month][Year][Consec]-[Hospital]
    return `${typeCode}${day}${monthCode}${year}${consec}-${hospitalInitials}`;
};

export const batchService = {
  getAll: async (): Promise<Batch[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return getStoredBatches();
  },

  getById: async (id: string): Promise<Batch | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStoredBatches().find(b => b.id === id);
  },

  getAllBottles: async (): Promise<Bottle[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStoredBottles();
  },

  getAvailableBottles: async (): Promise<Bottle[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStoredBottles().filter(b => b.status === 'COLLECTED');
  },

  getBottlesByBatchId: async (batchId: string): Promise<Bottle[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const batch = getStoredBatches().find(b => b.id === batchId);
    if (!batch) return [];
    const allBottles = getStoredBottles();
    return allBottles.filter(b => batch.bottles.includes(b.id));
  },
  
  getBottlesByDonorId: async (donorId: string): Promise<Bottle[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStoredBottles().filter(b => b.donorId === donorId);
  },

  getQCRecord: async (batchId: string): Promise<QualityControlRecord | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allQC = getStoredQC();
    return allQC.find(qc => qc.batchId === batchId);
  },

  getPhysicalQCRecord: async (batchId: string): Promise<PhysicalInspectionRecord | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allQC = getStoredPhysicalQC();
    return allQC.find(qc => qc.batchId === batchId);
  },

  createBottle: async (
      donorId: string, 
      donorName: string, 
      volume: number, 
      date: string, // YYYY-MM-DD
      hospitalInitials: string,
      donationType: 'HOMOLOGOUS' | 'HETEROLOGOUS' | 'MIXED' | 'REJECTED',
      milkType: MilkType,
      details?: {
          collectionDateTime?: string,
          donorAge?: number,
          obstetricEventType?: 'PARTO' | 'CESAREA',
          gestationalAge?: number,
          responsibleName?: string,
          observations?: string
      }
  ): Promise<Bottle> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const bottles = getStoredBottles();
    
    // Calculate daily consecutive
    const collectionDate = new Date(date);
    const dateString = collectionDate.toISOString().split('T')[0];
    const dailyCount = bottles.filter(b => b.collectionDate === dateString).length + 1;

    // Determine type for label (default to HE if mixed/rejected for safety, or use Donor type)
    const typeCode = (donationType === 'HOMOLOGOUS') ? 'HOMOLOGOUS' : 'HETEROLOGOUS';

    const code = generateTraceabilityCode(typeCode, collectionDate, hospitalInitials, dailyCount);

    const newBottle: Bottle = {
      id: Math.random().toString(36).substr(2, 9),
      traceabilityCode: code,
      donorId,
      donorName,
      collectionDate: date,
      volume,
      hospitalInitials,
      status: 'COLLECTED',
      milkType,
      
      // Extended fields
      collectionDateTime: details?.collectionDateTime || new Date().toISOString(),
      donorAgeSnapshot: details?.donorAge,
      obstetricEventType: details?.obstetricEventType,
      gestationalAgeSnapshot: details?.gestationalAge,
      responsibleName: details?.responsibleName,
      observations: details?.observations
    };
    
    saveBottles([newBottle, ...bottles]);
    return newBottle;
  },

  create: async (data: Pick<Batch, 'type'> & { selectedBottleIds: string[] }): Promise<Batch> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const batches = getStoredBatches();
    const bottles = getStoredBottles();
    
    // Validate bottles exist
    const selectedBottles = bottles.filter(b => data.selectedBottleIds.includes(b.id));
    
    // BUSINES RULE: Homologous batches must come from a SINGLE donor
    if (data.type === 'HOMOLOGOUS') {
        const uniqueDonors = new Set(selectedBottles.map(b => b.donorId));
        if (uniqueDonors.size > 1) {
            throw new Error('Validación fallida: Un lote HOMÓLOGO solo puede contener leche de una única donadora.');
        }
    }

    // Generate Batch Number: LOTE-YYYYMM-NNN
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthlyCount = batches.filter(b => b.batchNumber.includes(yearMonth)).length + 1;
    const batchNumber = `LOTE-${yearMonth}-${monthlyCount.toString().padStart(3, '0')}`;

    // Calculate volume
    const totalVolume = selectedBottles.reduce((sum, b) => sum + b.volume, 0);

    // Expiration Date: 6 months from creation
    const expirationDate = new Date(date);
    expirationDate.setMonth(expirationDate.getMonth() + 6);

    const newBatch: Batch = {
      id: Math.random().toString(36).substr(2, 9),
      batchNumber,
      creationDate: date.toISOString().split('T')[0],
      expirationDate: expirationDate.toISOString().split('T')[0],
      type: data.type,
      status: 'IN_PROCESS',
      totalVolume,
      currentVolume: totalVolume, // Initially full
      bottleCount: selectedBottles.length,
      bottles: data.selectedBottleIds
    };

    // Update Bottles status
    const updatedBottles = bottles.map(b => {
      if (data.selectedBottleIds.includes(b.id)) {
        return { ...b, status: 'ASSIGNED', batchId: newBatch.id };
      }
      return b;
    });

    saveBatches([newBatch, ...batches]);
    saveBottles(updatedBottles as Bottle[]);

    return newBatch;
  },

  updateStatus: async (id: string, status: BatchStatus): Promise<Batch> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const batches = getStoredBatches();
    const index = batches.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Batch not found');

    const updatedBatch = { ...batches[index], status };
    batches[index] = updatedBatch;
    saveBatches(batches);
    return updatedBatch;
  },

  // NEW: Save Physical Inspection
  addPhysicalInspection: async (data: Omit<PhysicalInspectionRecord, 'id' | 'inspectionDate'>): Promise<Batch> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      const batches = getStoredBatches();
      const batchIndex = batches.findIndex(b => b.id === data.batchId);
      if (batchIndex === -1) throw new Error('Batch not found');

      const newRecord: PhysicalInspectionRecord = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          inspectionDate: new Date().toISOString()
      };

      const allPhysical = getStoredPhysicalQC();
      savePhysicalQC([...allPhysical, newRecord]);

      // Update Batch Status Logic
      // If Approved -> PENDING_QC (Ready for chemical)
      // If Rejected -> REJECTED
      let newStatus: BatchStatus = 'PENDING_QC'; 
      if (newRecord.verdict === 'REJECTED') {
          newStatus = 'REJECTED';
      }

      const updatedBatch = {
          ...batches[batchIndex],
          status: newStatus,
          physicalInspectionId: newRecord.id
      };
      
      batches[batchIndex] = updatedBatch;
      saveBatches(batches);

      return updatedBatch;
  },

  addQualityControl: async (qcData: Omit<QualityControlRecord, 'id' | 'verdict' | 'inspectionDate'>): Promise<Batch> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const batches = getStoredBatches();
    const batchIndex = batches.findIndex(b => b.id === qcData.batchId);
    if (batchIndex === -1) throw new Error('Batch not found');

    // Automatic Approval Logic
    let verdict: 'APPROVED' | 'REJECTED' = 'APPROVED';
    if (qcData.acidityDornic > 8 || qcData.coliformsPresence) {
      verdict = 'REJECTED';
    }

    const newQCRecord: QualityControlRecord = {
      ...qcData,
      id: Math.random().toString(36).substr(2, 9),
      inspectionDate: new Date().toISOString().split('T')[0],
      verdict
    };

    const allQC = getStoredQC();
    saveQC([...allQC, newQCRecord]);

    const updatedBatch = { 
      ...batches[batchIndex], 
      status: verdict as BatchStatus,
      qualityControlId: newQCRecord.id
    };
    batches[batchIndex] = updatedBatch;
    saveBatches(batches);

    return updatedBatch;
  },

  reduceVolume: async (batchId: string, amount: number): Promise<Batch> => {
    const batches = getStoredBatches();
    const index = batches.findIndex(b => b.id === batchId);
    if (index === -1) throw new Error('Batch not found');
    
    const batch = batches[index];
    if (batch.currentVolume < amount) {
        throw new Error('Insufficient volume in batch');
    }

    const updatedBatch = { ...batch, currentVolume: batch.currentVolume - amount };
    batches[index] = updatedBatch;
    saveBatches(batches);
    return updatedBatch;
  },

  discardVolume: async (data: Omit<DiscardRecord, 'id' | 'date'>): Promise<void> => {
     await batchService.reduceVolume(data.batchId, data.volumeDiscarded);
     console.log('Discard recorded:', data);
  }
};
