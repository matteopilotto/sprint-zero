"""The fixed, built-in templates. Not stored per user."""
from fastapi import APIRouter, Depends

from auth import current_user_id

TEMPLATES = [
    {"id": "general", "name": "General meeting", "sections": ["Summary", "Key points", "Next steps"]},
    {"id": "one_on_one", "name": "1:1", "sections": ["Summary", "Key points", "Feedback", "Next steps"]},
    {"id": "customer_discovery", "name": "Customer discovery", "sections": ["Summary", "Key points", "Pain points", "Quotes", "Next steps"]},
    {"id": "standup", "name": "Stand-up", "sections": ["Summary", "Key points", "Blockers", "Next steps"]},
]

TEMPLATE_IDS = {t["id"] for t in TEMPLATES}


def sections_for(template_id):
    for t in TEMPLATES:
        if t["id"] == template_id:
            return t["sections"]
    return TEMPLATES[0]["sections"]


router = APIRouter()


@router.get("/api/templates")
def list_templates(user_id: str = Depends(current_user_id)):
    return {"templates": TEMPLATES}
