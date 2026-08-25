import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hectvnfwjxkexfoxcohj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_x93iBnOVSYwU16cLlGcgag_J7Yg4H0w';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL.startsWith('http')
);

// Fail gracefully if env vars are missing or invalid
export const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Safely get the active user session without throwing unhandled network errors
 */
export const getSafeSession = async () => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data?.session || null;
  } catch {
    return null;
  }
};

/**
 * Authentication
 */
export const signUpWithPassword = async (email: string, password: string) => {
  if (!supabase) return { data: null, error: { message: 'Cloud service is not configured' } };
  try {
    const res = await supabase.auth.signUp({
      email,
      password
    });
    if (res.error) {
      return { data: null, error: { message: res.error.message } };
    }
    return res;
  } catch (err: any) {
    return { data: null, error: { message: err?.message || 'Network error during sign up. Please try again.' } };
  }
};

export const signInWithPassword = async (email: string, password: string) => {
  if (!supabase) return { data: null, error: { message: 'Cloud service is not configured' } };
  try {
    const res = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (res.error) {
      return { data: null, error: { message: res.error.message } };
    }
    return res;
  } catch (err: any) {
    return { data: null, error: { message: err?.message || 'Network error during sign in. Please try again.' } };
  }
};

export const resetPassword = async (email: string) => {
  if (!supabase) return { data: null, error: { message: 'Cloud service is not configured' } };
  try {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    });
  } catch (err: any) {
    return { data: null, error: { message: err?.message || 'Failed to send password reset email.' } };
  }
};

export const updatePassword = async (password: string) => {
  if (!supabase) return { data: null, error: { message: 'Cloud service is not configured' } };
  try {
    return await supabase.auth.updateUser({ password });
  } catch (err: any) {
    return { data: null, error: { message: err?.message || 'Failed to update password.' } };
  }
};

export const signInWithEmail = async (email: string) => {
  if (!supabase) return { error: { message: 'Cloud service is not configured' } };
  try {
    return await supabase.auth.signInWithOtp({ email });
  } catch (err: any) {
    return { error: { message: err?.message || 'Failed to send code.' } };
  }
};

export const verifyOTP = async (email: string, token: string) => {
  if (!supabase) return { error: { message: 'Cloud service is not configured' } };
  
  try {
    // Try 'email' first (standard for OTP)
    const response = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    
    // If it fails with "Token has expired or is invalid", it might be because 
    // the user is new and 'signup' type is required instead.
    if (response.error && (response.error.message.includes('expired') || response.error.message.includes('invalid'))) {
      const signupResponse = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
      if (!signupResponse.error) return signupResponse;
    }
    
    return response;
  } catch (err: any) {
    return { error: { message: err?.message || 'Verification failed.' } };
  }
};

export const signOut = async () => {
  if (!supabase) return;
  try {
    return await supabase.auth.signOut();
  } catch {
    // Silently ignore network failures on sign out
  }
};

/**
 * Gets or generates an anonymous device ID
 */
const getDeviceId = () => {
  try {
    let deviceId = localStorage.getItem('qr_device_id');
    if (!deviceId) {
      deviceId = typeof crypto.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : `anon_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('qr_device_id', deviceId);
    }
    return deviceId;
  } catch {
    return 'fallback_device';
  }
};

export const initAnalytics = () => {
  trackEvent('app_opened');
};

/**
 * Tracks an event to Supabase events table
 * Supports both anonymous (device_id only) and authenticated (device_id + user_id)
 * Safe and non-blocking — never throws unhandled errors if offline or network fails
 */
export const trackEvent = async (eventName: string, metadata: Record<string, any> = {}) => {
  if (!supabase) return;

  try {
    const deviceId = getDeviceId();
    const session = await getSafeSession();
    const userId = session?.user?.id || null;

    // Construct the event payload according to required schema
    const payload = {
      device_id: deviceId,
      user_id: userId,
      event_name: eventName,
      metadata: metadata || {}
    };

    // Insert into Supabase - fire and forget to avoid blocking UI with safe error suppression
    await supabase
      .from('events')
      .insert(payload);

  } catch {
    // Silently swallow analytics error to never disrupt user flow
  }
};


/**
 * Profile Management
 */
export const syncProfile = async (email: string, businessData?: string | any) => {
  if (!supabase) return;
  try {
    const session = await getSafeSession();
    if (!session?.user) return;

    const name = typeof businessData === 'string' ? businessData : businessData?.name;
    const payload: any = {
      id: session.user.id,
      email: email,
      business_name: name || null,
      updated_at: new Date().toISOString()
    };

    if (typeof businessData === 'object' && businessData !== null) {
      payload.business_info = businessData;
    }

    const { error } = await supabase.from('profiles').upsert(payload);
    if (error && (error.message?.includes('business_info') || error.code === 'PGRST204')) {
      delete payload.business_info;
      await supabase.from('profiles').upsert(payload);
    }
  } catch {
    // Quietly ignore sync issues
  }
};

export const fetchProfile = async () => {
  if (!supabase) return null;
  try {
    const session = await getSafeSession();
    if (!session?.user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();

    if (error) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

/**
 * Receipt Storage
 */
export const saveReceiptToCloud = async (receipt: any, business: any) => {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  
  try {
    const session = await getSafeSession();
    if (!session?.user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase.from('receipts').upsert({
      id: receipt.id,
      user_id: session.user.id,
      customer_name: receipt.customerName || 'Walk-in Customer',
      business_name: business?.name,
      receipt_number: receipt.id.slice(0, 8).toUpperCase(),
      items: receipt.items,
      total_amount: receipt.total,
      template_name: business?.template || 'classic',
      signature_url: business?.signature,
      theme_color: business?.themeColor,
      created_at: receipt.createdAt || new Date().toISOString()
    }).select();

    if (error) {
      return { error };
    }
    return { data, error: null };
  } catch (err: any) {
    return { error: { message: err?.message || 'Network error saving receipt' } };
  }
};

export const fetchReceiptsFromCloud = async () => {
  if (!supabase) return [];
  
  try {
    const session = await getSafeSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    // Map database columns back to application object structure
    return data.map(item => ({
      id: item.id,
      customerName: item.customer_name,
      businessName: item.business_name,
      items: item.items,
      total: parseFloat(item.total_amount),
      template: item.template_name,
      signature: item.signature_url,
      themeColor: item.theme_color,
      createdAt: item.created_at,
      _synced: true
    }));
  } catch {
    return [];
  }
};

export const deleteReceiptFromCloud = async (id: string) => {
  if (!supabase) return;
  try {
    return await supabase.from('receipts').delete().match({ id });
  } catch {
    // Ignore deletion network errors
  }
};

/**
 * Invoice Storage
 */
export const saveInvoiceToCloud = async (invoice: any, business: any) => {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  
  try {
    const session = await getSafeSession();
    if (!session?.user) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase.from('invoices').upsert({
      id: invoice.id,
      user_id: session.user.id,
      customer_name: invoice.customerName,
      customer_contact: invoice.customerContact,
      business_name: business?.name,
      invoice_number: invoice.invoiceNumber,
      items: invoice.items,
      subtotal: invoice.subtotal,
      total_amount: invoice.total,
      due_date: invoice.dueDate,
      notes: invoice.notes,
      template_name: business?.template || invoice.template || 'classic',
      signature_url: business?.signature,
      theme_color: business?.themeColor,
      status: invoice.status || 'pending',
      created_at: invoice.createdAt || new Date().toISOString()
    }).select();

    if (error) {
      return { error };
    }
    return { data, error: null };
  } catch (err: any) {
    return { error: { message: err?.message || 'Network error saving invoice' } };
  }
};

export const fetchInvoicesFromCloud = async () => {
  if (!supabase) return [];
  
  try {
    const session = await getSafeSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(item => ({
      id: item.id,
      customerName: item.customer_name,
      customerContact: item.customer_contact,
      businessName: item.business_name,
      invoiceNumber: item.invoice_number,
      items: item.items,
      subtotal: parseFloat(item.subtotal),
      total: parseFloat(item.total_amount),
      dueDate: item.due_date,
      notes: item.notes,
      template: item.template_name,
      signature: item.signature_url,
      themeColor: item.theme_color,
      status: item.status,
      createdAt: item.created_at,
      _synced: true
    }));
  } catch {
    return [];
  }
};

export const deleteInvoiceFromCloud = async (id: string) => {
  if (!supabase) return;
  try {
    return await supabase.from('invoices').delete().match({ id });
  } catch {
    // Ignore deletion network errors
  }
};

/**
 * Fetches all events from Supabase for dashboarding
 */
export const fetchEvents = async () => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  } catch {
    return [];
  }
};
