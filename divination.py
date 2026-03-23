"""Pure Python divination calculations — no external dependencies."""

import math
from datetime import date, timedelta

# ─── Numerology ──────────────────────────────────────────────────────────────

_PYTHAGOREAN = {c: (i % 9) + 1 for i, c in enumerate("abcdefghijklmnopqrstuvwxyz")}

LIFE_PATH_MEANINGS = {
    1: "The Leader — independent, ambitious, pioneering",
    2: "The Diplomat — sensitive, cooperative, peacemaker",
    3: "The Communicator — creative, expressive, joyful",
    4: "The Builder — disciplined, practical, grounded",
    5: "The Adventurer — freedom-loving, versatile, restless",
    6: "The Nurturer — responsible, caring, harmonious",
    7: "The Seeker — analytical, introspective, spiritual",
    8: "The Powerhouse — ambitious, authoritative, material mastery",
    9: "The Humanitarian — compassionate, wise, selfless",
    11: "The Intuitive — visionary, spiritually aware, illuminating",
    22: "The Master Builder — visionary architect, large-scale achievement",
    33: "The Master Teacher — selfless service, spiritual upliftment",
}

LIFE_PATH_DESCRIPTIONS = {
    1: "You are here to learn independence and self-leadership. Life Path 1s are born innovators — you forge new trails rather than following existing ones. Your challenge is balancing self-reliance with connection. You thrive when you trust your own vision.",
    2: "You are here to master cooperation, intuition, and emotional intelligence. Life Path 2s are the quiet power behind great partnerships. Your sensitivity is your superpower — you feel what others miss. Your challenge is standing firm without losing your gentleness.",
    3: "You are here to express, create, and inspire joy. Life Path 3s carry an infectious creative energy — words, art, and ideas flow through you naturally. Your challenge is focus — you have so many gifts that scattering your energy is your biggest risk.",
    4: "You are here to build lasting foundations. Life Path 4s are the architects of reality — methodical, reliable, and endlessly determined. Your challenge is releasing rigidity and trusting that not everything needs a plan to work out.",
    5: "You are here to experience freedom and change. Life Path 5s are restless souls who learn through adventure, travel, and variety. Your challenge is commitment — you must learn that true freedom sometimes comes from staying, not leaving.",
    6: "You are here to nurture, heal, and create harmony. Life Path 6s are natural caretakers who feel responsible for everyone around them. Your challenge is letting others carry their own weight — your love becomes a prison when you give too much.",
    7: "You are here to seek truth beneath the surface. Life Path 7s are the philosophers and mystics — driven by questions most people never think to ask. Your challenge is trusting your heart as much as your mind, and letting others in past your walls.",
    8: "You are here to master the material world — power, money, and authority. Life Path 8s have a natural magnetism for abundance but must learn that true wealth is internal. Your challenge is using power in service of others, not just yourself.",
    9: "You are here to complete a great cycle of learning and give back to the world. Life Path 9s carry old-soul wisdom and deep compassion. Your challenge is letting go — of grudges, of the past, of the need to save everyone. Your liberation comes through surrender.",
    11: "You carry a Master Number — a higher vibration of Life Path 2. You are a spiritual channel with unusual intuitive gifts. Your challenge is managing the intensity of your sensitivity without retreating from the world. You are here to illuminate.",
    22: "You carry a Master Number — a higher vibration of Life Path 4. You have the rare ability to turn visionary ideas into tangible reality at scale. Your challenge is patience — your dreams are massive and the world moves slower than your vision.",
    33: "You carry a Master Number — a higher vibration of Life Path 6. You are a master healer and teacher whose presence elevates everyone around you. Your challenge is bearing the weight of compassion without losing yourself in others' pain.",
}

NUMEROLOGY_EXPLANATIONS = {
    "life_path": "Your Life Path number is the most important number in numerology. It's calculated by reducing your full birthdate (day + month + year) to a single digit (or master number 11, 22, 33). It reveals your life's purpose and the lessons you're here to learn.",
    "expression": "Your Expression number (also called Destiny number) comes from the numerical value of all the letters in your full birth name. Each letter maps to a number (A=1, B=2... I=9, J=1...). It reveals your natural talents, abilities, and the gifts you carry into this life.",
    "soul_urge": "Your Soul Urge number (also called Heart's Desire) is calculated from only the vowels in your name. It reveals what your soul truly craves — the inner motivation that drives you beneath the surface, often hidden even from yourself.",
}


def _reduce(n: int) -> int:
    """Reduce to single digit or master number."""
    while n > 9 and n not in (11, 22, 33):
        n = sum(int(d) for d in str(n))
    return n


def calc_life_path(birthdate: date) -> dict:
    total = sum(int(d) for d in birthdate.strftime("%Y%m%d"))
    lp = _reduce(total)
    digits = birthdate.strftime("%Y%m%d")
    calc_str = " + ".join(digits) + f" = {total} → {lp}"
    return {
        "number": lp,
        "meaning": LIFE_PATH_MEANINGS.get(lp, ""),
        "description": LIFE_PATH_DESCRIPTIONS.get(lp, ""),
        "calculation": calc_str,
        "explanation": NUMEROLOGY_EXPLANATIONS["life_path"],
    }


def calc_expression_number(name: str) -> dict:
    letters = [(c, _PYTHAGOREAN.get(c, 0)) for c in name.lower() if c.isalpha()]
    total = sum(v for _, v in letters)
    num = _reduce(total)
    calc_str = " + ".join(f"{c.upper()}({v})" for c, v in letters[:8])
    if len(letters) > 8:
        calc_str += f" + ... = {total} → {num}"
    else:
        calc_str += f" = {total} → {num}"
    return {
        "number": num,
        "meaning": LIFE_PATH_MEANINGS.get(num, ""),
        "description": LIFE_PATH_DESCRIPTIONS.get(num, ""),
        "calculation": calc_str,
        "explanation": NUMEROLOGY_EXPLANATIONS["expression"],
    }


def calc_soul_urge(name: str) -> dict:
    vowels = set("aeiou")
    letters = [(c, _PYTHAGOREAN.get(c, 0)) for c in name.lower() if c in vowels]
    total = sum(v for _, v in letters)
    num = _reduce(total)
    calc_str = " + ".join(f"{c.upper()}({v})" for c, v in letters) + f" = {total} → {num}"
    return {
        "number": num,
        "meaning": LIFE_PATH_MEANINGS.get(num, ""),
        "description": LIFE_PATH_DESCRIPTIONS.get(num, ""),
        "calculation": calc_str,
        "explanation": NUMEROLOGY_EXPLANATIONS["soul_urge"],
    }


# ─── Western Astrology ───────────────────────────────────────────────────────

_SIGNS = [
    ((3, 21), (4, 19), "Aries", "Fire", "Cardinal", "♈"),
    ((4, 20), (5, 20), "Taurus", "Earth", "Fixed", "♉"),
    ((5, 21), (6, 20), "Gemini", "Air", "Mutable", "♊"),
    ((6, 21), (7, 22), "Cancer", "Water", "Cardinal", "♋"),
    ((7, 23), (8, 22), "Leo", "Fire", "Fixed", "♌"),
    ((8, 23), (9, 22), "Virgo", "Earth", "Mutable", "♍"),
    ((9, 23), (10, 22), "Libra", "Air", "Cardinal", "♎"),
    ((10, 23), (11, 21), "Scorpio", "Water", "Fixed", "♏"),
    ((11, 22), (12, 21), "Sagittarius", "Fire", "Mutable", "♐"),
    ((12, 22), (1, 19), "Capricorn", "Earth", "Cardinal", "♑"),
    ((1, 20), (2, 18), "Aquarius", "Air", "Fixed", "♒"),
    ((2, 19), (3, 20), "Pisces", "Water", "Mutable", "♓"),
]

SIGN_DESCRIPTIONS = {
    "Aries": {
        "personality": "Aries charges into life headfirst with unstoppable energy and raw courage. You are the spark that ignites new ventures, the warrior who thrives on challenge. Your pioneering spirit means you'd rather fail spectacularly than play it safe.",
        "strengths": "Courageous, determined, confident, enthusiastic, optimistic, honest, passionate",
        "challenges": "Impatient, moody, short-tempered, impulsive, aggressive, confrontational",
        "compatibility": "Leo, Sagittarius, Gemini, Aquarius",
        "ruling_planet": "Mars",
        "lucky_numbers": "1, 8, 17",
        "season": "Early Spring (Mar 21 - Apr 19)",
    },
    "Taurus": {
        "personality": "Taurus is the anchor of the zodiac — patient, reliable, and deeply sensual. You build your life with care, surrounding yourself with beauty and comfort. Once you commit to something, nothing in the universe can move you from your path.",
        "strengths": "Reliable, patient, practical, devoted, responsible, stable, grounded",
        "challenges": "Stubborn, possessive, uncompromising, materialistic, resistant to change",
        "compatibility": "Virgo, Capricorn, Cancer, Pisces",
        "ruling_planet": "Venus",
        "lucky_numbers": "2, 6, 9, 12",
        "season": "Late Spring (Apr 20 - May 20)",
    },
    "Gemini": {
        "personality": "Gemini is the eternal student of the zodiac, endlessly curious and brilliantly adaptable. Your mind moves at lightning speed, making connections others miss entirely. You are two (or more) people living in one body — and that's your superpower.",
        "strengths": "Gentle, affectionate, curious, adaptable, quick learner, witty, versatile",
        "challenges": "Nervous, inconsistent, indecisive, scattered, superficial, restless",
        "compatibility": "Libra, Aquarius, Aries, Leo",
        "ruling_planet": "Mercury",
        "lucky_numbers": "5, 7, 14, 23",
        "season": "Early Summer (May 21 - Jun 20)",
    },
    "Cancer": {
        "personality": "Cancer feels everything — and remembers it all. You are the emotional memory of the zodiac, carrying deep wells of empathy and fierce protective instincts. Behind your tough shell lies the most nurturing heart, one that creates home wherever you go.",
        "strengths": "Tenacious, highly imaginative, loyal, emotional, sympathetic, persuasive, nurturing",
        "challenges": "Moody, pessimistic, suspicious, manipulative, insecure, clingy",
        "compatibility": "Scorpio, Pisces, Taurus, Virgo",
        "ruling_planet": "Moon",
        "lucky_numbers": "2, 3, 15, 20",
        "season": "Mid Summer (Jun 21 - Jul 22)",
    },
    "Leo": {
        "personality": "Leo doesn't just enter a room — they illuminate it. You are born to lead, create, and inspire, radiating a warmth that draws people into your orbit. Your generosity is legendary, and your heart is as big as your personality.",
        "strengths": "Creative, passionate, generous, warm-hearted, cheerful, humorous, natural leader",
        "challenges": "Arrogant, stubborn, self-centered, lazy, inflexible, domineering",
        "compatibility": "Aries, Sagittarius, Gemini, Libra",
        "ruling_planet": "Sun",
        "lucky_numbers": "1, 3, 10, 19",
        "season": "Late Summer (Jul 23 - Aug 22)",
    },
    "Virgo": {
        "personality": "Virgo sees the details the rest of the world overlooks. You are the master craftsperson of the zodiac — analytical, methodical, and driven by a deep need to be useful. Your critical eye is a gift, though learning when to turn it off is your life's work.",
        "strengths": "Loyal, analytical, kind, hardworking, practical, meticulous, reliable",
        "challenges": "Shyness, worry, overly critical, perfectionist, all work and no play",
        "compatibility": "Taurus, Capricorn, Cancer, Scorpio",
        "ruling_planet": "Mercury",
        "lucky_numbers": "5, 14, 15, 23, 32",
        "season": "Early Autumn (Aug 23 - Sep 22)",
    },
    "Libra": {
        "personality": "Libra is the zodiac's diplomat, artist, and lover of beauty. You crave harmony so deeply that you'll reshape your entire world to create it. Partnership is your natural state — you understand that life's greatest achievements come through collaboration.",
        "strengths": "Cooperative, diplomatic, gracious, fair-minded, social, charming, idealistic",
        "challenges": "Indecisive, avoids confrontation, self-pitying, people-pleasing, superficial",
        "compatibility": "Gemini, Aquarius, Leo, Sagittarius",
        "ruling_planet": "Venus",
        "lucky_numbers": "4, 6, 13, 15, 24",
        "season": "Mid Autumn (Sep 23 - Oct 22)",
    },
    "Scorpio": {
        "personality": "Scorpio lives at the extremes. You are the zodiac's alchemist, transforming pain into power and darkness into depth. Nothing about you is shallow — you love hard, fight hard, and feel everything at maximum intensity. Your greatest gift is rebirth.",
        "strengths": "Resourceful, brave, passionate, stubborn, strategic, loyal, magnetic",
        "challenges": "Distrusting, jealous, secretive, manipulative, obsessive, vengeful",
        "compatibility": "Cancer, Pisces, Virgo, Capricorn",
        "ruling_planet": "Pluto & Mars",
        "lucky_numbers": "8, 11, 18, 22",
        "season": "Late Autumn (Oct 23 - Nov 21)",
    },
    "Sagittarius": {
        "personality": "Sagittarius is the philosopher-adventurer of the zodiac, forever chasing the horizon. You need freedom like you need oxygen, and your optimism is genuinely infectious. Your arrow points always upward — toward bigger ideas, wider worlds, and deeper truths.",
        "strengths": "Generous, idealistic, great sense of humor, adventurous, honest, philosophical",
        "challenges": "Promises more than can deliver, impatient, tactless, restless, commitment-phobic",
        "compatibility": "Aries, Leo, Libra, Aquarius",
        "ruling_planet": "Jupiter",
        "lucky_numbers": "3, 7, 9, 12, 21",
        "season": "Early Winter (Nov 22 - Dec 21)",
    },
    "Capricorn": {
        "personality": "Capricorn is the mountain goat — steadily climbing toward the summit while others quit. You are disciplined, ambitious, and built for the long game. Time is your ally; you age like fine wine, growing more powerful and self-assured with each passing year.",
        "strengths": "Responsible, disciplined, self-control, good managers, ambitious, patient",
        "challenges": "Know-it-all, unforgiving, condescending, pessimistic, workaholic, rigid",
        "compatibility": "Taurus, Virgo, Scorpio, Pisces",
        "ruling_planet": "Saturn",
        "lucky_numbers": "4, 8, 13, 22",
        "season": "Mid Winter (Dec 22 - Jan 19)",
    },
    "Aquarius": {
        "personality": "Aquarius is the visionary rebel of the zodiac — always ten years ahead of everyone else. You see systems, patterns, and possibilities that others cannot. Your independence isn't selfishness; it's the necessary space for your revolutionary mind to do its work.",
        "strengths": "Progressive, original, independent, humanitarian, inventive, intellectual",
        "challenges": "Runs from emotional expression, temperamental, uncompromising, aloof, detached",
        "compatibility": "Gemini, Libra, Aries, Sagittarius",
        "ruling_planet": "Uranus & Saturn",
        "lucky_numbers": "4, 7, 11, 22, 29",
        "season": "Late Winter (Jan 20 - Feb 18)",
    },
    "Pisces": {
        "personality": "Pisces swims in the deepest waters of the zodiac — the realm of dreams, intuition, and boundless compassion. You absorb the emotions of everyone around you, which is both your greatest gift and your heaviest burden. Your imagination has no limits.",
        "strengths": "Compassionate, artistic, intuitive, gentle, wise, musical, selfless",
        "challenges": "Fearful, overly trusting, sad, desire to escape reality, can be a victim or a martyr",
        "compatibility": "Cancer, Scorpio, Taurus, Capricorn",
        "ruling_planet": "Neptune & Jupiter",
        "lucky_numbers": "3, 9, 12, 15, 18, 24",
        "season": "Early Spring (Feb 19 - Mar 20)",
    },
}


def _location_to_coords(location: str):
    """Return (lat, lon) for a location string, or None if unknown."""
    if not location:
        return None
    _COORDS = {
        # US cities
        "new york": (40.7128, -74.0060), "los angeles": (34.0522, -118.2437),
        "chicago": (41.8781, -87.6298), "houston": (29.7604, -95.3698),
        "phoenix": (33.4484, -112.0740), "philadelphia": (39.9526, -75.1652),
        "san antonio": (29.4241, -98.4936), "san diego": (32.7157, -117.1611),
        "dallas": (32.7767, -96.7970), "san jose": (37.3382, -121.8863),
        "austin": (30.2672, -97.7431), "jacksonville": (30.3322, -81.6557),
        "san francisco": (37.7749, -122.4194), "seattle": (47.6062, -122.3321),
        "denver": (39.7392, -104.9903), "nashville": (36.1627, -86.7816),
        "washington": (38.9072, -77.0369), "boston": (42.3601, -71.0589),
        "portland": (45.5152, -122.6784), "las vegas": (36.1699, -115.1398),
        "atlanta": (33.7490, -84.3880), "miami": (25.7617, -80.1918),
        "minneapolis": (44.9778, -93.2650), "detroit": (42.3314, -83.0458),
        "new orleans": (29.9511, -90.0715), "cleveland": (41.4993, -81.6944),
        "pittsburgh": (40.4406, -79.9959), "st louis": (38.6270, -90.1994),
        "indianapolis": (39.7684, -86.1581), "cincinnati": (39.1031, -84.5120),
        "milwaukee": (43.0389, -87.9065), "kansas city": (39.0997, -94.5786),
        "hammond": (41.5834, -87.5001),
        # International
        "london": (51.5074, -0.1278), "paris": (48.8566, 2.3522),
        "berlin": (52.5200, 13.4050), "rome": (41.9028, 12.4964),
        "madrid": (40.4168, -3.7038), "amsterdam": (52.3676, 4.9041),
        "tokyo": (35.6762, 139.6503), "beijing": (39.9042, 116.4074),
        "shanghai": (31.2304, 121.4737), "mumbai": (19.0760, 72.8777),
        "delhi": (28.7041, 77.1025), "sydney": (-33.8688, 151.2093),
        "melbourne": (-37.8136, 144.9631), "toronto": (43.6532, -79.3832),
        "vancouver": (49.2827, -123.1207), "montreal": (45.5017, -73.5673),
        "mexico city": (19.4326, -99.1332), "sao paulo": (-23.5505, -46.6333),
        "rio de janeiro": (-22.9068, -43.1729), "buenos aires": (-34.6037, -58.3816),
        "cairo": (30.0444, 31.2357), "istanbul": (41.0082, 28.9784),
        "moscow": (55.7558, 37.6173), "dubai": (25.2048, 55.2708),
        "singapore": (1.3521, 103.8198), "hong kong": (22.3193, 114.1694),
        "bangkok": (13.7563, 100.5018), "seoul": (37.5665, 126.9780),
        "stockholm": (59.3293, 18.0686), "oslo": (59.9139, 10.7522),
        "copenhagen": (55.6761, 12.5683), "dublin": (53.3498, -6.2603),
        "lisbon": (38.7223, -9.1393), "athens": (37.9838, 23.7275),
        "vienna": (48.2082, 16.3738), "zurich": (47.3769, 8.5417),
        "helsinki": (60.1699, 24.9384), "warsaw": (52.2297, 21.0122),
        # US states (capitals as representative coords)
        "alabama": (32.3182, -86.9023), "alaska": (64.2008, -152.4937),
        "arizona": (33.4484, -112.0740), "arkansas": (34.7465, -92.2896),
        "california": (36.7783, -119.4179), "colorado": (39.5501, -105.7821),
        "connecticut": (41.6032, -73.0877), "delaware": (38.9108, -75.5277),
        "florida": (27.6648, -81.5158), "georgia": (32.1656, -82.9001),
        "hawaii": (19.8968, -155.5828), "idaho": (44.0682, -114.7420),
        "illinois": (40.6331, -89.3985), "indiana": (40.2672, -86.1349),
        "iowa": (41.8780, -93.0977), "kansas": (39.0119, -98.4842),
        "kentucky": (37.8393, -84.2700), "louisiana": (30.9843, -91.9623),
        "maine": (45.2538, -69.4455), "maryland": (39.0458, -76.6413),
        "massachusetts": (42.4072, -71.3824), "michigan": (44.3148, -85.6024),
        "minnesota": (46.7296, -94.6859), "mississippi": (32.3547, -89.3985),
        "missouri": (37.9643, -91.8318), "montana": (46.8797, -110.3626),
        "nebraska": (41.4925, -99.9018), "nevada": (38.8026, -116.4194),
        "new hampshire": (43.1939, -71.5724), "new jersey": (40.0583, -74.4057),
        "new mexico": (34.5199, -105.8701), "north carolina": (35.7596, -79.0193),
        "north dakota": (47.5515, -101.0020), "ohio": (40.4173, -82.9071),
        "oklahoma": (35.4676, -97.5164), "oregon": (43.8041, -120.5542),
        "pennsylvania": (41.2033, -77.1945), "rhode island": (41.5801, -71.4774),
        "south carolina": (33.8361, -81.1637), "south dakota": (43.9695, -99.9018),
        "tennessee": (35.5175, -86.5804), "texas": (31.9686, -99.9018),
        "utah": (39.3210, -111.0937), "vermont": (44.5588, -72.5778),
        "virginia": (37.4316, -78.6569), "west virginia": (38.5976, -80.4549),
        "wisconsin": (43.7844, -88.7879), "wyoming": (43.0760, -107.2903),
    }
    loc_lower = location.lower().strip()
    # Try exact match first
    if loc_lower in _COORDS:
        return _COORDS[loc_lower]
    # Try substring match (e.g. "Hammond, Indiana" → match "hammond")
    for key, coords in _COORDS.items():
        if key in loc_lower:
            return coords
    return None


# Zodiac sign boundaries by ecliptic longitude
_ZODIAC_SIGNS_BY_LON = [
    (0, "Aries", "Fire", "Cardinal", "♈"), (30, "Taurus", "Earth", "Fixed", "♉"),
    (60, "Gemini", "Air", "Mutable", "♊"), (90, "Cancer", "Water", "Cardinal", "♋"),
    (120, "Leo", "Fire", "Fixed", "♌"), (150, "Virgo", "Earth", "Mutable", "♍"),
    (180, "Libra", "Air", "Cardinal", "♎"), (210, "Scorpio", "Water", "Fixed", "♏"),
    (240, "Sagittarius", "Fire", "Mutable", "♐"), (270, "Capricorn", "Earth", "Cardinal", "♑"),
    (300, "Aquarius", "Air", "Fixed", "♒"), (330, "Pisces", "Water", "Mutable", "♓"),
]

# Planet constants for Swiss Ephemeris
_PLANET_IDS = {
    "Sun": 0, "Moon": 1, "Mercury": 2, "Venus": 3, "Mars": 4,
    "Jupiter": 5, "Saturn": 6, "Uranus": 7, "Neptune": 8, "Pluto": 9,
}

# Aspect definitions: name, angle, orb
_ASPECTS = [
    ("Conjunction", 0, 8), ("Sextile", 60, 8), ("Square", 90, 8),
    ("Trine", 120, 8), ("Opposition", 180, 8),
]

# Moon phase names by angle range (Sun-Moon angle)
_MOON_PHASES = [
    (0, 45, "New Moon"), (45, 90, "Waxing Crescent"), (90, 135, "First Quarter"),
    (135, 180, "Waxing Gibbous"), (180, 225, "Full Moon"), (225, 270, "Waning Gibbous"),
    (270, 315, "Last Quarter"), (315, 360, "Waning Crescent"),
]


def _lon_to_sign(longitude: float):
    """Convert ecliptic longitude to (sign_name, element, modality, symbol, degree_in_sign)."""
    lon = longitude % 360
    idx = int(lon / 30)
    if idx > 11:
        idx = 11
    _, name, element, modality, symbol = _ZODIAC_SIGNS_BY_LON[idx]
    degree_in_sign = lon - (idx * 30)
    return name, element, modality, symbol, degree_in_sign


def calc_western_astrology(birthdate: date, birth_time: str = None, location: str = None) -> dict:
    """Calculate a full natal chart using the Swiss Ephemeris.

    Gracefully degrades: without birth_time/location, Ascendant and houses are omitted.
    """
    try:
        import swisseph as swe
        swe.set_ephe_path('')
    except ImportError:
        # Fallback to date-only Sun sign if swisseph unavailable
        return _calc_western_astrology_fallback(birthdate)

    # Convert birth to Julian Day using the shared HD helper
    birth_jd = _birth_to_utc_jd(birthdate, birth_time, location)

    # ── Planetary positions ──
    planet_longitudes = {}
    planet_signs = {}
    for pname, pid in _PLANET_IDS.items():
        pos, _ = swe.calc_ut(birth_jd, pid)
        lon = pos[0]
        planet_longitudes[pname] = lon
        sign_name, _, _, symbol, deg = _lon_to_sign(lon)
        planet_signs[pname] = {"sign": sign_name, "symbol": symbol, "degree": round(deg, 2)}

    # Sun sign (primary)
    sun_sign, sun_element, sun_modality, sun_symbol, _ = _lon_to_sign(planet_longitudes["Sun"])
    # Moon sign
    moon_sign, _, _, moon_symbol, _ = _lon_to_sign(planet_longitudes["Moon"])

    # ── Aspects ──
    aspects = []
    planet_names = list(_PLANET_IDS.keys())
    for i in range(len(planet_names)):
        for j in range(i + 1, len(planet_names)):
            p1, p2 = planet_names[i], planet_names[j]
            lon1, lon2 = planet_longitudes[p1], planet_longitudes[p2]
            diff = abs(lon1 - lon2) % 360
            if diff > 180:
                diff = 360 - diff
            for asp_name, asp_angle, asp_orb in _ASPECTS:
                if abs(diff - asp_angle) <= asp_orb:
                    aspects.append({
                        "planet1": p1, "planet2": p2, "aspect": asp_name,
                        "angle": round(diff, 2), "orb": round(abs(diff - asp_angle), 2),
                    })

    # ── Birth Moon Phase ──
    sun_lon = planet_longitudes["Sun"]
    moon_lon = planet_longitudes["Moon"]
    phase_angle = (moon_lon - sun_lon) % 360
    birth_moon_phase = "New Moon"
    for lo, hi, pname in _MOON_PHASES:
        if lo <= phase_angle < hi:
            birth_moon_phase = pname
            break

    # ── Ascendant & Houses (require birth_time AND location) ──
    rising_sign = None
    rising_symbol = None
    houses_list = []
    coords = _location_to_coords(location) if location else None
    if birth_time and coords:
        lat, lon = coords
        try:
            cusps, asc_mc = swe.houses(birth_jd, lat, lon, b'P')  # Placidus
            asc_lon = cusps[0]
            rising_name, _, _, r_symbol, _ = _lon_to_sign(asc_lon)
            rising_sign = rising_name
            rising_symbol = r_symbol

            # Build houses list (12 houses with sign and degree)
            for h_idx in range(12):
                h_lon = cusps[h_idx]
                h_sign, _, _, h_sym, h_deg = _lon_to_sign(h_lon)
                houses_list.append({
                    "house": h_idx + 1, "sign": h_sign, "symbol": h_sym,
                    "cusp_degree": round(h_lon, 2),
                })

            # Determine which house each planet falls in
            for pname in planet_names:
                p_lon = planet_longitudes[pname]
                house_num = 12  # default to 12th
                for h_idx in range(12):
                    cusp_start = cusps[h_idx]
                    cusp_end = cusps[(h_idx + 1) % 12]
                    if cusp_start < cusp_end:
                        if cusp_start <= p_lon < cusp_end:
                            house_num = h_idx + 1
                            break
                    else:  # wraps around 0°
                        if p_lon >= cusp_start or p_lon < cusp_end:
                            house_num = h_idx + 1
                            break
                planet_signs[pname]["house"] = house_num
        except Exception:
            pass  # Ascendant/houses unavailable, degrade gracefully

    # ── Build result dict — preserving original structure + new fields ──
    desc = SIGN_DESCRIPTIONS.get(sun_sign, {})
    result = {
        "sign": sun_sign, "element": sun_element, "modality": sun_modality, "symbol": sun_symbol,
        **desc,
        # New fields
        "moon_sign": moon_sign, "moon_symbol": moon_symbol,
        "rising_sign": rising_sign, "rising_symbol": rising_symbol,
        "planets": planet_signs,
        "aspects": aspects,
        "houses": houses_list if houses_list else None,
        "birth_moon_phase": birth_moon_phase,
    }
    return result


def _calc_western_astrology_fallback(birthdate: date) -> dict:
    """Date-only Sun sign calculation (original logic, used when swisseph is unavailable)."""
    m, d = birthdate.month, birthdate.day
    for start, end, name, element, modality, symbol in _SIGNS:
        if start[0] == end[0]:
            if m == start[0] and start[1] <= d <= end[1]:
                desc = SIGN_DESCRIPTIONS.get(name, {})
                return {"sign": name, "element": element, "modality": modality, "symbol": symbol, **desc,
                        "moon_sign": None, "moon_symbol": None, "rising_sign": None, "rising_symbol": None,
                        "planets": None, "aspects": None, "houses": None, "birth_moon_phase": None}
        else:
            if (m == start[0] and d >= start[1]) or (m == end[0] and d <= end[1]):
                desc = SIGN_DESCRIPTIONS.get(name, {})
                return {"sign": name, "element": element, "modality": modality, "symbol": symbol, **desc,
                        "moon_sign": None, "moon_symbol": None, "rising_sign": None, "rising_symbol": None,
                        "planets": None, "aspects": None, "houses": None, "birth_moon_phase": None}
    desc = SIGN_DESCRIPTIONS.get("Capricorn", {})
    return {"sign": "Capricorn", "element": "Earth", "modality": "Cardinal", "symbol": "♑", **desc,
            "moon_sign": None, "moon_symbol": None, "rising_sign": None, "rising_symbol": None,
            "planets": None, "aspects": None, "houses": None, "birth_moon_phase": None}


# ─── Chinese Zodiac ──────────────────────────────────────────────────────────

_ANIMALS = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
            "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"]
_ELEMENTS_CN = ["Wood", "Wood", "Fire", "Fire", "Earth", "Earth",
                "Metal", "Metal", "Water", "Water"]
_ANIMAL_TRAITS = {
    "Rat": "Quick-witted, resourceful, versatile",
    "Ox": "Diligent, dependable, strong",
    "Tiger": "Brave, competitive, confident",
    "Rabbit": "Quiet, elegant, alert",
    "Dragon": "Confident, ambitious, energetic",
    "Snake": "Enigmatic, intelligent, wise",
    "Horse": "Animated, active, energetic",
    "Goat": "Calm, gentle, creative",
    "Monkey": "Sharp, smart, curious",
    "Rooster": "Observant, hardworking, courageous",
    "Dog": "Loyal, honest, faithful",
    "Pig": "Compassionate, generous, diligent",
}

ANIMAL_DESCRIPTIONS = {
    "Rat": {
        "personality": "The Rat is the mastermind of the Chinese zodiac — clever, resourceful, and always three steps ahead. You have a natural talent for turning nothing into something, and your charm opens doors others don't even see. Rats thrive in social settings but guard their inner world fiercely.",
        "strengths": "Adaptable, quick-thinking, charming, resourceful, ambitious, detail-oriented",
        "challenges": "Secretive, greedy, calculating, stubborn, critical of others",
        "compatibility": "Dragon, Monkey, Ox",
        "lucky_numbers": "2, 3",
        "lucky_colors": "Blue, gold, green",
    },
    "Ox": {
        "personality": "The Ox is the backbone of the zodiac — strong, reliable, and endlessly patient. You achieve greatness not through flash but through sheer determination and consistency. When the world is in chaos, people turn to the Ox because you never, ever quit.",
        "strengths": "Dependable, strong, determined, patient, methodical, honest",
        "challenges": "Stubborn, rigid, slow to adapt, poor communicator, overly cautious",
        "compatibility": "Rat, Snake, Rooster",
        "lucky_numbers": "1, 4",
        "lucky_colors": "White, yellow, green",
    },
    "Tiger": {
        "personality": "The Tiger is magnetic, fearless, and born to lead. You live life with an intensity that both thrills and intimidates others. Risk doesn't scare you — boredom does. Tigers are fiercely protective of those they love and will fight any battle for them.",
        "strengths": "Brave, confident, competitive, charismatic, passionate, generous",
        "challenges": "Reckless, arrogant, impatient, short-tempered, overindulgent",
        "compatibility": "Dragon, Horse, Pig",
        "lucky_numbers": "1, 3, 4",
        "lucky_colors": "Blue, gray, orange",
    },
    "Rabbit": {
        "personality": "The Rabbit is the zodiac's quiet strategist — elegant, perceptive, and surprisingly powerful. You navigate life with grace, preferring diplomacy to confrontation. Beneath your calm exterior lies a sharp mind that misses nothing.",
        "strengths": "Gentle, elegant, alert, quick, skillful, kind, patient, responsible",
        "challenges": "Timid, overly cautious, superficial, conservative, escapist",
        "compatibility": "Goat, Pig, Dog",
        "lucky_numbers": "3, 4, 6",
        "lucky_colors": "Red, pink, purple, blue",
    },
    "Dragon": {
        "personality": "The Dragon is the most powerful and revered sign in the Chinese zodiac. You are ambitious, fearless, and blessed with natural authority. Dragons don't follow paths — they create them. Your energy is contagious, and your confidence inspires everyone around you.",
        "strengths": "Energetic, ambitious, confident, intelligent, enthusiastic, charismatic",
        "challenges": "Arrogant, tactless, impatient, unrealistic, hot-tempered",
        "compatibility": "Rat, Tiger, Snake",
        "lucky_numbers": "1, 6, 7",
        "lucky_colors": "Gold, silver, gray",
    },
    "Snake": {
        "personality": "The Snake is the deep thinker of the zodiac — wise, intuitive, and magnetically alluring. You see through pretense instantly and understand human nature at a profound level. Snakes are private people who reveal themselves only to those who earn their trust.",
        "strengths": "Wise, intuitive, elegant, analytical, determined, discreet",
        "challenges": "Suspicious, jealous, possessive, dishonest when cornered, cold",
        "compatibility": "Dragon, Rooster, Ox",
        "lucky_numbers": "2, 8, 9",
        "lucky_colors": "Black, red, yellow",
    },
    "Horse": {
        "personality": "The Horse is freedom incarnate — energetic, adventurous, and impossibly restless. You need wide-open spaces (literally and metaphorically) to thrive. Your enthusiasm is electric, and your work ethic is legendary when you're passionate about something.",
        "strengths": "Energetic, active, warm-hearted, enthusiastic, positive, independent",
        "challenges": "Impatient, impulsive, wasteful, stubborn, tactless, commitment-phobic",
        "compatibility": "Tiger, Goat, Rabbit",
        "lucky_numbers": "2, 3, 7",
        "lucky_colors": "Brown, yellow, purple",
    },
    "Goat": {
        "personality": "The Goat (or Sheep) is the zodiac's gentle artist — creative, kind, and deeply attuned to beauty. You experience the world through emotion and imagination, creating warmth wherever you go. Your compassion is genuine and boundless.",
        "strengths": "Gentle, creative, compassionate, determined, elegant, calm, resilient",
        "challenges": "Indecisive, timid, pessimistic, disorganized, overly dependent",
        "compatibility": "Rabbit, Horse, Pig",
        "lucky_numbers": "2, 7",
        "lucky_colors": "Brown, red, purple",
    },
    "Monkey": {
        "personality": "The Monkey is the zodiac's genius trickster — brilliant, inventive, and endlessly entertaining. Your mind works faster than most people can follow, and your problem-solving ability is off the charts. You turn every obstacle into a game you intend to win.",
        "strengths": "Sharp, smart, curious, creative, versatile, sociable, confident",
        "challenges": "Arrogant, cunning, restless, sarcastic, deceptive, opportunistic",
        "compatibility": "Rat, Dragon, Snake",
        "lucky_numbers": "4, 9",
        "lucky_colors": "White, blue, gold",
    },
    "Rooster": {
        "personality": "The Rooster is the zodiac's perfectionist — observant, hardworking, and brutally honest. You notice everything and aren't afraid to say it. Your standards are high (for yourself and others), and your work ethic is unmatched.",
        "strengths": "Observant, hardworking, courageous, talented, confident, honest",
        "challenges": "Vain, blunt, critical, impatient with others, attention-seeking",
        "compatibility": "Ox, Snake, Dragon",
        "lucky_numbers": "5, 7, 8",
        "lucky_colors": "Gold, brown, yellow",
    },
    "Dog": {
        "personality": "The Dog is the zodiac's most loyal soul — honest, faithful, and driven by a deep sense of justice. You are the friend everyone wishes they had: reliable, protective, and genuinely selfless. Dogs will sacrifice their own comfort to help someone in need.",
        "strengths": "Loyal, honest, amiable, kind, cautious, prudent, faithful",
        "challenges": "Anxious, pessimistic, stubborn, emotionally distant, judgmental",
        "compatibility": "Rabbit, Tiger, Horse",
        "lucky_numbers": "3, 4, 9",
        "lucky_colors": "Red, green, purple",
    },
    "Pig": {
        "personality": "The Pig is the zodiac's generous spirit — compassionate, diligent, and genuinely good-hearted. You approach life with sincerity and an open heart, seeing the best in everyone. Pigs work hard and play harder, enjoying life's pleasures without guilt.",
        "strengths": "Compassionate, generous, diligent, warm, sincere, tolerant",
        "challenges": "Naive, gullible, materialistic, lazy when unmotivated, over-trusting",
        "compatibility": "Tiger, Rabbit, Goat",
        "lucky_numbers": "2, 5, 8",
        "lucky_colors": "Yellow, gray, brown, gold",
    },
}


def calc_chinese_zodiac(birthdate: date) -> dict:
    y = birthdate.year
    animal = _ANIMALS[(y - 4) % 12]
    element = _ELEMENTS_CN[(y - 4) % 10]
    desc = ANIMAL_DESCRIPTIONS.get(animal, {})
    return {
        "animal": animal,
        "element": element,
        "traits": _ANIMAL_TRAITS.get(animal, ""),
        "year": y,
        **desc,
    }


# ─── Biorhythm ───────────────────────────────────────────────────────────────

def _bio_interpretation(cycle_name: str, value: float) -> str:
    """Generate interpretation text for a biorhythm cycle based on its value."""
    abs_val = abs(value)
    if abs_val < 5:
        # Critical day (crossing zero)
        return f"Critical {cycle_name.lower()} day. Your {cycle_name.lower()} rhythm is crossing zero, which can bring instability and unpredictability. Take extra care with {cycle_name.lower()}-related decisions today. These transition points are also moments of recalibration — rest if you can."
    elif value > 60:
        return f"Your {cycle_name.lower()} energy is at a peak. You're operating near full capacity — this is the ideal time to tackle demanding {cycle_name.lower()} tasks. Trust your body and mind; they're firing on all cylinders right now."
    elif value > 20:
        return f"Your {cycle_name.lower()} energy is in a positive phase. You have solid reserves to draw from today. Good time for moderate {cycle_name.lower()} challenges — you'll perform well without overexerting."
    elif value > -20:
        return f"Your {cycle_name.lower()} energy is in a neutral zone. Neither peak nor valley — a stable baseline. Routine tasks are fine, but don't push for breakthroughs today. Steady effort wins."
    elif value > -60:
        return f"Your {cycle_name.lower()} energy is in a low phase. You may feel drained or sluggish in this area. Be gentle with yourself — this is a recovery period. Conserve energy for what truly matters."
    else:
        return f"Your {cycle_name.lower()} energy is at its lowest point. This is your body's signal to rest and recharge. Avoid high-stakes {cycle_name.lower()} demands if possible. This valley is temporary — your next peak is coming."


def calc_biorhythm(birthdate: date, target: date = None) -> dict:
    target = target or date.today()
    days = (target - birthdate).days
    physical = math.sin(2 * math.pi * days / 23) * 100
    emotional = math.sin(2 * math.pi * days / 28) * 100
    intellectual = math.sin(2 * math.pi * days / 33) * 100
    return {
        "physical": round(physical, 1),
        "emotional": round(emotional, 1),
        "intellectual": round(intellectual, 1),
        "days_alive": days,
        "physical_interpretation": _bio_interpretation("Physical", physical),
        "emotional_interpretation": _bio_interpretation("Emotional", emotional),
        "intellectual_interpretation": _bio_interpretation("Intellectual", intellectual),
    }


# ─── Celtic Tree Astrology ───────────────────────────────────────────────────

_CELTIC_TREES = [
    ((12, 24), (1, 20), "Birch", "The Achiever — driven, resilient, natural leader"),
    ((1, 21), (2, 17), "Rowan", "The Thinker — visionary, creative, original mind"),
    ((2, 18), (3, 17), "Ash", "The Enchanter — imaginative, intuitive, artistic"),
    ((3, 18), (4, 14), "Alder", "The Trailblazer — courageous, confident, self-assured"),
    ((4, 15), (5, 12), "Willow", "The Observer — patient, perceptive, psychic"),
    ((5, 13), (6, 9), "Hawthorn", "The Illusionist — not what they seem, creative"),
    ((6, 10), (7, 7), "Oak", "The Stabilizer — protective, generous, nurturing"),
    ((7, 8), (8, 4), "Holly", "The Ruler — noble, natural authority, persistent"),
    ((8, 5), (9, 1), "Hazel", "The Knower — intelligent, organized, efficient"),
    ((9, 2), (9, 29), "Vine", "The Equalizer — unpredictable, charming, elegant"),
    ((9, 30), (10, 27), "Ivy", "The Survivor — loyal, compassionate, deeply spiritual"),
    ((10, 28), (11, 24), "Reed", "The Inquisitor — secret keeper, truth seeker"),
    ((11, 25), (12, 23), "Elder", "The Seeker — wild spirit, freedom-loving, wise"),
]


CELTIC_DESCRIPTIONS = {
    "Birch": {
        "personality": "Birch people are pioneers and trailblazers, always pushing forward into new territory. You carry a quiet resilience that allows you to thrive where others falter. Your ambition is matched by a genuine warmth that makes you a natural leader people want to follow.",
        "strengths": "Ambitious, resilient, adaptable, motivating, tolerant, tough-minded",
        "sacred_animal": "White Stag — symbolizing purity of purpose and spiritual quest",
        "gemstone": "Rock Crystal — amplifying clarity of vision and intention",
    },
    "Rowan": {
        "personality": "Rowan people are visionaries with razor-sharp minds and a quiet intensity. You see possibilities that others cannot, often feeling like an outsider because your ideas are so far ahead. Your original thinking transforms every field you touch.",
        "strengths": "Visionary, creative, philosophical, idealistic, passionate, influential",
        "sacred_animal": "Crane — symbolizing patience, secret knowledge, and longevity",
        "gemstone": "Peridot — attracting prosperity and protection from negativity",
    },
    "Ash": {
        "personality": "Ash people live in two worlds — the practical and the mystical. You have an artist's imagination paired with a poet's sensitivity. Nature speaks to you directly, and your intuition borders on the psychic. Your creative works carry deep emotional truth.",
        "strengths": "Imaginative, intuitive, artistic, connected to nature, compassionate, perceptive",
        "sacred_animal": "Seahorse — symbolizing patience, persistence, and protection",
        "gemstone": "Coral — connecting you to ocean wisdom and emotional healing",
    },
    "Alder": {
        "personality": "Alder people are fearless pathfinders who thrive on blazing new trails. You have a magnetic confidence that draws followers naturally. Your courage is not reckless — it comes from a deep self-knowledge that tells you exactly what you're capable of.",
        "strengths": "Courageous, confident, focused, self-assured, charismatic, competitive",
        "sacred_animal": "Fox — symbolizing cunning, strategy, and quick thinking",
        "gemstone": "Ruby — fueling passion, courage, and life force energy",
    },
    "Willow": {
        "personality": "Willow people are deeply attuned to the rhythms of the moon and the tides of emotion. You possess a psychic sensitivity that borders on the supernatural. Patient and observant, you understand the hidden currents that drive human behavior.",
        "strengths": "Intuitive, patient, perceptive, resilient, wise, emotionally intelligent",
        "sacred_animal": "Hare — symbolizing intuition, rebirth, and lunar connection",
        "gemstone": "Moonstone — enhancing intuition and emotional balance",
    },
    "Hawthorn": {
        "personality": "Hawthorn people are shapeshifters — never quite what they seem on the surface. You contain surprising depths and contradictions that keep others endlessly fascinated. Creative and adaptable, you perform brilliantly under pressure.",
        "strengths": "Creative, curious, adaptable, insightful, humorous, multitalented",
        "sacred_animal": "Owl — symbolizing wisdom, mystery, and seeing through illusion",
        "gemstone": "Topaz — attracting joy, generosity, and abundance",
    },
    "Oak": {
        "personality": "Oak people are the great protectors — strong, generous, and deeply rooted. You are the person everyone turns to in a crisis because your calm strength is unshakeable. Your nurturing nature creates safe spaces where others can grow and flourish.",
        "strengths": "Protective, generous, nurturing, optimistic, confident, strong-willed",
        "sacred_animal": "Wren — symbolizing resourcefulness, determination, and bold spirit",
        "gemstone": "Diamond — representing invincibility, clarity, and eternal strength",
    },
    "Holly": {
        "personality": "Holly people are natural-born rulers with a regal bearing and quiet authority. You possess a noble spirit that commands respect without demanding it. Your persistence is legendary — once you set your mind on something, the universe itself bends to accommodate you.",
        "strengths": "Noble, persistent, strategic, authoritative, graceful under pressure",
        "sacred_animal": "Horse — symbolizing power, nobility, and freedom",
        "gemstone": "Carnelian — boosting courage, vitality, and leadership energy",
    },
    "Hazel": {
        "personality": "Hazel people are the scholars and knowledge-seekers of the Celtic zodiac. Your mind is a beautifully organized library of wisdom, and you have a gift for making complex ideas accessible. Efficiency is your art form.",
        "strengths": "Intelligent, organized, efficient, analytical, knowledgeable, academic",
        "sacred_animal": "Salmon — symbolizing wisdom, inspiration, and sacred knowledge",
        "gemstone": "Amethyst — deepening wisdom, spiritual awareness, and mental clarity",
    },
    "Vine": {
        "personality": "Vine people are elegant enigmas — unpredictable, charming, and endlessly fascinating. Your moods shift like wine from sweet to dry, and you embrace life's contradictions rather than fighting them. You have an innate sense of beauty and balance.",
        "strengths": "Charming, elegant, empathetic, refined, unpredictable, romantic",
        "sacred_animal": "Swan — symbolizing grace, beauty, and transformation",
        "gemstone": "Emerald — enhancing love, harmony, and prophetic ability",
    },
    "Ivy": {
        "personality": "Ivy people are survivors of the highest order — loyal, compassionate, and spiritually deep. You can endure what would break most people, drawing strength from your unshakeable inner faith. Your loyalty to loved ones is absolute and unconditional.",
        "strengths": "Loyal, compassionate, spiritual, determined, enduring, generous",
        "sacred_animal": "Butterfly — symbolizing transformation, endurance, and the soul's journey",
        "gemstone": "Opal — reflecting your many facets and amplifying spiritual gifts",
    },
    "Reed": {
        "personality": "Reed people are the detectives of the Celtic zodiac — always digging beneath the surface to find hidden truth. You keep secrets like a vault and uncover them like a master investigator. Your fearlessness in facing dark truths makes you a powerful healer.",
        "strengths": "Fearless, truth-seeking, diplomatic, intellectual, tenacious, secretive",
        "sacred_animal": "Hound — symbolizing loyalty, tracking truth, and the underworld journey",
        "gemstone": "Jasper — grounding energy and providing protection during deep inner work",
    },
    "Elder": {
        "personality": "Elder people are the wild mystics of the Celtic zodiac — free spirits with ancient wisdom. You live life on your own terms with a boldness that both inspires and unsettles others. Born at the darkest time of year, you carry a deep understanding of endings and rebirth.",
        "strengths": "Free-spirited, wise, honest, adventurous, independent, philosophical",
        "sacred_animal": "Raven — symbolizing prophecy, magic, and messages between worlds",
        "gemstone": "Jet — absorbing negative energy and connecting to ancestral wisdom",
    },
}


def calc_celtic_tree(birthdate: date) -> dict:
    m, d = birthdate.month, birthdate.day
    for start, end, tree, meaning in _CELTIC_TREES:
        if start[0] == end[0]:
            if m == start[0] and start[1] <= d <= end[1]:
                desc = CELTIC_DESCRIPTIONS.get(tree, {})
                return {"tree": tree, "meaning": meaning, **desc}
        else:
            if (m == start[0] and d >= start[1]) or (m == end[0] and d <= end[1]):
                desc = CELTIC_DESCRIPTIONS.get(tree, {})
                return {"tree": tree, "meaning": meaning, **desc}
    desc = CELTIC_DESCRIPTIONS.get("Birch", {})
    return {"tree": "Birch", "meaning": "The Achiever — driven, resilient, natural leader", **desc}


# ─── Mayan Tzolkin ────────────────────────────────────────────────────────────

_TZOLKIN_SIGNS = [
    "Imix (Dragon)", "Ik (Wind)", "Akbal (Night)", "Kan (Seed)",
    "Chicchan (Serpent)", "Cimi (Death/Transformer)", "Manik (Deer/Hand)",
    "Lamat (Star/Rabbit)", "Muluc (Moon/Water)", "Oc (Dog)",
    "Chuen (Monkey)", "Eb (Road/Grass)", "Ben (Reed/Corn)",
    "Ix (Jaguar)", "Men (Eagle)", "Cib (Vulture/Owl)",
    "Caban (Earth)", "Etznab (Mirror/Flint)", "Cauac (Storm)",
    "Ahau (Sun/Lord)",
]

_TZOLKIN_MEANINGS = {
    0: "Nurturing, protective, primal creative energy",
    1: "Communication, breath, spirit, flexibility",
    2: "Introspection, dreams, mystery, the void",
    3: "Growth potential, fertility, new beginnings",
    4: "Life force, instinct, intimacy, transformation",
    5: "Rebirth, surrender, forgiveness, letting go",
    6: "Healing, service, grace, gentleness",
    7: "Harmony, beauty, abundance, playfulness",
    8: "Purification, flow, universal water, emotions",
    9: "Loyalty, companionship, guidance, heart",
    10: "Artistry, play, illusion, inner child",
    11: "Journey, pilgrimage, gratitude, community",
    12: "Authority, growth, time, sky-walking",
    13: "Shamanic power, earth magic, integrity",
    14: "Vision, hope, commitment, mental power",
    15: "Wisdom, receptivity, forgiveness, karmic clearing",
    16: "Evolution, synchronicity, navigation, movement",
    17: "Timelessness, reflection, truth, self-sacrifice",
    18: "Transformation, thunder, catalytic energy",
    19: "Unconditional love, mastery, wholeness, enlightenment",
}


TZOLKIN_DESCRIPTIONS = {
    0: {  # Imix (Dragon)
        "personality": "You carry the primordial creative force — the energy that births worlds. Imix people are nurturing, protective, and deeply connected to source energy. You initiate new cycles and feed the world with your creative output.",
        "strengths": "Creative, nurturing, protective, initiating, primal energy, trustworthy",
        "shadow_side": "Possessive, domineering, overly controlling, smothering",
        "element": "Water — the primordial ocean of creation",
    },
    1: {  # Ik (Wind)
        "personality": "You are the breath of spirit made manifest — a natural communicator who channels ideas from unseen realms. Ik people are flexible, eloquent, and carry messages that change lives. Your words have unusual power.",
        "strengths": "Communicative, spiritual, flexible, inspirational, agile-minded",
        "shadow_side": "Scattered, indecisive, fickle, gossipy, destructive with words",
        "element": "Air — the breath of life and spirit",
    },
    2: {  # Akbal (Night)
        "personality": "You dwell in the mysterious space between worlds — the realm of dreams, intuition, and the deep unconscious. Akbal people are introspective seekers who find treasures in darkness that others fear to enter.",
        "strengths": "Introspective, dreamy, intuitive, courageous, mysterious, deep-thinking",
        "shadow_side": "Fearful, depressive, secretive, withdrawn, prone to dark moods",
        "element": "Earth — the dark womb of creation",
    },
    3: {  # Kan (Seed)
        "personality": "You are pure potential waiting to bloom. Kan people carry the energy of growth, fertility, and new beginnings within them. Your patience allows you to plant seeds that grow into magnificent realities over time.",
        "strengths": "Patient, fertile (in ideas), growth-oriented, sexual, influential",
        "shadow_side": "Repressed, stagnant, overly cautious, sexually obsessive",
        "element": "Fire — the spark of germination",
    },
    4: {  # Chicchan (Serpent)
        "personality": "You pulse with raw life force — kundalini energy coiled and ready to strike. Chicchan people are magnetic, instinctive, and capable of profound transformation. Your body intelligence is extraordinary.",
        "strengths": "Instinctive, powerful, transformative, magnetic, passionate, vital",
        "shadow_side": "Manipulative, jealous, vengeful, emotionally volatile, controlling",
        "element": "Water — flowing life force energy",
    },
    5: {  # Cimi (Death/Transformer)
        "personality": "You walk between worlds with ease, understanding that all endings are beginnings in disguise. Cimi people are natural counselors, healers, and guides through life's deepest transitions. Death holds no fear for you — only rebirth.",
        "strengths": "Transformative, surrendering, forgiving, faith-driven, psychic, healing",
        "shadow_side": "Morbid, fatalistic, controlling through fear, emotionally numb",
        "element": "Air — the breath between worlds",
    },
    6: {  # Manik (Deer/Hand)
        "personality": "You are the gentle healer whose hands carry divine grace. Manik people serve others with quiet devotion and possess an innate understanding of the body's wisdom. Your touch — literal or metaphorical — brings restoration.",
        "strengths": "Healing, graceful, gentle, service-oriented, artistic, peaceful",
        "shadow_side": "Martyrdom, avoidance of conflict, passive-aggressive, self-sacrificing",
        "element": "Earth — grounding, healing touch",
    },
    7: {  # Lamat (Star/Rabbit)
        "personality": "You are a child of Venus — born under the sign of beauty, harmony, and abundance. Lamat people radiate a playful elegance that draws others like moths to starlight. Your natural gift is making life more beautiful.",
        "strengths": "Harmonious, beautiful, abundant, playful, lucky, artistic, charming",
        "shadow_side": "Vain, excessive, addictive personality, superficial, lazy",
        "element": "Fire — the brilliance of starlight",
    },
    8: {  # Muluc (Moon/Water)
        "personality": "You are deeply connected to the tides of emotion and the purifying power of water. Muluc people feel everything intensely and have the ability to cleanse and renew whatever they touch. Your emotional depth is your greatest gift.",
        "strengths": "Purifying, flowing, emotional depth, imaginative, romantic, devoted",
        "shadow_side": "Emotionally overwhelmed, fantasy-prone, escapist, moody, clingy",
        "element": "Water — the purifying moon-tide",
    },
    9: {  # Oc (Dog)
        "personality": "You are the loyal heart of the Tzolkin — faithful, warm, and driven by love. Oc people form deep bonds and guide others with unwavering devotion. Your heart-centered leadership inspires genuine trust.",
        "strengths": "Loyal, warm, devoted, guiding, team-spirited, trustworthy, loving",
        "shadow_side": "Codependent, anxious, jealous, needy, blindly loyal to a fault",
        "element": "Air — the warm breath of companionship",
    },
    10: {  # Chuen (Monkey)
        "personality": "You are the divine trickster — playful, brilliant, and endlessly creative. Chuen people weave art, humor, and magic into everything they do. Your inner child is your most powerful ally, and your creativity knows no limits.",
        "strengths": "Artistic, playful, clever, curious, entertaining, innovative, magical",
        "shadow_side": "Irresponsible, attention-seeking, superficial, deceptive, scattered",
        "element": "Fire — the creative spark of play",
    },
    11: {  # Eb (Road/Grass)
        "personality": "You walk the sacred road of service — a pilgrim whose journey blesses everyone along the path. Eb people understand that life is a journey, not a destination, and find profound meaning in community and gratitude.",
        "strengths": "Service-oriented, grateful, community-minded, wise, compassionate, pilgrim-spirited",
        "shadow_side": "Burdened, guilt-ridden, overly responsible, worn down by others' needs",
        "element": "Earth — the sacred road beneath your feet",
    },
    12: {  # Ben (Reed/Corn)
        "personality": "You are the bridge between earth and sky — rooted in the ground but reaching toward the heavens. Ben people carry natural authority and the ability to channel higher wisdom into practical reality. Time bends to your will.",
        "strengths": "Authoritative, visionary, bridge-builder, principled, growth-oriented",
        "shadow_side": "Rigid, judgmental, preachy, authoritarian, self-righteous",
        "element": "Air — reaching skyward like the corn stalk",
    },
    13: {  # Ix (Jaguar)
        "personality": "You carry the shamanic power of the jaguar — earth magic, integrity, and the ability to move between visible and invisible worlds. Ix people are natural mystics with a deep connection to the land and its spirits.",
        "strengths": "Shamanic, earth-connected, powerful, integrity-driven, magical, stealthy",
        "shadow_side": "Secretive, territorial, aggressive, withdrawn, manipulative",
        "element": "Earth — deep jungle magic",
    },
    14: {  # Men (Eagle)
        "personality": "You soar above the world with eagle vision, seeing the grand pattern that connects everything. Men people are visionary leaders with the mental power to hold enormous ideas and the commitment to manifest them.",
        "strengths": "Visionary, hopeful, committed, mentally powerful, ambitious, far-seeing",
        "shadow_side": "Escapist, unrealistic, detached, judgmental, cold from the heights",
        "element": "Air — the domain of the soaring eagle",
    },
    15: {  # Cib (Vulture/Owl)
        "personality": "You carry ancient karma and hard-won wisdom from many lifetimes. Cib people are old souls who understand forgiveness, receptivity, and the sacred art of letting go. Your wisdom is earned through experience, not books.",
        "strengths": "Wise, receptive, forgiving, karmic clarity, dignified, ceremonial",
        "shadow_side": "Burdened by the past, rigid, overly serious, stuck in old patterns",
        "element": "Fire — the burning away of karma",
    },
    16: {  # Caban (Earth)
        "personality": "You are the navigator of synchronicity — attuned to the living intelligence of Earth herself. Caban people notice the meaningful coincidences that others dismiss, and you ride the waves of evolution with natural grace.",
        "strengths": "Grounded, synchronistic, evolutionary, intelligent, progressive, connected",
        "shadow_side": "Earthquake energy, volatile, disruptive, anxious, control issues",
        "element": "Earth — the living, moving planet",
    },
    17: {  # Etznab (Mirror/Flint)
        "personality": "You are the mirror of truth — reflecting reality with razor-sharp clarity. Etznab people cut through illusion and self-deception with surgical precision. Your honesty can be brutal, but it sets people free.",
        "strengths": "Truthful, reflective, sharp, healing through honesty, timeless, courageous",
        "shadow_side": "Harsh, self-destructive, cold, overly critical, cutting with words",
        "element": "Air — the clear mirror of truth",
    },
    18: {  # Cauac (Storm)
        "personality": "You are a catalyst of transformation — where you go, change follows like thunder after lightning. Cauac people carry enormous energy that can feel overwhelming but ultimately clears the way for new growth.",
        "strengths": "Transformative, catalytic, energizing, purifying, healing, powerful",
        "shadow_side": "Chaotic, destructive, overwhelming, emotionally stormy, unstable",
        "element": "Water — the cleansing storm",
    },
    19: {  # Ahau (Sun/Lord)
        "personality": "You carry the highest vibration of the Tzolkin — unconditional love and solar mastery. Ahau people are here to embody wholeness, enlightenment, and the full flowering of human potential. You complete what others begin.",
        "strengths": "Loving, masterful, whole, enlightened, artistic, devoted, completing",
        "shadow_side": "Unrealistic expectations, spiritual bypassing, ego inflation, naivety",
        "element": "Fire — the radiance of the sun",
    },
}


def calc_mayan_tzolkin(birthdate: date) -> dict:
    # Correlation: Aug 11, 3114 BC (Gregorian) = Tzolkin 4 Ahau
    # Julian Day Number for that date: 584283
    # We compute days since that epoch
    epoch = date(2012, 12, 21)  # Known correlation: 4 Ahau 3 Kankin
    days_diff = (birthdate - epoch).days
    # Tzolkin day position (0-19 cycle)
    day_sign_idx = (days_diff + 19) % 20  # 19 = Ahau offset for epoch
    # Trecena number (1-13 cycle)
    trecena = ((days_diff + 4 - 1) % 13) + 1  # 4 = trecena on epoch
    desc = TZOLKIN_DESCRIPTIONS.get(day_sign_idx, {})
    return {
        "day_sign": _TZOLKIN_SIGNS[day_sign_idx],
        "trecena": trecena,
        "meaning": _TZOLKIN_MEANINGS.get(day_sign_idx, ""),
        "full_name": f"{trecena} {_TZOLKIN_SIGNS[day_sign_idx]}",
        **desc,
    }


# ─── Aura Color (from personality answers) ───────────────────────────────────

_AURA_MAP = {
    (1, 1): ("Indigo", "#4B0082", "Deep thinker, truth seeker, natural leader with psychic awareness"),
    (1, 2): ("Blue", "#4169E1", "Calm communicator, empathetic healer, spiritual depth"),
    (1, 3): ("Violet", "#8A2BE2", "Visionary mind, transformative energy, mystical power"),
    (1, 4): ("Crystal", "#E0E8F0", "Pure clarity, high sensitivity, transcendent perception"),
    (2, 1): ("Gold", "#FFD700", "Charismatic leader, divine protection, wisdom"),
    (2, 2): ("Green", "#2E8B57", "Heart-centered, growth-oriented, natural healer"),
    (2, 3): ("Orange", "#FF6B35", "Creative fire, adventure seeker, magnetic personality"),
    (2, 4): ("Turquoise", "#40E0D0", "Compassionate communicator, multi-talented, healer-teacher"),
    (3, 1): ("Red", "#DC143C", "Passionate leader, grounded power, physical vitality"),
    (3, 2): ("Pink", "#FF69B4", "Unconditional love, gentle strength, artistic soul"),
    (3, 3): ("Magenta", "#FF00FF", "Non-conformist, eccentric genius, spiritual maverick"),
    (3, 4): ("Silver", "#C0C0C0", "Lunar energy, intuitive, reflective, adaptive"),
    (4, 1): ("White", "#F5F5F5", "Spiritual purity, new beginnings, divine connection"),
    (4, 2): ("Yellow", "#FFD93D", "Optimistic intellect, joyful energy, playful wisdom"),
    (4, 3): ("Bronze", "#CD7F32", "Earth warrior, resilient, ancient soul energy"),
    (4, 4): ("Lavender", "#B57EDC", "Dreamwalker, ethereal, imaginative, gentle mystic"),
}


AURA_DESCRIPTIONS = {
    "Indigo": "Indigo auras belong to the truth-seekers and system-busters. You see through social facades instantly and feel compelled to challenge anything inauthentic. Your psychic awareness is powerful — you often know things before they happen. Indigo souls are here to break old paradigms and usher in new ways of thinking.",
    "Blue": "Blue auras radiate calm, clarity, and deep emotional wisdom. You are a natural healer and communicator, able to speak truth in a way that soothes rather than wounds. Your presence alone brings peace to chaotic environments. People seek you out instinctively when they need to be heard and understood.",
    "Violet": "Violet auras indicate a soul operating at one of the highest spiritual frequencies. You are a visionary and transformer, seeing potential where others see limitations. Your connection to the mystical realm is strong, and your creative output often carries an otherworldly quality that moves people profoundly.",
    "Crystal": "Crystal auras are extraordinarily rare — you are a chameleon who absorbs and reflects the energies around you. Your sensitivity is both a gift and a challenge: you can heal others simply by being near them, but you must learn to distinguish your feelings from those you've absorbed. You are a living mirror.",
    "Gold": "Gold auras signify divine protection, wisdom, and natural leadership that inspires devotion. You carry a charismatic presence that feels ancient and trustworthy. Others sense your inner strength immediately. Gold aura people often feel they have a specific mission or purpose that transcends personal ambition.",
    "Green": "Green auras pulse with the energy of growth, healing, and heart-centered living. You are a natural healer — whether through medicine, therapy, or simply your presence. Your connection to nature is profound, and you find your deepest peace in natural settings. Love flows through you easily and abundantly.",
    "Orange": "Orange auras blaze with creative fire, adventure, and magnetic personality. You are a thrill-seeker who turns every experience into a story worth telling. Your enthusiasm is genuinely contagious, and you have a rare ability to make others feel alive and inspired. Boredom is your only real enemy.",
    "Turquoise": "Turquoise auras combine the healing power of green with the communication gifts of blue. You are a healer-teacher who can explain complex truths in simple, compassionate ways. Your multi-talented nature means you often excel in several different fields simultaneously.",
    "Red": "Red auras radiate raw power, physical vitality, and grounded leadership. You are fiercely present in your body and the material world. Your energy is palpable — people feel your intensity the moment you enter a room. You are here to build, protect, and lead through action rather than words.",
    "Pink": "Pink auras glow with unconditional love, gentle strength, and artistic sensitivity. You experience life through the heart first, and your capacity for empathy is extraordinary. Your creative gifts are fueled by emotional depth. You remind everyone around you that softness is not weakness — it is a superpower.",
    "Magenta": "Magenta auras belong to the eccentrics and innovators — souls who refuse to conform to anyone's expectations. You combine physical passion with spiritual awareness in a way that baffles conventional thinkers. Your originality is your greatest asset, and you thrive when you stop trying to fit in.",
    "Silver": "Silver auras carry lunar energy — reflective, intuitive, and endlessly adaptive. You are gifted with psychic sensitivity and the ability to read situations with uncanny accuracy. Like the moon, you go through phases, and learning to honor your natural cycles is key to your wellbeing.",
    "White": "White auras represent spiritual purity, new beginnings, and direct connection to the divine. You are at a significant spiritual threshold — either newly awakened or preparing for a major transformation. Your energy field is a blank canvas of infinite possibility, unburdened by the past.",
    "Yellow": "Yellow auras shine with intellectual brilliance, optimism, and playful wisdom. You approach life with curiosity and joy, finding wonder in details others overlook. Your mental energy is powerful — ideas flow through you constantly. Your challenge is channeling this abundance into focused creation.",
    "Bronze": "Bronze auras carry the energy of the earth warrior — resilient, ancient, and deeply connected to ancestral wisdom. You have an old soul's patience and a fighter's determination. Your strength comes from the ground beneath your feet, and you draw power from tradition and history.",
    "Lavender": "Lavender auras float in the realm between waking and dreaming. You are an ethereal soul with a vivid imagination and gentle mystical awareness. Your creativity comes from otherworldly places, and your art (in whatever form) carries a dreamlike quality that transports people beyond the mundane.",
}


def calc_aura(personality_answers: list) -> dict:
    if not personality_answers or len(personality_answers) < 5:
        return {"color": "Blue", "hex": "#4169E1", "meaning": "Calm communicator, empathetic healer", "description": AURA_DESCRIPTIONS.get("Blue", "")}
    # Use first two answers to determine primary aura
    key = (personality_answers[0], personality_answers[1])
    color, hex_val, meaning = _AURA_MAP.get(key, ("Blue", "#4169E1", "Calm communicator"))
    return {"color": color, "hex": hex_val, "meaning": meaning, "description": AURA_DESCRIPTIONS.get(color, "")}


# ─── Palm Archetype (from personality answers) ───────────────────────────────

_PALM_ARCHETYPES = {
    1: ("Earth Hand", "Practical, grounded, reliable — you build things that last"),
    2: ("Water Hand", "Emotional, intuitive, creative — you feel the world deeply"),
    3: ("Fire Hand", "Energetic, bold, instinctive — you ignite change everywhere"),
    4: ("Air Hand", "Intellectual, curious, social — your mind never stops exploring"),
}


def calc_palm_archetype(personality_answers: list) -> dict:
    if not personality_answers or len(personality_answers) < 5:
        return {"archetype": "Earth Hand", "meaning": "Practical, grounded, reliable"}
    # Use answers 3-5 to determine hand type
    dominant = max(set(personality_answers[2:5]), key=personality_answers[2:5].count)
    archetype, meaning = _PALM_ARCHETYPES.get(dominant, _PALM_ARCHETYPES[1])
    return {"archetype": archetype, "meaning": meaning}


# ─── Tarot Cards ────────────────────────────────────────────────────────────

TAROT_DECK = [
    # === Major Arcana (22 cards) ===
    {"name": "The Fool", "suit": "Major Arcana", "number": 0, "upright": "New beginnings, innocence, spontaneity, free spirit", "reversed": "Recklessness, risk-taking, naivety, holding back"},
    {"name": "The Magician", "suit": "Major Arcana", "number": 1, "upright": "Willpower, manifestation, resourcefulness, skill", "reversed": "Manipulation, trickery, untapped potential, wasted talent"},
    {"name": "The High Priestess", "suit": "Major Arcana", "number": 2, "upright": "Intuition, mystery, inner knowledge, the subconscious", "reversed": "Secrets, withdrawal, silence, repressed feelings"},
    {"name": "The Empress", "suit": "Major Arcana", "number": 3, "upright": "Abundance, fertility, nurturing, beauty, nature", "reversed": "Dependence, smothering, creative block, neglect"},
    {"name": "The Emperor", "suit": "Major Arcana", "number": 4, "upright": "Authority, structure, stability, leadership, fatherhood", "reversed": "Tyranny, rigidity, domination, inflexibility"},
    {"name": "The Hierophant", "suit": "Major Arcana", "number": 5, "upright": "Tradition, spiritual wisdom, conformity, mentorship", "reversed": "Rebellion, subversiveness, unconventionality, freedom"},
    {"name": "The Lovers", "suit": "Major Arcana", "number": 6, "upright": "Love, union, harmony, choices, alignment", "reversed": "Disharmony, imbalance, misalignment, indecision"},
    {"name": "The Chariot", "suit": "Major Arcana", "number": 7, "upright": "Determination, willpower, triumph, control", "reversed": "Lack of direction, aggression, powerlessness, defeat"},
    {"name": "Strength", "suit": "Major Arcana", "number": 8, "upright": "Courage, inner strength, compassion, patience", "reversed": "Self-doubt, weakness, insecurity, raw emotion"},
    {"name": "The Hermit", "suit": "Major Arcana", "number": 9, "upright": "Soul-searching, introspection, solitude, inner guidance", "reversed": "Isolation, loneliness, withdrawal, lost"},
    {"name": "Wheel of Fortune", "suit": "Major Arcana", "number": 10, "upright": "Destiny, turning point, cycles, luck, karma", "reversed": "Bad luck, resistance to change, breaking cycles"},
    {"name": "Justice", "suit": "Major Arcana", "number": 11, "upright": "Fairness, truth, law, cause and effect, balance", "reversed": "Dishonesty, unfairness, lack of accountability"},
    {"name": "The Hanged Man", "suit": "Major Arcana", "number": 12, "upright": "Surrender, letting go, new perspectives, pause", "reversed": "Stalling, resistance, indecision, needless sacrifice"},
    {"name": "Death", "suit": "Major Arcana", "number": 13, "upright": "Transformation, endings, transition, release, renewal", "reversed": "Fear of change, stagnation, holding on, decay"},
    {"name": "Temperance", "suit": "Major Arcana", "number": 14, "upright": "Balance, moderation, patience, harmony, purpose", "reversed": "Imbalance, excess, lack of patience, discord"},
    {"name": "The Devil", "suit": "Major Arcana", "number": 15, "upright": "Shadow self, bondage, materialism, temptation", "reversed": "Breaking free, reclaiming power, detachment"},
    {"name": "The Tower", "suit": "Major Arcana", "number": 16, "upright": "Sudden upheaval, revelation, chaos, awakening", "reversed": "Avoidance of disaster, fear of change, delaying inevitable"},
    {"name": "The Star", "suit": "Major Arcana", "number": 17, "upright": "Hope, renewal, inspiration, serenity, faith", "reversed": "Despair, disconnection, lack of faith, discouragement"},
    {"name": "The Moon", "suit": "Major Arcana", "number": 18, "upright": "Illusion, intuition, the unconscious, dreams, fear", "reversed": "Confusion, repressed emotion, clarity emerging"},
    {"name": "The Sun", "suit": "Major Arcana", "number": 19, "upright": "Joy, success, vitality, warmth, positivity", "reversed": "Temporary sadness, lack of clarity, dimmed enthusiasm"},
    {"name": "Judgement", "suit": "Major Arcana", "number": 20, "upright": "Rebirth, reflection, reckoning, absolution, calling", "reversed": "Self-doubt, refusal of call, harsh self-judgment"},
    {"name": "The World", "suit": "Major Arcana", "number": 21, "upright": "Completion, achievement, fulfillment, wholeness, travel", "reversed": "Incompletion, shortcuts, delays, emptiness"},
    # === Minor Arcana — Wands (14 cards) ===
    {"name": "Ace of Wands", "suit": "Wands", "number": 1, "upright": "Inspiration, new opportunities, growth, potential", "reversed": "Delays, lack of motivation, hesitation, missed chance"},
    {"name": "Two of Wands", "suit": "Wands", "number": 2, "upright": "Planning, future vision, discovery, progress", "reversed": "Fear of unknown, lack of planning, playing it safe"},
    {"name": "Three of Wands", "suit": "Wands", "number": 3, "upright": "Expansion, foresight, overseas opportunities, momentum", "reversed": "Obstacles, delays, frustration, playing small"},
    {"name": "Four of Wands", "suit": "Wands", "number": 4, "upright": "Celebration, harmony, homecoming, community", "reversed": "Lack of support, instability, feeling unwelcome"},
    {"name": "Five of Wands", "suit": "Wands", "number": 5, "upright": "Conflict, competition, tension, disagreements", "reversed": "Avoidance of conflict, inner conflict, resolution"},
    {"name": "Six of Wands", "suit": "Wands", "number": 6, "upright": "Victory, recognition, success, public acclaim", "reversed": "Fall from grace, ego, lack of recognition"},
    {"name": "Seven of Wands", "suit": "Wands", "number": 7, "upright": "Perseverance, defending beliefs, challenge, courage", "reversed": "Giving up, overwhelmed, yielding, exhaustion"},
    {"name": "Eight of Wands", "suit": "Wands", "number": 8, "upright": "Rapid action, movement, swift change, excitement", "reversed": "Delays, frustration, waiting, slowdown"},
    {"name": "Nine of Wands", "suit": "Wands", "number": 9, "upright": "Resilience, persistence, last stand, boundaries", "reversed": "Exhaustion, giving up, stubbornness, paranoia"},
    {"name": "Ten of Wands", "suit": "Wands", "number": 10, "upright": "Burden, responsibility, hard work, accomplishment", "reversed": "Burnout, delegation needed, carrying too much"},
    {"name": "Page of Wands", "suit": "Wands", "number": 11, "upright": "Enthusiasm, exploration, discovery, free spirit", "reversed": "Setbacks, lack of direction, procrastination"},
    {"name": "Knight of Wands", "suit": "Wands", "number": 12, "upright": "Energy, passion, adventure, impulsiveness", "reversed": "Haste, recklessness, scattered energy, delays"},
    {"name": "Queen of Wands", "suit": "Wands", "number": 13, "upright": "Confidence, determination, warmth, vibrant energy", "reversed": "Selfishness, jealousy, insecurity, demanding"},
    {"name": "King of Wands", "suit": "Wands", "number": 14, "upright": "Leadership, vision, bold action, charisma", "reversed": "Impulsiveness, ruthlessness, high expectations"},
    # === Minor Arcana — Cups (14 cards) ===
    {"name": "Ace of Cups", "suit": "Cups", "number": 1, "upright": "New love, compassion, emotional awakening, creativity", "reversed": "Emotional loss, blocked feelings, emptiness"},
    {"name": "Two of Cups", "suit": "Cups", "number": 2, "upright": "Partnership, unity, mutual attraction, connection", "reversed": "Imbalance, broken communication, tension"},
    {"name": "Three of Cups", "suit": "Cups", "number": 3, "upright": "Celebration, friendship, community, joy", "reversed": "Overindulgence, gossip, isolation"},
    {"name": "Four of Cups", "suit": "Cups", "number": 4, "upright": "Contemplation, apathy, reevaluation, meditation", "reversed": "Awareness, new perspective, acceptance, motivation"},
    {"name": "Five of Cups", "suit": "Cups", "number": 5, "upright": "Loss, grief, regret, disappointment, pessimism", "reversed": "Acceptance, moving on, finding peace, forgiveness"},
    {"name": "Six of Cups", "suit": "Cups", "number": 6, "upright": "Nostalgia, memories, reunion, childhood, innocence", "reversed": "Living in the past, unrealistic, stuck"},
    {"name": "Seven of Cups", "suit": "Cups", "number": 7, "upright": "Fantasy, illusion, wishful thinking, choices", "reversed": "Clarity, reality check, focus, decision made"},
    {"name": "Eight of Cups", "suit": "Cups", "number": 8, "upright": "Walking away, disillusionment, seeking truth, leaving", "reversed": "Fear of change, stagnation, clinging, avoidance"},
    {"name": "Nine of Cups", "suit": "Cups", "number": 9, "upright": "Wish fulfillment, satisfaction, contentment, gratitude", "reversed": "Dissatisfaction, greed, materialism, unfulfilled"},
    {"name": "Ten of Cups", "suit": "Cups", "number": 10, "upright": "Harmony, happiness, family, emotional fulfillment", "reversed": "Broken family, misalignment, domestic trouble"},
    {"name": "Page of Cups", "suit": "Cups", "number": 11, "upright": "Creative opportunity, intuitive message, curiosity", "reversed": "Emotional immaturity, creative block, insecurity"},
    {"name": "Knight of Cups", "suit": "Cups", "number": 12, "upright": "Romance, charm, imagination, following the heart", "reversed": "Moodiness, unrealistic, jealousy, disappointment"},
    {"name": "Queen of Cups", "suit": "Cups", "number": 13, "upright": "Compassion, emotional security, intuition, nurturing", "reversed": "Emotional instability, codependency, martyrdom"},
    {"name": "King of Cups", "suit": "Cups", "number": 14, "upright": "Emotional balance, diplomacy, wisdom, calm authority", "reversed": "Emotional manipulation, moodiness, coldness"},
    # === Minor Arcana — Swords (14 cards) ===
    {"name": "Ace of Swords", "suit": "Swords", "number": 1, "upright": "Clarity, breakthrough, new ideas, mental force", "reversed": "Confusion, chaos, misinformation, brutality"},
    {"name": "Two of Swords", "suit": "Swords", "number": 2, "upright": "Indecision, stalemate, blocked emotions, avoidance", "reversed": "Information overload, tough choice, confusion"},
    {"name": "Three of Swords", "suit": "Swords", "number": 3, "upright": "Heartbreak, grief, sorrow, painful truth", "reversed": "Recovery, forgiveness, releasing pain, healing"},
    {"name": "Four of Swords", "suit": "Swords", "number": 4, "upright": "Rest, recovery, contemplation, mental restoration", "reversed": "Restlessness, burnout, lack of progress, anxiety"},
    {"name": "Five of Swords", "suit": "Swords", "number": 5, "upright": "Conflict, defeat, winning at all costs, betrayal", "reversed": "Reconciliation, making amends, past resentment"},
    {"name": "Six of Swords", "suit": "Swords", "number": 6, "upright": "Transition, moving on, calmer waters, recovery", "reversed": "Unfinished business, resistance, emotional baggage"},
    {"name": "Seven of Swords", "suit": "Swords", "number": 7, "upright": "Deception, strategy, stealth, cunning, evasion", "reversed": "Coming clean, confession, conscience, getting caught"},
    {"name": "Eight of Swords", "suit": "Swords", "number": 8, "upright": "Restriction, imprisonment, self-limiting beliefs", "reversed": "Self-acceptance, freedom, new perspective, release"},
    {"name": "Nine of Swords", "suit": "Swords", "number": 9, "upright": "Anxiety, nightmares, worry, despair, mental anguish", "reversed": "Hope, reaching out, recovery, inner peace"},
    {"name": "Ten of Swords", "suit": "Swords", "number": 10, "upright": "Painful ending, rock bottom, loss, betrayal, crisis", "reversed": "Recovery, regeneration, inevitable end, lessons learned"},
    {"name": "Page of Swords", "suit": "Swords", "number": 11, "upright": "Curiosity, mental agility, new ideas, thirst for knowledge", "reversed": "Deception, manipulation, all talk, cynicism"},
    {"name": "Knight of Swords", "suit": "Swords", "number": 12, "upright": "Ambition, action, drive, determination, fast thinking", "reversed": "Recklessness, impatience, impulsiveness, burnout"},
    {"name": "Queen of Swords", "suit": "Swords", "number": 13, "upright": "Clear thinking, independence, direct communication, perception", "reversed": "Cold-hearted, cruel, bitterness, overly critical"},
    {"name": "King of Swords", "suit": "Swords", "number": 14, "upright": "Intellectual power, authority, truth, clear thinking", "reversed": "Manipulation, tyranny, abuse of power, cold logic"},
    # === Minor Arcana — Pentacles (14 cards) ===
    {"name": "Ace of Pentacles", "suit": "Pentacles", "number": 1, "upright": "New financial opportunity, prosperity, abundance, security", "reversed": "Missed opportunity, scarcity, instability, poor planning"},
    {"name": "Two of Pentacles", "suit": "Pentacles", "number": 2, "upright": "Balance, adaptability, juggling priorities, flexibility", "reversed": "Imbalance, overwhelm, disorganization, overcommitted"},
    {"name": "Three of Pentacles", "suit": "Pentacles", "number": 3, "upright": "Teamwork, collaboration, mastery, implementation", "reversed": "Lack of teamwork, conflict, poor quality, disharmony"},
    {"name": "Four of Pentacles", "suit": "Pentacles", "number": 4, "upright": "Security, conservation, control, holding on", "reversed": "Greed, materialism, possessiveness, letting go"},
    {"name": "Five of Pentacles", "suit": "Pentacles", "number": 5, "upright": "Financial loss, hardship, isolation, worry, insecurity", "reversed": "Recovery, improvement, turning a corner, spiritual wealth"},
    {"name": "Six of Pentacles", "suit": "Pentacles", "number": 6, "upright": "Generosity, charity, giving, sharing, prosperity", "reversed": "Debt, selfishness, strings attached, one-sided charity"},
    {"name": "Seven of Pentacles", "suit": "Pentacles", "number": 7, "upright": "Patience, long-term investment, perseverance, reward", "reversed": "Impatience, poor results, wasted effort, shortcuts"},
    {"name": "Eight of Pentacles", "suit": "Pentacles", "number": 8, "upright": "Skill development, diligence, craftsmanship, dedication", "reversed": "Perfectionism, lack of motivation, misdirected effort"},
    {"name": "Nine of Pentacles", "suit": "Pentacles", "number": 9, "upright": "Luxury, self-sufficiency, financial independence, elegance", "reversed": "Over-investment in work, financial setback, superficiality"},
    {"name": "Ten of Pentacles", "suit": "Pentacles", "number": 10, "upright": "Wealth, inheritance, family legacy, long-term success", "reversed": "Financial failure, loss of legacy, family disputes"},
    {"name": "Page of Pentacles", "suit": "Pentacles", "number": 11, "upright": "Ambition, new venture, studiousness, practicality", "reversed": "Lack of progress, procrastination, failure to launch"},
    {"name": "Knight of Pentacles", "suit": "Pentacles", "number": 12, "upright": "Efficiency, routine, reliability, methodical progress", "reversed": "Boredom, stagnation, laziness, perfectionism"},
    {"name": "Queen of Pentacles", "suit": "Pentacles", "number": 13, "upright": "Nurturing, practical, abundance, financial security, warmth", "reversed": "Self-centeredness, jealousy, smothering, work-life imbalance"},
    {"name": "King of Pentacles", "suit": "Pentacles", "number": 14, "upright": "Wealth, business, leadership, discipline, abundance", "reversed": "Greed, indulgence, obsession with status, corruption"},
]


def draw_tarot_spread(count=3):
    """Draw random tarot cards. Each has 50% chance of being reversed."""
    import random
    deck = list(TAROT_DECK)
    random.shuffle(deck)
    spread = []
    positions = ["Past", "Present", "Future"]
    for i in range(min(count, len(deck))):
        card = dict(deck[i])  # copy
        card["reversed"] = random.random() < 0.5
        card["position"] = positions[i] if i < len(positions) else f"Card {i+1}"
        spread.append(card)
    return spread


# ─── Moon Phase ───────────────────────────────────────────────────────────────

def calc_moon_phase(target_date: date = None) -> dict:
    """Calculate current moon phase using Conway's algorithm."""
    target = target_date or date.today()
    # Known new moon: Jan 6, 2000
    # Synodic month: 29.53059 days
    known_new_moon = date(2000, 1, 6)
    days_since = (target - known_new_moon).days
    synodic_month = 29.53059
    phase_day = days_since % synodic_month
    phase_pct = (phase_day / synodic_month) * 100

    # Determine phase name and emoji
    if phase_day < 1.85: phase_name, emoji = "New Moon", "\U0001f311"
    elif phase_day < 7.38: phase_name, emoji = "Waxing Crescent", "\U0001f312"
    elif phase_day < 9.23: phase_name, emoji = "First Quarter", "\U0001f313"
    elif phase_day < 14.77: phase_name, emoji = "Waxing Gibbous", "\U0001f314"
    elif phase_day < 16.61: phase_name, emoji = "Full Moon", "\U0001f315"
    elif phase_day < 22.15: phase_name, emoji = "Waning Gibbous", "\U0001f316"
    elif phase_day < 23.99: phase_name, emoji = "Last Quarter", "\U0001f317"
    else: phase_name, emoji = "Waning Crescent", "\U0001f318"

    illumination = round(50 * (1 - math.cos(2 * math.pi * phase_day / synodic_month)), 1)

    # Guidance based on phase
    guidance = {
        "New Moon": "A time for setting intentions and planting seeds. Start new projects, make wishes, set goals.",
        "Waxing Crescent": "Your intentions are taking root. Build momentum, take the first steps, gather resources.",
        "First Quarter": "A time of action and decision. Push through obstacles, commit to your path.",
        "Waxing Gibbous": "Refine and adjust. The energy is building — trust the process and fine-tune your approach.",
        "Full Moon": "Peak energy and illumination. Emotions run high. Celebrate progress, release what no longer serves you.",
        "Waning Gibbous": "Share your wisdom and give gratitude. Reflect on what you've learned this cycle.",
        "Last Quarter": "Release and let go. Forgive, declutter, shed old patterns. Make space for the new.",
        "Waning Crescent": "Rest and surrender. The cycle is completing. Retreat inward, dream, restore your energy.",
    }

    return {
        "phase": phase_name,
        "emoji": emoji,
        "illumination": illumination,
        "phase_day": round(phase_day, 1),
        "guidance": guidance.get(phase_name, ""),
        "days_until_full": round((14.77 - phase_day) % synodic_month, 1),
        "days_until_new": round((synodic_month - phase_day), 1),
    }


# ─── Mercury Retrograde ──────────────────────────────────────────────────────

MERCURY_RETROGRADES = [
    (date(2025, 3, 15), date(2025, 4, 7)),
    (date(2025, 7, 18), date(2025, 8, 11)),
    (date(2025, 11, 9), date(2025, 11, 29)),
    (date(2026, 3, 2), date(2026, 3, 25)),
    (date(2026, 7, 2), date(2026, 7, 26)),
    (date(2026, 10, 24), date(2026, 11, 13)),
    (date(2027, 2, 14), date(2027, 3, 9)),
    (date(2027, 6, 15), date(2027, 7, 9)),
    (date(2027, 10, 7), date(2027, 10, 28)),
]


def calc_mercury_retrograde(target_date: date = None) -> dict:
    """Check Mercury retrograde status for a given date."""
    target = target_date or date.today()
    for start, end in MERCURY_RETROGRADES:
        if start <= target <= end:
            days_left = (end - target).days
            return {
                "is_retrograde": True, "start": str(start), "end": str(end),
                "days_remaining": days_left,
                "guidance": "Mercury is retrograde. Avoid signing contracts, back up your data, double-check communications. Reconnect with old friends — the past wants your attention.",
            }
        # Check if approaching (within 7 days)
        if 0 < (start - target).days <= 7:
            return {
                "is_retrograde": False, "approaching": True,
                "starts_in": (start - target).days, "start": str(start),
                "guidance": f"Mercury retrograde begins in {(start - target).days} days. Finish important communications and back up your devices now.",
            }
    # Find next retrograde
    future = [(s, e) for s, e in MERCURY_RETROGRADES if s > target]
    if future:
        next_start = future[0][0]
        return {
            "is_retrograde": False, "approaching": False,
            "next_retrograde": str(next_start),
            "days_until": (next_start - target).days,
            "guidance": "Mercury is direct. Communication and travel flow smoothly. A good time for contracts and new ventures.",
        }
    return {"is_retrograde": False, "guidance": "Mercury is direct."}


# ─── Human Design (Swiss Ephemeris — accurate calculation) ────────────────────

import swisseph as swe
from datetime import datetime, timedelta

# Gate info lookup: gate number → name and theme
HUMAN_DESIGN_GATES = {
    1: {"name": "The Creative", "theme": "Self-expression and creativity"},
    2: {"name": "The Receptive", "theme": "Direction and higher knowing"},
    3: {"name": "Ordering", "theme": "Innovation through difficulty"},
    4: {"name": "Formulization", "theme": "Mental answers and solutions"},
    5: {"name": "Fixed Rhythms", "theme": "Waiting and natural patterns"},
    6: {"name": "Friction", "theme": "Emotional depth and intimacy"},
    7: {"name": "The Army", "theme": "Leadership and the role of self"},
    8: {"name": "Contribution", "theme": "Making a creative contribution"},
    9: {"name": "Focus", "theme": "Determination and detailed focus"},
    10: {"name": "Treading", "theme": "Self-love and behavior"},
    11: {"name": "Peace", "theme": "Ideas and conceptualization"},
    12: {"name": "Caution", "theme": "Articulation and social caution"},
    13: {"name": "The Listener", "theme": "Collecting past experiences"},
    14: {"name": "Power Skills", "theme": "Wealth and empowerment"},
    15: {"name": "Extremes", "theme": "Love of humanity and rhythm"},
    16: {"name": "Enthusiasm", "theme": "Skills and selectivity"},
    17: {"name": "Following", "theme": "Opinions and logical thinking"},
    18: {"name": "Correction", "theme": "Challenging the status quo"},
    19: {"name": "Approach", "theme": "Sensitivity and wanting"},
    20: {"name": "Contemplation", "theme": "Present awareness and action"},
    21: {"name": "Biting Through", "theme": "Control and willpower"},
    22: {"name": "Openness", "theme": "Grace under pressure"},
    23: {"name": "Splitting Apart", "theme": "Assimilation and insight"},
    24: {"name": "Returning", "theme": "Rationalization and mental review"},
    25: {"name": "Innocence", "theme": "Universal love and the spirit"},
    26: {"name": "The Taming Power", "theme": "The great trickster and ego"},
    27: {"name": "Nourishment", "theme": "Caring and responsibility"},
    28: {"name": "The Great", "theme": "Risk-taking and purpose"},
    29: {"name": "The Abysmal", "theme": "Perseverance and commitment"},
    30: {"name": "Clinging Fire", "theme": "Desire and emotional intensity"},
    31: {"name": "Influence", "theme": "Democratic leadership"},
    32: {"name": "Duration", "theme": "Continuity and transformation"},
    33: {"name": "Retreat", "theme": "Privacy and remembering"},
    34: {"name": "Great Power", "theme": "Power and raw energy"},
    35: {"name": "Progress", "theme": "Adventure and experience"},
    36: {"name": "Darkening of Light", "theme": "Crisis and emotional depth"},
    37: {"name": "The Family", "theme": "Community and bargains"},
    38: {"name": "Opposition", "theme": "The fighter and struggle"},
    39: {"name": "Obstruction", "theme": "Provocation and the spirit"},
    40: {"name": "Deliverance", "theme": "Aloneness and willpower"},
    41: {"name": "Decrease", "theme": "Imagination and fantasy"},
    42: {"name": "Increase", "theme": "Growth and completion"},
    43: {"name": "Breakthrough", "theme": "Insight and mental pressure"},
    44: {"name": "Coming to Meet", "theme": "Alertness and patterns"},
    45: {"name": "Gathering", "theme": "The gatherer and possessions"},
    46: {"name": "Pushing Upward", "theme": "Love of the body and luck"},
    47: {"name": "Oppression", "theme": "Realization and mental processing"},
    48: {"name": "The Well", "theme": "Depth and wisdom"},
    49: {"name": "Revolution", "theme": "Principles and rejection"},
    50: {"name": "The Cauldron", "theme": "Values and responsibility"},
    51: {"name": "Arousing", "theme": "Shock and initiation"},
    52: {"name": "Keeping Still", "theme": "Stillness and concentration"},
    53: {"name": "Development", "theme": "Starting and new beginnings"},
    54: {"name": "The Marrying Maiden", "theme": "Ambition and drive"},
    55: {"name": "Abundance", "theme": "Emotional spirit and faith"},
    56: {"name": "The Wanderer", "theme": "Stimulation and storytelling"},
    57: {"name": "The Gentle", "theme": "Intuitive clarity and survival"},
    58: {"name": "Joyous", "theme": "Vitality and joy of life"},
    59: {"name": "Dispersion", "theme": "Sexuality and breaking barriers"},
    60: {"name": "Limitation", "theme": "Acceptance and mutation"},
    61: {"name": "Inner Truth", "theme": "Mystery and inspiration"},
    62: {"name": "Preponderance of Small", "theme": "Details and expression"},
    63: {"name": "After Completion", "theme": "Doubt and logical questioning"},
    64: {"name": "Before Completion", "theme": "Confusion and mental pressure"},
}

HUMAN_DESIGN_TYPES = {
    "Generator": {
        "description": "Generators are the life force of the planet, designed to respond to life. You have sustainable energy when doing work that lights you up.",
        "strategy": "To Respond",
        "strategy_desc": "Wait for something in your environment to respond to before acting. Your gut response (sacral) tells you what's correct.",
        "not_self": "Frustration", "signature": "Satisfaction", "population": "~37%",
    },
    "Manifesting Generator": {
        "description": "Manifesting Generators are multi-passionate beings with the energy to pursue many interests. You are designed for speed and efficiency.",
        "strategy": "To Respond, then Inform",
        "strategy_desc": "Like Generators, wait for your sacral response. Once you know what's correct, inform others before taking action.",
        "not_self": "Frustration and Anger", "signature": "Satisfaction", "population": "~33%",
    },
    "Projector": {
        "description": "Projectors are the guides and advisors of humanity. You see others deeply and have the gift of managing and directing energy.",
        "strategy": "Wait for the Invitation",
        "strategy_desc": "Wait to be recognized and invited before sharing your wisdom. When invited, your guidance is transformative.",
        "not_self": "Bitterness", "signature": "Success", "population": "~20%",
    },
    "Manifestor": {
        "description": "Manifestors are the initiators, designed to make things happen. You have the power to start new ventures and catalyze change.",
        "strategy": "To Inform",
        "strategy_desc": "Inform the people who will be affected before you act. This removes resistance and creates peace.",
        "not_self": "Anger", "signature": "Peace", "population": "~8%",
    },
    "Reflector": {
        "description": "Reflectors are the mirrors of society, reflecting the health of their community. You are rare and deeply sensitive to your environment.",
        "strategy": "Wait a Lunar Cycle",
        "strategy_desc": "Wait 28 days (one full lunar cycle) before making major decisions. Discuss with trusted others during this time.",
        "not_self": "Disappointment", "signature": "Surprise", "population": "~1%",
    },
}

HUMAN_DESIGN_PROFILES = {
    "1/3": {"name": "Investigator / Martyr", "desc": "You learn through deep study and trial-and-error. Your life is about building solid foundations through experience."},
    "1/4": {"name": "Investigator / Opportunist", "desc": "You combine deep research with a strong network. Your influence flows through close relationships."},
    "2/4": {"name": "Hermit / Opportunist", "desc": "You have natural talents that others see before you do. Your gifts emerge through your network calling them out."},
    "2/5": {"name": "Hermit / Heretic", "desc": "You have natural genius that attracts projections. Others see you as a savior, pushing you to share your gifts widely."},
    "3/5": {"name": "Martyr / Heretic", "desc": "You learn through breaking things and discovering what works. Others project solutions onto you, and you deliver through experience."},
    "3/6": {"name": "Martyr / Role Model", "desc": "The first 30 years are trial and error. After that, you rise above as a wise role model who has lived through it all."},
    "4/6": {"name": "Opportunist / Role Model", "desc": "Your influence flows through your network. After life experience, you become a trusted authority others look up to."},
    "4/1": {"name": "Opportunist / Investigator", "desc": "You influence through relationships while being deeply grounded in knowledge. Fixed in your views but warm in delivery."},
    "5/1": {"name": "Heretic / Investigator", "desc": "Others project their needs onto you, and you deliver practical solutions backed by deep research."},
    "5/2": {"name": "Heretic / Hermit", "desc": "You attract attention and projections naturally. Your genius needs solitude to recharge between public engagements."},
    "6/2": {"name": "Role Model / Hermit", "desc": "You live life in three phases: experimentation, retreat, and finally emergence as an authentic role model."},
    "6/3": {"name": "Role Model / Martyr", "desc": "A life of intense experience. You go through everything so you can eventually stand as a credible guide for others."},
}

HUMAN_DESIGN_AUTHORITIES = {
    "Emotional": {"desc": "Your truth comes in waves. Never make decisions in the heat of the moment — wait for emotional clarity over time.", "center": "Solar Plexus"},
    "Sacral": {"desc": "Your gut response is your truth. Listen for the 'uh-huh' (yes) or 'un-un' (no) sounds from deep within.", "center": "Sacral"},
    "Splenic": {"desc": "Your body knows in an instant. Trust your first instinct — it's a spontaneous knowing that doesn't repeat.", "center": "Spleen"},
    "Ego": {"desc": "Your willpower and heart center guide you. Ask yourself: 'Do I have the will for this? Is this worth my energy?'", "center": "Heart/Ego"},
    "Self-Projected": {"desc": "Your truth comes through your voice. Talk through decisions with trusted others and listen to what YOU say.", "center": "G Center"},
    "Mental": {"desc": "No inner authority — you need to discuss with others and evaluate your environment to find clarity.", "center": "None (outer)"},
    "Lunar": {"desc": "Wait through a full 28-day lunar cycle before making major decisions. Your clarity comes with the moon.", "center": "None (lunar)"},
}

# ── Rave Mandala: ecliptic degree → gate mapping ─────────────────────────────
# Verified against myBodyGraph.com professional charts.
# Each gate spans exactly 5.625° (360/64). Sorted by start degree.
# Gate 25 starts at 358.25° (28°15' Pisces); wheel wraps at 0°/360°.
_GATE_DEGREE_TABLE = [
    (3.875, 17),    (9.500, 21),    (15.125, 51),   (20.750, 42),   (26.375, 3),
    (32.000, 27),   (37.625, 24),   (43.250, 2),    (48.875, 23),   (54.500, 8),
    (60.125, 20),   (65.750, 16),   (71.375, 35),   (77.000, 45),   (82.625, 12),
    (88.250, 15),   (93.875, 52),   (99.500, 39),   (105.125, 53),  (110.750, 62),
    (116.375, 56),  (122.000, 31),  (127.625, 33),  (133.250, 7),   (138.875, 4),
    (144.500, 29),  (150.125, 59),  (155.750, 40),  (161.375, 64),  (167.000, 47),
    (172.625, 6),   (178.250, 46),  (183.875, 18),  (189.500, 48),  (195.125, 57),
    (200.750, 32),  (206.375, 50),  (212.000, 28),  (217.625, 44),  (223.250, 1),
    (228.875, 43),  (234.500, 14),  (240.125, 34),  (245.750, 9),   (251.375, 5),
    (257.000, 26),  (262.625, 11),  (268.250, 10),  (273.875, 58),  (279.500, 38),
    (285.125, 54),  (290.750, 61),  (296.375, 60),  (302.000, 41),  (307.625, 19),
    (313.250, 13),  (318.875, 49),  (324.500, 30),  (330.125, 55),  (335.750, 37),
    (341.375, 63),  (347.000, 22),  (352.625, 36),  (358.250, 25),
]

# ── 36 Channels connecting the 9 Centers ─────────────────────────────────────
# Each channel: (gate_a, gate_b, center_a, center_b)
# Centers: Head, Ajna, Throat, G, Sacral, Root, Spleen, Heart, SolarPlexus
_HD_CHANNELS = [
    # Head ↔ Ajna
    (64, 47, "Head", "Ajna"), (61, 24, "Head", "Ajna"), (63, 4, "Head", "Ajna"),
    # Ajna ↔ Throat
    (17, 62, "Ajna", "Throat"), (43, 23, "Ajna", "Throat"), (11, 56, "Ajna", "Throat"),
    # Throat ↔ G
    (31, 7, "Throat", "G"), (8, 1, "Throat", "G"), (33, 13, "Throat", "G"),
    (20, 10, "Throat", "G"),
    # Throat ↔ Heart
    (45, 21, "Throat", "Heart"),
    # Throat ↔ SolarPlexus
    (35, 36, "Throat", "SolarPlexus"), (12, 22, "Throat", "SolarPlexus"),
    # Throat ↔ Sacral (Manifesting Generator channels)
    (20, 34, "Throat", "Sacral"),
    # Throat ↔ Spleen
    (20, 57, "Throat", "Spleen"), (16, 48, "Throat", "Spleen"),
    # G ↔ Sacral
    (15, 5, "G", "Sacral"), (46, 29, "G", "Sacral"), (2, 14, "G", "Sacral"),
    (10, 34, "G", "Sacral"),
    # G ↔ Spleen
    (57, 10, "G", "Spleen"),
    # Heart ↔ G
    (25, 51, "Heart", "G"), (26, 44, "Heart", "Spleen"),
    # Heart ↔ Sacral
    (40, 37, "Heart", "SolarPlexus"),
    # Sacral ↔ Spleen
    (50, 27, "Sacral", "Spleen"), (3, 60, "Sacral", "Root"), (9, 52, "Sacral", "Root"),
    (42, 53, "Sacral", "Root"), (59, 6, "Sacral", "SolarPlexus"),
    # Sacral ↔ Root
    (34, 57, "Sacral", "Spleen"),
    # Sacral ↔ SolarPlexus
    (49, 19, "SolarPlexus", "Root"),
    # Root ↔ Spleen
    (44, 26, "Spleen", "Heart"), (32, 54, "Spleen", "Root"),
    (28, 38, "Spleen", "Root"), (18, 58, "Spleen", "Root"),
    (48, 16, "Spleen", "Throat"),
    # Root ↔ SolarPlexus
    (39, 55, "Root", "SolarPlexus"), (41, 30, "Root", "SolarPlexus"),
]

# Motor centers (energy sources)
_MOTOR_CENTERS = {"Sacral", "Root", "Heart", "SolarPlexus"}


def _longitude_to_gate_line(longitude: float) -> tuple:
    """Convert ecliptic longitude (0-360°) to (gate_number, line_number)."""
    lon = longitude % 360.0
    line_span = 5.625 / 6.0  # each gate has 6 lines within 5.625°

    # Handle wraparound: longitudes 0° - 2° belong to Gate 3 (starts at 356.375°)
    if lon < _GATE_DEGREE_TABLE[0][0]:
        # Before first entry — belongs to last gate (Gate 3 at 356.375°)
        gate_num = _GATE_DEGREE_TABLE[-1][1]
        pos_in_gate = lon + (360.0 - _GATE_DEGREE_TABLE[-1][0])
        line = int(pos_in_gate / line_span) + 1
        return gate_num, min(max(line, 1), 6)

    # Normal lookup
    for i in range(len(_GATE_DEGREE_TABLE)):
        start = _GATE_DEGREE_TABLE[i][0]
        end = _GATE_DEGREE_TABLE[i + 1][0] if i + 1 < len(_GATE_DEGREE_TABLE) else 360.0
        if start <= lon < end:
            gate_num = _GATE_DEGREE_TABLE[i][1]
            pos_in_gate = lon - start
            line = int(pos_in_gate / line_span) + 1
            return gate_num, min(max(line, 1), 6)
    return gate_num, 1


def _get_planet_positions(jd: float) -> dict:
    """Calculate all 13 planetary positions for a Julian Day using Swiss Ephemeris."""
    swe.set_ephe_path('')  # use built-in ephemeris

    planets = {
        'Sun': swe.SUN, 'Earth': swe.SUN,  # Earth is opposite Sun
        'Moon': swe.MOON, 'Mercury': swe.MERCURY, 'Venus': swe.VENUS,
        'Mars': swe.MARS, 'Jupiter': swe.JUPITER, 'Saturn': swe.SATURN,
        'Uranus': swe.URANUS, 'Neptune': swe.NEPTUNE, 'Pluto': swe.PLUTO,
        'North Node': swe.MEAN_NODE,
    }
    positions = {}
    for name, planet_id in planets.items():
        xx, _ = swe.calc_ut(jd, planet_id)
        lon = xx[0]
        if name == 'Earth':
            lon = (lon + 180.0) % 360.0  # Earth is opposite Sun
        positions[name] = lon

    positions['South Node'] = (positions['North Node'] + 180.0) % 360.0
    return positions


def _find_design_jd(birth_jd: float) -> float:
    """Find the Julian Day when the Sun was exactly 88° before its birth position."""
    xx, _ = swe.calc_ut(birth_jd, swe.SUN)
    birth_sun = xx[0]
    target = (birth_sun - 88.0) % 360.0

    # Start ~88 days before birth, search with binary refinement
    test_jd = birth_jd - 88.0
    for _ in range(200):
        xx, _ = swe.calc_ut(test_jd, swe.SUN)
        diff = (xx[0] - target) % 360.0
        if diff > 180:
            diff -= 360
        if abs(diff) < 0.001:  # within ~3.6 arc-seconds
            return test_jd
        # Adjust: Sun moves ~1°/day
        test_jd -= diff * 0.9856  # approximate correction
    return test_jd


def _get_activated_gates(positions: dict) -> set:
    """Get set of activated gate numbers from planetary positions."""
    gates = set()
    for planet, lon in positions.items():
        gate, _ = _longitude_to_gate_line(lon)
        gates.add(gate)
    return gates


def _determine_type_authority_definition(personality_gates: set, design_gates: set) -> tuple:
    """Determine Type, Authority, and Definition from activated gates.
    Returns (type_name, authority_name, definition_name, defined_centers)."""
    all_gates = personality_gates | design_gates

    # Find defined channels and centers
    defined_centers = set()
    defined_channels = []
    for gate_a, gate_b, center_a, center_b in _HD_CHANNELS:
        if gate_a in all_gates and gate_b in all_gates:
            defined_centers.add(center_a)
            defined_centers.add(center_b)
            defined_channels.append((gate_a, gate_b, center_a, center_b))

    # Reflector: no defined centers at all
    if not defined_centers:
        return "Reflector", "Lunar", "No Definition", defined_centers

    sacral_defined = "Sacral" in defined_centers

    # Check if any motor center connects to Throat (through channels)
    motor_to_throat = False
    # Build adjacency from defined channels
    center_connections = {}
    for _, _, ca, cb in defined_channels:
        center_connections.setdefault(ca, set()).add(cb)
        center_connections.setdefault(cb, set()).add(ca)

    # BFS from each motor center to Throat
    for motor in _MOTOR_CENTERS:
        if motor not in defined_centers:
            continue
        visited = set()
        queue = [motor]
        while queue:
            current = queue.pop(0)
            if current == "Throat":
                motor_to_throat = True
                break
            if current in visited:
                continue
            visited.add(current)
            for neighbor in center_connections.get(current, []):
                if neighbor in defined_centers:
                    queue.append(neighbor)
        if motor_to_throat:
            break

    # Determine Type
    if sacral_defined:
        if motor_to_throat:
            hd_type = "Manifesting Generator"
        else:
            hd_type = "Generator"
    elif motor_to_throat:
        hd_type = "Manifestor"
    else:
        hd_type = "Projector"

    # Determine Authority (hierarchy: Emotional > Sacral > Splenic > Ego > Self-Projected > Mental > Lunar)
    if "SolarPlexus" in defined_centers:
        authority = "Emotional"
    elif sacral_defined:
        authority = "Sacral"
    elif "Spleen" in defined_centers:
        authority = "Splenic"
    elif "Heart" in defined_centers:
        authority = "Ego"
    elif "G" in defined_centers and "Throat" in defined_centers:
        authority = "Self-Projected"
    elif "Ajna" in defined_centers or "Head" in defined_centers:
        authority = "Mental"
    else:
        authority = "Lunar"

    # Determine Definition (connectivity of defined centers)
    if len(defined_centers) <= 1:
        definition = "No Definition"
    else:
        # Count connected components among defined centers
        visited = set()
        components = 0
        for center in defined_centers:
            if center not in visited:
                components += 1
                queue = [center]
                while queue:
                    c = queue.pop(0)
                    if c in visited:
                        continue
                    visited.add(c)
                    for n in center_connections.get(c, []):
                        if n in defined_centers and n not in visited:
                            queue.append(n)

        definition_map = {1: "Single Definition", 2: "Split Definition",
                          3: "Triple Split Definition", 4: "Quadruple Split Definition"}
        definition = definition_map.get(components, f"{components}-Split Definition")

    return hd_type, authority, definition, defined_centers


def _birth_to_utc_jd(birthdate: date, birth_time: str = None, location: str = None) -> float:
    """Convert birth date/time/location to Julian Day in UTC."""
    hour = 12.0  # default to noon if no time given
    if birth_time:
        try:
            parts = birth_time.split(':')
            hour = float(parts[0]) + float(parts[1]) / 60.0 if len(parts) >= 2 else float(parts[0])
        except (ValueError, IndexError):
            hour = 12.0

    # Timezone offset from location (simplified mapping for US + major regions)
    tz_offset = 0.0  # UTC default
    if location:
        loc_lower = location.lower()
        # US time zones
        if any(x in loc_lower for x in ['eastern', 'new york', 'florida', 'georgia', 'ohio', 'michigan',
                                          'virginia', 'carolina', 'pennsylvania', 'connecticut', 'maryland',
                                          'new jersey', 'massachusetts', 'maine', 'vermont', 'indiana']):
            tz_offset = -5.0
        elif any(x in loc_lower for x in ['central', 'chicago', 'texas', 'illinois', 'missouri', 'minnesota',
                                            'wisconsin', 'iowa', 'louisiana', 'oklahoma', 'kansas', 'tennessee',
                                            'alabama', 'mississippi', 'arkansas', 'hammond']):
            tz_offset = -6.0
        elif any(x in loc_lower for x in ['mountain', 'denver', 'colorado', 'arizona', 'utah', 'montana',
                                            'new mexico', 'wyoming', 'idaho']):
            tz_offset = -7.0
        elif any(x in loc_lower for x in ['pacific', 'los angeles', 'california', 'oregon', 'washington',
                                            'seattle', 'san francisco', 'portland']):
            tz_offset = -8.0
        elif any(x in loc_lower for x in ['hawaii']):
            tz_offset = -10.0
        elif any(x in loc_lower for x in ['alaska']):
            tz_offset = -9.0
        # International
        elif any(x in loc_lower for x in ['london', 'uk', 'england', 'ireland', 'portugal']):
            tz_offset = 0.0
        elif any(x in loc_lower for x in ['paris', 'berlin', 'rome', 'madrid', 'amsterdam', 'france',
                                            'germany', 'italy', 'spain', 'netherlands', 'belgium', 'switzerland']):
            tz_offset = 1.0
        elif any(x in loc_lower for x in ['moscow', 'istanbul', 'athens', 'helsinki', 'bucharest']):
            tz_offset = 3.0
        elif any(x in loc_lower for x in ['tokyo', 'japan', 'korea', 'seoul']):
            tz_offset = 9.0
        elif any(x in loc_lower for x in ['sydney', 'australia', 'melbourne']):
            tz_offset = 10.0
        elif any(x in loc_lower for x in ['delhi', 'india', 'mumbai', 'bangalore']):
            tz_offset = 5.5
        elif any(x in loc_lower for x in ['beijing', 'china', 'shanghai', 'hong kong', 'singapore']):
            tz_offset = 8.0
        elif any(x in loc_lower for x in ['dubai', 'abu dhabi']):
            tz_offset = 4.0
        elif any(x in loc_lower for x in ['sao paulo', 'brazil', 'rio']):
            tz_offset = -3.0
        elif any(x in loc_lower for x in ['mexico city', 'mexico']):
            tz_offset = -6.0

    utc_hour = hour - tz_offset
    # Handle day rollover
    day_offset = 0
    if utc_hour >= 24:
        utc_hour -= 24
        day_offset = 1
    elif utc_hour < 0:
        utc_hour += 24
        day_offset = -1

    bd = birthdate + timedelta(days=day_offset)
    return swe.julday(bd.year, bd.month, bd.day, utc_hour)


def calc_human_design(birthdate: date, birth_time: str = None, location: str = None) -> dict:
    """Calculate accurate Human Design chart using Swiss Ephemeris."""

    # Convert to Julian Day (UTC)
    birth_jd = _birth_to_utc_jd(birthdate, birth_time, location)

    # Get Personality (conscious) planetary positions at birth
    personality_positions = _get_planet_positions(birth_jd)
    conscious_sun_lon = personality_positions['Sun']
    conscious_gate, conscious_line = _longitude_to_gate_line(conscious_sun_lon)

    # Find Design date (88° solar arc before birth) and get Design positions
    design_jd = _find_design_jd(birth_jd)
    design_positions = _get_planet_positions(design_jd)
    unconscious_sun_lon = design_positions['Sun']
    unconscious_gate, unconscious_line = _longitude_to_gate_line(unconscious_sun_lon)

    # Get all activated gates from both personality and design
    personality_gates = _get_activated_gates(personality_positions)
    design_gates = _get_activated_gates(design_positions)

    # Determine Type, Authority, and Definition from channel activations
    hd_type, authority_key, definition, defined_centers = _determine_type_authority_definition(
        personality_gates, design_gates
    )

    type_data = HUMAN_DESIGN_TYPES[hd_type]
    authority_data = HUMAN_DESIGN_AUTHORITIES[authority_key]

    # Profile from Sun gate lines
    profile_key = f"{conscious_line}/{unconscious_line}"
    if profile_key not in HUMAN_DESIGN_PROFILES:
        valid_profiles = list(HUMAN_DESIGN_PROFILES.keys())
        profile_key = valid_profiles[(conscious_line * 6 + unconscious_line) % len(valid_profiles)]
    profile_data = HUMAN_DESIGN_PROFILES[profile_key]

    c_gate_info = HUMAN_DESIGN_GATES.get(conscious_gate, {"name": "?", "theme": "?"})
    u_gate_info = HUMAN_DESIGN_GATES.get(unconscious_gate, {"name": "?", "theme": "?"})

    return {
        "type": hd_type,
        "type_description": type_data["description"],
        "strategy": type_data["strategy"],
        "strategy_description": type_data["strategy_desc"],
        "not_self_theme": type_data["not_self"],
        "signature": type_data["signature"],
        "population": type_data["population"],
        "authority": authority_key,
        "authority_description": authority_data["desc"],
        "authority_center": authority_data["center"],
        "profile": profile_key,
        "profile_name": profile_data["name"],
        "profile_description": profile_data["desc"],
        "definition": definition,
        "defined_centers": sorted(defined_centers),
        "conscious_sun": {
            "gate": conscious_gate,
            "name": c_gate_info["name"],
            "theme": c_gate_info["theme"],
            "line": conscious_line,
        },
        "unconscious_sun": {
            "gate": unconscious_gate,
            "name": u_gate_info["name"],
            "theme": u_gate_info["theme"],
            "line": unconscious_line,
        },
    }


# ─── Transits ─────────────────────────────────────────────────────────────────

_ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

_ASPECTS = [
    ("Conjunction", 0.0, 8.0),
    ("Sextile", 60.0, 6.0),
    ("Square", 90.0, 7.0),
    ("Trine", 120.0, 7.0),
    ("Opposition", 180.0, 8.0),
]

# Planets used for transit calculations (skip Earth/nodes — not standard transit planets)
_TRANSIT_PLANETS = {
    "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY,
    "Venus": swe.VENUS, "Mars": swe.MARS, "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN, "Uranus": swe.URANUS, "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO,
}

# Fast-moving bodies whose mutual transits are too fleeting to report
_FAST_PLANETS = {"Moon", "Mercury"}

# Brief interpretations keyed by (aspect, transit_planet) — natal planet adds nuance
_ASPECT_MEANINGS = {
    # --- Sun transits ---
    ("Conjunction", "Sun"): "A powerful renewal of identity and vitality — your core self is being illuminated.",
    ("Trine", "Sun"): "Creative energy flows easily; confidence and self-expression come naturally.",
    ("Sextile", "Sun"): "Opportunities for personal growth appear through collaboration and openness.",
    ("Square", "Sun"): "Friction pushes growth — ego clashes or inner tension demand honest self-examination.",
    ("Opposition", "Sun"): "Awareness through contrast — relationships mirror what you need to see in yourself.",
    # --- Moon transits ---
    ("Conjunction", "Moon"): "Emotions intensify; deep feelings surface asking to be honoured.",
    ("Trine", "Moon"): "Emotional ease and nurturing energy support intuitive decisions.",
    ("Sextile", "Moon"): "Gentle emotional openings bring comfort and connection.",
    ("Square", "Moon"): "Emotional tension or mood swings signal unmet needs demanding attention.",
    ("Opposition", "Moon"): "Inner feelings clash with outer demands — balance self-care with responsibility.",
    # --- Mercury transits ---
    ("Conjunction", "Mercury"): "Mental clarity sharpens; important conversations or insights arrive.",
    ("Trine", "Mercury"): "Communication flows smoothly — ideal for learning, writing, or negotiations.",
    ("Sextile", "Mercury"): "Quick thinking and social connections open new mental pathways.",
    ("Square", "Mercury"): "Miscommunication or mental restlessness; slow down and verify before acting.",
    ("Opposition", "Mercury"): "Others challenge your thinking — listen carefully, there is wisdom in disagreement.",
    # --- Venus transits ---
    ("Conjunction", "Venus"): "Love, beauty, and pleasure are magnified — a time of attraction and harmony.",
    ("Trine", "Venus"): "Grace in relationships and finances; enjoy beauty without guilt.",
    ("Sextile", "Venus"): "Social charm increases — small gestures of kindness ripple outward.",
    ("Square", "Venus"): "Desires conflict with values; indulgence tempts but moderation serves you better.",
    ("Opposition", "Venus"): "Relationship dynamics demand compromise — what you want versus what you give.",
    # --- Mars transits ---
    ("Conjunction", "Mars"): "Energy and drive surge — channel this fire into action, not conflict.",
    ("Trine", "Mars"): "Physical vitality and courage peak; take bold, decisive steps.",
    ("Sextile", "Mars"): "Assertiveness finds constructive outlets — initiative is rewarded.",
    ("Square", "Mars"): "Frustration and impatience flare; choose your battles wisely.",
    ("Opposition", "Mars"): "Others may provoke or compete — stand firm without escalating.",
    # --- Jupiter transits ---
    ("Conjunction", "Jupiter"): "Expansion and luck converge — a major growth opportunity opens.",
    ("Trine", "Jupiter"): "Abundance flows naturally; optimism and generosity are rewarded.",
    ("Sextile", "Jupiter"): "A fortunate opening appears — say yes to growth opportunities.",
    ("Square", "Jupiter"): "Overconfidence or excess can derail progress; grow wisely, not recklessly.",
    ("Opposition", "Jupiter"): "Grand plans meet reality — balance ambition with practical limits.",
    # --- Saturn transits ---
    ("Conjunction", "Saturn"): "A serious turning point — structures are tested and rebuilt with integrity.",
    ("Trine", "Saturn"): "Discipline pays off; steady effort brings lasting, tangible results.",
    ("Sextile", "Saturn"): "Patient work is recognised — small commitments create big foundations.",
    ("Square", "Saturn"): "Obstacles and restrictions force you to mature and prioritise what truly matters.",
    ("Opposition", "Saturn"): "Accountability arrives — face responsibilities you have been postponing.",
    # --- Uranus transits ---
    ("Conjunction", "Uranus"): "Radical change electrifies this area of life — expect the unexpected.",
    ("Trine", "Uranus"): "Innovation and freedom flow without disruption — embrace your originality.",
    ("Sextile", "Uranus"): "Exciting new perspectives emerge; small rebellions lead to breakthroughs.",
    ("Square", "Uranus"): "Sudden upheaval shatters stale patterns — liberation through disruption.",
    ("Opposition", "Uranus"): "External shocks awaken dormant potential — resist clinging to the old.",
    # --- Neptune transits ---
    ("Conjunction", "Neptune"): "Boundaries dissolve — spiritual awakening mingles with confusion; trust intuition.",
    ("Trine", "Neptune"): "Imagination and compassion deepen; creativity and spiritual insight flourish.",
    ("Sextile", "Neptune"): "Subtle inspiration and heightened empathy guide you gently forward.",
    ("Square", "Neptune"): "Illusions cloud judgement — seek clarity before committing to anything.",
    ("Opposition", "Neptune"): "Others may deceive or idealise you — ground yourself in honest reality.",
    # --- Pluto transits ---
    ("Conjunction", "Pluto"): "Profound transformation — something must die so something greater can be born.",
    ("Trine", "Pluto"): "Deep empowerment flows; you access hidden reserves of strength and insight.",
    ("Sextile", "Pluto"): "Subtle but powerful shifts in perspective reveal what was hidden.",
    ("Square", "Pluto"): "Power struggles and compulsions surface — surrender control to find true power.",
    ("Opposition", "Pluto"): "Intense confrontations with others mirror your own shadow — face it to transform.",
}


def _sign_from_longitude(lon: float) -> str:
    """Return zodiac sign name for an ecliptic longitude."""
    return _ZODIAC_SIGNS[int(lon / 30.0) % 12]


def calc_transits(birthdate: date, birth_time: str = None, location: str = None) -> list:
    """Calculate current planetary transits to the natal chart.

    Returns a list of dicts describing each active transit aspect,
    sorted by orb (tightest first).
    """
    from datetime import datetime

    swe.set_ephe_path('')

    # Natal Julian Day
    birth_jd = _birth_to_utc_jd(birthdate, birth_time, location)

    # Current Julian Day (now, UTC)
    now = datetime.utcnow()
    now_jd = swe.julday(now.year, now.month, now.day,
                        now.hour + now.minute / 60.0 + now.second / 3600.0)

    # Calculate natal positions
    natal_positions = {}
    for name, pid in _TRANSIT_PLANETS.items():
        xx, _ = swe.calc_ut(birth_jd, pid)
        natal_positions[name] = xx[0]

    # Calculate current (transit) positions
    transit_positions = {}
    for name, pid in _TRANSIT_PLANETS.items():
        xx, _ = swe.calc_ut(now_jd, pid)
        transit_positions[name] = xx[0]

    # Find aspects
    results = []
    for t_name, t_lon in transit_positions.items():
        t_sign = _sign_from_longitude(t_lon)
        for n_name, n_lon in natal_positions.items():
            # Skip fleeting fast-to-fast aspects
            if t_name in _FAST_PLANETS and n_name in _FAST_PLANETS:
                continue

            diff = abs(t_lon - n_lon) % 360.0
            if diff > 180.0:
                diff = 360.0 - diff

            for aspect_name, aspect_angle, max_orb in _ASPECTS:
                orb = abs(diff - aspect_angle)
                if orb <= max_orb:
                    meaning = _ASPECT_MEANINGS.get(
                        (aspect_name, t_name),
                        f"Transit {t_name} forms a {aspect_name.lower()} — a significant cosmic influence."
                    )
                    results.append({
                        "transit_planet": t_name,
                        "transit_sign": t_sign,
                        "natal_planet": n_name,
                        "natal_sign": _sign_from_longitude(n_lon),
                        "aspect": aspect_name,
                        "angle": aspect_angle,
                        "orb": round(orb, 2),
                        "meaning": meaning,
                    })
                    break  # only one aspect per planet pair

    # Sort by orb (tightest first)
    results.sort(key=lambda x: x["orb"])
    return results


# ─── Master Calculator ────────────────────────────────────────────────────────

def calculate_all(
    name: str,
    birthdate: date,
    birth_time: str = None,
    location: str = None,
    personality_answers: list = None,
) -> dict:
    """Calculate all divination systems and return unified dict."""
    return {
        "numerology": {
            "life_path": calc_life_path(birthdate),
            "expression": calc_expression_number(name),
            "soul_urge": calc_soul_urge(name),
        },
        "western_astrology": calc_western_astrology(birthdate, birth_time, location),
        "chinese_zodiac": calc_chinese_zodiac(birthdate),
        "biorhythm": calc_biorhythm(birthdate),
        "celtic_tree": calc_celtic_tree(birthdate),
        "mayan_tzolkin": calc_mayan_tzolkin(birthdate),
        "aura": calc_aura(personality_answers or []),
        "palm": calc_palm_archetype(personality_answers or []),
        "human_design": calc_human_design(birthdate, birth_time, location),
        "transits": calc_transits(birthdate, birth_time, location),
        "moon_phase": calc_moon_phase(),
        "mercury_retrograde": calc_mercury_retrograde(),
        "birth_time": birth_time,
        "location": location,
    }
