"""
AURA Speech Service
Manages local Text-to-Speech (TTS) and Speech-to-Text (STT) capabilities.
Uses faster-whisper (SYSTRAN) for high-performance offline voice transcription,
with pyttsx3 / Windows SAPI for offline low-latency TTS synthesis.
"""
import os
import sys
import logging
import asyncio
from typing import Optional, Dict, Any

logger = logging.getLogger("aura.speech")

# Local engine handle for pyttsx3 and faster-whisper
_tts_engine = None
_whisper_model = None


def get_tts_engine():
    global _tts_engine
    if _tts_engine is None:
        try:
            import pyttsx3
            _tts_engine = pyttsx3.init()
            _tts_engine.setProperty("rate", 185)
            _tts_engine.setProperty("volume", 0.95)
        except Exception as e:
            logger.warning(f"Failed to initialize pyttsx3: {e}")
            _tts_engine = None
    return _tts_engine


def get_whisper_model():
    """Lazy-load and cache the faster-whisper model."""
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            model_size = os.environ.get("AURA_WHISPER_MODEL", "base.en")
            compute_type = os.environ.get("AURA_WHISPER_COMPUTE", "int8")
            logger.info(f"Loading faster-whisper model: {model_size} ({compute_type})...")
            _whisper_model = WhisperModel(model_size, device="cpu", compute_type=compute_type)
            logger.info("faster-whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize faster-whisper: {e}")
            _whisper_model = None
    return _whisper_model


async def speak_text(text: str) -> Dict[str, Any]:
    """Speak text asynchronously through local Windows speech synthesis."""
    if not text or not text.strip():
        return {"success": False, "error": "Text is empty"}

    def _speak_sync():
        engine = get_tts_engine()
        if engine:
            try:
                engine.say(text)
                engine.runAndWait()
                return True
            except Exception as e:
                logger.error(f"TTS speak error: {e}")
                return False
        return False

    loop = asyncio.get_event_loop()
    success = await loop.run_in_executor(None, _speak_sync)
    return {"success": success, "text": text}


def synthesize_with_piper(text: str, output_wav_path: str, model_path: Optional[str] = None) -> bool:
    """Synthesize high-quality neural speech using local Piper TTS engine."""
    try:
        import piper
        from piper.voice import PiperVoice
        if not model_path or not os.path.exists(model_path):
            return False
        voice = PiperVoice.load(model_path)
        with open(output_wav_path, "wb") as wav_file:
            voice.synthesize(text, wav_file)
        return True
    except Exception as e:
        logger.error(f"Piper synthesis error: {e}")
        return False


async def transcribe_audio_file(file_path: str) -> Dict[str, Any]:
    """Transcribe an audio file using faster-whisper (with speech_recognition fallback)."""
    if not os.path.exists(file_path):
        return {"success": False, "error": "Audio file not found"}

    def _transcribe_sync():
        model = get_whisper_model()
        if model:
            try:
                segments, info = model.transcribe(file_path, beam_size=5)
                text = " ".join([seg.text.strip() for seg in segments])
                return {
                    "success": True,
                    "text": text,
                    "language": info.language,
                    "duration": info.duration,
                    "engine": "faster-whisper"
                }
            except Exception as e:
                logger.warning(f"faster-whisper transcription error: {e}")

        # Fallback to speech_recognition
        try:
            import speech_recognition as sr
            r = sr.Recognizer()
            with sr.AudioFile(file_path) as source:
                audio_data = r.record(source)
                text = r.recognize_google(audio_data)
                return {"success": True, "text": text, "engine": "google-fallback"}
        except Exception as e:
            logger.error(f"Fallback speech transcription failed: {e}")
            return {"success": False, "error": str(e)}

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _transcribe_sync)
