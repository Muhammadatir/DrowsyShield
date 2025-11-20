import type { EmergencyContact } from "@/types/emergency";

const EMERGENCY_CONTACTS_KEY = 'drowsyguard_emergency_contacts';

export const saveEmergencyContacts = (contacts: EmergencyContact[]): void => {
  try {
    localStorage.setItem(EMERGENCY_CONTACTS_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error('Error saving emergency contacts:', error);
  }
};

export const loadEmergencyContacts = (): EmergencyContact[] => {
  try {
    const data = localStorage.getItem(EMERGENCY_CONTACTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading emergency contacts:', error);
    return [];
  }
};

export const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>): EmergencyContact => {
  const contacts = loadEmergencyContacts();
  const newContact: EmergencyContact = {
    ...contact,
    id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  contacts.push(newContact);
  saveEmergencyContacts(contacts);
  return newContact;
};

export const removeEmergencyContact = (id: string): void => {
  const contacts = loadEmergencyContacts();
  const filtered = contacts.filter(c => c.id !== id);
  saveEmergencyContacts(filtered);
};

export const updateEmergencyContact = (id: string, updates: Partial<EmergencyContact>): void => {
  const contacts = loadEmergencyContacts();
  const index = contacts.findIndex(c => c.id === id);
  if (index !== -1) {
    contacts[index] = { ...contacts[index], ...updates };
    saveEmergencyContacts(contacts);
  }
};
