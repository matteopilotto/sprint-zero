import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../api/client.js';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function NotesListPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [notes, setNotes] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.listNotes().then((data) => setNotes(data.notes)).catch((err) => setError(err.message));
  }, [api]);

  async function handleNew() {
    setCreating(true);
    try {
      const note = await api.createNote({});
      navigate(`/notes/${note.id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Your notes</h1>
        <button type="button" className="primary" data-testid="new-note-button"
          onClick={handleNew} disabled={creating}>
          New note
        </button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {notes === null && !error && <p className="muted">Loading...</p>}
      {notes && notes.length === 0 && (
        <p className="empty">No notes yet. Click New note to start.</p>
      )}

      {notes && notes.length > 0 && (
        <ul className="note-list" data-testid="note-list">
          {notes.map((n) => (
            <li key={n.id}>
              <Link to={`/notes/${n.id}`} className="note-row" data-testid="note-row">
                <span className="note-title">{n.title}</span>
                <span className="note-meta">
                  {n.is_enhanced && <span className="badge">Enhanced</span>}
                  <span className="muted">{formatDate(n.updated_at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
