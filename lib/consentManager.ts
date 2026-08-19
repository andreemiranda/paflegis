const CONSENT_KEY = 'paflegis_cookie_preferences';
const CONSENT_HISTORY_KEY = 'paflegis_consent_history';
const RIGHTS_REQUESTS_KEY = 'paflegis_rights_requests';

export const POLICY_VERSIONS = {
  privacy: '1.0 - Jul/2026',
  terms: '1.0 - Jul/2026',
  cookies: '1.0 - Jul/2026',
};

export interface ConsentPreferences {
  essencial: boolean;
  analitico: boolean;
  desempenho: boolean;
  funcional: boolean;
  preferencias: boolean;
  marketing: boolean;
  consentimento_definido: boolean;
}

export interface ConsentRecord {
  id: string;
  timestamp: string;
  action: 'Aceitou Todos' | 'Recusou' | 'Personalizou' | 'Revogou';
  preferences: Omit<ConsentPreferences, 'consentimento_definido'>;
  browser: string;
  device: string;
  policyVersion: string;
  termsVersion: string;
  cookiesVersion: string;
  hash: string;
}

export interface RightsRequest {
  protocol: string;
  timestamp: string;
  type: string;
  name: string;
  email: string;
  message: string;
  status: string;
}

function simpleHash(data: string): string {
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = (Math.imul(31, h) + data.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0');
}

function browserName(): string {
  if (typeof navigator === 'undefined') return 'Servidor';
  const ua = navigator.userAgent;
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  return 'Outro';
}

function deviceType(): string {
  if (typeof navigator === 'undefined') return 'Desktop';
  if (/Mobi|Android/i.test(navigator.userAgent)) return 'Mobile';
  if (/iPad|Tablet/i.test(navigator.userAgent)) return 'Tablet';
  return 'Desktop';
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getStoredPreferences(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePreferences(
  prefs: Omit<ConsentPreferences, 'consentimento_definido'>,
  action: ConsentRecord['action']
): ConsentPreferences {
  const full: ConsentPreferences = { ...prefs, consentimento_definido: true };
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(full));

    const ts = new Date().toISOString();
    const record: ConsentRecord = {
      id: genId(),
      timestamp: ts,
      action,
      preferences: prefs,
      browser: browserName(),
      device: deviceType(),
      policyVersion: POLICY_VERSIONS.privacy,
      termsVersion: POLICY_VERSIONS.terms,
      cookiesVersion: POLICY_VERSIONS.cookies,
      hash: simpleHash(JSON.stringify(prefs) + ts),
    };

    const history = getConsentHistory();
    history.unshift(record);
    localStorage.setItem(CONSENT_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  }
  return full;
}

export function getConsentHistory(): ConsentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONSENT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearPreferences(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(CONSENT_HISTORY_KEY);
    localStorage.removeItem(RIGHTS_REQUESTS_KEY);
  }
}

export function exportPreferences(): string {
  return JSON.stringify(
    {
      preferences: getStoredPreferences(),
      history: getConsentHistory(),
      requests: getRightsRequests(),
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

export function saveRightsRequest(
  req: Pick<RightsRequest, 'type' | 'name' | 'email' | 'message'>
): string {
  const protocol = 'LGPD-' + Date.now().toString(36).toUpperCase();
  const full: RightsRequest = { ...req, protocol, timestamp: new Date().toISOString(), status: 'Pendente' };
  if (typeof window !== 'undefined') {
    const all = getRightsRequests();
    all.unshift(full);
    localStorage.setItem(RIGHTS_REQUESTS_KEY, JSON.stringify(all.slice(0, 30)));
  }
  return protocol;
}

export function getRightsRequests(): RightsRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RIGHTS_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
