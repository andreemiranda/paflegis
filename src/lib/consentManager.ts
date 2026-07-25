/**
 * Gerenciador de consentimento LGPD - Paflegis
 * Registra histórico, versões, hash de integridade e solicitações de direitos.
 */

const CONSENT_KEY        = 'paflegis_cookie_preferences';
const CONSENT_HISTORY_KEY = 'paflegis_consent_history';
const RIGHTS_REQUESTS_KEY = 'paflegis_rights_requests';

export const POLICY_VERSIONS = {
  privacy : '1.0 - Jul/2026',
  terms   : '1.0 - Jul/2026',
  cookies : '1.0 - Jul/2026',
};

export interface ConsentPreferences {
  essencial    : boolean; // sempre true
  analitico    : boolean;
  desempenho   : boolean;
  funcional    : boolean;
  preferencias : boolean;
  marketing    : boolean; // AdSense
  consentimento_definido: boolean;
}

export interface ConsentRecord {
  id             : string;
  timestamp      : string;
  action         : 'Aceitou Todos' | 'Recusou' | 'Personalizou' | 'Revogou';
  preferences    : Omit<ConsentPreferences, 'consentimento_definido'>;
  browser        : string;
  device         : string;
  policyVersion  : string;
  termsVersion   : string;
  cookiesVersion : string;
  hash           : string;
}

export interface RightsRequest {
  protocol  : string;
  timestamp : string;
  type      : string;
  name      : string;
  email     : string;
  message   : string;
  status    : string;
}

// ── helpers ────────────────────────────────────────────────────────────────

function simpleHash(data: string): string {
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = Math.imul(31, h) + data.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0');
}

function browserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg'))     return 'Edge';
  if (ua.includes('Chrome'))  return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari'))  return 'Safari';
  return 'Outro';
}

function deviceType(): string {
  if (/Mobi|Android/i.test(navigator.userAgent)) return 'Mobile';
  if (/iPad|Tablet/i.test(navigator.userAgent))  return 'Tablet';
  return 'Desktop';
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── preferences ───────────────────────────────────────────────────────────

export function getStoredPreferences(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function savePreferences(
  prefs : Omit<ConsentPreferences, 'consentimento_definido'>,
  action: ConsentRecord['action'],
): ConsentPreferences {
  const full: ConsentPreferences = { ...prefs, consentimento_definido: true };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(full));

  const ts = new Date().toISOString();
  const record: ConsentRecord = {
    id             : genId(),
    timestamp      : ts,
    action,
    preferences    : prefs,
    browser        : browserName(),
    device         : deviceType(),
    policyVersion  : POLICY_VERSIONS.privacy,
    termsVersion   : POLICY_VERSIONS.terms,
    cookiesVersion : POLICY_VERSIONS.cookies,
    hash           : simpleHash(JSON.stringify(prefs) + ts),
  };

  const history = getConsentHistory();
  history.unshift(record);
  localStorage.setItem(CONSENT_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  return full;
}

// ── history ───────────────────────────────────────────────────────────────

export function getConsentHistory(): ConsentRecord[] {
  try {
    const raw = localStorage.getItem(CONSENT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ── clear / export ────────────────────────────────────────────────────────

export function clearPreferences(): void {
  localStorage.removeItem(CONSENT_KEY);
  localStorage.removeItem(CONSENT_HISTORY_KEY);
  localStorage.removeItem(RIGHTS_REQUESTS_KEY);
}

export function exportPreferences(): string {
  return JSON.stringify({
    preferences : getStoredPreferences(),
    history     : getConsentHistory(),
    requests    : getRightsRequests(),
    exportedAt  : new Date().toISOString(),
  }, null, 2);
}

// ── rights requests ───────────────────────────────────────────────────────

export function saveRightsRequest(
  req: Pick<RightsRequest, 'type' | 'name' | 'email' | 'message'>,
): string {
  const protocol = 'LGPD-' + Date.now().toString(36).toUpperCase();
  const full: RightsRequest = { ...req, protocol, timestamp: new Date().toISOString(), status: 'Pendente' };
  const all = getRightsRequests();
  all.unshift(full);
  localStorage.setItem(RIGHTS_REQUESTS_KEY, JSON.stringify(all.slice(0, 30)));
  return protocol;
}

export function getRightsRequests(): RightsRequest[] {
  try {
    const raw = localStorage.getItem(RIGHTS_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
