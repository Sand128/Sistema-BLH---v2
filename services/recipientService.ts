
import { Recipient, AdministrationRecord } from '../types';
import { MOCK_RECIPIENTS, MOCK_ADMINISTRATIONS } from './mockData';
import { batchService } from './batchService';

const RECIPIENT_KEY = 'blh_recipients';
const ADMIN_KEY = 'blh_administrations';

// Initialize mock data
if (!localStorage.getItem(RECIPIENT_KEY)) {
  localStorage.setItem(RECIPIENT_KEY, JSON.stringify(MOCK_RECIPIENTS));
}
if (!localStorage.getItem(ADMIN_KEY)) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(MOCK_ADMINISTRATIONS));
}

const getStoredRecipients = (): Recipient[] => {
  const data = localStorage.getItem(RECIPIENT_KEY);
  return data ? JSON.parse(data) : [];
};

const getStoredAdministrations = (): AdministrationRecord[] => {
  const data = localStorage.getItem(ADMIN_KEY);
  return data ? JSON.parse(data) : [];
};

const saveRecipients = (data: Recipient[]) => {
  localStorage.setItem(RECIPIENT_KEY, JSON.stringify(data));
};

const saveAdministrations = (data: AdministrationRecord[]) => {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(data));
};

export const recipientService = {
  getAll: async (): Promise<Recipient[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return getStoredRecipients();
  },

  getById: async (id: string): Promise<Recipient | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getStoredRecipients().find(r => r.id === id);
  },

  create: async (data: Omit<Recipient, 'id' | 'registrationDate'>): Promise<Recipient> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const recipients = getStoredRecipients();
    const newRecipient: Recipient = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      registrationDate: new Date().toISOString().split('T')[0]
    };
    saveRecipients([...recipients, newRecipient]);
    return newRecipient;
  },

  update: async (id: string, updates: Partial<Recipient>): Promise<Recipient> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const recipients = getStoredRecipients();
    const index = recipients.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Recipient not found');

    const updated = { ...recipients[index], ...updates };
    recipients[index] = updated;
    saveRecipients(recipients);
    return updated;
  },

  getHistory: async (recipientId: string): Promise<AdministrationRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return getStoredAdministrations().filter(a => a.recipientId === recipientId);
  },

  getByBatchId: async (batchId: string): Promise<AdministrationRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return getStoredAdministrations().filter(a => a.batchId === batchId);
  },

  administerMilk: async (
    recipientId: string, 
    batchId: string, 
    volume: number, 
    user: string, 
    notes?: string
  ): Promise<AdministrationRecord> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 1. Reduce volume from batch
    const updatedBatch = await batchService.reduceVolume(batchId, volume);
    const recipient = getStoredRecipients().find(r => r.id === recipientId);

    if (!recipient) throw new Error('Recipient not found');

    // 2. Create Record
    const record: AdministrationRecord = {
      id: Math.random().toString(36).substr(2, 9),
      recipientId,
      recipientName: recipient.fullName,
      batchId,
      batchNumber: updatedBatch.batchNumber,
      volumeAdministered: volume,
      date: new Date().toISOString(),
      administeredBy: user,
      notes
    };

    const admins = getStoredAdministrations();
    saveAdministrations([record, ...admins]); // Newest first

    return record;
  }
};
