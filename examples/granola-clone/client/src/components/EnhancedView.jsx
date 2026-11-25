// Tiny renderer for the enhanced notes format: "## " headings, "- " bullets,
// and plain paragraphs. Builds React elements, so no HTML injection is possible.
export default function EnhancedView({ text }) {
  const blocks = [];
  let bullets = [];
  let para = [];

  const flushBullets = () => {
    if (bullets.length) blocks.push({ type: 'ul', items: bullets });
    bullets = [];
  };
  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
    para = [];
  };

  for (const raw of (text || '').split('\n')) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      flushBullets(); flushPara();
      blocks.push({ type: 'h2', text: line.slice(3) });
    } else if (line.startsWith('- ')) {
      flushPara();
      bullets.push(line.slice(2));
    } else if (line === '') {
      flushBullets(); flushPara();
    } else {
      flushBullets();
      para.push(line);
    }
  }
  flushBullets(); flushPara();

  return (
    <div className="enhanced" data-testid="enhanced-notes">
      {blocks.map((b, i) => {
        if (b.type === 'h2') return <h2 key={i}>{b.text}</h2>;
        if (b.type === 'p') return <p key={i}>{b.text}</p>;
        return (
          <ul key={i}>
            {b.items.map((item, j) => <li key={j}>{item}</li>)}
          </ul>
        );
      })}
    </div>
  );
}
