export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Get access token from localStorage where Supabase stores it.
 * Avoids calling getSession() which can hang.
 */
export async function getAccessToken(): Promise<string> {
  try {
    // Extract project ref from Supabase URL (e.g., zmjxyspizdqhrtdcgkwk from https://zmjxyspizdqhrtdcgkwk.supabase.co)
    const urlMatch = SUPABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (!urlMatch) {
      return SUPABASE_ANON_KEY;
    }
    
    const projectRef = urlMatch[1];
    const storageKey = `sb-${projectRef}-auth-token`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        // The stored session object has an access_token property
        if (parsed?.access_token) {
          return parsed.access_token;
        }
      } catch (e) {
        // If parsing fails, fall back to anon key
      }
    }
  } catch (err) {
    // If anything fails, fall back to anon key
  }
  
  return SUPABASE_ANON_KEY;
}

export async function supabaseGet<T = any>(
  table: string, 
  query: string = ''
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const token = await getAccessToken();
    const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { data: null, error: new Error(`${response.status}: ${errorText}`) };
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function supabaseUpdate(
  table: string,
  filter: string,
  updates: object
): Promise<{ error: Error | null }> {
  try {
    const token = await getAccessToken();
    const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { error: new Error(`${response.status}: ${errorText}`) };
    }
    
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

export async function supabaseInsert<T = any>(
  table: string,
  data: object
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const token = await getAccessToken();
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { data: null, error: new Error(`${response.status}: ${errorText}`) };
    }
    
    const result = await response.json();
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}
