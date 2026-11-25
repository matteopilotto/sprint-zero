"""Meeting notes: CRUD plus enhance. Every query is scoped to the signed-in user."""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel

from auth import current_user_id
from db import connect, now_iso
from enhancer import EnhanceError, enhance
from errors import ApiError, invalid_input
from templates import TEMPLATE_IDS

router = APIRouter(prefix="/api/notes")

NOTE_FIELDS = ["id", "title", "rough_notes", "transcript", "template", "enhanced_notes",
               "enhanced_mode", "enhanced_at", "created_at", "updated_at"]


class NoteCreate(BaseModel):
    title: Optional[str] = None
    rough_notes: Optional[str] = None
    transcript: Optional[str] = None
    template: Optional[str] = None


class NoteUpdate(NoteCreate):
    enhanced_notes: Optional[str] = None


def clean_title(title):
    return (title or "").strip() or "Untitled meeting"


def check_template(template):
    if template not in TEMPLATE_IDS:
        raise invalid_input("Unknown template")
    return template


def to_note(row):
    return {field: row[field] for field in NOTE_FIELDS}


def find_note(conn, note_id, user_id):
    row = conn.execute("SELECT * FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id)).fetchone()
    if not row:
        raise ApiError(404, "not_found", "Note not found")
    return row


@router.get("")
def list_notes(user_id: str = Depends(current_user_id)):
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC, rowid DESC", (user_id,)
        ).fetchall()
    notes = [
        {"id": r["id"], "title": r["title"], "template": r["template"],
         "is_enhanced": r["enhanced_notes"] is not None,
         "created_at": r["created_at"], "updated_at": r["updated_at"]}
        for r in rows
    ]
    return {"notes": notes}


@router.post("", status_code=201)
def create_note(body: Optional[NoteCreate] = None, user_id: str = Depends(current_user_id)):
    body = body or NoteCreate()
    template = check_template(body.template or "general")
    note_id, now = str(uuid.uuid4()), now_iso()
    with connect() as conn:
        conn.execute(
            """INSERT INTO notes (id, user_id, title, rough_notes, transcript, template, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (note_id, user_id, clean_title(body.title), body.rough_notes or "", body.transcript or "",
             template, now, now),
        )
        return to_note(find_note(conn, note_id, user_id))


@router.get("/{note_id}")
def get_note(note_id: str, user_id: str = Depends(current_user_id)):
    with connect() as conn:
        return to_note(find_note(conn, note_id, user_id))


@router.put("/{note_id}")
def update_note(note_id: str, body: NoteUpdate, user_id: str = Depends(current_user_id)):
    sent = body.model_dump(exclude_unset=True)
    changes = {}
    if "title" in sent:
        changes["title"] = clean_title(sent["title"])
    for field in ("rough_notes", "transcript"):
        if field in sent:
            changes[field] = sent[field] or ""
    if "template" in sent:
        changes["template"] = check_template(sent["template"])
    if "enhanced_notes" in sent:
        changes["enhanced_notes"] = sent["enhanced_notes"]  # manual edit: mode/at stay as they were
    changes["updated_at"] = now_iso()

    with connect() as conn:
        find_note(conn, note_id, user_id)
        assignments = ", ".join(f"{field} = ?" for field in changes)
        conn.execute(f"UPDATE notes SET {assignments} WHERE id = ? AND user_id = ?",
                     (*changes.values(), note_id, user_id))
        return to_note(find_note(conn, note_id, user_id))


@router.post("/{note_id}/enhance")
def enhance_note(note_id: str, user_id: str = Depends(current_user_id)):
    with connect() as conn:
        note = find_note(conn, note_id, user_id)
    if not note["rough_notes"].strip() and not note["transcript"].strip():
        raise ApiError(400, "nothing_to_enhance", "Add rough notes or a transcript first")

    try:
        enhanced, mode = enhance(note["title"], note["rough_notes"], note["transcript"], note["template"])
    except EnhanceError:
        raise ApiError(502, "enhance_failed", "Enhancement failed. Your notes are unchanged.")

    now = now_iso()
    with connect() as conn:
        conn.execute(
            """UPDATE notes SET enhanced_notes = ?, enhanced_mode = ?, enhanced_at = ?, updated_at = ?
               WHERE id = ? AND user_id = ?""",
            (enhanced, mode, now, now, note_id, user_id),
        )
        return to_note(find_note(conn, note_id, user_id))


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: str, user_id: str = Depends(current_user_id)):
    with connect() as conn:
        find_note(conn, note_id, user_id)
        conn.execute("DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id))
    return Response(status_code=204)
