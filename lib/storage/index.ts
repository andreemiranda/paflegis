/**
 * lib/storage/index.ts — Camada de persistência unificada com drivers trocáveis (sqlite, file, memory).
 * Suporta armazenamento de registros espelhados da API, status de sincronização,
 * contadores atômicos (protocolo de contato) e rate limiting distribuído.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getConfig } from '@/lib/config';
import { slog } from '@/lib/sapl/backend';

export interface StorageRecord {
  modulo: string;
  recurso: string;
  record_id: string;
  data: any;
  hash: string;
  updated_at: number;
}

export interface SyncStatusInfo {
  lastSyncAt: number | null;
  lastSyncType: 'full' | 'incremental' | null;
  saplBaseHash: string;
  totalRecords: number;
  resourceCounts: Record<string, number>;
  upstreamCounts: Record<string, number>;
  lastErrors: { resource: string; error: string; timestamp: number }[];
  inProgress: boolean;
}

export interface IStorageDriver {
  init(): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string, ttlSeconds?: number): Promise<number>;

  saveRecord(modulo: string, recurso: string, id: string | number, data: any, hash?: string): Promise<void>;
  saveRecordsBatch(records: { modulo: string; recurso: string; id: string | number; data: any; hash?: string }[]): Promise<void>;
  getRecord<T>(modulo: string, recurso: string, id: string | number): Promise<T | null>;
  listRecords<T>(modulo: string, recurso: string, options?: { page?: number; limit?: number; search?: string; ordering?: string }): Promise<{ items: T[]; total: number }>;
  countRecords(modulo?: string, recurso?: string): Promise<number>;

  getSyncStatus(): Promise<SyncStatusInfo>;
  updateSyncStatus(partial: Partial<SyncStatusInfo>): Promise<void>;
  clearMirror(newHash?: string): Promise<void>;
}

// -------------------------------------------------------------
// Driver 1: JSON Filesystem (Portátil, sem dependências nativas)
// -------------------------------------------------------------
export class FileStorageDriver implements IStorageDriver {
  private baseDir: string;
  private kvDir: string;
  private recordsDir: string;

  constructor() {
    const config = getConfig();
    const subPath = config.storagePath || '.data';
    let dir = path.join(process.cwd(), subPath, 'file_store');
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch {
      dir = '/tmp/paflegis_data/file_store';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    this.baseDir = dir;
    this.kvDir = path.join(this.baseDir, 'kv');
    this.recordsDir = path.join(this.baseDir, 'records');
  }

  async init(): Promise<void> {
    if (!fs.existsSync(this.kvDir)) fs.mkdirSync(this.kvDir, { recursive: true });
    if (!fs.existsSync(this.recordsDir)) fs.mkdirSync(this.recordsDir, { recursive: true });
  }

  private safeKey(k: string): string {
    return k.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    const fp = path.join(this.kvDir, `${this.safeKey(key)}.json`);
    if (!fs.existsSync(fp)) return null;
    try {
      const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
      if (raw.expires_at && raw.expires_at < Date.now()) {
        fs.unlinkSync(fp);
        return null;
      }
      return raw.value as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.init();
    const fp = path.join(this.kvDir, `${this.safeKey(key)}.json`);
    const expires_at = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    fs.writeFileSync(fp, JSON.stringify({ value, expires_at }), 'utf8');
  }

  async del(key: string): Promise<void> {
    await this.init();
    const fp = path.join(this.kvDir, `${this.safeKey(key)}.json`);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const cur = (await this.get<number>(key)) || 0;
    const next = cur + 1;
    await this.set(key, next, ttlSeconds);
    return next;
  }

  async saveRecord(modulo: string, recurso: string, id: string | number, data: any, hash?: string): Promise<void> {
    await this.init();
    const subDir = path.join(this.recordsDir, this.safeKey(modulo), this.safeKey(recurso));
    if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

    const contentStr = JSON.stringify(data);
    const contentHash = hash || crypto.createHash('sha256').update(contentStr).digest('hex').slice(0, 16);
    const rec: StorageRecord = {
      modulo,
      recurso,
      record_id: String(id),
      data,
      hash: contentHash,
      updated_at: Date.now(),
    };

    const fp = path.join(subDir, `${this.safeKey(String(id))}.json`);
    fs.writeFileSync(fp, JSON.stringify(rec), 'utf8');
  }

  async saveRecordsBatch(records: { modulo: string; recurso: string; id: string | number; data: any; hash?: string }[]): Promise<void> {
    for (const r of records) {
      await this.saveRecord(r.modulo, r.recurso, r.id, r.data, r.hash);
    }
  }

  async getRecord<T>(modulo: string, recurso: string, id: string | number): Promise<T | null> {
    await this.init();
    const fp = path.join(this.recordsDir, this.safeKey(modulo), this.safeKey(recurso), `${this.safeKey(String(id))}.json`);
    if (!fs.existsSync(fp)) return null;
    try {
      const rec = JSON.parse(fs.readFileSync(fp, 'utf8')) as StorageRecord;
      return rec.data as T;
    } catch {
      return null;
    }
  }

  async listRecords<T>(modulo: string, recurso: string, options?: { page?: number; limit?: number; search?: string; ordering?: string }): Promise<{ items: T[]; total: number }> {
    await this.init();
    const subDir = path.join(this.recordsDir, this.safeKey(modulo), this.safeKey(recurso));
    if (!fs.existsSync(subDir)) return { items: [], total: 0 };

    const files = fs.readdirSync(subDir).filter((f) => f.endsWith('.json'));
    let records: StorageRecord[] = [];

    for (const f of files) {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(subDir, f), 'utf8')) as StorageRecord;
        if (options?.search) {
          const s = JSON.stringify(raw.data).toLowerCase();
          if (!s.includes(options.search.toLowerCase())) continue;
        }
        records.push(raw);
      } catch {}
    }

    records.sort((a, b) => b.updated_at - a.updated_at);
    const total = records.length;
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const paginated = records.slice((page - 1) * limit, page * limit);

    return { items: paginated.map((r) => r.data as T), total };
  }

  async countRecords(modulo?: string, recurso?: string): Promise<number> {
    await this.init();
    if (modulo && recurso) {
      const subDir = path.join(this.recordsDir, this.safeKey(modulo), this.safeKey(recurso));
      if (!fs.existsSync(subDir)) return 0;
      return fs.readdirSync(subDir).filter((f) => f.endsWith('.json')).length;
    }
    let total = 0;
    if (fs.existsSync(this.recordsDir)) {
      const modulos = fs.readdirSync(this.recordsDir);
      for (const m of modulos) {
        const mDir = path.join(this.recordsDir, m);
        if (fs.statSync(mDir).isDirectory()) {
          const recursos = fs.readdirSync(mDir);
          for (const r of recursos) {
            const rDir = path.join(mDir, r);
            if (fs.statSync(rDir).isDirectory()) {
              total += fs.readdirSync(rDir).filter((f) => f.endsWith('.json')).length;
            }
          }
        }
      }
    }
    return total;
  }

  async getSyncStatus(): Promise<SyncStatusInfo> {
    const raw = await this.get<SyncStatusInfo>('__sync_status__');
    return (
      raw || {
        lastSyncAt: null,
        lastSyncType: null,
        saplBaseHash: getConfig().saplApiBaseHash,
        totalRecords: 0,
        resourceCounts: {},
        upstreamCounts: {},
        lastErrors: [],
        inProgress: false,
      }
    );
  }

  async updateSyncStatus(partial: Partial<SyncStatusInfo>): Promise<void> {
    const cur = await this.getSyncStatus();
    await this.set('__sync_status__', { ...cur, ...partial });
  }

  async clearMirror(newHash?: string): Promise<void> {
    await this.init();
    if (fs.existsSync(this.recordsDir)) {
      fs.rmSync(this.recordsDir, { recursive: true, force: true });
    }
    await this.updateSyncStatus({
      lastSyncAt: null,
      lastSyncType: null,
      saplBaseHash: newHash || getConfig().saplApiBaseHash,
      totalRecords: 0,
      resourceCounts: {},
      upstreamCounts: {},
      lastErrors: [],
      inProgress: false,
    });
  }
}

// -------------------------------------------------------------
// Driver 2: SQLite Nativo (com fallback automático para FileStorage)
// -------------------------------------------------------------
export class SqliteStorageDriver implements IStorageDriver {
  private db: any = null;
  private dbPath: string;
  private fallback: FileStorageDriver | null = null;

  constructor() {
    const config = getConfig();
    const subPath = config.storagePath || '.data';
    let baseDir = path.join(/*turbopackIgnore: true*/ process.cwd(), subPath);
    try {
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }
    } catch {
      baseDir = '/tmp/paflegis_data';
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }
    }
    this.dbPath = path.join(baseDir, 'paflegis.sqlite');
  }

  async init(): Promise<void> {
    if (this.db || this.fallback) return;
    try {
      let DatabaseSyncClass: any = null;
      try {
        const dynamicRequire =
          typeof (globalThis as any).__non_webpack_require__ !== 'undefined'
            ? (globalThis as any).__non_webpack_require__
            : (typeof globalThis !== 'undefined' && (globalThis as any).require) || eval('require');
        const mod = dynamicRequire('node:sqlite');
        DatabaseSyncClass = mod?.DatabaseSync || null;
      } catch {
        DatabaseSyncClass = null;
      }

      if (!DatabaseSyncClass) {
        throw new Error('Módulo node:sqlite não disponível pelo bundler');
      }

      this.db = new DatabaseSyncClass(this.dbPath);

      // Cria tabelas necessárias
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS kv_store (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS mirrored_records (
          modulo TEXT NOT NULL,
          recurso TEXT NOT NULL,
          record_id TEXT NOT NULL,
          data TEXT NOT NULL,
          hash TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (modulo, recurso, record_id)
        );

        CREATE INDEX IF NOT EXISTS idx_records_lookup ON mirrored_records (modulo, recurso, updated_at);

        CREATE TABLE IF NOT EXISTS sync_status (
          id TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

      slog('INFO', 'storage', `SQLite inicializado com sucesso em ${this.dbPath}`);
    } catch (err: any) {
      slog('WARN', 'storage', `SQLite indisponível (${err.message}). Utilizando FileStorageDriver como armazenamento resiliente.`);
      this.fallback = new FileStorageDriver();
      await this.fallback.init();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    if (this.fallback) return this.fallback.get<T>(key);

    const now = Date.now();
    const stmt = this.db.prepare('SELECT value, expires_at FROM kv_store WHERE key = ?');
    const row = stmt.get(key) as { value: string; expires_at: number | null } | undefined;

    if (!row) return null;
    if (row.expires_at && row.expires_at < now) {
      this.del(key);
      return null;
    }
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.init();
    if (this.fallback) return this.fallback.set(key, value, ttlSeconds);

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);

    const stmt = this.db.prepare(`
      INSERT INTO kv_store (key, value, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at
    `);
    stmt.run(key, strVal, expiresAt);
  }

  async del(key: string): Promise<void> {
    await this.init();
    if (this.fallback) return this.fallback.del(key);

    const stmt = this.db.prepare('DELETE FROM kv_store WHERE key = ?');
    stmt.run(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    await this.init();
    if (this.fallback) return this.fallback.incr(key, ttlSeconds);

    const now = Date.now();
    const expiresAt = ttlSeconds ? now + ttlSeconds * 1000 : null;

    const currentStmt = this.db.prepare('SELECT value, expires_at FROM kv_store WHERE key = ?');
    const row = currentStmt.get(key) as { value: string; expires_at: number | null } | undefined;

    let nextVal = 1;
    if (row) {
      if (!row.expires_at || row.expires_at >= now) {
        nextVal = (parseInt(row.value, 10) || 0) + 1;
      }
    }

    const setStmt = this.db.prepare(`
      INSERT INTO kv_store (key, value, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at
    `);
    setStmt.run(key, String(nextVal), expiresAt);
    return nextVal;
  }

  async saveRecord(modulo: string, recurso: string, id: string | number, data: any, hash?: string): Promise<void> {
    await this.init();
    if (this.fallback) return this.fallback.saveRecord(modulo, recurso, id, data, hash);

    const strId = String(id);
    const contentStr = JSON.stringify(data);
    const contentHash = hash || crypto.createHash('sha256').update(contentStr).digest('hex').slice(0, 16);
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO mirrored_records (modulo, recurso, record_id, data, hash, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(modulo, recurso, record_id) DO UPDATE SET
        data = excluded.data,
        hash = excluded.hash,
        updated_at = excluded.updated_at
    `);
    stmt.run(modulo, recurso, strId, contentStr, contentHash, now);
  }

  async saveRecordsBatch(records: { modulo: string; recurso: string; id: string | number; data: any; hash?: string }[]): Promise<void> {
    await this.init();
    if (this.fallback) return this.fallback.saveRecordsBatch(records);
    if (!records.length) return;

    const stmt = this.db.prepare(`
      INSERT INTO mirrored_records (modulo, recurso, record_id, data, hash, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(modulo, recurso, record_id) DO UPDATE SET
        data = excluded.data,
        hash = excluded.hash,
        updated_at = excluded.updated_at
    `);

    const now = Date.now();
    for (const r of records) {
      const contentStr = JSON.stringify(r.data);
      const contentHash = r.hash || crypto.createHash('sha256').update(contentStr).digest('hex').slice(0, 16);
      stmt.run(r.modulo, r.recurso, String(r.id), contentStr, contentHash, now);
    }
  }

  async getRecord<T>(modulo: string, recurso: string, id: string | number): Promise<T | null> {
    await this.init();
    if (this.fallback) return this.fallback.getRecord<T>(modulo, recurso, id);

    const stmt = this.db.prepare('SELECT data FROM mirrored_records WHERE modulo = ? AND recurso = ? AND record_id = ?');
    const row = stmt.get(modulo, recurso, String(id)) as { data: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.data) as T;
    } catch {
      return null;
    }
  }

  async listRecords<T>(modulo: string, recurso: string, options?: { page?: number; limit?: number; search?: string; ordering?: string }): Promise<{ items: T[]; total: number }> {
    await this.init();
    if (this.fallback) return this.fallback.listRecords<T>(modulo, recurso, options);

    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as cnt FROM mirrored_records WHERE modulo = ? AND recurso = ?';
    let dataQuery = 'SELECT data FROM mirrored_records WHERE modulo = ? AND recurso = ?';
    const params: any[] = [modulo, recurso];

    if (options?.search) {
      countQuery += ' AND data LIKE ?';
      dataQuery += ' AND data LIKE ?';
      params.push(`%${options.search}%`);
    }

    dataQuery += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';

    const countRow = this.db.prepare(countQuery).get(...params) as { cnt: number } | undefined;
    const total = countRow?.cnt || 0;

    const dataParams = [...params, limit, offset];
    const rows = this.db.prepare(dataQuery).all(...dataParams) as { data: string }[];

    const items: T[] = [];
    for (const r of rows) {
      try {
        items.push(JSON.parse(r.data));
      } catch {}
    }

    return { items, total };
  }

  async countRecords(modulo?: string, recurso?: string): Promise<number> {
    await this.init();
    if (this.fallback) return this.fallback.countRecords(modulo, recurso);

    if (modulo && recurso) {
      const row = this.db.prepare('SELECT COUNT(*) as cnt FROM mirrored_records WHERE modulo = ? AND recurso = ?').get(modulo, recurso) as { cnt: number } | undefined;
      return row?.cnt || 0;
    }
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM mirrored_records').get() as { cnt: number } | undefined;
    return row?.cnt || 0;
  }

  async getSyncStatus(): Promise<SyncStatusInfo> {
    await this.init();
    if (this.fallback) return this.fallback.getSyncStatus();

    const row = this.db.prepare('SELECT payload FROM sync_status WHERE id = ?').get('current') as { payload: string } | undefined;
    if (row) {
      try {
        return JSON.parse(row.payload);
      } catch {}
    }
    return {
      lastSyncAt: null,
      lastSyncType: null,
      saplBaseHash: getConfig().saplApiBaseHash,
      totalRecords: 0,
      resourceCounts: {},
      upstreamCounts: {},
      lastErrors: [],
      inProgress: false,
    };
  }

  async updateSyncStatus(partial: Partial<SyncStatusInfo>): Promise<void> {
    await this.init();
    if (this.fallback) return this.fallback.updateSyncStatus(partial);

    const current = await this.getSyncStatus();
    const updated = { ...current, ...partial };
    const stmt = this.db.prepare(`
      INSERT INTO sync_status (id, payload, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
    `);
    stmt.run('current', JSON.stringify(updated), Date.now());
  }

  async clearMirror(newHash?: string): Promise<void> {
    await this.init();
    if (this.fallback) return this.fallback.clearMirror(newHash);

    this.db.exec('DELETE FROM mirrored_records;');
    await this.updateSyncStatus({
      lastSyncAt: null,
      lastSyncType: null,
      saplBaseHash: newHash || getConfig().saplApiBaseHash,
      totalRecords: 0,
      resourceCounts: {},
      upstreamCounts: {},
      lastErrors: [],
      inProgress: false,
    });
    slog('WARN', 'storage', 'Espelho local limpo por alteração do SAPL de origem');
  }
}

// -------------------------------------------------------------
// Driver 3: In-Memory (Testes / efêmero)
// -------------------------------------------------------------
export class MemoryStorageDriver implements IStorageDriver {
  private kv = new Map<string, { value: any; expires_at: number | null }>();
  private records = new Map<string, StorageRecord>();
  private status: SyncStatusInfo = {
    lastSyncAt: null,
    lastSyncType: null,
    saplBaseHash: getConfig().saplApiBaseHash,
    totalRecords: 0,
    resourceCounts: {},
    upstreamCounts: {},
    lastErrors: [],
    inProgress: false,
  };

  async init(): Promise<void> {}

  async get<T>(key: string): Promise<T | null> {
    const item = this.kv.get(key);
    if (!item) return null;
    if (item.expires_at && item.expires_at < Date.now()) {
      this.kv.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expires_at = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.kv.set(key, { value, expires_at });
  }

  async del(key: string): Promise<void> {
    this.kv.delete(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const cur = (await this.get<number>(key)) || 0;
    const next = cur + 1;
    await this.set(key, next, ttlSeconds);
    return next;
  }

  async saveRecord(modulo: string, recurso: string, id: string | number, data: any, hash?: string): Promise<void> {
    const k = `${modulo}:${recurso}:${id}`;
    const contentStr = JSON.stringify(data);
    const contentHash = hash || crypto.createHash('sha256').update(contentStr).digest('hex').slice(0, 16);
    this.records.set(k, {
      modulo,
      recurso,
      record_id: String(id),
      data,
      hash: contentHash,
      updated_at: Date.now(),
    });
  }

  async saveRecordsBatch(records: { modulo: string; recurso: string; id: string | number; data: any; hash?: string }[]): Promise<void> {
    for (const r of records) {
      await this.saveRecord(r.modulo, r.recurso, r.id, r.data, r.hash);
    }
  }

  async getRecord<T>(modulo: string, recurso: string, id: string | number): Promise<T | null> {
    const k = `${modulo}:${recurso}:${id}`;
    const rec = this.records.get(k);
    return rec ? (rec.data as T) : null;
  }

  async listRecords<T>(modulo: string, recurso: string, options?: { page?: number; limit?: number; search?: string; ordering?: string }): Promise<{ items: T[]; total: number }> {
    const prefix = `${modulo}:${recurso}:`;
    let list: StorageRecord[] = [];
    for (const [k, v] of this.records.entries()) {
      if (k.startsWith(prefix)) {
        if (options?.search) {
          const s = JSON.stringify(v.data).toLowerCase();
          if (!s.includes(options.search.toLowerCase())) continue;
        }
        list.push(v);
      }
    }
    list.sort((a, b) => b.updated_at - a.updated_at);
    const total = list.length;
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const paginated = list.slice((page - 1) * limit, page * limit);
    return { items: paginated.map((r) => r.data as T), total };
  }

  async countRecords(modulo?: string, recurso?: string): Promise<number> {
    if (!modulo || !recurso) return this.records.size;
    const prefix = `${modulo}:${recurso}:`;
    let count = 0;
    for (const k of this.records.keys()) {
      if (k.startsWith(prefix)) count++;
    }
    return count;
  }

  async getSyncStatus(): Promise<SyncStatusInfo> {
    return { ...this.status, totalRecords: this.records.size };
  }

  async updateSyncStatus(partial: Partial<SyncStatusInfo>): Promise<void> {
    this.status = { ...this.status, ...partial };
  }

  async clearMirror(newHash?: string): Promise<void> {
    this.records.clear();
    this.status = {
      lastSyncAt: null,
      lastSyncType: null,
      saplBaseHash: newHash || getConfig().saplApiBaseHash,
      totalRecords: 0,
      resourceCounts: {},
      upstreamCounts: {},
      lastErrors: [],
      inProgress: false,
    };
  }
}

// -------------------------------------------------------------
// Singleton Storage Factory
// -------------------------------------------------------------
let activeDriver: IStorageDriver | null = null;

export function getStorage(): IStorageDriver {
  if (activeDriver) return activeDriver;

  const config = getConfig();

  if (config.storageDriver === 'memory') {
    activeDriver = new MemoryStorageDriver();
    return activeDriver;
  }

  if (config.storageDriver === 'sqlite') {
    activeDriver = new SqliteStorageDriver();
    return activeDriver;
  }

  activeDriver = new FileStorageDriver();
  return activeDriver;
}

/**
 * Gera o próximo número de protocolo para formulário de contato com persistência atômica.
 * Formato garantido: YYYY-XXXXXX (ex: 2026-000042), nunca repete entre cold starts.
 */
export async function getNextPersistentProtocolNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const counterKey = `protocolo:${year}`;
  const storage = getStorage();
  const nextNum = await storage.incr(counterKey);
  const formattedSeq = String(nextNum).padStart(6, '0');
  return `${year}-${formattedSeq}`;
}

/**
 * Valida se houve troca de instância de SAPL (verificando hash da API base).
 * Se o hash mudou, limpa o espelho antigo para não misturar dados de cidades diferentes.
 */
export async function checkAndHandleSaplSwitch(): Promise<boolean> {
  const config = getConfig();
  const storage = getStorage();
  const status = await storage.getSyncStatus();

  if (status.saplBaseHash && status.saplBaseHash !== config.saplApiBaseHash) {
    slog('WARN', 'storage', `Troca de SAPL detectada! Anterior: ${status.saplBaseHash}, Novo: ${config.saplApiBaseHash}`);
    await storage.clearMirror(config.saplApiBaseHash);
    return true;
  }
  return false;
}
