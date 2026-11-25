import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../api/client.js';
import EnhancedView from '../components/EnhancedView.jsx';
import TranscriptField from '../components/TranscriptField.jsx';

const UNTITLED = 'Untitled meeting';
const ENHANCE_FAILED = 'Enhancement failed. Your notes are unchanged.';

export default function NoteEditorPage() {
  const { id } = useParams();
  const api = useApi();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);       // last saved version from the API
  const [templates, setTemplates] = useState([]);
  const [title, setTitle] = useState('');
  const [roughNotes, setRoughNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [template, setTemplate] = useState('general');
  const [tab, setTab] = useState('mine');       // 'mine' | 'enhanced'
  const [editingEnhanced, setEditingEnhanced] = useState(false);
  const [enhancedDraft, setEnhancedDraft] = useState('');
  const [status, setStatus] = useState('');     // '', 'Saving...', 'Saved'
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState('');

  function loadInto(n) {
    setNote(n);
    // The backend stores a blank title as "Untitled meeting"; show it as empty.
    setTitle(n.title === UNTITLED ? '' : n.title);
    setRoughNotes(n.rough_notes);
    setTranscript(n.transcript);
    setTemplate(n.template);
    setEnhancedDraft(n.enhanced_notes || '');
  }

  useEffect(() => {
    api.getNote(id).then(loadInto).catch((err) => setError(err.message));
    api.listTemplates().then((d) => setTemplates(d.templates)).catch(() => {});
  }, [api, id]);

  // Any edit clears the "Saved" marker.
  const edit = (setter) => (value) => { setter(value); setStatus(''); };

  const fields = () => ({ title, rough_notes: roughNotes, transcript, template });

  async function handleSave() {
    setError('');
    setStatus('Saving...');
    try {
      const body = editingEnhanced ? { ...fields(), enhanced_notes: enhancedDraft } : fields();
      loadInto(await api.updateNote(id, body));
      setEditingEnhanced(false);
      setStatus('Saved');
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  }

  async function handleEnhance() {
    if (note.enhanced_notes && !window.confirm('Replace the current enhanced notes?')) return;
    setError('');
    setEnhancing(true);
    try {
      await api.updateNote(id, fields()); // save first, the enhancer reads saved fields
      loadInto(await api.enhanceNote(id));
      setEditingEnhanced(false);
      setTab('enhanced');
      setStatus('Saved');
    } catch (err) {
      setError(err.code === 'network_error' ? ENHANCE_FAILED : err.message || ENHANCE_FAILED);
    } finally {
      setEnhancing(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.deleteNote(id);
      navigate('/notes');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!note) {
    return error ? <p className="error" role="alert">{error}</p> : <p className="muted">Loading...</p>;
  }

  const hasEnhanced = Boolean(note.enhanced_notes);
  const canEnhance = (roughNotes.trim() || transcript.trim()) && !enhancing;

  return (
    <div className="editor">
      <input className="title-input" name="title" data-testid="title-input" aria-label="Meeting title"
        placeholder="Meeting title" value={title} autoFocus
        onChange={(e) => edit(setTitle)(e.target.value)} />

      <div className="toolbar">
        <label className="inline">
          Template
          <select name="template" data-testid="template-select" value={template}
            onChange={(e) => edit(setTemplate)(e.target.value)}>
            {templates.length === 0 && <option value={template}>{template}</option>}
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <div className="toolbar-right">
          {status && <span className="status" data-testid="save-status">{status}</span>}
          <button type="button" data-testid="save-note" onClick={handleSave}>Save</button>
          <button type="button" className="primary" data-testid="enhance-button"
            onClick={handleEnhance} disabled={!canEnhance}>
            {enhancing ? 'Enhancing...' : 'Enhance'}
          </button>
          <button type="button" className="danger" data-testid="delete-note" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="tabs">
        <button type="button" data-testid="tab-my-notes"
          className={tab === 'mine' ? 'tab active' : 'tab'} onClick={() => setTab('mine')}>
          My notes
        </button>
        <button type="button" data-testid="tab-enhanced" disabled={!hasEnhanced}
          className={tab === 'enhanced' ? 'tab active' : 'tab'} onClick={() => setTab('enhanced')}>
          Enhanced
        </button>
      </div>

      {tab === 'mine' || !hasEnhanced ? (
        <textarea name="rough_notes" data-testid="rough-notes-input" aria-label="My notes" rows={10}
          placeholder="Write notes..." value={roughNotes}
          onChange={(e) => edit(setRoughNotes)(e.target.value)} />
      ) : (
        <section className="enhanced-panel">
          <div className="field-head">
            <span className="mode-label" data-testid="enhanced-mode">
              {note.enhanced_mode === 'ai' ? 'Enhanced with AI' : 'Enhanced locally'}
            </span>
            {!editingEnhanced && (
              <button type="button" className="ghost small" data-testid="edit-enhanced"
                onClick={() => { setEnhancedDraft(note.enhanced_notes); setEditingEnhanced(true); }}>
                Edit
              </button>
            )}
          </div>
          {editingEnhanced ? (
            <textarea name="enhanced_notes" data-testid="enhanced-notes-input" aria-label="Enhanced notes"
              rows={14} value={enhancedDraft} onChange={(e) => edit(setEnhancedDraft)(e.target.value)} />
          ) : (
            <EnhancedView text={note.enhanced_notes} />
          )}
        </section>
      )}

      <TranscriptField value={transcript} onChange={edit(setTranscript)} />
    </div>
  );
}
