/**
 * Content (CMS) Section
 *
 * Admin screen for managing the site's editable content: service packages,
 * portfolio gallery images, FAQs, and freeform site copy. Everything here is
 * read by the public site and by the chatbot's knowledge index, so edits show
 * up in both places without a code deploy.
 */
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrash, faPen, faUpload, faSave, faXmark,
  faBoxOpen, faImages, faCircleQuestion, faFileLines, faRotate, faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import CmsService from '../components/service/CmsService';
import { useToast } from '../components/common/Toast';
import { useConfirm } from '../components/common/ConfirmDialog';

const TABS = [
  { key: 'Packages', icon: faBoxOpen },
  { key: 'Portfolio', icon: faImages },
  { key: 'FAQs', icon: faCircleQuestion },
  { key: 'Site Content', icon: faFileLines },
];

// --- shared styling ---------------------------------------------------------
const btn = 'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:hover:cursor-default';
const primaryBtn = `${btn} bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/30 focus-visible:ring-purple-400`;
const neutralBtn = `${btn} bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white focus-visible:ring-white/30`;
const input = 'w-full bg-white/[0.04] ring-1 ring-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 caret-purple-400 selection:bg-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/70 transition-shadow duration-150';
const label = 'block text-xs font-medium text-gray-400 mb-1.5';
const card = 'bg-white/[0.03] ring-1 ring-white/[0.07] rounded-xl';

/** Placeholder rows shown while the first fetch is in flight. */
function Skeleton({ rows = 3, className = 'h-24' }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${card} ${className} animate-pulse`} />
      ))}
    </div>
  );
}

/** Shown when a collection has no rows yet, with the action that fixes it. */
function EmptyState({ icon, title, body, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${card} flex flex-col items-center justify-center text-center px-6 py-12`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 ring-1 ring-purple-500/20 mb-4">
        <FontAwesomeIcon icon={icon} className="text-purple-400 text-lg" />
      </span>
      <p className="text-white font-medium">{title}</p>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">{body}</p>
      {actionLabel && (
        <button className={`${primaryBtn} mt-5`} onClick={onAction}>
          <FontAwesomeIcon icon={faPlus} />
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

function ContentSection() {
  const [tab, setTab] = useState('Packages');
  const toast = useToast();
  const [reindexing, setReindexing] = useState(false);

  // Content edits reindex automatically on a short delay; this forces it now,
  // which is useful right after a batch of edits.
  const reindex = async () => {
    setReindexing(true);
    try {
      const res = await CmsService.reindex();
      toast.success('Chatbot knowledge updated', `${res?.data?.chunks ?? 0} chunks indexed`);
    } catch (err) {
      toast.error('Reindex failed', err?.response?.data?.message || err.message);
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="text-white pb-12">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Content</h2>
          <p className="text-sm text-gray-500 mt-1">
            Edits here update the public site and what the chatbot can answer.
          </p>
        </div>
        <button className={neutralBtn} onClick={reindex} disabled={reindexing}>
          <FontAwesomeIcon icon={faRotate} className={reindexing ? 'animate-spin' : ''} />
          {reindexing ? 'Syncing…' : 'Sync chatbot'}
        </button>
      </div>

      {/* Tabs with a sliding indicator, so the active surface is unambiguous */}
      <div className="relative flex gap-1 mt-5 mb-6 border-b border-white/10 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 hover:cursor-pointer ${
                active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={t.icon} className={active ? 'text-purple-400' : ''} />
              {t.key}
              {active && (
                <motion.span
                  layoutId="cms-tab-indicator"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'Packages' && <PackagesTab />}
          {tab === 'Portfolio' && <PortfolioTab />}
          {tab === 'FAQs' && <FaqsTab />}
          {tab === 'Site Content' && <SiteContentTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Image URL field with upload button and a live preview of the result. */
function ImageUploadField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('That file is not an image', 'Choose a JPG, PNG, or WebP file.');
      return;
    }
    setUploading(true);
    try {
      const result = await CmsService.uploadFile(file);
      onChange(result.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed', err?.response?.data?.message || err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <label className={label}>Image</label>
      <div className="flex items-start gap-3">
        {value ? (
          <img
            src={value}
            alt="Preview"
            className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-white/[0.04] ring-1 ring-white/10 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faImages} className="text-gray-600" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <input className={input} placeholder="Image URL" value={value || ''} onChange={(e) => onChange(e.target.value)} />
          <label className={`${neutralBtn} ${uploading ? 'opacity-60' : ''}`}>
            <FontAwesomeIcon icon={faUpload} className={uploading ? 'animate-pulse' : ''} />
            {uploading ? 'Uploading…' : 'Upload image'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        </div>
      </div>
    </div>
  );
}

/** Small badge marking content that is hidden from the public site. */
function HiddenBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 ring-1 ring-amber-500/25">
      <FontAwesomeIcon icon={faEyeSlash} className="text-[9px]" />
      Hidden
    </span>
  );
}

// ---------------- Packages ----------------
function PackagesTab() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    return CmsService.getPackages(false)
      .then(setItems)
      .catch((err) => toast.error('Could not load packages', err.message))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const blank = { category: 'Photography', name: '', price: '', description: '', features: [], imageUrl: '', displayOrder: 0, active: true };

  const save = async () => {
    if (!editing.name?.trim()) return toast.error('Name is required');
    if (editing.price === '' || isNaN(Number(editing.price))) return toast.error('Price must be a number');

    setSaving(true);
    const payload = {
      ...editing,
      price: Number(editing.price),
      features: typeof editing.features === 'string'
        ? editing.features.split('\n').map((f) => f.trim()).filter(Boolean)
        : editing.features,
    };
    try {
      if (editing.id) await CmsService.updatePackage(editing.id, payload);
      else await CmsService.createPackage(payload);
      toast.success(editing.id ? 'Package updated' : 'Package created', 'The Packages page and chatbot will reflect this.');
      setEditing(null);
      load();
    } catch (err) {
      toast.error('Could not save package', err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (pkg) => {
    const ok = await confirm({
      title: `Delete "${pkg.name}"?`,
      body: 'It will be removed from the Packages page and from the chatbot\'s knowledge. This cannot be undone.',
      destructive: true,
    });
    if (!ok) return;
    try {
      await CmsService.deletePackage(pkg.id);
      toast.success('Package deleted');
      load();
    } catch (err) {
      toast.error('Could not delete package', err?.response?.data?.message || err.message);
    }
  };

  if (loading) return <Skeleton rows={6} />;

  return (
    <div>
      {!editing && items.length > 0 && (
        <button className={`${primaryBtn} mb-5`} onClick={() => setEditing({ ...blank })}>
          <FontAwesomeIcon icon={faPlus} /> Add package
        </button>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`${card} p-5 mb-6 space-y-4`}>
              <p className="text-sm font-semibold">{editing.id ? 'Edit package' : 'New package'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Category</label>
                  <select className={input} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                    <option className="bg-gray-900">Photography</option>
                    <option className="bg-gray-900">Videography</option>
                    <option className="bg-gray-900">Photo + Video</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Name</label>
                  <input className={input} placeholder="e.g. Wedding Premium" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label className={label}>Price (PHP)</label>
                  <input className={input} type="number" placeholder="5000" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
                </div>
                <div>
                  <label className={label}>Display order</label>
                  <input className={input} type="number" value={editing.displayOrder ?? 0} onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={label}>Description</label>
                <textarea className={input} rows={2} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <label className={label}>Features — one per line</label>
                <textarea
                  className={`${input} font-mono text-xs leading-relaxed`}
                  rows={5}
                  placeholder={'7-Hours Photography Session\n200+ Digital Edited Photos'}
                  value={Array.isArray(editing.features) ? editing.features.join('\n') : editing.features || ''}
                  onChange={(e) => setEditing({ ...editing, features: e.target.value })}
                />
              </div>
              <ImageUploadField value={editing.imageUrl} onChange={(url) => setEditing({ ...editing, imageUrl: url })} />
              <label className="flex items-center gap-2.5 text-sm text-gray-300 hover:cursor-pointer w-fit">
                <input type="checkbox" className="accent-purple-500 h-4 w-4" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                Visible on the site
              </label>
              <div className="flex gap-2 pt-1">
                <button className={primaryBtn} onClick={save} disabled={saving}>
                  <FontAwesomeIcon icon={faSave} />{saving ? 'Saving…' : 'Save package'}
                </button>
                <button className={neutralBtn} onClick={() => setEditing(null)} disabled={saving}>
                  <FontAwesomeIcon icon={faXmark} />Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 && !editing ? (
        <EmptyState
          icon={faBoxOpen}
          title="No packages yet"
          body="Packages you add here appear on the public Packages page and become answerable by the chatbot."
          actionLabel="Add your first package"
          onAction={() => setEditing({ ...blank })}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className={`${card} p-4 flex flex-col hover:ring-white/15 transition-[box-shadow,--tw-ring-color] duration-200 group`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-purple-400 font-medium">{p.category}</p>
                  <p className="font-semibold truncate mt-0.5">{p.name}</p>
                  <p className="text-sm text-gray-400 mt-0.5 tabular-nums">
                    ₱{Number(p.price).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
                  <button aria-label={`Edit ${p.name}`} className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-150 hover:cursor-pointer" onClick={() => setEditing({ ...p, price: String(p.price) })}>
                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                  </button>
                  <button aria-label={`Delete ${p.name}`} className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 hover:cursor-pointer" onClick={() => remove(p)}>
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              </div>
              {p.features?.length > 0 && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{p.features.join(' · ')}</p>
              )}
              {!p.active && <div className="mt-3"><HiddenBadge /></div>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Portfolio ----------------
function PortfolioTab() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    return CmsService.getPortfolio(false)
      .then(setItems)
      .catch((err) => toast.error('Could not load portfolio', err.message))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const blank = { category: 'wedding', imageUrl: '', caption: '', displayOrder: 0, active: true };

  const save = async () => {
    if (!editing.imageUrl?.trim()) return toast.error('An image is required', 'Upload a file or paste an image URL.');
    setSaving(true);
    try {
      if (editing.id) await CmsService.updatePortfolioItem(editing.id, editing);
      else await CmsService.createPortfolioItem(editing);
      toast.success(editing.id ? 'Image updated' : 'Image added');
      setEditing(null);
      load();
    } catch (err) {
      toast.error('Could not save image', err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const ok = await confirm({
      title: 'Delete this image?',
      body: 'It will be removed from the public portfolio gallery. This cannot be undone.',
      destructive: true,
    });
    if (!ok) return;
    try {
      await CmsService.deletePortfolioItem(item.id);
      toast.success('Image deleted');
      load();
    } catch (err) {
      toast.error('Could not delete image', err?.response?.data?.message || err.message);
    }
  };

  if (loading) return <Skeleton rows={8} className="h-36" />;

  return (
    <div>
      {!editing && items.length > 0 && (
        <button className={`${primaryBtn} mb-5`} onClick={() => setEditing({ ...blank })}>
          <FontAwesomeIcon icon={faPlus} /> Add image
        </button>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className={`${card} p-5 mb-6 space-y-4`}>
              <p className="text-sm font-semibold">{editing.id ? 'Edit image' : 'New image'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Category</label>
                  <input className={input} placeholder="wedding, portrait, sports…" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                </div>
                <div>
                  <label className={label}>Display order</label>
                  <input className={input} type="number" value={editing.displayOrder ?? 0} onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })} />
                </div>
              </div>
              <ImageUploadField value={editing.imageUrl} onChange={(url) => setEditing({ ...editing, imageUrl: url })} />
              <div>
                <label className={label}>Caption (optional)</label>
                <input className={input} value={editing.caption || ''} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <button className={primaryBtn} onClick={save} disabled={saving}>
                  <FontAwesomeIcon icon={faSave} />{saving ? 'Saving…' : 'Save image'}
                </button>
                <button className={neutralBtn} onClick={() => setEditing(null)} disabled={saving}>
                  <FontAwesomeIcon icon={faXmark} />Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 && !editing ? (
        <EmptyState
          icon={faImages}
          title="No portfolio images yet"
          body="Upload your work here to fill the public portfolio gallery, grouped by category."
          actionLabel="Add your first image"
          onAction={() => setEditing({ ...blank })}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.025, 0.3) }}
              className={`${card} overflow-hidden group`}
            >
              <div className="relative aspect-[4/3] bg-white/[0.04]">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.caption || item.category} loading="lazy" className="h-full w-full object-cover" />
                )}
                {/* Actions surface on hover so the grid stays about the images */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-end gap-1 p-2">
                  <button aria-label="Edit image" className="h-8 w-8 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-colors duration-150 hover:cursor-pointer" onClick={() => setEditing({ ...item })}>
                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                  </button>
                  <button aria-label="Delete image" className="h-8 w-8 rounded-lg bg-black/60 text-red-400 hover:bg-red-600 hover:text-white backdrop-blur-sm transition-colors duration-150 hover:cursor-pointer" onClick={() => remove(item)}>
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] uppercase tracking-wide text-purple-400 truncate">{item.category}</p>
                {!item.active && <div className="mt-1.5"><HiddenBadge /></div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- FAQs ----------------
function FaqsTab() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    return CmsService.getFaqs(false)
      .then(setItems)
      .catch((err) => toast.error('Could not load FAQs', err.message))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const blank = { question: '', answer: '', displayOrder: 0, active: true };

  const save = async () => {
    if (!editing.question?.trim() || !editing.answer?.trim()) {
      return toast.error('Both a question and an answer are required');
    }
    setSaving(true);
    try {
      if (editing.id) await CmsService.updateFaq(editing.id, editing);
      else await CmsService.createFaq(editing);
      toast.success(editing.id ? 'FAQ updated' : 'FAQ added', 'The chatbot will use this to answer visitors.');
      setEditing(null);
      load();
    } catch (err) {
      toast.error('Could not save FAQ', err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (faq) => {
    const ok = await confirm({
      title: 'Delete this FAQ?',
      body: 'The chatbot will stop using it to answer visitors. This cannot be undone.',
      destructive: true,
    });
    if (!ok) return;
    try {
      await CmsService.deleteFaq(faq.id);
      toast.success('FAQ deleted');
      load();
    } catch (err) {
      toast.error('Could not delete FAQ', err?.response?.data?.message || err.message);
    }
  };

  if (loading) return <Skeleton rows={3} className="h-20" />;

  return (
    <div>
      {!editing && items.length > 0 && (
        <button className={`${primaryBtn} mb-5`} onClick={() => setEditing({ ...blank })}>
          <FontAwesomeIcon icon={faPlus} /> Add FAQ
        </button>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className={`${card} p-5 mb-6 space-y-4`}>
              <p className="text-sm font-semibold">{editing.id ? 'Edit FAQ' : 'New FAQ'}</p>
              <div>
                <label className={label}>Question</label>
                <input className={input} placeholder="Do you travel outside Bulacan?" value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
              </div>
              <div>
                <label className={label}>Answer</label>
                <textarea className={input} rows={3} value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
              </div>
              <div className="sm:w-40">
                <label className={label}>Display order</label>
                <input className={input} type="number" value={editing.displayOrder ?? 0} onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                The chatbot answers visitors from these, so keep them accurate — it quotes what you write here.
              </p>
              <div className="flex gap-2">
                <button className={primaryBtn} onClick={save} disabled={saving}>
                  <FontAwesomeIcon icon={faSave} />{saving ? 'Saving…' : 'Save FAQ'}
                </button>
                <button className={neutralBtn} onClick={() => setEditing(null)} disabled={saving}>
                  <FontAwesomeIcon icon={faXmark} />Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 && !editing ? (
        <EmptyState
          icon={faCircleQuestion}
          title="No FAQs yet"
          body="Add the questions customers ask most. The chatbot uses them to answer visitors automatically."
          actionLabel="Add your first FAQ"
          onAction={() => setEditing({ ...blank })}
        />
      ) : (
        <div className="space-y-3">
          {items.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className={`${card} p-4 group hover:ring-white/15 transition-[box-shadow,--tw-ring-color] duration-200`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{f.question}</p>
                  <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{f.answer}</p>
                  {!f.active && <div className="mt-2"><HiddenBadge /></div>}
                </div>
                <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
                  <button aria-label="Edit FAQ" className="h-8 w-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-150 hover:cursor-pointer" onClick={() => setEditing({ ...f })}>
                    <FontAwesomeIcon icon={faPen} className="text-xs" />
                  </button>
                  <button aria-label="Delete FAQ" className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 hover:cursor-pointer" onClick={() => remove(f)}>
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Site Content ----------------
function SiteContentTab() {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const toast = useToast();

  const load = useCallback(() => {
    setLoading(true);
    return CmsService.getSiteContent()
      .then((data) => {
        setItems(data);
        setDrafts(Object.fromEntries(data.map((c) => [c.contentKey, c.content])));
      })
      .catch((err) => toast.error('Could not load site content', err.message))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (item) => {
    setSavingKey(item.contentKey);
    try {
      await CmsService.saveSiteContent(item.contentKey, { ...item, content: drafts[item.contentKey] });
      toast.success('Content saved', item.label);
      load();
    } catch (err) {
      toast.error('Could not save content', err?.response?.data?.message || err.message);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <Skeleton rows={4} className="h-28" />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={faFileLines}
        title="No content blocks"
        body="Site copy blocks (About text, contact details, policies) appear here once seeded."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
        Freeform copy used across the site — About text, contact details, policies. The chatbot
        also answers from these, so contact details and policies should stay current.
      </p>
      {items.map((item, i) => {
        const dirty = drafts[item.contentKey] !== item.content;
        return (
          <motion.div
            key={item.contentKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
            className={`${card} p-4`}
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-[11px] text-gray-600 font-mono mt-0.5">{item.contentKey}</p>
              </div>
              {dirty && (
                <span className="text-[11px] text-amber-400 shrink-0">Unsaved changes</span>
              )}
            </div>
            <textarea
              className={input}
              rows={Math.min(8, Math.max(2, String(drafts[item.contentKey] || '').split('\n').length + 1))}
              value={drafts[item.contentKey] || ''}
              onChange={(e) => setDrafts({ ...drafts, [item.contentKey]: e.target.value })}
            />
            <button
              className={`${primaryBtn} mt-3`}
              onClick={() => save(item)}
              disabled={!dirty || savingKey === item.contentKey}
            >
              <FontAwesomeIcon icon={faSave} />
              {savingKey === item.contentKey ? 'Saving…' : 'Save'}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

export default ContentSection;
