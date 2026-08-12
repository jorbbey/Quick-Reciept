import { Customer } from '../types';
import { generateId } from './utils';

const STORAGE_KEY = 'qr_customers';

export function getSavedCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: Customer[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCustomer(name: string, phone?: string, email?: string): Customer[] {
  if (!name || !name.trim()) return getSavedCustomers();
  const trimmedName = name.trim();
  const existing = getSavedCustomers();

  const idx = existing.findIndex(
    c => c.name.toLowerCase() === trimmedName.toLowerCase()
  );

  const updatedItem: Customer = {
    id: idx >= 0 ? existing[idx].id : generateId(),
    name: trimmedName,
    phone: phone || (idx >= 0 ? existing[idx].phone : ''),
    email: email || (idx >= 0 ? existing[idx].email : ''),
    lastUsedAt: new Date().toISOString()
  };

  let newList: Customer[];
  if (idx >= 0) {
    newList = [...existing];
    newList[idx] = updatedItem;
  } else {
    newList = [updatedItem, ...existing];
  }

  // Sort by lastUsedAt desc
  newList.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
  
  // Keep max 50 customers
  if (newList.length > 50) {
    newList = newList.slice(0, 50);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  } catch (e) {
    console.error('Failed to save customer memory', e);
  }

  return newList;
}

export function getRecentCustomers(limit = 6): Customer[] {
  return getSavedCustomers().slice(0, limit);
}

export function searchCustomers(query: string): Customer[] {
  if (!query || !query.trim()) return getRecentCustomers();
  const q = query.toLowerCase().trim();
  return getSavedCustomers().filter(
    c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
  );
}
