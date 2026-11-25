"""The enhancer: one swappable module.

enhance(title, rough_notes, transcript, template_id) -> (enhanced_notes, mode)

- If ANTHROPIC_API_KEY is set, Claude writes the notes (mode "ai").
- Otherwise a deterministic, rule-based enhancer does (mode "local").

Both modes return exactly the template's sections, in order, as "## " headings.
Summary gets a paragraph; every other section gets "- " bullets ("- None noted" if empty).
"""
import os
import re

from templates import sections_for

MAX_TRANSCRIPT_CHARS = 20000
EMPTY = "- None noted"


class EnhanceError(Exception):
    pass


def enhance(title, rough_notes, transcript, template_id):
    transcript = (transcript or "")[:MAX_TRANSCRIPT_CHARS]
    sections = sections_for(template_id)
    if os.environ.get("ANTHROPIC_API_KEY"):
        return _enhance_with_claude(title, rough_notes or "", transcript, sections), "ai"
    return enhance_locally(title, rough_notes or "", transcript, sections), "local"


# ---- formatting shared by both modes -------------------------------------

def _render(sections, content):
    """content maps section name -> summary paragraph (str) or list of bullet strings."""
    blocks = []
    for name in sections:
        body = content.get(name)
        if name == "Summary":
            text = (body or "").strip() or "None noted."
        else:
            bullets = [b.strip() for b in (body or []) if b and b.strip()]
            text = "\n".join("- " + b for b in bullets) if bullets else EMPTY
        blocks.append(f"## {name}\n{text}")
    return "\n\n".join(blocks)


# ---- Claude mode ---------------------------------------------------------

def _enhance_with_claude(title, rough_notes, transcript, sections):
    try:
        import anthropic  # lazy import: not needed in local mode

        client = anthropic.Anthropic(timeout=60)
        prompt = (
            "You turn a person's rough meeting notes plus the meeting transcript into clean, "
            "structured meeting notes. Treat the rough notes as the signal for what mattered most.\n\n"
            f"Use exactly these sections, in this order, each as a '## ' heading: {', '.join(sections)}.\n"
            "Under Summary write one short paragraph (no bullets). Under every other section write "
            "'- ' bullet lines only. If a section has nothing, write '- None noted'. "
            "Output only the notes, no preamble.\n\n"
            f"Meeting title: {title}\n\nRough notes:\n{rough_notes or '(none)'}\n\n"
            f"Transcript:\n{transcript or '(none)'}"
        )
        message = client.messages.create(
            model=os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5"),
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(block.text for block in message.content if getattr(block, "type", "") == "text")
    except Exception as exc:  # any SDK, network or auth failure
        raise EnhanceError(str(exc)) from exc
    if not text.strip():
        raise EnhanceError("Empty response from Claude")
    return _normalise(text, sections)


def _normalise(text, sections):
    """Force Claude's output into the exact template format, whatever it returned."""
    found, current = {}, None
    for line in text.splitlines():
        heading = re.match(r"^#+\s*(.+?)\s*$", line)
        if heading:
            current = heading.group(1).strip().rstrip(":").lower()
            found.setdefault(current, [])
        elif current is not None and line.strip():
            found[current].append(line.strip())

    content = {}
    for name in sections:
        lines = found.get(name.lower(), [])
        if name == "Summary":
            content[name] = " ".join(re.sub(r"^[-*•]\s*", "", l) for l in lines)
        else:
            bullets = [re.sub(r"^[-*•]\s*", "", l) for l in lines]
            content[name] = [b for b in bullets if b.lower().rstrip(".") != "none noted"]
    return _render(sections, content)


# ---- local rule-based mode -----------------------------------------------

ACTION_WORDS = ["send", "follow up", "follow-up", "will", "by", "todo", "to do", "action"]
PAIN_WORDS = ["expensive", "price", "pricing", "cost", "budget", "problem", "issue", "pain",
              "frustrat", "slow", "hard", "difficult", "struggl", "manual", "missing", "lack",
              "can't", "cannot", "pushback", "concern"]
FEEDBACK_WORDS = ["feedback", "great job", "good job", "well done", "nice work", "improve",
                  "should", "suggest", "proud", "concern", "praise", "growth"]
BLOCKER_WORDS = ["blocked", "blocker", "blocking", "stuck", "waiting on", "waiting for",
                 "depends on", "dependency", "can't", "cannot"]
QUOTE_WORDS = PAIN_WORDS + ["need", "want", "love", "hate", "wish", "must", "honestly", "really"]
STOPWORDS = {"the", "and", "for", "that", "this", "with", "have", "from", "they", "what", "about",
             "would", "there", "their", "will", "your", "just", "like", "been", "were", "want"}


def _has_word(text, words):
    """Short words ("by", "will") must match whole words; longer ones match as stems ("frustrat")."""
    lower = text.lower()
    for w in words:
        tail = "" if len(w) > 5 else r"(?![a-z])"
        if re.search(r"(?<![a-z])" + re.escape(w) + tail, lower):
            return True
    return False


def _rough_lines(rough_notes):
    lines = []
    for line in rough_notes.splitlines():
        clean = re.sub(r"^\s*[-*•]+\s*", "", line).strip()
        if clean:
            lines.append(clean[0].upper() + clean[1:])
    return lines


def _transcript_sentences(transcript):
    """Returns a list of (speaker or None, sentence)."""
    out = []
    for line in transcript.splitlines():
        line = line.strip()
        if not line:
            continue
        speaker = None
        m = re.match(r"^([A-Z][\w .'-]{0,30}):\s+(.*)$", line)
        if m:
            speaker, line = m.group(1).strip(), m.group(2)
        for sentence in re.split(r"(?<=[.!?])\s+", line):
            if sentence.strip():
                out.append((speaker, sentence.strip()))
    return out


def _keywords(text):
    return {w for w in re.findall(r"[a-z0-9']+", text.lower()) if len(w) > 2 and w not in STOPWORDS}


def _best_match(line, sentences):
    words = _keywords(line)
    best, best_score = None, 0
    for speaker, sentence in sentences:
        score = len(words & _keywords(sentence))
        if score > best_score:
            best, best_score = (speaker, sentence), score
    return best


def _attributed(speaker, sentence):
    return f"{speaker}: {sentence}" if speaker else sentence


def _unique(items, limit):
    seen, out = set(), []
    for item in items:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out[:limit]


def enhance_locally(title, rough_notes, transcript, sections):
    rough = _rough_lines(rough_notes)
    sentences = _transcript_sentences(transcript)
    candidates = rough + [_attributed(s, t) for s, t in sentences]

    # Summary: title plus the first transcript sentences (or the first rough notes).
    opening = [t for _, t in sentences[:2]] or [r.rstrip(".") + "." for r in rough[:2]]
    summary = f"{(title or 'Untitled meeting').strip().rstrip('.')}." + (" " + " ".join(opening) if opening else "")

    # Key points: each rough line, expanded with the most relevant transcript sentence.
    if rough:
        key_points = []
        for line in rough:
            match = _best_match(line, sentences)
            key_points.append(f"{line} ({_attributed(*match)})" if match else line)
    else:
        key_points = [_attributed(s, t) for s, t in sentences[:5]]

    content = {
        "Summary": summary,
        "Key points": _unique(key_points, 10),
        "Next steps": _unique([c for c in candidates if _has_word(c, ACTION_WORDS)], 8),
        "Pain points": _unique([c for c in candidates if _has_word(c, PAIN_WORDS)], 5),
        "Quotes": _unique([f'"{t}" ({s})' if s else f'"{t}"'
                           for s, t in sentences if _has_word(t, QUOTE_WORDS)], 3),
        "Feedback": _unique([c for c in candidates if _has_word(c, FEEDBACK_WORDS)], 5),
        "Blockers": _unique([c for c in candidates if _has_word(c, BLOCKER_WORDS)], 5),
    }
    return _render(sections, content)
