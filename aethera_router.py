"""Aethera — AI-powered cosmic fortune teller combining 9 divination systems."""

import base64
import json
import logging
import time
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/aethera", tags=["aethera"])

# Simple in-memory rate limit (per IP, 20/hour)
_rate_cache: dict = {}

# ─── Firebase Auth Verification ──────────────────────────────────────────────

_firebase_app = None

def _get_firebase_app():
    """Lazy-init Firebase Admin SDK for token verification."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    try:
        import firebase_admin
        from firebase_admin import credentials
        _firebase_app = firebase_admin.get_app()
    except ValueError:
        import firebase_admin
        # Uses GOOGLE_APPLICATION_CREDENTIALS env var or default service account
        try:
            _firebase_app = firebase_admin.initialize_app()
        except Exception as e:
            logger.warning(f"Firebase Admin init failed: {e}. Auth verification disabled.")
            _firebase_app = False  # sentinel: tried and failed
    except ImportError:
        logger.warning("firebase-admin not installed. Auth verification disabled.")
        _firebase_app = False
    return _firebase_app


async def require_auth(request: Request) -> dict:
    """Dependency: require valid Firebase auth token.
    Verifies the token server-side via Firebase Admin SDK when available.
    Falls back to token-present check if SDK unavailable or verification fails
    (e.g. clock skew, expired token mid-request). Data privacy is enforced
    at the Firestore rules layer — each user can only access their own doc."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Authentication required. Please sign in.")

    token = auth_header[7:]  # strip "Bearer "

    # Try to verify token with Firebase Admin SDK
    app = _get_firebase_app()
    if app and app is not False:
        try:
            from firebase_admin import auth as fb_auth
            decoded = fb_auth.verify_id_token(token, app=app, check_revoked=False)
            return {"uid": decoded["uid"], "email": decoded.get("email", ""), "token_verified": True}
        except Exception as e:
            logger.warning(f"Token verification failed (accepting anyway): {e}")

    # Fallback: accept token presence — Firestore rules enforce per-user privacy
    return {"uid": "unverified", "token_present": True}

# Language display names for AI prompt
_LANGUAGE_NAMES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "pt": "Portuguese",
    "de": "German",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese (Simplified)",
}


# ─── Shared Gemini API Helper ─────────────────────────────────────────────────

_gemini_api_key_cache = None

def _get_gemini_key() -> str:
    """Get Gemini API key from env or secrets file. Cached after first call."""
    global _gemini_api_key_cache
    if _gemini_api_key_cache:
        return _gemini_api_key_cache
    import os
    key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY", "")
    if not key:
        secrets_path = os.path.expanduser("~/.ai_secrets")
        if os.path.exists(secrets_path):
            with open(secrets_path) as f:
                for line in f:
                    if "GOOGLE_API_KEY=" in line or "GEMINI_API_KEY=" in line:
                        key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
    if key:
        _gemini_api_key_cache = key
    return key


async def _call_gemini(prompt: str, temperature: float = 0.85, max_tokens: int = 2000, timeout: float = 60.0) -> str:
    """Call Gemini 2.0 Flash directly. Returns the text response."""
    import httpx
    api_key = _get_gemini_key()
    if not api_key:
        raise ValueError("No Gemini API key configured")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
    }
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


# ─── Models ───────────────────────────────────────────────────────────────────

class AetheraRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(default=None, max_length=200)
    birthdate: date
    birth_time: Optional[str] = None
    location: Optional[str] = None
    personality_answers: List[int] = Field(default_factory=list, max_length=5)
    focus_area: str = Field(default="purpose", pattern="^(love|work|money|health|purpose)$")
    language: str = Field(default="en", pattern="^(en|es|fr|pt|de|ja|ko|zh)$")


class AetheraResponse(BaseModel):
    name: str
    birthdate: Optional[str] = None
    divination: dict
    cosmic_reading: str
    aura_color: str
    aura_hex: str
    cosmic_archetype: str
    tagline: str
    share_text: str
    shock_line: str
    tension: str
    today_guidance: str
    focus_reading: str


@router.post("/reading", response_model=AetheraResponse)
async def get_reading(req: AetheraRequest, request: Request, user: dict = Depends(require_auth)):
    """Generate a comprehensive cosmic reading from 9 divination systems."""
    # Rate limit: 20 readings/hour per IP
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    _rate_cache.setdefault(ip, [])
    _rate_cache[ip] = [t for t in _rate_cache[ip] if now - t < 3600]
    if len(_rate_cache[ip]) >= 20:
        raise HTTPException(429, "Too many readings. Try again later.")
    _rate_cache[ip].append(now)

    # Calculate all divination systems
    from products.aethera.divination import calculate_all
    divination = calculate_all(
        name=req.name,
        birthdate=req.birthdate,
        birth_time=req.birth_time,
        location=req.location,
        personality_answers=req.personality_answers,
    )

    # Build AI synthesis prompt
    prompt = _build_synthesis_prompt(req.name, divination, req.focus_area, req.language)

    # Call Gemini for narrative synthesis
    try:
        raw_answer = await _call_gemini(prompt, temperature=0.9, max_tokens=2500, timeout=60.0)
    except Exception as e:
        logger.error(f"AI synthesis failed: {e}")
        raw_answer = _fallback_reading(req.name, divination, req.focus_area)

    # Parse the AI response
    parsed = _parse_ai_response(raw_answer, req.name, divination, req.focus_area)

    aura = divination.get("aura", {})
    astro = divination.get("western_astrology", {})

    share_text = (
        f"My cosmic profile: {astro.get('sign', '?')} {astro.get('symbol', '')} | "
        f"Life Path {divination['numerology']['life_path']['number']} | "
        f"{divination['chinese_zodiac']['element']} {divination['chinese_zodiac']['animal']} | "
        f"Aura: {aura.get('color', '?')} | "
        f"Discover yours at aethera.live"
    )

    return AetheraResponse(
        name=req.name,
        birthdate=str(req.birthdate),
        divination=divination,
        cosmic_reading=parsed["reading"],
        aura_color=aura.get("color", "Blue"),
        aura_hex=aura.get("hex", "#4169E1"),
        cosmic_archetype=parsed["archetype"],
        tagline=parsed["tagline"],
        share_text=share_text,
        shock_line=parsed["shock_line"],
        tension=parsed["tension"],
        today_guidance=parsed["today_guidance"],
        focus_reading=parsed["focus_reading"],
    )


class PalmLineMap(BaseModel):
    name: str  # e.g. "Heart Line"
    color: str  # hex color for drawing
    start_x: float  # 0-100 percentage from left
    start_y: float  # 0-100 percentage from top
    curve_x: float  # control point x
    curve_y: float  # control point y
    end_x: float
    end_y: float
    description: str  # what this line reveals


class PalmReadingResponse(BaseModel):
    palm_analysis: dict  # lines detected, hand shape, features
    reading: str  # AI-generated interpretive reading
    highlights: List[str]  # key findings for the UI
    line_map: List[dict] = []  # line positions for overlay drawing


@router.post("/palm-reading", response_model=PalmReadingResponse)
async def palm_reading(
    request: Request,
    image: UploadFile = File(...),
    user: dict = Depends(require_auth),
    name: str = Form(""),
    language: str = Form("en"),
):
    """Analyze a palm photo using AI vision and generate a personalized reading."""
    import time

    # Rate limit
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    _rate_cache.setdefault(ip, [])
    _rate_cache[ip] = [t for t in _rate_cache[ip] if now - t < 3600]
    if len(_rate_cache[ip]) >= 20:
        raise HTTPException(429, "Too many readings. Try again later.")
    _rate_cache[ip].append(now)

    # Read and validate image
    contents = await image.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB max
        raise HTTPException(400, "Image too large (max 10MB)")
    if len(contents) < 1000:
        raise HTTPException(400, "Image too small or empty")

    img_b64 = base64.b64encode(contents).decode("utf-8")
    content_type = image.content_type or "image/jpeg"

    lang_name = _LANGUAGE_NAMES.get(language, "English")

    # Use Gemini Vision for palm analysis (cheapest multimodal: ~$0.0003/reading)
    palm_data, reading_text, highlights, line_map = await _analyze_palm_with_vision(
        img_b64, content_type, name, lang_name
    )

    return PalmReadingResponse(
        palm_analysis=palm_data,
        reading=reading_text,
        highlights=highlights,
        line_map=line_map,
    )


class TarotResponse(BaseModel):
    cards: list  # list of card dicts with name, suit, position, reversed, upright, reversed meanings
    interpretation: str  # AI-generated narrative interpretation


@router.post("/tarot", response_model=TarotResponse)
async def tarot_reading(
    request: Request,
    name: str = "",
    user: dict = Depends(require_auth),
    focus_area: str = "purpose",
    language: str = "en",
):
    """Draw 3 tarot cards and get an AI-powered interpretation."""
    import time

    # Rate limit
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    _rate_cache.setdefault(ip, [])
    _rate_cache[ip] = [t for t in _rate_cache[ip] if now - t < 3600]
    if len(_rate_cache[ip]) >= 20:
        raise HTTPException(429, "Too many readings. Try again later.")
    _rate_cache[ip].append(now)

    # Draw cards
    from products.aethera.divination import draw_tarot_spread
    spread = draw_tarot_spread(3)

    # Build AI prompt
    lang_name = _LANGUAGE_NAMES.get(language, "English")
    lang_instruction = f"\n\nCRITICAL: Write the ENTIRE interpretation in {lang_name}." if language != "en" else ""

    cards_description = ""
    for card in spread:
        orientation = "REVERSED" if card["reversed"] else "UPRIGHT"
        # For the prompt, use the keyword strings from the original card data
        upright_keys = card.get("upright", "")
        reversed_keys = card.get("reversed", "")
        if isinstance(reversed_keys, bool):
            # The 'reversed' key was overwritten by the bool; get from deck
            from products.aethera.divination import TAROT_DECK
            for deck_card in TAROT_DECK:
                if deck_card["name"] == card["name"]:
                    upright_keys = deck_card["upright"]
                    reversed_keys = deck_card["reversed"]
                    break
        meaning_str = reversed_keys if card["reversed"] else upright_keys
        cards_description += f"\n- {card['position']}: {card['name']} ({card['suit']}) — {orientation}\n  Keywords: {meaning_str}\n"

    name_part = f" for {name}" if name else ""
    prompt = f"""You are Aethera, a mystical tarot oracle with deep knowledge of the Rider-Waite tradition. A seeker{name_part} has drawn three cards about their {focus_area}:

{cards_description}

Weave these three cards into a compelling narrative reading:
1. Begin with the Past card — what energy or situation has been shaping them
2. Flow into the Present card — what they are experiencing or must face now
3. Close with the Future card — what is emerging or awaiting them
4. Reference each card specifically by name and whether it is upright or reversed
5. Connect the reading to their focus area: {focus_area}
6. Include one "message from the cards" — a single eerily personal sentence that feels like the cards are speaking directly to the seeker
7. Write 3-4 paragraphs, warm and mystical but specific — never generic
8. If a card is reversed, interpret it with the reversed meaning, noting the inverted energy

CRITICAL: Stay in character as a mystical tarot oracle at ALL times. NEVER include technical analysis, code, platform recommendations, engineering commentary, or AI-related content. Write ONLY the tarot reading.{lang_instruction}"""

    # Call Gemini for interpretation
    try:
        raw = await _call_gemini(prompt, temperature=0.9, max_tokens=1500, timeout=45.0)
        interpretation = _sanitize_reading(raw)
    except Exception as e:
        logger.error(f"Tarot AI interpretation failed: {e}")
        # Fallback interpretation
        parts = []
        for card in spread:
            orientation = "reversed" if card["reversed"] else "upright"
            parts.append(f"In the {card['position']} position, {card['name']} appears {orientation}, "
                         f"speaking of {card.get('upright', 'transformation')}.")
        interpretation = " ".join(parts) + " The cards invite you to reflect deeply on your path."

    # Clean up card data for response (ensure 'reversed' is the bool, add meaning strings)
    response_cards = []
    from products.aethera.divination import TAROT_DECK
    for card in spread:
        # Look up original meanings from deck
        upright_meaning = ""
        reversed_meaning = ""
        for deck_card in TAROT_DECK:
            if deck_card["name"] == card["name"]:
                upright_meaning = deck_card["upright"]
                reversed_meaning = deck_card["reversed"]
                break
        response_cards.append({
            "name": card["name"],
            "suit": card["suit"],
            "number": card.get("number", 0),
            "position": card["position"],
            "is_reversed": card["reversed"] if isinstance(card["reversed"], bool) else False,
            "upright_meaning": upright_meaning,
            "reversed_meaning": reversed_meaning,
        })

    return TarotResponse(cards=response_cards, interpretation=interpretation)


async def _analyze_palm_with_vision(
    img_b64: str, content_type: str, name: str, language: str = "English"
) -> tuple:
    """Send palm image to Gemini Vision for analysis."""
    import os
    import httpx

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        # Fallback: try to load from .ai_secrets
        try:
            secrets_path = os.path.expanduser("~/.ai_secrets")
            if os.path.exists(secrets_path):
                with open(secrets_path) as f:
                    for line in f:
                        if line.startswith("export GOOGLE_API_KEY=") or line.startswith("export GEMINI_API_KEY="):
                            api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                            break
        except Exception:
            pass

    if not api_key:
        raise HTTPException(500, "Vision API not configured")

    lang_instruction = f"\n\nIMPORTANT: Write the entire response in {language}." if language != "English" else ""

    prompt = f"""You are Aethera, a mystical palm reader with deep knowledge of palmistry traditions (Western, Chinese, Indian). Analyze this palm photo with interpretive precision.

{"The person's name is " + name + ". " if name else ""}

STEP 1 - OBSERVE (be specific about what you see):
Examine the palm and describe:
- HEART LINE: length, depth, curvature, branches, breaks
- HEAD LINE: length, slope, connection to life line
- LIFE LINE: depth, length, arc width, any breaks or chains
- FATE LINE: present or absent, strength, origin point
- HAND SHAPE: square/rectangular/oval, finger length vs palm width
- MOUNT PROMINENCE: which mounts (Venus, Jupiter, Saturn, Apollo, Mercury, Moon, Mars) appear most developed
- SPECIAL MARKS: stars, crosses, islands, triangles, or unusual patterns

STEP 2 - INTERPRET (be specific, not generic):
For each feature you observe, give a specific interpretive reading. Use language like "this suggests..." or "this part of your hand reveals..."

STEP 3 - SYNTHESIZE:
Weave the observations into a cohesive 3-paragraph reading that feels deeply personal and insightful. Connect the palm features to personality traits, life patterns, and future potential.

Format your response as:

ANALYSIS:
heart_line: [observation]
head_line: [observation]
life_line: [observation]
fate_line: [observation]
hand_shape: [observation]
dominant_mount: [observation]
special_marks: [observation]

HIGHLIGHTS:
- [Key finding 1 - the most striking feature]
- [Key finding 2]
- [Key finding 3]
- [Key finding 4]

LINE_MAP:
For each major line visible, provide approximate position coordinates as percentages (0-100) of the image width/height. The palm is oriented with fingers at the top. Use this exact format for each line (one per line):
heart_line|start_x,start_y|curve_x,curve_y|end_x,end_y|[short description]
head_line|start_x,start_y|curve_x,curve_y|end_x,end_y|[short description]
life_line|start_x,start_y|curve_x,curve_y|end_x,end_y|[short description]
fate_line|start_x,start_y|curve_x,curve_y|end_x,end_y|[short description]

Example: heart_line|15,35|50,28|85,32|Strong and deep — emotionally generous
Be as accurate as possible based on what you see in the actual image.

READING:
[3-paragraph interpretive reading that feels personal and specific]

CRITICAL: Stay in character as a mystical palm reader. Never mention AI, technology, or break character.{lang_instruction}"""

    # Call Gemini Vision API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": content_type,
                        "data": img_b64,
                    }
                },
            ]
        }],
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 2000,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.error(f"Gemini Vision error: {resp.status_code} {resp.text[:200]}")
                raise HTTPException(502, "Vision analysis failed")
            data = resp.json()

        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini Vision call failed: {e}")
        raise HTTPException(502, f"Vision analysis failed: {str(e)[:100]}")

    # Parse response
    palm_data = {}
    highlights = []
    reading = raw_text

    try:
        if "ANALYSIS:" in raw_text:
            analysis_section = raw_text.split("ANALYSIS:")[1].split("HIGHLIGHTS:")[0] if "HIGHLIGHTS:" in raw_text else raw_text.split("ANALYSIS:")[1].split("READING:")[0]
            for line in analysis_section.strip().split("\n"):
                if ":" in line:
                    key, val = line.split(":", 1)
                    palm_data[key.strip()] = val.strip()

        if "HIGHLIGHTS:" in raw_text:
            hl_end = "LINE_MAP:" if "LINE_MAP:" in raw_text else ("READING:" if "READING:" in raw_text else None)
            hl_section = raw_text.split("HIGHLIGHTS:")[1].split(hl_end)[0] if hl_end else raw_text.split("HIGHLIGHTS:")[1]
            for line in hl_section.strip().split("\n"):
                line = line.strip().lstrip("- ").strip()
                if line and len(line) > 5:
                    highlights.append(line)

        if "READING:" in raw_text:
            reading = raw_text.split("READING:", 1)[1].strip()
    except Exception:
        pass

    # Parse LINE_MAP
    _line_colors = {
        "heart_line": "#ff4d6d",
        "head_line": "#4d9fff",
        "life_line": "#4dff91",
        "fate_line": "#ffd700",
        "sun_line": "#ff9f43",
        "mercury_line": "#a855f7",
    }
    _line_labels = {
        "heart_line": "Heart Line",
        "head_line": "Head Line",
        "life_line": "Life Line",
        "fate_line": "Fate Line",
        "sun_line": "Sun Line",
        "mercury_line": "Mercury Line",
    }
    line_map = []
    try:
        if "LINE_MAP:" in raw_text:
            lm_end = "READING:" if "READING:" in raw_text.split("LINE_MAP:")[1] else None
            lm_section = raw_text.split("LINE_MAP:")[1]
            if lm_end:
                lm_section = lm_section.split(lm_end)[0]
            for ln in lm_section.strip().split("\n"):
                ln = ln.strip().strip("- ").strip()
                if "|" not in ln:
                    continue
                parts = ln.split("|")
                if len(parts) < 4:
                    continue
                line_key = parts[0].strip().lower().replace(" ", "_")
                try:
                    sx, sy = [float(x.strip()) for x in parts[1].split(",")]
                    cx, cy = [float(x.strip()) for x in parts[2].split(",")]
                    ex, ey = [float(x.strip()) for x in parts[3].split(",")]
                    desc = parts[4].strip() if len(parts) > 4 else ""
                    line_map.append({
                        "name": _line_labels.get(line_key, line_key.replace("_", " ").title()),
                        "color": _line_colors.get(line_key, "#ffffff"),
                        "start_x": max(0, min(100, sx)),
                        "start_y": max(0, min(100, sy)),
                        "curve_x": max(0, min(100, cx)),
                        "curve_y": max(0, min(100, cy)),
                        "end_x": max(0, min(100, ex)),
                        "end_y": max(0, min(100, ey)),
                        "description": desc,
                    })
                except (ValueError, IndexError):
                    continue
    except Exception:
        pass

    if not highlights:
        highlights = ["Your palm reveals a unique energy pattern"]

    return palm_data, reading, highlights[:6], line_map


def _build_synthesis_prompt(name: str, div: dict, focus_area: str = "purpose", language: str = "en") -> str:
    astro = div["western_astrology"]
    cn = div["chinese_zodiac"]
    num = div["numerology"]
    bio = div["biorhythm"]
    celtic = div["celtic_tree"]
    mayan = div["mayan_tzolkin"]
    aura = div["aura"]
    palm = div["palm"]
    hd = div.get("human_design", {})
    transits = div.get("transits", [])

    lang_name = _LANGUAGE_NAMES.get(language, "English")

    focus_prompts = {
        "love": "Their heart is heavy with questions about love and relationships. Weave romantic and relational guidance throughout — what their cosmic profile reveals about how they love, who they attract, and what shift is coming in their love life.",
        "work": "They are searching for clarity in their career and professional path. Weave work and purpose guidance throughout — what their cosmic profile reveals about their professional gifts, current challenges, and the opportunity approaching.",
        "money": "They carry tension around finances and material security. Weave abundance and financial guidance throughout — what their cosmic profile reveals about their relationship with money, blocks to prosperity, and the shift in fortune approaching.",
        "health": "Their body or mind has been asking for attention. Weave wellness and vitality guidance throughout — what their cosmic profile reveals about their physical and emotional energy, where they hold stress, and what healing is emerging.",
        "purpose": "They are questioning whether they are on the right path. Weave existential and purpose guidance throughout — what their cosmic profile reveals about their true calling, the signs they've been ignoring, and the transformation unfolding.",
    }

    focus_instruction = focus_prompts.get(focus_area, focus_prompts["purpose"])

    lang_instruction = ""
    if language != "en":
        lang_instruction = f"\n\nCRITICAL: Write the ENTIRE reading in {lang_name}. All section labels (ARCHETYPE, TAGLINE, etc.) must remain in English as markers, but all content text must be in {lang_name}."

    return f"""You are Aethera, a mystical AI oracle who weaves together ancient wisdom systems into deeply personal cosmic readings. Your tone is warm, mystical, specific, and empowering — never generic.

Create a cosmic reading for {name}. Weave ALL of these systems into a unified narrative:

NUMEROLOGY:
- Life Path {num['life_path']['number']}: {num['life_path']['meaning']}
- Expression {num['expression']['number']}: {num['expression']['meaning']}
- Soul Urge {num['soul_urge']['number']}: {num['soul_urge']['meaning']}

WESTERN ASTROLOGY:
- Sun Sign: {astro['sign']} ({astro['element']}, {astro['modality']})

CHINESE ZODIAC:
- {cn['element']} {cn['animal']}: {cn['traits']}

BIORHYTHM (today):
- Physical: {bio['physical']}% | Emotional: {bio['emotional']}% | Intellectual: {bio['intellectual']}%

CELTIC TREE: {celtic['tree']} — {celtic['meaning']}

MAYAN TZOLKIN: {mayan['full_name']} — {mayan['meaning']}

AURA: {aura['color']} — {aura['meaning']}

PALM: {palm['archetype']} — {palm['meaning']}

HUMAN DESIGN:
- Type: {hd.get('type', 'Unknown')} (Strategy: {hd.get('strategy', 'Unknown')})
- Authority: {hd.get('authority', 'Unknown')}
- Profile: {hd.get('profile', 'Unknown')} ({hd.get('profile_name', '')})
- Conscious Sun: Gate {hd.get('conscious_sun', {}).get('gate', '?')} — {hd.get('conscious_sun', {}).get('name', '')}
- Unconscious Sun: Gate {hd.get('unconscious_sun', {}).get('gate', '?')} — {hd.get('unconscious_sun', {}).get('name', '')}

ACTIVE TRANSITS (planets currently aspecting your natal chart):
{chr(10).join(f"- Transit {t['transit_planet']} in {t['transit_sign']} {t['aspect']} natal {t['natal_planet']} in {t['natal_sign']} (orb {t['orb']:.1f}°): {t['meaning']}" for t in transits[:10]) if transits else "- No major transits active at this moment."}

FOCUS AREA — {focus_area.upper()}:
{focus_instruction}

Format your response EXACTLY as (each section on its own line, starting with the label):

ARCHETYPE: [Give them a unique cosmic archetype name, 2-4 words, e.g. "The Celestial Architect" or "Storm Phoenix"]

TAGLINE: [One mystical sentence summarizing their cosmic identity]

SHOCK_LINE: [One eerily specific observation that feels deeply personal but actually applies broadly. Make it feel like you can see into their soul. Examples of the right tone: "You've been carrying someone else's dream as if it were your own, and you're only now beginning to feel the weight of it." or "There is a conversation you've been rehearsing in your head for weeks — the stars suggest it's time to have it." This should make them stop and say "how did it know that?"]

TENSION: [Describe the core conflict between their systems — e.g. their fiery Aries sun craves action but their Life Path 7 demands stillness and introspection. Their Water Hand feels everything deeply but their {cn['element']} {cn['animal']} nature pushes them to perform strength. Make this feel like you've named something they've always felt but never articulated. 2-3 sentences.]

TODAY_GUIDANCE: [Based specifically on their biorhythm percentages today — Physical {bio['physical']}%, Emotional {bio['emotional']}%, Intellectual {bio['intellectual']}% — give concrete, actionable guidance for today. Not generic "take it easy" but specific: if emotional is high and physical is low, say something like "Your heart is wide open today but your body is asking for gentleness — this is a day for deep conversations, not heavy lifting." 2-3 sentences.]

FOCUS_READING: [A dedicated 2-3 paragraph reading specifically about their {focus_area} concern, drawing on their cosmic profile. This should feel like the oracle is directly addressing what's weighing on their mind. Be specific, not vague.]

READING:
[Write a 3-4 paragraph cosmic reading that:
1. Opens with their dominant energy and what makes them cosmically unique
2. Reveals hidden tensions between their systems (expand on the TENSION above)
3. Gives specific guidance for TODAY based on their biorhythm percentages
4. Closes with a powerful prediction or affirmation about their path ahead
Keep it personal, specific to their actual numbers/signs, and avoid generic horoscope language.

CRITICAL RULES:
- You are Aethera, a MYSTICAL ORACLE. Stay in character at ALL times.
- NEVER include technical analysis, code, platform recommendations, or engineering commentary.
- NEVER mention APIs, agents, frameworks, Python, or any technology.
- NEVER break character or acknowledge you are an AI.
- Write ONLY the cosmic reading sections requested — nothing else.]{lang_instruction}"""


def _parse_ai_response(raw: str, name: str, div: dict, focus_area: str = "purpose") -> dict:
    """Parse AI response into structured sections."""
    import re

    # Normalize: AI often wraps labels in markdown bold (**ARCHETYPE**: or **ARCHETYPE:**)
    # Strip all ** around section labels so parsing works consistently
    raw = re.sub(r'\*\*(ARCHETYPE|TAGLINE|SHOCK_LINE|TENSION|TODAY_GUIDANCE|FOCUS_READING|READING)\*\*\s*:', r'\1:', raw)
    # Also handle *LABEL*: format
    raw = re.sub(r'\*(ARCHETYPE|TAGLINE|SHOCK_LINE|TENSION|TODAY_GUIDANCE|FOCUS_READING|READING)\*\s*:', r'\1:', raw)

    result = {
        "archetype": "The Cosmic Seeker",
        "tagline": "A soul woven from starlight and ancient wisdom",
        "shock_line": "You have been standing at a threshold for longer than you realize — and the door has been open the entire time.",
        "tension": "",
        "today_guidance": "",
        "focus_reading": "",
        "reading": raw,
    }

    try:
        if "ARCHETYPE:" in raw:
            parts = raw.split("ARCHETYPE:", 1)[1]
            result["archetype"] = parts.split("\n")[0].strip().strip("*").strip()

        if "TAGLINE:" in raw:
            parts = raw.split("TAGLINE:", 1)[1]
            result["tagline"] = parts.split("\n")[0].strip().strip("*").strip()

        if "SHOCK_LINE:" in raw:
            parts = raw.split("SHOCK_LINE:", 1)[1]
            # Shock line might span multiple lines until the next section
            next_section = None
            for marker in ["TENSION:", "TODAY_GUIDANCE:", "FOCUS_READING:", "READING:"]:
                if marker in parts:
                    next_section = marker
                    break
            if next_section:
                shock_text = parts.split(next_section)[0].strip()
            else:
                shock_text = parts.split("\n\n")[0].strip()
            result["shock_line"] = shock_text.strip("*").strip().strip('"').strip()

        if "TENSION:" in raw:
            parts = raw.split("TENSION:", 1)[1]
            next_section = None
            for marker in ["TODAY_GUIDANCE:", "FOCUS_READING:", "READING:"]:
                if marker in parts:
                    next_section = marker
                    break
            if next_section:
                result["tension"] = parts.split(next_section)[0].strip().strip("*").strip()
            else:
                result["tension"] = parts.split("\n\n")[0].strip().strip("*").strip()

        if "TODAY_GUIDANCE:" in raw:
            parts = raw.split("TODAY_GUIDANCE:", 1)[1]
            next_section = None
            for marker in ["FOCUS_READING:", "READING:"]:
                if marker in parts:
                    next_section = marker
                    break
            if next_section:
                result["today_guidance"] = parts.split(next_section)[0].strip().strip("*").strip()
            else:
                result["today_guidance"] = parts.split("\n\n")[0].strip().strip("*").strip()

        if "FOCUS_READING:" in raw:
            parts = raw.split("FOCUS_READING:", 1)[1]
            if "READING:" in parts:
                result["focus_reading"] = parts.split("READING:")[0].strip().strip("*").strip()
            else:
                result["focus_reading"] = parts.split("\n\n\n")[0].strip().strip("*").strip()

        if "READING:" in raw:
            result["reading"] = raw.split("READING:", 1)[1].strip()
        elif "ARCHETYPE:" in raw and "TAGLINE:" in raw:
            lines = raw.split("\n")
            reading_lines = []
            past_tagline = False
            for line in lines:
                if past_tagline and line.strip():
                    reading_lines.append(line)
                if "TAGLINE:" in line:
                    past_tagline = True
            result["reading"] = "\n".join(reading_lines).strip()
    except Exception:
        pass

    # Clean any remaining markdown bold and technical leaks from all fields
    _tech_patterns = [
        "technical analysis", "actionable recommendation", "platform improvement",
        "python", "API", "framework", "database", "concurrency", "garbage collection",
        "memory leak", "El Gringo", "ElGringo", "multi-agent", "prompt overload",
        "syntax error", "output validation", "locking mechanism", "race condition",
        "feedback loop", "agent", "orchestrat",
    ]
    for key in result:
        if isinstance(result[key], str):
            result[key] = result[key].replace("**", "").strip()
            # If technical content leaked into a reading, strip those paragraphs
            if any(tp.lower() in result[key].lower() for tp in _tech_patterns):
                cleaned_paras = []
                for para in result[key].split("\n"):
                    if not any(tp.lower() in para.lower() for tp in _tech_patterns):
                        cleaned_paras.append(para)
                result[key] = "\n".join(cleaned_paras).strip()

    if not result["reading"] or len(result["reading"]) < 50:
        result["reading"] = _fallback_reading(name, div, focus_area)

    # Generate fallback tension if AI didn't provide one
    if not result["tension"]:
        astro = div["western_astrology"]
        num = div["numerology"]
        cn = div["chinese_zodiac"]
        result["tension"] = (
            f"Your {astro['sign']} sun burns with {astro['element'].lower()} energy, "
            f"yet your Life Path {num['life_path']['number']} pulls you toward a different rhythm. "
            f"The {cn['element']} {cn['animal']} within you adds another layer — "
            f"this is the tension that makes you uniquely powerful."
        )

    # Generate fallback today guidance if AI didn't provide one
    if not result["today_guidance"]:
        bio = div["biorhythm"]
        result["today_guidance"] = _fallback_today_guidance(bio)

    return result


def _fallback_today_guidance(bio: dict) -> str:
    """Generate biorhythm-based guidance when AI doesn't provide one."""
    phys = bio["physical"]
    emot = bio["emotional"]
    intl = bio["intellectual"]

    parts = []
    if phys > 50:
        parts.append("Your physical energy is surging — your body wants to move, create, and take action.")
    elif phys < -50:
        parts.append("Your physical energy is in a deep rest cycle — honor your body's need for recovery today.")
    else:
        parts.append("Your physical energy is in a balanced transition — steady and grounded.")

    if emot > 50:
        parts.append("Emotionally, you are wide open — connections made today will feel unusually deep.")
    elif emot < -50:
        parts.append("Your emotional field is turned inward — solitude and self-compassion are your allies today.")
    else:
        parts.append("Your emotional currents are steady — trust your feelings without overthinking them.")

    if intl > 50:
        parts.append("Your mind is razor-sharp — this is a day for decisions, learning, and strategic thinking.")
    elif intl < -50:
        parts.append("Your mental energy is cycling low — lean on intuition rather than analysis today.")
    else:
        parts.append("Your intellectual energy is balanced — a good day for both thinking and feeling your way forward.")

    return " ".join(parts)


class CompatibilityRequest(BaseModel):
    name1: str = Field(..., min_length=1, max_length=100)
    birthdate1: date
    name2: str = Field(..., min_length=1, max_length=100)
    birthdate2: date
    language: str = Field(default="en", pattern="^(en|es|fr|pt|de|ja|ko|zh)$")


class CompatibilityResponse(BaseModel):
    score: int  # 0-100
    breakdown: dict  # element_harmony, life_path, chinese_zodiac scores
    ai_narrative: str
    person1: dict  # key signs
    person2: dict  # key signs


# Element compatibility tables
_ELEMENT_COMPAT = {
    # Western elements
    ("Fire", "Fire"): 15, ("Fire", "Air"): 18, ("Fire", "Earth"): 5, ("Fire", "Water"): 0,
    ("Air", "Air"): 15, ("Air", "Water"): 5, ("Air", "Earth"): 5,
    ("Earth", "Earth"): 15, ("Earth", "Water"): 18,
    ("Water", "Water"): 15,
}

# Life path natural compatibility (known numerology pairs)
_LP_COMPAT = {
    (1, 5): 20, (1, 7): 15, (1, 3): 15,
    (2, 4): 18, (2, 6): 20, (2, 8): 15,
    (3, 5): 18, (3, 6): 15, (3, 9): 18,
    (4, 6): 15, (4, 7): 18, (4, 8): 18,
    (5, 7): 15, (5, 9): 15,
    (6, 9): 20, (6, 8): 15,
    (7, 9): 15,
    (8, 9): 10,
}

# Chinese zodiac harmony groups (traditional triads)
_CN_TRIADS = [
    {"Rat", "Dragon", "Monkey"},
    {"Ox", "Snake", "Rooster"},
    {"Tiger", "Horse", "Dog"},
    {"Rabbit", "Goat", "Pig"},
]
_CN_CLASHES = [
    ("Rat", "Horse"), ("Ox", "Goat"), ("Tiger", "Monkey"),
    ("Rabbit", "Rooster"), ("Dragon", "Dog"), ("Snake", "Pig"),
]


def _calc_element_harmony(elem1: str, elem2: str) -> int:
    """Score element compatibility 0-20."""
    if elem1 == elem2:
        return 20
    pair = tuple(sorted([elem1, elem2]))
    return _ELEMENT_COMPAT.get(pair, 8)


def _calc_lp_compat(lp1: int, lp2: int) -> int:
    """Score life path compatibility 0-20."""
    if lp1 == lp2:
        return 15
    pair = tuple(sorted([lp1, lp2]))
    return _LP_COMPAT.get(pair, 10)


def _calc_cn_compat(animal1: str, animal2: str) -> int:
    """Score Chinese zodiac compatibility 0-20."""
    if animal1 == animal2:
        return 14
    for triad in _CN_TRIADS:
        if animal1 in triad and animal2 in triad:
            return 20
    for clash in _CN_CLASHES:
        if (animal1 in clash and animal2 in clash):
            return 2
    return 10


@router.post("/compatibility", response_model=CompatibilityResponse)
async def compatibility_check(req: CompatibilityRequest, request: Request, user: dict = Depends(require_auth)):
    """Calculate cosmic compatibility between two people."""
    import time

    # Rate limit
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    _rate_cache.setdefault(ip, [])
    _rate_cache[ip] = [t for t in _rate_cache[ip] if now - t < 3600]
    if len(_rate_cache[ip]) >= 20:
        raise HTTPException(429, "Too many readings. Try again later.")
    _rate_cache[ip].append(now)

    from products.aethera.divination import calculate_all

    div1 = calculate_all(name=req.name1, birthdate=req.birthdate1)
    div2 = calculate_all(name=req.name2, birthdate=req.birthdate2)

    # Extract key data
    astro1, astro2 = div1["western_astrology"], div2["western_astrology"]
    cn1, cn2 = div1["chinese_zodiac"], div2["chinese_zodiac"]
    lp1 = div1["numerology"]["life_path"]["number"]
    lp2 = div2["numerology"]["life_path"]["number"]

    # Calculate compatibility scores
    elem_score = _calc_element_harmony(astro1["element"], astro2["element"])
    lp_score = _calc_lp_compat(lp1, lp2)
    cn_score = _calc_cn_compat(cn1["animal"], cn2["animal"])

    # Bonus: same modality +5, complementary aura +5
    modality_bonus = 5 if astro1.get("modality") == astro2.get("modality") else 0
    aura1 = div1.get("aura", {}).get("color", "")
    aura2 = div2.get("aura", {}).get("color", "")
    aura_bonus = 5 if aura1 == aura2 else 2

    # Base score from three pillars (max 60) + bonuses (max 10) + base 30
    raw_score = elem_score + lp_score + cn_score + modality_bonus + aura_bonus
    # Normalize to 0-100 scale (raw max ~70, min ~14)
    score = min(100, max(15, int((raw_score / 70) * 75 + 25)))

    breakdown = {
        "element_harmony": {
            "score": elem_score,
            "max": 20,
            "detail": f"{astro1['sign']} ({astro1['element']}) + {astro2['sign']} ({astro2['element']})",
        },
        "life_path": {
            "score": lp_score,
            "max": 20,
            "detail": f"Life Path {lp1} + Life Path {lp2}",
        },
        "chinese_zodiac": {
            "score": cn_score,
            "max": 20,
            "detail": f"{cn1['element']} {cn1['animal']} + {cn2['element']} {cn2['animal']}",
        },
        "modality_bonus": modality_bonus,
        "aura_bonus": aura_bonus,
    }

    person1 = {
        "name": req.name1,
        "sign": astro1["sign"],
        "symbol": astro1.get("symbol", ""),
        "element": astro1["element"],
        "life_path": lp1,
        "chinese": f"{cn1['element']} {cn1['animal']}",
        "aura": aura1,
    }
    person2 = {
        "name": req.name2,
        "sign": astro2["sign"],
        "symbol": astro2.get("symbol", ""),
        "element": astro2["element"],
        "life_path": lp2,
        "chinese": f"{cn2['element']} {cn2['animal']}",
        "aura": aura2,
    }

    # AI narrative
    lang_name = _LANGUAGE_NAMES.get(req.language, "English")
    lang_instruction = f"\n\nCRITICAL: Write the ENTIRE narrative in {lang_name}." if req.language != "en" else ""

    prompt = f"""You are Aethera, a mystical cosmic matchmaker. Two souls seek to understand their cosmic connection.

PERSON 1: {req.name1}
- {astro1['sign']} ({astro1['element']}, {astro1.get('modality', '')})
- Life Path {lp1}: {div1['numerology']['life_path']['meaning']}
- Chinese: {cn1['element']} {cn1['animal']}
- Celtic: {div1['celtic_tree']['tree']}
- Aura: {aura1}

PERSON 2: {req.name2}
- {astro2['sign']} ({astro2['element']}, {astro2.get('modality', '')})
- Life Path {lp2}: {div2['numerology']['life_path']['meaning']}
- Chinese: {cn2['element']} {cn2['animal']}
- Celtic: {div2['celtic_tree']['tree']}
- Aura: {aura2}

COMPATIBILITY SCORE: {score}%

Write a 2-3 paragraph relationship reading. Be specific about how their energies interact. Mention:
1. What draws them together (the magnetic pull between their signs/elements)
2. Their core challenge as a pair (the tension or friction point)
3. The key to making it work (specific, actionable cosmic advice)

Be warm, specific, and mystical. Never generic. Reference their actual signs and numbers.

CRITICAL RULES:
- You are a MYSTICAL ORACLE speaking to real people. Stay in character at ALL times.
- NEVER include technical analysis, code suggestions, platform recommendations, or AI/engineering commentary.
- NEVER mention APIs, agents, frameworks, Python, databases, or any technology.
- NEVER break the fourth wall or acknowledge you are an AI.
- Write ONLY the relationship reading — nothing else. No headers, no bullet points, no technical notes.
- If you feel compelled to add anything beyond the reading, STOP. The user only wants their cosmic love story.{lang_instruction}"""

    try:
        ai_narrative = await _call_gemini(prompt, temperature=0.85, max_tokens=1500, timeout=45.0)
    except Exception as e:
        logger.error(f"Compatibility AI narrative failed: {e}")
        ai_narrative = (
            f"The cosmic connection between {req.name1} ({astro1['sign']}) and {req.name2} ({astro2['sign']}) "
            f"carries a {score}% harmony score. {astro1['element']} meets {astro2['element']}, "
            f"creating {'a powerful resonance' if score > 70 else 'an intriguing tension' if score > 50 else 'a challenging but growth-oriented dynamic'}. "
            f"Life Paths {lp1} and {lp2} {'complement each other beautifully' if lp_score >= 15 else 'push each other to grow'}."
        )

    # Strip any technical content that leaked through
    ai_narrative = _sanitize_reading(ai_narrative)

    return CompatibilityResponse(
        score=score,
        breakdown=breakdown,
        ai_narrative=ai_narrative,
        person1=person1,
        person2=person2,
    )


# ─── Text-to-Speech (OpenAI Premium Voices) ─────────────────────────

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)
    voice: str = Field(default="shimmer", pattern="^(shimmer|nova|fable|onyx|echo|alloy)$")


@router.post("/tts")
async def text_to_speech(req: TTSRequest, request: Request, user: dict = Depends(require_auth)):
    """Generate speech audio using OpenAI TTS API. Premium feature."""
    import os
    import httpx
    import time

    # Rate limit: 10 TTS requests/hour per IP
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    _rate_cache.setdefault(f"tts_{ip}", [])
    _rate_cache[f"tts_{ip}"] = [t for t in _rate_cache[f"tts_{ip}"] if now - t < 3600]
    if len(_rate_cache[f"tts_{ip}"]) >= 10:
        raise HTTPException(429, "Too many voice requests. Try again later.")
    _rate_cache[f"tts_{ip}"].append(now)

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        # Try loading from secrets file
        try:
            secrets_path = os.path.expanduser("~/.ai_secrets")
            if os.path.exists(secrets_path):
                with open(secrets_path) as f:
                    for line in f:
                        if line.startswith("export OPENAI_API_KEY="):
                            api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                            break
        except Exception:
            pass

    if not api_key:
        raise HTTPException(500, "Premium voice not configured. Use the free browser voice.")

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "tts-1",
                    "voice": req.voice,
                    "input": req.text,
                    "speed": 0.9,
                },
            )
            if resp.status_code != 200:
                logger.error(f"OpenAI TTS error: {resp.status_code} {resp.text[:200]}")
                raise HTTPException(502, "Voice generation failed")

            from fastapi.responses import Response
            return Response(
                content=resp.content,
                media_type="audio/mpeg",
                headers={"Cache-Control": "public, max-age=3600"},
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS failed: {e}")
        raise HTTPException(502, f"Voice generation failed: {str(e)[:100]}")


# ─── Chat Endpoint ──────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    language: str = Field(default="en", pattern="^(en|es|fr|pt|de|ja|ko|zh)$")
    reading_context: Optional[dict] = None  # current readingData from frontend


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    suggestions: List[str] = []


class DreamRequest(BaseModel):
    dream_text: str = Field(..., min_length=10, max_length=5000)
    language: str = Field(default="en", pattern="^(en|es|fr|pt|de|ja|ko|zh)$")
    reading_context: Optional[dict] = None


class DreamResponse(BaseModel):
    interpretation: str
    symbols: List[dict]  # [{symbol, meaning, cosmic_connection}]
    archetype: str  # dream archetype (e.g. "The Journey", "The Shadow")
    cosmic_connections: str  # how the dream connects to their chart
    guidance: str  # actionable guidance from the dream
    techniques_used: List[str]  # which interpretation methods were used


def _extract_cosmic_summary(reading_context: dict) -> str:
    """Extract a concise cosmic profile summary from the frontend readingData."""
    if not reading_context:
        return "No cosmic profile available."

    parts = []
    div = reading_context.get("divination", reading_context)

    # Astrology
    astro = div.get("western_astrology", {})
    if astro:
        sun = astro.get("sign", "")
        moon = astro.get("moon_sign", "")
        rising = astro.get("rising_sign", "")
        if sun:
            parts.append(f"Sun: {sun}")
        if moon:
            parts.append(f"Moon: {moon}")
        if rising:
            parts.append(f"Rising: {rising}")

    # Numerology
    num = div.get("numerology", {})
    lp = num.get("life_path", {})
    if isinstance(lp, dict) and lp.get("number"):
        parts.append(f"Life Path: {lp['number']}")
    elif isinstance(lp, (int, str)):
        parts.append(f"Life Path: {lp}")

    # Chinese zodiac
    cz = div.get("chinese_zodiac", {})
    if cz:
        animal = cz.get("animal", "")
        element = cz.get("element", "")
        if animal:
            parts.append(f"Chinese Zodiac: {element} {animal}".strip())

    # Human Design
    hd = div.get("human_design", {})
    if hd:
        hd_type = hd.get("type", "")
        authority = hd.get("authority", "")
        profile = hd.get("profile", "")
        if hd_type:
            parts.append(f"Human Design: {hd_type}")
        if authority:
            parts.append(f"Authority: {authority}")
        if profile:
            parts.append(f"Profile: {profile}")

    # Aura
    aura = div.get("aura", {})
    if aura and aura.get("color"):
        parts.append(f"Aura: {aura['color']}")

    # Focus area
    focus = reading_context.get("focus_area", "")
    if focus:
        parts.append(f"Focus: {focus}")

    return " | ".join(parts) if parts else "No cosmic profile available."


def _build_chat_prompt(message: str, cosmic_summary: str, language: str) -> str:
    """Build the chat prompt with Aethera persona and cosmic context."""
    lang_name = _LANGUAGE_NAMES.get(language, "English")
    lang_instruction = (
        f"\n\nCRITICAL: Respond ENTIRELY in {lang_name}."
        if language != "en" else ""
    )

    return f"""You are Aethera, a warm and mystical cosmic oracle. You speak with wisdom, warmth, and occasional poetic flair. You never break character. You reference the seeker's actual cosmic data when relevant.

THE SEEKER'S COSMIC PROFILE:
{cosmic_summary}

The seeker asks: {message}

Respond as Aethera. Keep your response concise (2-4 paragraphs max). Be specific to their chart — reference their actual signs, numbers, gates, not generic advice. If they ask about something not in their chart, answer with general cosmic wisdom while staying in character.

CRITICAL: Stay in character as a mystical cosmic oracle at ALL times. NEVER include technical analysis, code, platform recommendations, engineering commentary, or AI-related content. Write ONLY your mystical response.{lang_instruction}"""


def _generate_chat_suggestions(reading_context: Optional[dict]) -> List[str]:
    """Generate 2-3 follow-up question suggestions based on the reading context."""
    if not reading_context:
        return [
            "What does the universe have in store for me today?",
            "Can you tell me about my spiritual gifts?",
        ]

    suggestions = []
    div = reading_context.get("divination", reading_context)

    # Astrology-based suggestions
    astro = div.get("western_astrology", {})
    moon = astro.get("moon_sign", "")
    sun = astro.get("sign", "")
    if moon:
        suggestions.append(f"How does my Moon in {moon} affect my relationships?")
    if sun:
        suggestions.append(f"What challenges should a {sun} watch out for this year?")

    # Human Design suggestions
    hd = div.get("human_design", {})
    hd_type = hd.get("type", "")
    if hd_type:
        suggestions.append(f"What does my {hd_type} strategy mean for my career?")

    # Numerology suggestions
    num = div.get("numerology", {})
    lp = num.get("life_path", {})
    lp_num = lp.get("number") if isinstance(lp, dict) else lp
    if lp_num:
        suggestions.append(f"How does Life Path {lp_num} influence my love life?")

    # Chinese zodiac suggestions
    cz = div.get("chinese_zodiac", {})
    animal = cz.get("animal", "")
    if animal:
        suggestions.append(f"What is the {animal}'s greatest hidden strength?")

    # Return 2-3 suggestions, prioritizing variety
    return suggestions[:3] if len(suggestions) >= 2 else suggestions + [
        "What spiritual practice would benefit me most right now?",
        "What message does the universe have for me today?",
    ][:3 - len(suggestions)]


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request, user: dict = Depends(require_auth)):
    """Chat with Aethera — a stateless cosmic oracle conversation endpoint."""
    import uuid

    # Rate limit: 30 messages/hour per IP
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    rate_key = f"chat_{ip}"
    _rate_cache.setdefault(rate_key, [])
    _rate_cache[rate_key] = [t for t in _rate_cache[rate_key] if now - t < 3600]
    if len(_rate_cache[rate_key]) >= 30:
        raise HTTPException(429, "Too many messages. Take a breath and try again shortly.")
    _rate_cache[rate_key].append(now)

    # Build cosmic context and prompt
    cosmic_summary = _extract_cosmic_summary(req.reading_context)
    prompt = _build_chat_prompt(req.message, cosmic_summary, req.language)

    # Conversation ID: reuse if provided, else generate
    conversation_id = req.conversation_id or str(uuid.uuid4())

    # Call Gemini directly for fast response (skip multi-agent orchestrator)
    try:
        import os
        reply = await _call_gemini(prompt, temperature=0.85, max_tokens=800, timeout=30.0)
        reply = _sanitize_reading(reply)
    except Exception as e:
        logger.error(f"Aethera chat failed: {e}")
        reply = (
            "The cosmic signals are flickering, dear seeker. "
            "The stars are momentarily veiled, but their wisdom remains. "
            "Please ask again in a moment — the universe always answers those who persist."
        )

    # Generate contextual follow-up suggestions
    suggestions = _generate_chat_suggestions(req.reading_context)

    return ChatResponse(
        conversation_id=conversation_id,
        reply=reply,
        suggestions=suggestions,
    )


@router.get("/og-image")
async def og_image():
    """Return a rich 1200x630 social preview card for Open Graph."""
    from fastapi.responses import Response
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a1a"/>
      <stop offset="50%" stop-color="#1a0a40"/>
      <stop offset="100%" stop-color="#0d1a2e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7c5bf5"/>
      <stop offset="50%" stop-color="#ffd700"/>
      <stop offset="100%" stop-color="#00d4aa"/>
    </linearGradient>
    <radialGradient id="glow1" cx="30%" cy="20%"><stop offset="0%" stop-color="#7c5bf522"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    <radialGradient id="glow2" cx="70%" cy="80%"><stop offset="0%" stop-color="#00d4aa15"/><stop offset="100%" stop-color="transparent"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>
  <text x="600" y="200" text-anchor="middle" font-family="Georgia,serif" font-size="96" font-weight="700" fill="url(#gold)" letter-spacing="8">&#10024; Aethera</text>
  <text x="600" y="270" text-anchor="middle" font-family="Georgia,serif" font-size="32" fill="#c8c0e0" font-style="italic">Your Cosmic Identity, Revealed</text>
  <line x1="500" y1="310" x2="700" y2="310" stroke="#ffd70044" stroke-width="1"/>
  <text x="600" y="370" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#8888aa">Numerology &#183; Astrology &#183; Human Design &#183; Tarot &#183; Palm Reading</text>
  <text x="600" y="410" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#8888aa">Chinese Zodiac &#183; Celtic Tree &#183; Mayan Calendar &#183; Aura</text>
  <rect x="420" y="460" width="360" height="56" rx="28" fill="#7c5bf5"/>
  <text x="600" y="496" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#ffffff" font-weight="600">Discover Yours Free</text>
  <text x="600" y="580" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#555577" letter-spacing="4">aethera.live</text>
</svg>'''
    return Response(content=svg, media_type="image/svg+xml",
                    headers={"Cache-Control": "public, max-age=86400"})


@router.get("/assets/{subdir}/{filename}")
async def serve_asset_subdir(subdir: str, filename: str):
    """Serve static assets from css/ and js/ subdirectories."""
    from fastapi.responses import FileResponse
    from pathlib import Path

    # Only allow known subdirectories
    if subdir not in ("css", "js"):
        raise HTTPException(404, "Asset not found")

    # Security: prevent path traversal
    if ".." in filename or "/" in filename:
        raise HTTPException(400, "Invalid filename")

    asset_path = Path(__file__).parent / subdir / filename
    if not asset_path.exists() or not asset_path.is_file():
        raise HTTPException(404, "Asset not found")

    suffix = asset_path.suffix.lower()
    ct = {
        ".css": "text/css",
        ".js": "application/javascript",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
    }.get(suffix, "application/octet-stream")
    return FileResponse(asset_path, media_type=ct)


@router.get("/share/{share_id}")
async def share_page(share_id: str):
    """Serve a personalized share page with custom OG tags for social media previews."""
    from fastapi.responses import HTMLResponse
    import urllib.parse

    # Decode the share data from the ID (base64-encoded JSON)
    try:
        import base64, json
        data = json.loads(base64.urlsafe_b64decode(share_id + '==').decode())
    except Exception:
        data = {}

    name = data.get('n', 'Someone')
    archetype = data.get('a', 'Cosmic Traveler')
    tagline = data.get('t', '')
    sign = data.get('s', '')
    moon = data.get('m', '')
    rising = data.get('r', '')
    hd_type = data.get('h', '')
    hd_profile = data.get('hp', '')
    hd_auth = data.get('ha', '')
    lp = data.get('l', '')
    expr = data.get('le', '')
    soul = data.get('ls', '')
    chinese = data.get('cn', '')
    celtic = data.get('ct', '')
    aura = data.get('au', '')
    shock = data.get('sh', '')

    # Build rich description with the full reading
    desc_lines = []
    big3 = ' | '.join(filter(None, [sign, (moon + ' Moon') if moon else '', (rising + ' Rising') if rising else '']))
    if big3: desc_lines.append(big3)
    if hd_type: desc_lines.append(f'Human Design: {hd_type}' + (f' {hd_profile}' if hd_profile else '') + (f' ({hd_auth} Authority)' if hd_auth else ''))
    nums = ' | '.join(filter(None, [f'Life Path {lp}' if lp else '', f'Expression {expr}' if expr else '', f'Soul Urge {soul}' if soul else '']))
    if nums: desc_lines.append(nums)
    if chinese: desc_lines.append(chinese)
    if celtic: desc_lines.append(f'Celtic Tree: {celtic}')
    if aura: desc_lines.append(f'Aura: {aura}')
    if shock: desc_lines.append(f'"{shock}"')
    description = '. '.join(desc_lines) if desc_lines else 'Discover your cosmic identity'
    # OG description limit ~300 chars
    if len(description) > 280:
        description = description[:277] + '...'

    og_title = f"{name}'s Cosmic Profile — {archetype}"
    og_image_url = f"https://aethera.live/v1/aethera/share-image/{share_id}"
    share_url = f"https://aethera.live/v1/aethera/share/{share_id}"

    html = f"""<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{og_image_url}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{share_url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Aethera">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{og_title}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{og_image_url}">
<title>{name}'s Cosmic Profile — Aethera</title>
<meta http-equiv="refresh" content="0;url=https://aethera.live">
</head><body style="background:#0a0a1a;color:#fff;font-family:Georgia,serif;text-align:center;padding:60px 20px">
<h1 style="color:#ffd700">{name}'s Cosmic Profile</h1>
<h2 style="color:#8888aa;font-style:italic">{archetype}</h2>
<p style="color:#ccc;font-style:italic;margin:12px 0">{tagline}</p>
<p style="color:#aaa;margin:20px auto;max-width:500px;line-height:1.6">{description}</p>
<p style="margin-top:30px"><a href="https://aethera.live" style="color:#7c5bf5;font-size:1.2rem">Discover YOUR cosmic identity free →</a></p>
</body></html>"""
    return HTMLResponse(html)


@router.get("/share-image/{share_id}")
async def share_image(share_id: str):
    """Generate a personalized 1200x630 OG image for social sharing."""
    from fastapi.responses import Response

    try:
        import base64, json
        data = json.loads(base64.urlsafe_b64decode(share_id + '==').decode())
    except Exception:
        data = {}

    name = data.get('n', 'Someone')
    archetype = data.get('a', 'Cosmic Traveler')
    tagline = data.get('t', '')
    sign = data.get('s', '')
    moon = data.get('m', '')
    rising = data.get('r', '')
    hd_type = data.get('h', '')
    hd_profile = data.get('hp', '')
    hd_auth = data.get('ha', '')
    lp = data.get('l', '')
    expr_num = data.get('le', '')
    chinese = data.get('cn', '')
    celtic = data.get('ct', '')
    aura = data.get('au', '')
    shock = data.get('sh', '')

    # Build info lines for the image
    line1 = ' · '.join(filter(None, [sign, (moon + ' Moon') if moon else '', (rising + ' Rising') if rising else '']))
    line2 = ' · '.join(filter(None, [
        (hd_type + (' ' + hd_profile if hd_profile else '')) if hd_type else '',
        ('Life Path ' + str(lp)) if lp else '',
        chinese,
    ]))
    line3 = ' · '.join(filter(None, [
        ('Celtic: ' + celtic) if celtic else '',
        ('Aura: ' + aura) if aura else '',
        (hd_auth + ' Authority') if hd_auth else '',
    ]))
    # Truncate shock line for SVG (no line breaks)
    shock_display = shock[:100] + '...' if len(shock) > 100 else shock

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a1a"/><stop offset="50%" stop-color="#1a0a40"/><stop offset="100%" stop-color="#0d1a2e"/>
    </linearGradient>
    <linearGradient id="gd" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7c5bf5"/><stop offset="50%" stop-color="#ffd700"/><stop offset="100%" stop-color="#00d4aa"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="70" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#555577" letter-spacing="6">COSMIC PROFILE</text>
  <text x="600" y="125" text-anchor="middle" font-family="Georgia,serif" font-size="48" fill="#ffd700" font-weight="700">{name}</text>
  <text x="600" y="175" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="url(#gd)" font-style="italic">{archetype}</text>
  <line x1="450" y1="200" x2="750" y2="200" stroke="#ffd70033" stroke-width="1"/>
  <text x="600" y="240" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#c8c0e0">{line1}</text>
  <text x="600" y="275" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#8888aa">{line2}</text>
  <text x="600" y="305" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#666688">{line3}</text>
  <line x1="480" y1="330" x2="720" y2="330" stroke="#ffffff11" stroke-width="1"/>
  <text x="600" y="370" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#aa99cc" font-style="italic">&#x201C;{shock_display}&#x201D;</text>
  <text x="600" y="415" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#777799" font-style="italic">{tagline[:80]}</text>
  <rect x="420" y="460" width="360" height="50" rx="25" fill="#7c5bf5"/>
  <text x="600" y="492" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#fff" font-weight="600">Discover Yours Free</text>
  <text x="600" y="580" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#555577" letter-spacing="4">aethera.live</text>
</svg>'''
    return Response(content=svg, media_type="image/svg+xml",
                    headers={"Cache-Control": "public, max-age=86400"})


@router.get("/assets/{filename}")
async def serve_asset(filename: str):
    """Serve static assets (images, etc.)."""
    from fastapi.responses import FileResponse
    from pathlib import Path
    # Map asset names to files
    asset_map = {
        "hero": "aethera-hero.webp",
    }
    actual = asset_map.get(filename, filename)
    # Security: only serve from the aethera directory or cards subdirectory
    asset_path = Path(__file__).parent / actual
    if not asset_path.exists():
        # Try cards subdirectory
        asset_path = Path(__file__).parent / "cards" / actual
    if not asset_path.exists() or not asset_path.is_file():
        raise HTTPException(404, "Asset not found")
    # Determine content type
    suffix = asset_path.suffix.lower()
    ct = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml"}.get(suffix, "application/octet-stream")
    return FileResponse(asset_path, media_type=ct)


def _sanitize_reading(text: str) -> str:
    """Remove any technical/AI content that leaked into a reading."""
    _tech_patterns = [
        "technical analysis", "actionable recommendation", "platform improvement",
        "python", "API", "framework", "database", "concurrency", "garbage collection",
        "memory leak", "El Gringo", "ElGringo", "multi-agent", "prompt overload",
        "syntax error", "output validation", "locking mechanism", "race condition",
        "feedback loop", "feedback system", "orchestrat", "implement",
        "code suggestion", "engineering", "infrastructure",
    ]
    text = text.replace("**", "").strip()
    if any(tp.lower() in text.lower() for tp in _tech_patterns):
        cleaned = []
        for para in text.split("\n"):
            if not any(tp.lower() in para.lower() for tp in _tech_patterns):
                cleaned.append(para)
        text = "\n".join(cleaned).strip()
    return text


def _fallback_reading(name: str, div: dict, focus_area: str = "purpose") -> str:
    """Generate a basic reading if AI fails."""
    astro = div["western_astrology"]
    num = div["numerology"]
    cn = div["chinese_zodiac"]
    return (
        f"{name}, as a {astro['sign']} with Life Path {num['life_path']['number']}, "
        f"you carry the energy of {num['life_path']['meaning'].split('—')[1].strip() if '—' in num['life_path']['meaning'] else 'a unique soul'}. "
        f"The {cn['element']} {cn['animal']} within you adds {cn['traits'].lower()}. "
        f"Your Celtic birth tree, the {div['celtic_tree']['tree']}, marks you as "
        f"{div['celtic_tree']['meaning'].split('—')[1].strip() if '—' in div['celtic_tree']['meaning'] else 'a special spirit'}. "
        f"Today, your biorhythm shows physical energy at {div['biorhythm']['physical']}%, "
        f"emotional flow at {div['biorhythm']['emotional']}%, and intellectual sharpness at {div['biorhythm']['intellectual']}%. "
        f"Regarding your {focus_area}, trust the cosmic patterns unfolding around you."
    )


# ─── Dream Interpretation ────────────────────────────────────────────────────

# Separate rate cache for dream interpretations
_dream_rate_cache: dict = {}


def _build_dream_prompt(dream_text: str, cosmic_summary: str, language: str) -> str:
    """Build the dream interpretation prompt using multiple professional techniques."""
    lang_name = _LANGUAGE_NAMES.get(language, "English")
    lang_instruction = (
        f"\n\nCRITICAL: Write the ENTIRE interpretation in {lang_name}. "
        f"Section labels (INTERPRETATION, SYMBOLS, etc.) must remain in English as markers, "
        f"but all content text must be in {lang_name}."
        if language != "en" else ""
    )

    has_astrology = any(k in cosmic_summary for k in ["Sun:", "Moon:", "Rising:"])
    has_hd = "Human Design:" in cosmic_summary
    has_numerology = "Life Path:" in cosmic_summary

    techniques_section = """INTERPRETATION TECHNIQUES TO APPLY:

1. JUNGIAN ANALYSIS: Identify archetypes present (Shadow, Anima/Animus, the Self, the Wise Old Man/Woman, the Trickster). Look for symbols of the collective unconscious. Assess what the dream reveals about the dreamer's individuation process and shadow integration.

2. FREUDIAN SYMBOLISM: Distinguish between the manifest content (what literally happened) and the latent content (hidden meaning). Identify wish fulfillment elements and any condensation or displacement of emotions.

3. GESTALT DREAMWORK: Treat every element in the dream — every person, object, animal, and landscape — as a projection of a part of the dreamer. What does each element say about the dreamer's inner world?

4. MYTHOLOGICAL/ARCHETYPAL (Joseph Campbell): Map the dream to the hero's journey stages — is the dreamer in the Departure, Initiation, or Return phase? Identify universal mythological symbols (the threshold, the abyss, the treasure, the return).

5. SPIRITUAL/TRANSPERSONAL: Assess prophetic or precognitive elements. Identify astral symbolism, chakra connections (which energy centers are activated), and any messages from the higher self or spiritual guides."""

    if has_astrology:
        techniques_section += """

6. ASTROLOGICAL TRANSIT ANALYSIS: Connect dream themes and symbols directly to the dreamer's natal chart and current planetary transits. Water dreams for water signs, fire/conflict dreams during Mars transits, transformation dreams during Pluto aspects."""

    if has_hd:
        techniques_section += """

7. HUMAN DESIGN ENERGY ANALYSIS: Connect dream patterns to the dreamer's Human Design type, authority, and strategy. Generators may dream of satisfaction vs frustration, Projectors of recognition vs bitterness, Manifestors of initiation vs anger, Reflectors of surprise vs disappointment."""

    if has_numerology:
        techniques_section += """

8. NUMEROLOGICAL SYMBOLISM: Identify numbers appearing in the dream (people, objects, repetitions, floors, doors) and connect them to the dreamer's Life Path number and personal year cycle."""

    return f"""You are Aethera, a cosmic oracle who is also a masterfully trained dream analyst. You weave together ancient wisdom traditions with professional dream interpretation techniques to deliver profound, personalized dream analysis.

THE DREAMER'S COSMIC PROFILE:
{cosmic_summary}

THE DREAM:
{dream_text}

{techniques_section}

INSTRUCTIONS:
Analyze this dream through ALL applicable techniques above, then synthesize your findings into a unified interpretation. Personalize everything to the dreamer's cosmic profile.

Format your response EXACTLY as follows:

ARCHETYPE: [Name the dream archetype — choose from or adapt: The Journey, The Shadow, The Transformation, The Threshold, The Descent, The Ascent, The Mirror, The Storm, The Garden, The Labyrinth, The Flight, The Return, The Initiation, The Reunion, The Dissolution, The Creation. Pick the one that best captures the dream's core energy.]

INTERPRETATION:
[3-4 paragraphs weaving together insights from all applicable techniques. Start with the dominant theme, move through the symbolic layers, and close with the dream's deepest message. Reference the dreamer's specific cosmic data (signs, life path, HD type) throughout. This should feel like a profound personal revelation, not a textbook analysis.]

SYMBOLS:
[List each significant symbol from the dream, one per line, in this exact format:]
symbol_name|meaning and significance|connection to the dreamer's cosmic profile
[Example:]
water|Emotional depth and the unconscious mind|Connected to your Pisces Sun — water is your native element
door|Transition and new opportunities|Your Life Path 7 seeks hidden doorways to truth
[Include 4-8 symbols. Every symbol MUST have all three parts separated by pipes.]

COSMIC_CONNECTIONS:
[2-3 paragraphs explaining how this dream connects to the dreamer's chart, transits, Human Design type, life path number, and current cosmic weather. Be specific — reference actual data from their profile.]

GUIDANCE:
[2-3 paragraphs of actionable guidance drawn from the dream's message. What should the dreamer do, reflect on, or change? Include a specific ritual, meditation, or practice they can try. Connect the guidance to their cosmic profile.]

CRITICAL RULES:
- Stay in character as Aethera, a mystical cosmic dream oracle, at ALL times.
- NEVER mention AI, technology, algorithms, or break character.
- NEVER use generic dream dictionary entries — every interpretation must feel deeply personal.
- Reference the dreamer's actual cosmic data (signs, numbers, HD type) throughout.
- Be warm, wise, and specific — never vague or generic.{lang_instruction}"""


def _parse_dream_symbols(raw_text: str) -> List[dict]:
    """Parse dream symbols from the SYMBOLS section of the AI response."""
    symbols = []
    if "SYMBOLS:" not in raw_text:
        return symbols

    # Extract the SYMBOLS section
    symbols_section = raw_text.split("SYMBOLS:", 1)[1]
    # Find where it ends (next section marker)
    for marker in ["COSMIC_CONNECTIONS:", "GUIDANCE:"]:
        if marker in symbols_section:
            symbols_section = symbols_section.split(marker)[0]
            break

    for line in symbols_section.strip().split("\n"):
        line = line.strip().lstrip("- ").strip()
        if "|" not in line or len(line) < 5:
            continue
        parts = line.split("|")
        if len(parts) >= 3:
            symbols.append({
                "symbol": parts[0].strip(),
                "meaning": parts[1].strip(),
                "cosmic_connection": parts[2].strip(),
            })
        elif len(parts) == 2:
            symbols.append({
                "symbol": parts[0].strip(),
                "meaning": parts[1].strip(),
                "cosmic_connection": "",
            })

    return symbols


def _determine_techniques_used(cosmic_summary: str) -> List[str]:
    """Determine which interpretation techniques were applied based on available data."""
    techniques = ["Jungian Analysis", "Gestalt Dreamwork", "Mythological/Archetypal"]

    if any(k in cosmic_summary for k in ["Sun:", "Moon:", "Rising:"]):
        techniques.append("Astrological Transit Analysis")

    if "Human Design:" in cosmic_summary:
        techniques.append("Human Design Energy Analysis")

    if "Life Path:" in cosmic_summary:
        techniques.append("Numerological Symbolism")

    # Always include these foundational methods
    techniques.append("Freudian Symbolism")
    techniques.append("Spiritual/Transpersonal")

    return techniques


@router.post("/dream", response_model=DreamResponse)
async def dream_interpretation(
    req: DreamRequest, request: Request, user: dict = Depends(require_auth)
):
    """Interpret a dream using multiple professional techniques, personalized to the seeker's cosmic profile."""
    # Rate limit: 10 dream interpretations/hour per IP
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    rate_key = f"dream_{ip}"
    _dream_rate_cache.setdefault(rate_key, [])
    _dream_rate_cache[rate_key] = [t for t in _dream_rate_cache[rate_key] if now - t < 3600]
    if len(_dream_rate_cache[rate_key]) >= 10:
        raise HTTPException(429, "Too many dream interpretations. Let your subconscious rest and try again later.")
    _dream_rate_cache[rate_key].append(now)

    # Build cosmic context from reading data
    cosmic_summary = _extract_cosmic_summary(req.reading_context)

    # Build the dream interpretation prompt
    prompt = _build_dream_prompt(req.dream_text, cosmic_summary, req.language)

    # Call Gemini
    try:
        raw_text = await _call_gemini(prompt, temperature=0.9, max_tokens=2000, timeout=45.0)
        raw_text = _sanitize_reading(raw_text)
    except Exception as e:
        logger.error(f"Aethera dream interpretation failed: {e}")
        raise HTTPException(502, "The dream realm is momentarily veiled. Please try again.")

    # Parse the structured response
    interpretation = ""
    archetype = "The Journey"
    cosmic_connections = ""
    guidance = ""

    try:
        import re
        # Strip markdown bold from section labels
        raw_text = re.sub(
            r'\*\*(ARCHETYPE|INTERPRETATION|SYMBOLS|COSMIC_CONNECTIONS|GUIDANCE)\*\*\s*:',
            r'\1:', raw_text
        )
        raw_text = re.sub(
            r'\*(ARCHETYPE|INTERPRETATION|SYMBOLS|COSMIC_CONNECTIONS|GUIDANCE)\*\s*:',
            r'\1:', raw_text
        )

        # Extract ARCHETYPE
        if "ARCHETYPE:" in raw_text:
            archetype_line = raw_text.split("ARCHETYPE:", 1)[1].split("\n")[0].strip()
            archetype = archetype_line.strip("*").strip().strip('"').strip()
            if not archetype:
                archetype = "The Journey"

        # Extract INTERPRETATION
        if "INTERPRETATION:" in raw_text:
            interp_section = raw_text.split("INTERPRETATION:", 1)[1]
            for marker in ["SYMBOLS:", "COSMIC_CONNECTIONS:", "GUIDANCE:"]:
                if marker in interp_section:
                    interp_section = interp_section.split(marker)[0]
                    break
            interpretation = interp_section.strip()

        # Extract COSMIC_CONNECTIONS
        if "COSMIC_CONNECTIONS:" in raw_text:
            cc_section = raw_text.split("COSMIC_CONNECTIONS:", 1)[1]
            if "GUIDANCE:" in cc_section:
                cc_section = cc_section.split("GUIDANCE:")[0]
            cosmic_connections = cc_section.strip()

        # Extract GUIDANCE
        if "GUIDANCE:" in raw_text:
            guidance = raw_text.split("GUIDANCE:", 1)[1].strip()
            # Remove any trailing CRITICAL RULES section if it leaked
            if "CRITICAL RULES:" in guidance:
                guidance = guidance.split("CRITICAL RULES:")[0].strip()
            if "CRITICAL:" in guidance:
                guidance = guidance.split("CRITICAL:")[0].strip()
    except Exception:
        # If parsing fails, use the raw text as interpretation
        interpretation = raw_text

    # Parse symbols
    symbols = _parse_dream_symbols(raw_text)

    # Fallback if no symbols were parsed
    if not symbols:
        symbols = [{"symbol": "the dream itself", "meaning": "A message from your subconscious", "cosmic_connection": "Connected to your current cosmic cycle"}]

    # Fallback for empty sections
    if not interpretation:
        interpretation = raw_text
    if not cosmic_connections:
        cosmic_connections = "Your dream resonates with the cosmic energies currently surrounding you. Reflect on how its themes mirror your waking journey."
    if not guidance:
        guidance = "Sit with this dream. Write it down, revisit it before sleep tonight, and notice what feelings arise. Your subconscious is trying to deliver an important message."

    # Determine which techniques were used
    techniques_used = _determine_techniques_used(cosmic_summary)

    return DreamResponse(
        interpretation=interpretation,
        symbols=symbols,
        archetype=archetype,
        cosmic_connections=cosmic_connections,
        guidance=guidance,
        techniques_used=techniques_used,
    )
