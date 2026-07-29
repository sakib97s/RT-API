import { createHash } from 'crypto';

/**
 * SHA-256 hash a value after trimming and lowercasing.
 * Returns undefined if value is empty / falsy.
 */
function sha256(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const cleaned = String(value).trim().toLowerCase();
  if (!cleaned) return undefined;
  return createHash('sha256').update(cleaned).digest('hex');
}

/**
 * Normalize a Bangladesh phone number to E.164 without the '+'.
 * Examples: '01712345678' → '8801712345678'
 */
function normalizeBdPhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  let p = String(phone).replace(/[\s\-()]+/g, '').trim();
  if (!p) return undefined;

  if (p.startsWith('+880')) {
    p = p.slice(1); // remove leading +
  } else if (p.startsWith('880')) {
    // already in correct format
  } else if (p.startsWith('0')) {
    p = '880' + p.slice(1);
  }

  return p;
}

/**
 * Normalize text: trim + lowercase. Returns undefined if empty.
 */
function normText(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const t = String(value).trim().toLowerCase();
  return t || undefined;
}

export interface MetaUserDataInput {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  region?: string;
  postcode?: string;
  country?: string;
  externalId?: string;
  fbc?: string;
  fbp?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  gender?: string;
  dateOfBirth?: string;
}

/**
 * Build a Meta Conversions API `user_data` object.
 *
 * - PII fields (em, ph, fn, ln, ct, st, zp, country, ge, db) are SHA-256 hashed.
 * - fbc, fbp, client_ip_address, client_user_agent, external_id are sent raw (unhashed).
 * - Missing/empty fields are omitted entirely (no fabrication).
 */
export function buildMetaUserData(input: MetaUserDataInput): Record<string, any> {
  const result: Record<string, any> = {};

  // Hashed PII fields
  const em = sha256(input.email);
  if (em) result.em = em;

  const normalizedPhone = normalizeBdPhone(input.phone);
  const ph = sha256(normalizedPhone);
  if (ph) result.ph = ph;

  const fn = sha256(normText(input.firstName));
  if (fn) result.fn = fn;

  const ln = sha256(normText(input.lastName));
  if (ln) result.ln = ln;

  const ct = sha256(normText(input.city));
  if (ct) result.ct = ct;

  const st = sha256(normText(input.region));
  if (st) result.st = st;

  const zp = sha256(normText(input.postcode));
  if (zp) result.zp = zp;

  const country = sha256(normText(input.country));
  if (country) result.country = country;

  const ge = sha256(normText(input.gender));
  if (ge) result.ge = ge;

  const db = sha256(normText(input.dateOfBirth));
  if (db) result.db = db;

  // Raw (unhashed) fields
  if (input.externalId) result.external_id = input.externalId;
  if (input.fbc) result.fbc = input.fbc;
  if (input.fbp) result.fbp = input.fbp;
  if (input.clientIpAddress) result.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) result.client_user_agent = input.clientUserAgent;

  return result;
}
