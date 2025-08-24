# app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict
import uuid
import time

app = FastAPI()

# In-memory "DB"
SESSIONS: Dict[str, dict] = {}

SESSION_TTL = 300  # 5 min timeout


class StartSessionRequest(BaseModel):
    station_id: str
    user_id: str


class UpdateSessionRequest(BaseModel):
    session_id: str
    status: str   # e.g. battery_inserted, payment_confirmed, completed, aborted


@app.post("/session/start")
def start_session(data: StartSessionRequest):
    # expire old sessions for this station
    for sid, s in list(SESSIONS.items()):
        if s["station_id"] == data.station_id and s["status"] not in ["completed", "aborted"]:
            del SESSIONS[sid]

    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {
        "station_id": data.station_id,
        "user_id": data.user_id,
        "status": "pending",
        "created_at": time.time(),
    }
    return {"session_id": session_id}


@app.post("/session/update")
def update_session(data: UpdateSessionRequest):
    session = SESSIONS.get(data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session["status"] = data.status

    # Auto-cleanup if final
    if data.status in ["completed", "aborted"]:
        session["ended_at"] = time.time()

    return {"ok": True, "session": session}


@app.get("/session/{session_id}")
def get_session(session_id: str):
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # auto-expire after TTL
    if time.time() - session["created_at"] > SESSION_TTL:
        session["status"] = "aborted"
    return session


@app.get("/station/{station_id}/active-session")
def get_active_session(station_id: str):
    for sid, s in SESSIONS.items():
        if s["station_id"] == station_id and s["status"] not in ["completed", "aborted"]:
            return {"session_id": sid, "session": s}
    return {"session_id": None, "session": None}

@app.get("/")
def health():
    return {"status": "ok", "time": time.time()}


