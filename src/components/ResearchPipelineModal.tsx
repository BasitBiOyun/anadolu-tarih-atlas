import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Queue,
  Cpu,
  CheckCircle,
  Clock,
  ArrowsClockwise,
  PlusCircle,
  HardDrive
} from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';
import {
  getResearchQueue,
  getResearchJobs,
  ResearchQueueDoc,
  ResearchJobDoc,
  STORAGE_SITES_PATH
} from '../data/firebaseBackend';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ResearchPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  indexedCount: number;
}

export const ResearchPipelineModal: React.FC<ResearchPipelineModalProps> = ({
  isOpen,
  onClose,
  indexedCount
}) => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'queue' | 'jobs' | 'storage'>('queue');
  const [queue, setQueue] = useState<ResearchQueueDoc[]>([]);
  const [jobs, setJobs] = useState<ResearchJobDoc[]>([]);
  const [loading, setLoading] = useState(false);

  // New research request form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteId, setNewSiteId] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [newTopics, setNewTopics] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [queueData, jobsData] = await Promise.all([
        getResearchQueue(),
        getResearchJobs()
      ]);
      setQueue(queueData);
      setJobs(jobsData);
    } catch (err) {
      console.error('Error loading Firestore collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleCreateQueueItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim()) return;

    setIsSubmitting(true);
    try {
      const slug = (newSiteId.trim() || newSiteName.trim())
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');

      const newItem: Omit<ResearchQueueDoc, 'id'> = {
        siteId: slug,
        siteName: {
          tr: newSiteName.trim(),
          en: newSiteName.trim()
        },
        priority: newPriority,
        status: 'pending',
        targetTopics: newTopics.split(',').map(s => s.trim()).filter(Boolean),
        notes: newNotes.trim() || undefined,
        requestedBy: lang === 'tr' ? 'Atlas Araştırmacısı' : 'Atlas Researcher',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(collection(db, 'research_queue'));
      await setDoc(docRef, { ...newItem, id: docRef.id });

      // Reset form
      setNewSiteName('');
      setNewSiteId('');
      setNewTopics('');
      setNewNotes('');
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create research queue item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F2] border border-[#D9CEBC] shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden text-[#262018]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E8DFD0] bg-[#F4EFE6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database size={20} weight="fill" className="text-[#8A4526]" />
            <div>
              <h2 className="text-base font-serif font-bold text-[#1A1510]">
                {t('Firebase Arkeolojik Araştırma Havuzu', 'Firebase Archaeological Research Pipeline')}
              </h2>
              <div className="text-[11px] font-mono text-[#786958] flex items-center gap-2 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Cloud Firestore: sites_index ({indexedCount}), research_queue ({queue.length}), research_jobs ({jobs.length})</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-[#786958] hover:text-[#1A1510] hover:bg-[#EAE2D3] transition-colors"
              title={t('Yenile', 'Refresh')}
            >
              <ArrowsClockwise size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-[#786958] hover:text-[#1A1510] transition-colors"
              aria-label={t('Kapat', 'Close')}
            >
              <X size={20} weight="regular" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E0D5C3] bg-[#EFE9DD] px-6 text-xs font-serif font-medium">
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'queue'
                ? 'border-[#8A4526] text-[#8A4526] bg-[#FAF7F2] font-semibold'
                : 'border-transparent text-[#695B4A] hover:text-[#1A1510]'
            }`}
          >
            <Queue size={16} />
            <span>{t('Araştırma Kuyruğu', 'Research Queue')}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#E2D8C7] rounded-full">
              {queue.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'jobs'
                ? 'border-[#8A4526] text-[#8A4526] bg-[#FAF7F2] font-semibold'
                : 'border-transparent text-[#695B4A] hover:text-[#1A1510]'
            }`}
          >
            <Cpu size={16} />
            <span>{t('Aktif İşler', 'Active Jobs')}</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#E2D8C7] rounded-full">
              {jobs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`py-2.5 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'storage'
                ? 'border-[#8A4526] text-[#8A4526] bg-[#FAF7F2] font-semibold'
                : 'border-transparent text-[#695B4A] hover:text-[#1A1510]'
            }`}
          >
            <HardDrive size={16} />
            <span>{t('Storage Depolama', 'Firebase Storage')}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed flex-1">
          {/* TAB 1: RESEARCH QUEUE */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[#4A3F33] font-serif">
                  {t(
                    'Firestore `research_queue` koleksiyonunda bekleyen ve işlenen akademik alan araştırmaları:',
                    'Academic field and literature research tracked in Firestore `research_queue`:'
                  )}
                </p>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8A4526] hover:bg-[#72371E] text-[#FAF7F2] text-xs font-serif shadow-xs transition-colors"
                >
                  <PlusCircle size={15} />
                  <span>{t('Yeni Araştırma Görevi', 'New Research Task')}</span>
                </button>
              </div>

              {/* Add form */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateQueueItem}
                  className="p-4 bg-[#F2EDE2] border border-[#D9CEBC] space-y-3"
                >
                  <div className="font-serif font-semibold text-xs text-[#8A4526]">
                    {t('Firestore research_queue Koleksiyonuna Ekle', 'Add to Firestore research_queue')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#4A3F33] mb-1">
                        {t('Site / Yerleşim Adı', 'Site / Settlement Name')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={newSiteName}
                        onChange={e => setNewSiteName(e.target.value)}
                        placeholder="Örn: Hallan Çemi"
                        className="w-full px-2.5 py-1.5 bg-white border border-[#CFC3B0] text-xs focus:outline-none focus:border-[#8A4526]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#4A3F33] mb-1">
                        {t('Öncelik Seviyesi', 'Priority Level')}
                      </label>
                      <select
                        value={newPriority}
                        onChange={e => setNewPriority(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#CFC3B0] text-xs focus:outline-none focus:border-[#8A4526]"
                      >
                        <option value="low">{t('Düşük (Low)', 'Low')}</option>
                        <option value="normal">{t('Normal', 'Normal')}</option>
                        <option value="high">{t('Yüksek (High)', 'High')}</option>
                        <option value="urgent">{t('Acil (Urgent)', 'Urgent')}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#4A3F33] mb-1">
                      {t('Araştırma Konuları (Virgülle ayırınız)', 'Target Topics (Comma-separated)')}
                    </label>
                    <input
                      type="text"
                      value={newTopics}
                      onChange={e => setNewTopics(e.target.value)}
                      placeholder="Örn: Stratigrafi, C14 Tarihlemesi, Obsidiyen Analizi"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CFC3B0] text-xs focus:outline-none focus:border-[#8A4526]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#4A3F33] mb-1">
                      {t('Araştırma Notu / Açıklama', 'Research Notes')}
                    </label>
                    <textarea
                      rows={2}
                      value={newNotes}
                      onChange={e => setNewNotes(e.target.value)}
                      placeholder="Kazı heyeti yayınları ve kaynak hedefleri..."
                      className="w-full px-2.5 py-1.5 bg-white border border-[#CFC3B0] text-xs focus:outline-none focus:border-[#8A4526]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1 text-xs text-[#5C4F40] hover:text-[#1A1510] border border-[#D9CEBC]"
                    >
                      {t('İptal', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1 bg-[#8A4526] hover:bg-[#72371E] text-white text-xs font-serif"
                    >
                      {isSubmitting ? t('Kaydediliyor...', 'Saving...') : t('Kuyruğa Ekle', 'Add to Queue')}
                    </button>
                  </div>
                </form>
              )}

              {/* Queue List */}
              <div className="space-y-2">
                {queue.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-[#E0D5C3] shadow-2xs hover:border-[#8A4526]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-[#1A1510]">
                            {item.siteName[lang] || item.siteName.tr}
                          </span>
                          <span
                            className={`text-[10px] font-serif font-semibold px-2 py-0.5 rounded-full ${
                              item.priority === 'urgent'
                                ? 'bg-red-100 text-red-800'
                                : item.priority === 'high'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-[#EAE2D3] text-[#5C4F40]'
                            }`}
                          >
                            {item.priority.toUpperCase()}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              item.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'in_progress'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-xs text-[#4A3F33] font-prose">{item.notes}</p>
                        )}
                        {item.targetTopics && item.targetTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.targetTopics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-[#F4EFE6] text-[#695B4A] px-2 py-0.5 border border-[#D9CEBC]"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-[10px] text-[#8C7D6C] font-mono shrink-0">
                        {new Date(item.createdAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE RESEARCH JOBS */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <p className="text-[13px] text-[#4A3F33] font-serif">
                {t(
                  'Firestore `research_jobs` koleksiyonunda yer alan işleme süreçleri ve yürütülen görevler:',
                  'Automated synthesis processes and tasks tracked in Firestore `research_jobs`:'
                )}
              </p>

              <div className="space-y-3">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className="p-4 bg-white border border-[#E0D5C3] shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-[#8A4526]" />
                        <span className="font-serif font-bold text-sm text-[#1A1510]">
                          {job.siteName || job.siteId}
                        </span>
                        <span className="text-[11px] font-mono text-[#8C7D6C]">({job.id})</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                          job.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'running'
                            ? 'bg-sky-100 text-sky-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-[#5C4F40] mb-1 font-mono">
                        <span>{job.step}</span>
                        <span>{job.progress}%</span>
                      </div>
                      <div className="w-full bg-[#EAE2D3] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            job.status === 'completed'
                              ? 'bg-emerald-600'
                              : job.status === 'running'
                              ? 'bg-[#8A4526]'
                              : 'bg-amber-600'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Logs */}
                    {job.logs && job.logs.length > 0 && (
                      <div className="bg-[#24211D] text-[#E8DFD0] p-2.5 text-[11px] font-mono space-y-1 rounded-xs">
                        {job.logs.map((log, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-[#A69784]">
                              [{new Date(log.timestamp).toLocaleTimeString()}]
                            </span>
                            <span
                              className={
                                log.level === 'success'
                                  ? 'text-emerald-400'
                                  : log.level === 'warn'
                                  ? 'text-amber-400'
                                  : 'text-[#F4EFE6]'
                              }
                            >
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: STORAGE DETAILS */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-[#E0D5C3] shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#1A1510]">
                  <HardDrive size={18} className="text-[#8A4526]" />
                  <span>{t('Firebase Storage Konfigürasyonu', 'Firebase Storage Configuration')}</span>
                </div>
                <div className="space-y-2 text-xs font-prose text-[#4A3F33]">
                  <div className="flex items-center justify-between p-2 bg-[#F4EFE6] border border-[#E0D5C3]">
                    <span className="font-mono text-[#695B4A]">Klasör Yolu (Prefix):</span>
                    <span className="font-mono font-bold text-[#8A4526]">{STORAGE_SITES_PATH}/</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#F4EFE6] border border-[#E0D5C3]">
                    <span className="font-mono text-[#695B4A]">Bucket:</span>
                    <span className="font-mono text-[#262018]">hiddenfeed.firebasestorage.app</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#F4EFE6] border border-[#E0D5C3]">
                    <span className="font-mono text-[#695B4A]">Lazy-Loading Modu:</span>
                    <span className="font-serif text-emerald-800 font-semibold">{t('Etkin (Site açıldığında çekilir)', 'Active (Fetched on demand)')}</span>
                  </div>
                </div>
                <p className="text-xs text-[#5C4F40]">
                  {t(
                    'Harita başlangıçta yalnızca hafifleştirilmiş `sites_index` verisini Cloud Firestore üzerinden yükler. Kullanıcı herhangi bir ören yerine tıkladığında veya arama sonucundan seçtiğinde, ilgili alanın kapsamlı iki dilli monografi dosyası (`atlas/sites/{id}.json`) Firebase Storage üzerinden asenkron olarak indirilir ve bellek önbelleğine alınır.',
                    'The map initially loads only the lightweight `sites_index` from Cloud Firestore. When an archaeological site is selected from the map or search, the full bilingual monograph JSON (`atlas/sites/{id}.json`) is lazy-loaded on demand from Firebase Storage and cached in memory.'
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E8DFD0] bg-[#F4EFE6] flex items-center justify-between text-[11px] text-[#786958]">
          <div className="flex items-center gap-1 font-mono">
            <span>Project:</span>
            <span className="font-semibold text-[#1A1510]">hiddenfeed</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#8A4526] hover:bg-[#72371E] text-white text-xs font-serif transition-colors"
          >
            {t('Kapat', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
