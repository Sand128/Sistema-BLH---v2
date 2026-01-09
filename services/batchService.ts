
import { Batch, Bottle, BatchStatus, QualityControlRecord, DiscardRecord, PhysicalInspectionRecord, MilkType, BatchType } from '../types';
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

export const batchService = {
  getAll: async (): Promise<Batch[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStoredBatches();
  },

  getById: async (id: string): Promise<Batch | undefined> => {
    return getStoredBatches().find(b => b.id === id);
  },

  getBottleById: async (id: string): Promise<Bottle | undefined> => {
    return getStoredBottles().find(b => b.id === id);
  },

  getAllBottles: async (): Promise<Bottle[]> => {
    return getStoredBottles();
  },

  getAvailableBottles: async (): Promise<Bottle[]> => {
    return getStoredBottles().filter(b => b.status === 'COLLECTED');
  },

  getBottlesByBatchId: async (batchId: string): Promise<Bottle[]> => {
    const allBottles = getStoredBottles();
    return allBottles.filter(b => b.batchId === batchId);
  },
  
  getBottlesByDonorId: async (donorId: string): Promise<Bottle[]> => {
    return getStoredBottles().filter(b => b.donorId === donorId);
  },

  getQCRecordByBottleId: async (bottleId: string): Promise<QualityControlRecord | undefined> => {
    return getStoredQC().find(qc => qc.bottleId === bottleId);
  },

  getPhysicalQCRecordByBottleId: async (bottleId: string): Promise<PhysicalInspectionRecord | undefined> => {
    return getStoredPhysicalQC().find(qc => qc.bottleId === bottleId);
  },

  // Added for compatibility with reportService (Batch level lookup)
  getQCRecord: async (batchId: string): Promise<QualityControlRecord | undefined> => {
    return getStoredQC().find(qc => qc.batchId === batchId);
  },

  // Added for compatibility with reportService (Batch level lookup)
  getPhysicalQCRecord: async (batchId: string): Promise<PhysicalInspectionRecord | undefined> => {
    return getStoredPhysicalQC().find(qc => qc.batchId === batchId);
  },

  createBottle: async (
      donorId: string, 
      donorName: string, 
      volume: number, 
      date: string,
      hospitalInitials: string,
      donationType: string,
      milkType: MilkType,
      details?: any
  ): Promise<Bottle> => {
    const bottles = getStoredBottles();
    const newBottle: Bottle = {
      id: Math.random().toString(36).substr(2, 9),
      traceabilityCode: `HE${Date.now().toString().slice(-6)}`,
      donorId, donorName, collectionDate: date, volume, hospitalInitials,
      status: 'COLLECTED', milkType, ...details
    };
    saveBottles([newBottle, ...bottles]);
    return newBottle;
  },

  create: async (data: { 
    type: BatchType, 
    selectedBottleIds: string[],
    justificationForExtraDonors?: string,
    authorizerName?: string
  }): Promise<Batch> => {
    const batches = getStoredBatches();
    const bottles = getStoredBottles();
    const selectedBottles = bottles.filter(b => data.selectedBottleIds.includes(b.id));
    
    const newBatch: Batch = {
      id: Math.random().toString(36).substr(2, 9),
      batchNumber: `LOTE-${Date.now().toString().slice(-6)}`,
      creationDate: new Date().toISOString().split('T')[0],
      expirationDate: '', 
      status: 'IN_PROCESS',
      totalVolume: selectedBottles.reduce((sum, b) => sum + b.volume, 0),
      currentVolume: selectedBottles.reduce((sum, b) => sum + b.volume, 0),
      bottleCount: selectedBottles.length, 
      bottles: data.selectedBottleIds,
      type: data.type,
      justificationForExtraDonors: data.justificationForExtraDonors,
      authorizerName: data.authorizerName
    };

    const updatedBottles = bottles.map(b => {
      if (data.selectedBottleIds.includes(b.id)) return { ...b, status: 'ASSIGNED', batchId: newBatch.id };
      return b;
    });

    saveBatches([newBatch, ...batches]);
    saveBottles(updatedBottles as Bottle[]);
    return newBatch;
  },

  updateStatus: async (id: string, status: BatchStatus): Promise<Batch> => {
    const batches = getStoredBatches();
    const index = batches.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Batch not found');
    const updated = { ...batches[index], status };
    batches[index] = updated;
    saveBatches(batches);
    return updated;
  },

  // ANÁLISIS POR FRASCO
  addBottlePhysicalInspection: async (data: Omit<PhysicalInspectionRecord, 'id' | 'inspectionDate'>): Promise<Bottle> => {
      const bottles = getStoredBottles();
      const bottleIndex = bottles.findIndex(b => b.id === data.bottleId);
      if (bottleIndex === -1) throw new Error('Bottle not found');

      const newRecord: PhysicalInspectionRecord = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          inspectionDate: new Date().toISOString()
      };

      const allPhysical = getStoredPhysicalQC();
      savePhysicalQC([...allPhysical, newRecord]);

      const updatedBottle: Bottle = {
          ...bottles[bottleIndex],
          physicalInspectionId: newRecord.id,
          status: newRecord.verdict === 'REJECTED' ? 'REJECTED' : bottles[bottleIndex].status
      };
      
      bottles[bottleIndex] = updatedBottle;
      saveBottles(bottles);
      await batchService.recalculateBatchStatus(data.batchId);
      return updatedBottle;
  },

  addBottleQualityControl: async (qcData: Omit<QualityControlRecord, 'id' | 'verdict' | 'inspectionDate'>): Promise<Bottle> => {
    const bottles = getStoredBottles();
    const bottleIndex = bottles.findIndex(b => b.id === qcData.bottleId);
    if (bottleIndex === -1) throw new Error('Bottle not found');

    let verdict: 'APPROVED' | 'REJECTED' = (qcData.acidityDornic > 8 || qcData.coliformsPresence) ? 'REJECTED' : 'APPROVED';

    const newQCRecord: QualityControlRecord = {
      ...qcData,
      id: Math.random().toString(36).substr(2, 9),
      inspectionDate: new Date().toISOString().split('T')[0],
      verdict
    };

    const allQC = getStoredQC();
    saveQC([...allQC, newQCRecord]);

    const updatedBottle: Bottle = { 
      ...bottles[bottleIndex], 
      qualityControlId: newQCRecord.id,
      status: verdict
    };
    
    bottles[bottleIndex] = updatedBottle;
    saveBottles(bottles);
    await batchService.recalculateBatchStatus(qcData.batchId);
    return updatedBottle;
  },

  recalculateBatchStatus: async (batchId: string): Promise<void> => {
      const batches = getStoredBatches();
      const batchIndex = batches.findIndex(b => b.id === batchId);
      if (batchIndex === -1) return;

      const batchBottles = getStoredBottles().filter(b => b.batchId === batchId);
      
      const anyRejected = batchBottles.some(b => b.status === 'REJECTED');
      const allAnalyzed = batchBottles.every(b => b.physicalInspectionId && b.qualityControlId);
      const allApproved = batchBottles.every(b => b.status === 'APPROVED');

      let newStatus: BatchStatus = batches[batchIndex].status;

      if (anyRejected) {
          // Si hay algún frasco no apto, el lote se bloquea (se puede marcar como rejected o dejar en pending)
          // Según el requerimiento: bloquear avance.
          newStatus = 'REJECTED'; 
      } else if (allAnalyzed && allApproved) {
          newStatus = 'APPROVED';
      } else if (batchBottles.some(b => b.physicalInspectionId)) {
          newStatus = 'PENDING_QC';
      }

      batches[batchIndex].status = newStatus;
      saveBatches(batches);
  },

  reduceVolume: async (batchId: string, amount: number): Promise<Batch> => {
    const batches = getStoredBatches();
    const index = batches.findIndex(b => b.id === batchId);
    const batch = batches[index];
    if (batch.currentVolume < amount) throw new Error('Insufficient volume');
    const updated = { ...batch, currentVolume: batch.currentVolume - amount };
    batches[index] = updated;
    saveBatches(batches);
    return updated;
  },

  discardVolume: async (data: Omit<DiscardRecord, 'id' | 'date'>): Promise<void> => {
     await batchService.reduceVolume(data.batchId, data.volumeDiscarded);
  }
};
