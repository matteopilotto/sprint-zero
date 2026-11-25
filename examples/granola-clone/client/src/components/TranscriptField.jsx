import { useRef } from 'react';

// Transcript text area plus an "Upload .txt" button that fills it from a file.
export default function TranscriptField({ value, onChange }) {
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(onChange);
    e.target.value = ''; // allow choosing the same file again
  }

  return (
    <section className="field-block">
      <div className="field-head">
        <label htmlFor="transcript">Transcript</label>
        <button type="button" className="ghost small" data-testid="upload-transcript-button"
          onClick={() => fileRef.current?.click()}>
          Upload .txt
        </button>
        <input ref={fileRef} type="file" accept=".txt,text/plain" hidden
          data-testid="transcript-file-input" aria-label="Transcript file" onChange={handleFile} />
      </div>
      <textarea id="transcript" name="transcript" data-testid="transcript-input" rows={8}
        placeholder="Paste the meeting transcript..." value={value}
        onChange={(e) => onChange(e.target.value)} />
    </section>
  );
}
