"""
AURA Speech API Router
Endpoints for voice input transcription and speech output synthesis.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import tempfile
import os
from aura.speech.speech_service import speak_text, transcribe_audio_file

speech_router = APIRouter()


class SpeakRequest(BaseModel):
    text: str


@speech_router.post("/speak")
async def handle_speak(body: SpeakRequest):
    result = await speak_text(body.text)
    return result


@speech_router.post("/transcribe")
async def handle_transcribe(audio: UploadFile = File(...)):
    suffix = os.path.splitext(audio.filename or "audio.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        content = await audio.read()
        temp_file.write(content)
        temp_path = temp_file.name

    try:
        result = await transcribe_audio_file(temp_path)
        return result
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
