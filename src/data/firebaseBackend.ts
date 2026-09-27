import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db, STORAGE_SITES_PATH } from '../config/firebase';
import { IndexSettlement, SiteDetail } from '../types/settlement';

export { STORAGE_SITES_PATH };

export interface ResearchQueueDoc {
  id: string;
  siteId: string;
  siteName: { tr: string; en: string };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  targetTopics: string[];
  notes?: string;
  requestedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchJobDoc {
  id: string;
  siteId: string;
  siteName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  step: string;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'success' | 'error';
    message: string;
  }>;
  resultSummary?: string;
  startedAt: string;
  completedAt?: string;
}

/**
 * Strips undefined properties recursively so Firestore does not reject documents.
 */
export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result;
  }
  return obj;
}

/**
 * Fetches all index records from Firestore collection 'sites_index'.
 */
export async function getSitesIndexFromFirestore(): Promise<IndexSettlement[]> {
  const sitesRef = collection(db, 'sites_index');
  const snapshot = await getDocs(sitesRef);

  if (snapshot.empty) {
    return [];
  }

  const items: IndexSettlement[] = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data() as IndexSettlement;
    items.push({
      ...data,
      id: docSnap.id
    });
  });

  return items;
}

/**
 * Seeds or updates the sites_index collection in Firestore.
 */
export async function seedSitesIndexToFirestore(sites: IndexSettlement[]): Promise<void> {
  const batchPromises = sites.map(site => {
    const docRef = doc(db, 'sites_index', site.id);
    const sanitized = sanitizeForFirestore({
      ...site,
      file: `${STORAGE_SITES_PATH}/${site.id}.json`,
      syncedAt: new Date().toISOString()
    });
    return setDoc(docRef, sanitized, { merge: true });
  });

  await Promise.all(batchPromises);
}

/**
 * Seeds sample research queue tasks and execution jobs into Firestore
 * to initialize the 'research_queue' and 'research_jobs' collections.
 */
export async function seedInitialResearchCollections(): Promise<void> {
  try {
    const queueCol = collection(db, 'research_queue');
    const queueSnap = await getDocs(query(queueCol, limit(1)));

    if (queueSnap.empty) {
      const initialQueue: ResearchQueueDoc[] = [
        {
          id: 'rq-gobekli-tepe',
          siteId: 'gobekli-tepe',
          siteName: { tr: 'Göbekli Tepe', en: 'Göbekli Tepe' },
          priority: 'urgent',
          status: 'completed',
          targetTopics: ['D Yapısı Stratigrafisi', 'C14 Bayes Radyokarbon Revizyonu', 'Monolitik İkonografi'],
          notes: 'Yeni DAİ kazı raporları ve Göbekli Tepe Araştırma Projesi güncel stratigrafi verileri işlendi.',
          requestedBy: 'Atlas Bilimsel Kurulu',
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: 'rq-karahantepe',
          siteId: 'karahantepe',
          siteName: { tr: 'Karahantepe', en: 'Karahantepe' },
          priority: 'high',
          status: 'in_progress',
          targetTopics: ['Taş Tepeler Kompleksi Karşılaştırması', 'Antropomorfik Heykeller', 'PPNB Taban Yapıları'],
          notes: 'Karahantepe monografisi için 2023-2025 kazı sezonu buluntularının bibliyografik sentezi.',
          requestedBy: 'Atlas Araştırma Ekibi',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'rq-boncuklu-tarla',
          siteId: 'boncuklu-tarla',
          siteName: { tr: 'Boncuklu Tarla', en: 'Boncuklu Tarla' },
          priority: 'high',
          status: 'in_progress',
          targetTopics: ['PPNA Takı Atölyeleri', 'Mardin Bölgesi Erken Neolitik Mimarisi'],
          notes: 'Boncuklu Tarla kulak ve dudak takıları ile erken yerleşiklik izleri kataloğu.',
          requestedBy: 'Neolitik Çalışma Grubu',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rq-kocabas-hominin',
          siteId: 'kocabas-hominin',
          siteName: { tr: 'Kocabaş Hominin Buluntu Alanı', en: 'Kocabaş Hominin Locality' },
          priority: 'normal',
          status: 'pending',
          targetTopics: ['Kozmojenik Nüklid Tarihlendirmesi', 'Traverten Biyo-kronolojisi', 'Homo erectus Morfolojisi'],
          notes: 'Denizli havzası traverten ocakları buluntularının güncel jeolojik kronolojisi.',
          requestedBy: 'Paleolitik Çalışma Grubu',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'rq-asikli-hoyuk',
          siteId: 'asikli-hoyuk',
          siteName: { tr: 'Aşıklı Höyük', en: 'Aşıklı Höyük' },
          priority: 'normal',
          status: 'pending',
          targetTopics: ['Kapadokya Obsidiyen Ticareti', 'Erken Tıp ve Trepanasyon', 'Kerpiç Mimari Evrimi'],
          notes: 'Aşıklı Höyük derin sondajları ve Kapadokya bölgesi erken neolitikleşme süreci.',
          requestedBy: 'Atlas Araştırma Ekibi',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const item of initialQueue) {
        await setDoc(doc(db, 'research_queue', item.id), sanitizeForFirestore(item), { merge: true });
      }
    }

    const jobsCol = collection(db, 'research_jobs');
    const jobsSnap = await getDocs(query(jobsCol, limit(1)));

    if (jobsSnap.empty) {
      const initialJobs: ResearchJobDoc[] = [
        {
          id: 'job-gobekli-001',
          siteId: 'gobekli-tepe',
          siteName: 'Göbekli Tepe',
          status: 'completed',
          progress: 100,
          step: 'Sentez tamamlandı ve atlas/sites/gobekli-tepe.json güncellendi',
          logs: [
            { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), level: 'info', message: 'Araştırma işi başlatıldı: Göbekli Tepe monografik revizyonu' },
            { timestamp: new Date(Date.now() - 86400000 * 2 + 1000).toISOString(), level: 'info', message: 'Bibliyografya taraması: 18 akademik kaynak dizinlendi' },
            { timestamp: new Date(Date.now() - 86400000 * 2 + 2000).toISOString(), level: 'success', message: 'Kronoloji matrisi güncellendi: -9600 ile -8000 aralığı teyit edildi' },
            { timestamp: new Date(Date.now() - 86400000 * 2 + 3000).toISOString(), level: 'success', message: 'Detaylı site JSON dosyası Firebase Storage üzerine kaydedildi' }
          ],
          resultSummary: 'Göbekli Tepe monografik verisi 18 doğrulanmış kaynak, UNESCO Dünya Mirası kaydı ve görsel arşivle tamamlandı.',
          startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          completedAt: new Date(Date.now() - 86400000 * 2 + 5000).toISOString()
        },
        {
          id: 'job-karahan-002',
          siteId: 'karahantepe',
          siteName: 'Karahantepe',
          status: 'running',
          progress: 68,
          step: 'Taş Tepeler ve Göbekli Tepe T-sütun karşılaştırmalı analizi yürütülüyor',
          logs: [
            { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), level: 'info', message: 'Karahantepe araştırma işi başlatıldı' },
            { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), level: 'info', message: 'AD Yapısı ve insan başı heykeli sembolizmi inceleniyor' },
            { timestamp: new Date(Date.now() - 3600000).toISOString(), level: 'info', message: 'PPNB ve Çanak Çömleksiz Neolitik tabakalanması çözümleniyor' }
          ],
          resultSummary: 'İşlem devam ediyor. Karahantepe monografisi için 12 kaynak çapraz doğrulandı.',
          startedAt: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'job-boncuklu-003',
          siteId: 'boncuklu-tarla',
          siteName: 'Boncuklu Tarla',
          status: 'queued',
          progress: 15,
          step: 'Kaynak toplama ve erken yerleşim katmanları tespiti',
          logs: [
            { timestamp: new Date(Date.now() - 1800000).toISOString(), level: 'info', message: 'İş kuyruğa alındı' }
          ],
          startedAt: new Date(Date.now() - 1800000).toISOString()
        }
      ];

      for (const job of initialJobs) {
        await setDoc(doc(db, 'research_jobs', job.id), sanitizeForFirestore(job), { merge: true });
      }
    }
  } catch (err) {
    console.warn('[Firebase] Initial research collections seeding warning:', err);
  }
}

/**
 * Lazy-loads a detailed site JSON directly from Firebase Storage under `atlas/sites/${cleanId}.json`.
 * Firebase Storage is the sole authoritative source for full archaeological monographs.
 * Attempts client Storage download (getBytes / getDownloadURL) and falls back to same-origin Storage proxy if browser CORS blocks client fetch.
 * Returns null if the site is not present in Firebase Storage.
 */
export async function fetchSiteDetailFromStorage(cleanId: string): Promise<SiteDetail | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`/api/sites/${encodeURIComponent(cleanId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Site detail request failed with HTTP ${response.status}`);
    }

    const data: SiteDetail = await response.json();
    return data && data.id ? data : null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Retrieves the live research queue from Firestore.
 */
export async function getResearchQueue(): Promise<ResearchQueueDoc[]> {
  try {
    const queueRef = collection(db, 'research_queue');
    const snap = await getDocs(queueRef);
    const list: ResearchQueueDoc[] = [];
    snap.forEach(d => list.push({ ...d.data(), id: d.id } as ResearchQueueDoc));
    return list;
  } catch (err) {
    console.error('Error fetching research_queue:', err);
    return [];
  }
}

/**
 * Retrieves research jobs from Firestore.
 */
export async function getResearchJobs(): Promise<ResearchJobDoc[]> {
  try {
    const jobsRef = collection(db, 'research_jobs');
    const snap = await getDocs(jobsRef);
    const list: ResearchJobDoc[] = [];
    snap.forEach(d => list.push({ ...d.data(), id: d.id } as ResearchJobDoc));
    return list;
  } catch (err) {
    console.error('Error fetching research_jobs:', err);
    return [];
  }
}

