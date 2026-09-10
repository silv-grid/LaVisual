/**
 * Content (CMS) Section
 *
 * Admin screen for managing the site's editable content: service packages,
 * portfolio gallery images, FAQs, and freeform site copy (About text,
 * contact info, policies). Everything here is read by the public site and
 * by the chatbot's knowledge index, so edits here show up in both places
 * without a code deploy.
 */
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPen, faUpload, faSave, faXmark } from '@fortawesome/free-solid-svg-icons';
import CmsService from '../components/service/CmsService';

const TABS = ['Packages', 'Portfolio', 'FAQs', 'Site Content'];

function ContentSection() {
  const [tab, setTab] = useState('Packages');

  return (
    <div className="text-white pb-12">
      <h2 className="text-2xl font-bold mb-4">Content Management</h2>
      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 hover:cursor-pointer ${tab === t ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Packages' && <PackagesTab />}
      {tab === 'Portfolio' && <PortfolioTab />}
      {tab === 'FAQs' && <FaqsTab />}
      {tab === 'Site Content' && <SiteContentTab />}
    </div>
  );
}

// Shared small button styles
const btn = "px-3 py-1.5 rounded-lg text-sm hover:cursor-pointer";
const primaryBtn = `${btn} bg-purple-600 hover:bg-purple-700`;
const dangerBtn = `${btn} bg-red-600/80 hover:bg-red-600`;
const neutralBtn = `${btn} bg-gray-700 hover:bg-gray-600`;
const input = "w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500";

function ImageUploadField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await CmsService.uploadFile(file);
      onChange(result.url);
    } catch (err) {
      alert('Upload failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="flex items-center space-x-2">
      <input className={input} placeholder="Image URL" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      <label className={`${neutralBtn} flex items-center space-x-1 whitespace-nowrap`}>
        <FontAwesomeIcon icon={faUpload} />
        <span>{uploading ? 'Uploading...' : 'Upload'}</span>
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
    </div>
  );
}

// ---------------- Packages ----------------
function PackagesTab() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null = not editing, {} = new, {...} = existing
  const [loading, setLoading] = useState(true);

  const load = () => CmsService.getPackages(false).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const blank = { category: 'Photography', name: '', price: 0, description: '', features: [], imageUrl: '', displayOrder: 0, active: true };

  const save = async () => {
    const payload = { ...editing, features: typeof editing.features === 'string' ? editing.features.split('\n').filter(Boolean) : editing.features };
    if (editing.id) await CmsService.updatePackage(editing.id, payload);
    else await CmsService.createPackage(payload);
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    await CmsService.deletePackage(id);
    load();
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div>
      <button className={`${primaryBtn} mb-4 flex items-center space-x-2`} onClick={() => setEditing({ ...blank })}>
        <FontAwesomeIcon icon={faPlus} /> <span>Add Package</span>
      </button>

      {editing && (
        <div className="bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className={input} placeholder="Category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            <input className={input} placeholder="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <input className={input} type="number" placeholder="Price" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
            <input className={input} type="number" placeholder="Display order" value={editing.displayOrder} onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })} />
          </div>
          <textarea className={input} placeholder="Description" rows={2} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          <textarea className={input} placeholder="Features (one per line)" rows={4}
            value={Array.isArray(editing.features) ? editing.features.join('\n') : editing.features || ''}
            onChange={(e) => setEditing({ ...editing, features: e.target.value })} />
          <ImageUploadField value={editing.imageUrl} onChange={(url) => setEditing({ ...editing, imageUrl: url })} />
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
            <span>Active (visible on site)</span>
          </label>
          <div className="flex space-x-2">
            <button className={`${primaryBtn} flex items-center space-x-2`} onClick={save}><FontAwesomeIcon icon={faSave} /><span>Save</span></button>
            <button className={`${neutralBtn} flex items-center space-x-2`} onClick={() => setEditing(null)}><FontAwesomeIcon icon={faXmark} /><span>Cancel</span></button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p.id} className="bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-purple-400">{p.category}</p>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-400">₱{p.price}</p>
              </div>
              <div className="flex space-x-2">
                <button className="text-gray-400 hover:text-white hover:cursor-pointer" onClick={() => setEditing({ ...p })}><FontAwesomeIcon icon={faPen} /></button>
                <button className="text-red-400 hover:text-red-300 hover:cursor-pointer" onClick={() => remove(p.id)}><FontAwesomeIcon icon={faTrash} /></button>
              </div>
            </div>
            {!p.active && <p className="text-xs text-yellow-500 mt-2">Hidden (inactive)</p>}
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500">No packages yet.</p>}
      </div>
    </div>
  );
}

// ---------------- Portfolio ----------------
function PortfolioTab() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => CmsService.getPortfolio(false).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const blank = { category: 'wedding', imageUrl: '', caption: '', displayOrder: 0, active: true };

  const save = async () => {
    if (editing.id) await CmsService.updatePortfolioItem(editing.id, editing);
    else await CmsService.createPortfolioItem(editing);
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this image?')) return;
    await CmsService.deletePortfolioItem(id);
    load();
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div>
      <button className={`${primaryBtn} mb-4 flex items-center space-x-2`} onClick={() => setEditing({ ...blank })}>
        <FontAwesomeIcon icon={faPlus} /> <span>Add Image</span>
      </button>

      {editing && (
        <div className="bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
          <input className={input} placeholder="Category (wedding, portrait, sports, video, ...)" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
          <ImageUploadField value={editing.imageUrl} onChange={(url) => setEditing({ ...editing, imageUrl: url })} />
          <input className={input} placeholder="Caption (optional)" value={editing.caption || ''} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} />
          <input className={input} type="number" placeholder="Display order" value={editing.displayOrder} onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })} />
          <div className="flex space-x-2">
            <button className={`${primaryBtn} flex items-center space-x-2`} onClick={save}><FontAwesomeIcon icon={faSave} /><span>Save</span></button>
            <button className={`${neutralBtn} flex items-center space-x-2`} onClick={() => setEditing(null)}><FontAwesomeIcon icon={faXmark} /><span>Cancel</span></button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden">
            {item.imageUrl && <img src={item.imageUrl} alt={item.caption || item.category} className="w-full h-28 object-cover" />}
            <div className="p-2">
              <p className="text-xs text-purple-400 truncate">{item.category}</p>
              <div className="flex justify-between items-center mt-1">
                <button className="text-gray-400 hover:text-white hover:cursor-pointer" onClick={() => setEditing({ ...item })}><FontAwesomeIcon icon={faPen} /></button>
                <button className="text-red-400 hover:text-red-300 hover:cursor-pointer" onClick={() => remove(item.id)}><FontAwesomeIcon icon={faTrash} /></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500">No portfolio images yet.</p>}
      </div>
    </div>
  );
}

// ---------------- FAQs ----------------
function FaqsTab() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => CmsService.getFaqs(false).then(setItems).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const blank = { question: '', answer: '', displayOrder: 0, active: true };

  const save = async () => {
    if (editing.id) await CmsService.updateFaq(editing.id, editing);
    else await CmsService.createFaq(editing);
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    await CmsService.deleteFaq(id);
    load();
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div>
      <button className={`${primaryBtn} mb-4 flex items-center space-x-2`} onClick={() => setEditing({ ...blank })}>
        <FontAwesomeIcon icon={faPlus} /> <span>Add FAQ</span>
      </button>

      {editing && (
        <div className="bg-gray-800 rounded-xl p-4 mb-6 space-y-3">
          <input className={input} placeholder="Question" value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
          <textarea className={input} placeholder="Answer" rows={3} value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
          <input className={input} type="number" placeholder="Display order" value={editing.displayOrder} onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })} />
          <p className="text-xs text-gray-500">FAQs are used by the AI chatbot to answer visitor questions - keep answers accurate.</p>
          <div className="flex space-x-2">
            <button className={`${primaryBtn} flex items-center space-x-2`} onClick={save}><FontAwesomeIcon icon={faSave} /><span>Save</span></button>
            <button className={`${neutralBtn} flex items-center space-x-2`} onClick={() => setEditing(null)}><FontAwesomeIcon icon={faXmark} /><span>Cancel</span></button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((f) => (
          <div key={f.id} className="bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{f.question}</p>
                <p className="text-sm text-gray-400 mt-1">{f.answer}</p>
              </div>
              <div className="flex space-x-2 shrink-0 ml-4">
                <button className="text-gray-400 hover:text-white hover:cursor-pointer" onClick={() => setEditing({ ...f })}><FontAwesomeIcon icon={faPen} /></button>
                <button className="text-red-400 hover:text-red-300 hover:cursor-pointer" onClick={() => remove(f.id)}><FontAwesomeIcon icon={faTrash} /></button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500">No FAQs yet.</p>}
      </div>
    </div>
  );
}

// ---------------- Site Content ----------------
function SiteContentTab() {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => CmsService.getSiteContent().then((data) => {
    setItems(data);
    const d = {};
    data.forEach((c) => { d[c.contentKey] = c.content; });
    setDrafts(d);
  }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async (item) => {
    await CmsService.saveSiteContent(item.contentKey, { ...item, content: drafts[item.contentKey] });
    load();
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Freeform site copy (About text, contact info, policies). Also used by the chatbot to answer questions.
      </p>
      {items.map((item) => (
        <div key={item.contentKey} className="bg-gray-800 rounded-xl p-4">
          <p className="font-semibold mb-2">{item.label} <span className="text-xs text-gray-500">({item.contentKey})</span></p>
          <textarea
            className={input}
            rows={3}
            value={drafts[item.contentKey] || ''}
            onChange={(e) => setDrafts({ ...drafts, [item.contentKey]: e.target.value })}
          />
          <button className={`${primaryBtn} mt-2 flex items-center space-x-2`} onClick={() => save(item)}>
            <FontAwesomeIcon icon={faSave} /><span>Save</span>
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="text-gray-500">No content blocks yet.</p>}
    </div>
  );
}

export default ContentSection;
