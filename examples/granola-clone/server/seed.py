"""Seed the local SQLite database with a demo user and realistic meeting notes.

Idempotent: deletes the demo user (and their notes) and re-creates them.
Run from server/: python seed.py
"""
import uuid

from auth import hash_password
from db import connect, init_schema
from enhancer import enhance_locally
from templates import sections_for

DEMO_NAME = "Priya Raman"
DEMO_EMAIL = "priya@northwind.io"
DEMO_PASSWORD = "granola-demo-1"

NOTES = [
    {
        "title": "Acme Corp discovery call",
        "template": "customer_discovery",
        "enhance": True,
        "created_at": "2026-11-24T15:00:03Z",
        "updated_at": "2026-11-24T15:42:10Z",
        "rough_notes": "pricing pushback - too expensive for 20 seats\nwants SSO\nusing spreadsheets today\nsend deck by Fri",
        "transcript": (
            "Priya: Thanks for making time, Daniel. How is the team handling meeting notes today?\n"
            "Daniel: Honestly it's all spreadsheets and a shared doc. It's very manual and things get lost.\n"
            "Priya: What would make you switch?\n"
            "Daniel: The main thing is price. At twenty seats your current plan is too expensive for us.\n"
            "Daniel: We also need SSO before security will sign off. That is a must for us.\n"
            "Priya: Understood. I will send the deck and a pricing proposal by Friday.\n"
            "Daniel: Great. I'll loop in Maria from IT so we can follow up on SSO next week."
        ),
    },
    {
        "title": "Weekly 1:1 with Sam Okafor",
        "template": "one_on_one",
        "enhance": False,
        "created_at": "2026-11-21T10:00:00Z",
        "updated_at": "2026-11-21T10:31:45Z",
        "rough_notes": "onboarding revamp shipped - great feedback from CS\nwants to own the Q1 roadmap review\nfeeling stretched across two squads\nfollow up on conference budget",
        "transcript": "",
    },
    {
        "title": "Platform team stand-up",
        "template": "standup",
        "enhance": True,
        "created_at": "2026-11-20T09:30:00Z",
        "updated_at": "2026-11-20T09:48:12Z",
        "rough_notes": "Lena - billing migration 80% done\nTomás blocked on staging access\nrelease cut Thursday",
        "transcript": (
            "Lena: Billing migration is about eighty percent done. I'll finish the invoice export today.\n"
            "Tomás: I'm still blocked on staging access, waiting on the infra ticket.\n"
            "Priya: I will chase infra after this call.\n"
            "Wei: Search indexing fix is merged. Release cut is Thursday as planned."
        ),
    },
    {
        "title": "Northwind Ventures investor update",
        "template": "general",
        "enhance": False,
        "created_at": "2026-11-18T16:00:00Z",
        "updated_at": "2026-11-18T16:40:05Z",
        "rough_notes": "MRR up 14% MoM\nasked about churn in SMB segment\nwants intro to Helix Health\nsend updated metrics deck",
        "transcript": "",
    },
]


def main():
    init_schema()
    with connect() as conn:
        conn.execute("DELETE FROM users WHERE email = ?", (DEMO_EMAIL,))  # notes cascade
        user_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, DEMO_EMAIL, DEMO_NAME, hash_password(DEMO_PASSWORD), "2026-11-17T09:00:00Z"),
        )
        for n in NOTES:
            enhanced = mode = enhanced_at = None
            if n["enhance"]:
                enhanced = enhance_locally(n["title"], n["rough_notes"], n["transcript"], sections_for(n["template"]))
                mode, enhanced_at = "local", n["updated_at"]
            conn.execute(
                """INSERT INTO notes (id, user_id, title, rough_notes, transcript, template,
                                      enhanced_notes, enhanced_mode, enhanced_at, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (str(uuid.uuid4()), user_id, n["title"], n["rough_notes"], n["transcript"], n["template"],
                 enhanced, mode, enhanced_at, n["created_at"], n["updated_at"]),
            )

    print(f"Seeded {len(NOTES)} notes for {DEMO_NAME}.")
    print(f"Demo login -> email: {DEMO_EMAIL}  password: {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
