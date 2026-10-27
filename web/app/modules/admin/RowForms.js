'use client';

// Pautan and Pengumuman editors. Each item is a card; "Ubah" opens a form with a label above every box.
// Errors keep what was typed; a successful save closes the form and shows "Disimpan ✓" on the card.
import { useActionState, useEffect, useRef, useState } from 'react';
import { deleteAnnouncement, deleteLink, saveAnnouncement, saveLink } from '@/app/admin/actions';
import { fmtDate } from '../ui/format';
import Icon from './icons';

const dateInput = (iso) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }) : '');
const shortUrl = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/, '').slice(0, 60);

// Runs `fn` once each time an action finishes successfully.
function useOnSaved(state, fn) {
  const seen = useRef(null);
  useEffect(() => {
    if (state?.ok && state.at !== seen.current) { seen.current = state.at; fn(); }
  }, [state, fn]);
}

function Saved({ show }) {
  return show ? <span className="chip good" role="status">Disimpan ✓</span> : null;
}

function DeleteButton({ action, pending, label }) {
  return (
    <button formAction={action} className="btn danger ghost" formNoValidate disabled={pending}
      onClick={(e) => { if (!confirm(`Padam "${label}"? Ini tidak boleh dibatalkan.`)) e.preventDefault(); }}>
      Padam
    </button>
  );
}

// ---- Pautan ----

function LinkForm({ link: saved, trackers, onClose, onSaved }) {
  const [save, saveAction, saving] = useActionState(saveLink, undefined);
  const [del, delAction, deleting] = useActionState(deleteLink, undefined);
  useOnSaved(save, onSaved);
  useOnSaved(del, onSaved);
  const v = save?.values;
  const link = v ? { ...saved, ...v, is_active: v.is_active === 'on', id: saved?.id } : saved;
  const error = del?.error || save?.error;
  return (
    <form action={saveAction} className="edit-form">
      <input type="hidden" name="id" value={link?.id ?? ''} />
      <div className="field-grid">
        <label className="wide">Tajuk butang
          <input name="title" required maxLength={120} defaultValue={link?.title} placeholder="cth. Borang Kehadiran Mesyuarat" autoFocus />
        </label>
        <label className="wide">Pautan (URL)
          <input name="url" type="url" required defaultValue={link?.url} placeholder="https://forms.gle/…" />
          <small>Untuk Google Form: Hantar → 🔗 → salin pautan pendek (forms.gle/…).</small>
        </label>
        <label>Kategori
          <input name="category" list="categories" defaultValue={link?.category ?? 'Umum'} />
          <small>Butang dalam kategori sama berwarna sama.</small>
        </label>
        <label>Kemajuan pada butang
          <select name="tracker_key" defaultValue={link?.tracker_key ?? ''}>
            <option value="">Tiada</option>
            {trackers.map((t) => <option key={t.key} value={t.key}>{t.title}</option>)}
          </select>
          <small>Paparkan “x/y dihantar” pada butang.</small>
        </label>
        <label className="wide">Nota kecil di bawah tajuk (pilihan)
          <input name="description" maxLength={120} defaultValue={link?.description ?? ''} />
        </label>
        <label>Susunan
          <input name="sort_order" type="number" step="1" defaultValue={link?.sort_order ?? 0} />
          <small>Nombor kecil dipaparkan dahulu.</small>
        </label>
        <label className="switch">
          <input name="is_active" type="checkbox" defaultChecked={link?.is_active ?? true} />
          <span>Paparkan di dashboard</span>
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Menyimpan…' : saved ? 'Simpan perubahan' : 'Tambah pautan'}</button>
        <button type="button" className="btn" onClick={onClose}>Batal</button>
        {saved && <DeleteButton action={delAction} pending={deleting} label={link.title} />}
      </div>
    </form>
  );
}

function LinkCard({ link, trackers, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const tracker = trackers.find((t) => t.key === link.tracker_key);
  if (editing) {
    return (
      <li className="item-card editing">
        <LinkForm link={link} trackers={trackers} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 3000); }} />
      </li>
    );
  }
  return (
    <li className={`item-card${link.is_active ? '' : ' hidden-item'}`}>
      <div className="item-main">
        <strong className="item-title">{link.title}</strong>
        <a href={link.url} target="_blank" rel="noreferrer" className="item-url">{shortUrl(link.url)} ↗</a>
        <span className="item-chips">
          {!link.is_active && <span className="chip neutral">Tersembunyi</span>}
          {tracker && <span className="chip">Kemajuan: {tracker.title}</span>}
          {link.source === 'sheet' && <span className="chip neutral">dari sheet PAUTAN</span>}
          <Saved show={saved} />
        </span>
      </div>
      {!readOnly && (
        <button type="button" className="btn" onClick={() => setEditing(true)}><Icon name="edit" size={16} /> Ubah</button>
      )}
    </li>
  );
}

export function LinkManager({ links, trackers, readOnly }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const groups = [...new Set(links.map((l) => l.category))].map((c) => [c, links.filter((l) => l.category === c)]);
  return (
    <>
      <datalist id="categories">{groups.map(([c]) => <option key={c} value={c} />)}</datalist>
      {!readOnly && (
        <div className="toolbar">
          {!adding && <button type="button" className="btn primary" onClick={() => { setAdding(true); setAdded(false); }}><Icon name="plus" size={18} /> Tambah pautan</button>}
          {added && <span className="chip good" role="status">Pautan ditambah ✓</span>}
        </div>
      )}
      {adding && (
        <div className="item-card editing new">
          <h2>Pautan baharu</h2>
          <LinkForm trackers={trackers} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); setAdded(true); }} />
        </div>
      )}
      {!links.length && <p className="muted">Belum ada pautan.</p>}
      {groups.map(([category, items]) => (
        <section key={category} className="item-group">
          <h2>{category} <span className="count">{items.length}</span></h2>
          <ul className="item-list">
            {items.map((l) => <LinkCard key={l.id} link={l} trackers={trackers} readOnly={readOnly} />)}
          </ul>
        </section>
      ))}
    </>
  );
}

// ---- Pengumuman ----

function AnnouncementForm({ a: saved, onClose, onSaved }) {
  const [save, saveAction, saving] = useActionState(saveAnnouncement, undefined);
  const [del, delAction, deleting] = useActionState(deleteAnnouncement, undefined);
  useOnSaved(save, onSaved);
  useOnSaved(del, onSaved);
  const v = save?.values;
  const a = v ? { ...saved, ...v, expires_at: v.expires_at ? `${v.expires_at}T12:00:00+08:00` : null, is_active: v.is_active === 'on', id: saved?.id } : saved;
  const error = del?.error || save?.error;
  return (
    <form action={saveAction} className="edit-form">
      <input type="hidden" name="id" value={a?.id ?? ''} />
      <div className="field-grid">
        <label className="wide">Tajuk
          <input name="title" required maxLength={200} defaultValue={a?.title} placeholder="cth. Mesyuarat guru Jumaat 2 petang" autoFocus />
        </label>
        <label className="wide">Butiran (pilihan)
          <textarea name="body" maxLength={2000} rows={3} defaultValue={a?.body ?? ''} />
        </label>
        <label>Tamat pada (pilihan)
          <input name="expires_at" type="date" defaultValue={dateInput(a?.expires_at)} />
          <small>Selepas tarikh ini pengumuman hilang sendiri.</small>
        </label>
        <label className="switch">
          <input name="is_active" type="checkbox" defaultChecked={a?.is_active ?? true} />
          <span>Paparkan di dashboard</span>
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Menyimpan…' : saved ? 'Simpan perubahan' : 'Tambah pengumuman'}</button>
        <button type="button" className="btn" onClick={onClose}>Batal</button>
        {saved && <DeleteButton action={delAction} pending={deleting} label={a.title} />}
      </div>
    </form>
  );
}

function AnnouncementCard({ a, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const expired = a.expires_at && Date.parse(a.expires_at) < Date.now();
  if (editing) {
    return (
      <li className="item-card editing">
        <AnnouncementForm a={a} onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 3000); }} />
      </li>
    );
  }
  return (
    <li className={`item-card${a.is_active && !expired ? '' : ' hidden-item'}`}>
      <div className="item-main">
        <strong className="item-title">{a.title}</strong>
        {a.body && <span className="item-body">{a.body}</span>}
        <span className="item-chips">
          {!a.is_active ? <span className="chip neutral">Tersembunyi</span>
            : expired ? <span className="chip neutral">Sudah tamat</span>
            : <span className="chip good">Dipaparkan</span>}
          {a.expires_at && !expired && <span className="chip">Tamat {fmtDate(a.expires_at)}</span>}
          <Saved show={saved} />
        </span>
      </div>
      {!readOnly && (
        <button type="button" className="btn" onClick={() => setEditing(true)}><Icon name="edit" size={16} /> Ubah</button>
      )}
    </li>
  );
}

export function AnnouncementManager({ announcements, readOnly }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  return (
    <>
      {!readOnly && (
        <div className="toolbar">
          {!adding && <button type="button" className="btn primary" onClick={() => { setAdding(true); setAdded(false); }}><Icon name="plus" size={18} /> Tambah pengumuman</button>}
          {added && <span className="chip good" role="status">Pengumuman ditambah ✓</span>}
        </div>
      )}
      {adding && (
        <div className="item-card editing new">
          <h2>Pengumuman baharu</h2>
          <AnnouncementForm onClose={() => setAdding(false)} onSaved={() => { setAdding(false); setAdded(true); }} />
        </div>
      )}
      {announcements.length
        ? <ul className="item-list">{announcements.map((a) => <AnnouncementCard key={a.id} a={a} readOnly={readOnly} />)}</ul>
        : <p className="muted">Belum ada pengumuman.</p>}
    </>
  );
}
