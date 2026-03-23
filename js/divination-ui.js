/* ================================================================
   DIVINATION-UI — Rendering for each divination tab
   (numerology, astrology, chinese, celtic, mayan, aura)
   ================================================================ */

/* ════════════════════════════════════════════════════════════════
   ZODIAC ART CARD BUILDER
   ════════════════════════════════════════════════════════════════ */
const ZODIAC_ELEMENTS = {
  Aries:'fire',Taurus:'earth',Gemini:'air',Cancer:'water',
  Leo:'fire',Virgo:'earth',Libra:'air',Scorpio:'water',
  Sagittarius:'fire',Capricorn:'earth',Aquarius:'air',Pisces:'water'
};
const ZODIAC_SYMBOLS = {
  Aries:'\u2648',Taurus:'\u2649',Gemini:'\u264A',Cancer:'\u264B',
  Leo:'\u264C',Virgo:'\u264D',Libra:'\u264E',Scorpio:'\u264F',
  Sagittarius:'\u2650',Capricorn:'\u2651',Aquarius:'\u2652',Pisces:'\u2653'
};

function buildZodiacArtCard(signName) {
  const elem = ZODIAC_ELEMENTS[signName] || 'fire';
  const symbol = ZODIAC_SYMBOLS[signName] || '\u2726';
  let dots = '';
  const seed = signName.length * 7;
  const positions = [];
  for (let i = 0; i < 7; i++) {
    const x = 15 + ((seed * (i+1) * 17) % 70);
    const y = 15 + ((seed * (i+1) * 23) % 70);
    positions.push({x, y});
    dots += `<span style="left:${x}%;top:${y}%"></span>`;
  }
  for (let i = 0; i < positions.length - 1; i++) {
    const p1 = positions[i], p2 = positions[i+1];
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * (180/Math.PI);
    dots += `<span class="dot-line" style="left:${p1.x}%;top:${p1.y}%;width:${len}%;transform:rotate(${angle}deg)"></span>`;
  }

  return `<div class="zodiac-art-card zodiac-${elem}">
    <div class="zodiac-art-dots">${dots}</div>
    <div class="zodiac-art-inner">
      <div class="zodiac-art-symbol">${symbol}</div>
      <div class="zodiac-art-name">${signName}</div>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════════════════════
   NUMEROLOGY TAB
   ════════════════════════════════════════════════════════════════ */
function renderNumerologyTab(num) {
  function numCard(label, data) {
    return `<div class="div-section" style="margin-bottom:16px">
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:8px">
        <span style="font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:700;color:var(--gold)">${data.number}</span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:600">${label}</span>
      </div>
      <p style="color:var(--accent2);font-size:.85rem;margin-bottom:10px">${data.meaning}</p>
      <p style="font-size:.9rem;line-height:1.7;margin-bottom:12px">${data.description || ''}</p>
      <details style="margin-top:8px">
        <summary style="cursor:pointer;color:var(--accent);font-size:.8rem">How is this calculated?</summary>
        <div style="margin-top:8px;padding:12px;background:var(--card2);border-radius:8px;font-size:.8rem">
          <p style="color:var(--muted);margin-bottom:6px">${data.explanation || ''}</p>
          <p style="color:var(--dim);font-family:monospace;font-size:.75rem">${data.calculation || ''}</p>
        </div>
      </details>
    </div>`;
  }
  document.getElementById('r-numerology').innerHTML =
    numCard('Life Path', num.life_path) +
    numCard('Expression', num.expression) +
    numCard('Soul Urge', num.soul_urge) +
    `<details class="div-section learn-more" style="cursor:pointer">
      <summary style="color:var(--accent);font-size:.85rem;font-weight:500">Learn More: How Numerology Works</summary>
      <div style="margin-top:12px;font-size:.85rem;line-height:1.7;color:var(--muted)">
        <h4 style="color:var(--gold);font-size:.95rem;margin-bottom:6px">History &amp; Origins</h4>
        <p>Numerology traces back to Pythagoras (570-495 BCE), who believed numbers were the ultimate reality underlying all things. The system assigns numeric values to letters and reduces multi-digit numbers to single digits (1-9) or master numbers (11, 22, 33) through repeated addition.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">The Three Core Numbers</h4>
        <p><strong style="color:var(--text)">Life Path</strong> (from your birthdate) reveals your life's purpose and the lessons you're here to learn. It's calculated by reducing your full birthdate to a single digit. <strong style="color:var(--text)">Expression</strong> (from your full name) reveals your natural talents and abilities — each letter maps to a number (A=1, B=2... I=9, J=1...). <strong style="color:var(--text)">Soul Urge</strong> (from the vowels in your name) reveals your innermost desires and motivations.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">Interpreting Your Numbers</h4>
        <p>Each number carries a vibration: 1 = leadership, 2 = cooperation, 3 = creativity, 4 = stability, 5 = freedom, 6 = nurturing, 7 = introspection, 8 = power, 9 = humanitarianism. Master numbers (11, 22, 33) carry amplified energy and greater potential — along with greater challenges. Click "How is this calculated?" on each number above to see your exact calculation breakdown.</p>
      </div>
    </details>`;
}

/* ════════════════════════════════════════════════════════════════
   ASTROLOGY TAB
   ════════════════════════════════════════════════════════════════ */
function renderAstrologyTab(astro) {
  // Build Big Three section (Sun, Moon, Rising) if moon/rising data available
  let bigThreeHTML = '';
  if (astro.moon_sign || astro.rising_sign) {
    bigThreeHTML = `
    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.1rem;text-align:center;margin-bottom:16px">The Big Three</h4>
      <div class="big-three-grid">
        <div class="big-three-card">
          <div class="big-three-symbol">${astro.symbol || ZODIAC_SYMBOLS[astro.sign] || '\u2726'}</div>
          <div class="big-three-label">Sun Sign</div>
          <div class="big-three-name">${astro.sign}</div>
        </div>
        ${astro.moon_sign ? `<div class="big-three-card">
          <div class="big-three-symbol">${astro.moon_symbol || ZODIAC_SYMBOLS[astro.moon_sign] || '\u263D'}</div>
          <div class="big-three-label">Moon Sign</div>
          <div class="big-three-name">${astro.moon_sign}</div>
        </div>` : ''}
        ${astro.rising_sign ? `<div class="big-three-card">
          <div class="big-three-symbol">${astro.rising_symbol || ZODIAC_SYMBOLS[astro.rising_sign] || '\u2191'}</div>
          <div class="big-three-label">Rising Sign</div>
          <div class="big-three-name">${astro.rising_sign}</div>
        </div>` : ''}
      </div>
    </div>`;
  }

  // Build Planetary Positions grid if available
  let planetsHTML = '';
  if (astro.planets && Object.keys(astro.planets).length > 0) {
    let planetItems = '';
    for (const [planet, sign] of Object.entries(astro.planets)) {
      const sym = ZODIAC_SYMBOLS[sign] || '\u2726';
      planetItems += `<div class="planet-item">
        <div class="planet-item-name">${planet}</div>
        <div class="planet-item-symbol">${sym}</div>
        <div class="planet-item-sign">${sign}</div>
      </div>`;
    }
    planetsHTML = `
    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.1rem;margin-bottom:14px">Planetary Positions</h4>
      <div class="planet-grid">${planetItems}</div>
    </div>`;
  }

  // Build Aspects list if available
  const ASPECT_SYMBOLS = {conjunction:'\u260C', sextile:'\u2739', square:'\u25A1', trine:'\u25B3', opposition:'\u260D'};
  let aspectsHTML = '';
  if (astro.aspects && astro.aspects.length > 0) {
    let aspectItems = '';
    for (const a of astro.aspects) {
      const aspectKey = (a.aspect || '').toLowerCase();
      const sym = ASPECT_SYMBOLS[aspectKey] || a.aspect;
      const colorClass = (aspectKey === 'trine' || aspectKey === 'sextile') ? 'aspect-harmonious'
        : (aspectKey === 'square' || aspectKey === 'opposition') ? 'aspect-challenging'
        : 'aspect-neutral';
      aspectItems += `<div class="aspect-item ${colorClass}">
        <span class="aspect-planets">${a.planet1} ${sym} ${a.planet2}</span>
        <span class="aspect-detail">${a.aspect}${a.angle ? ' (' + a.angle + '\u00B0' + (a.orb ? ', orb ' + a.orb + '\u00B0' : '') + ')' : ''}</span>
      </div>`;
    }
    aspectsHTML = `
    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.1rem;margin-bottom:14px">Aspects</h4>
      <div class="aspect-list">${aspectItems}</div>
    </div>`;
  }

  // Build Birth Moon Phase if available
  let birthMoonHTML = '';
  if (astro.birth_moon_phase) {
    const moonEmojis = {'new moon':'\uD83C\uDF11','waxing crescent':'\uD83C\uDF12','first quarter':'\uD83C\uDF13','waxing gibbous':'\uD83C\uDF14','full moon':'\uD83C\uDF15','waning gibbous':'\uD83C\uDF16','last quarter':'\uD83C\uDF17','waning crescent':'\uD83C\uDF18'};
    const phaseKey = astro.birth_moon_phase.toLowerCase();
    const moonEmoji = moonEmojis[phaseKey] || '\uD83C\uDF15';
    birthMoonHTML = `
    <div class="div-section" style="text-align:center">
      <div style="font-size:2.5rem;margin-bottom:8px">${moonEmoji}</div>
      <div style="font-size:.7rem;text-transform:uppercase;color:var(--muted);letter-spacing:1.2px;margin-bottom:4px">Birth Moon Phase</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:var(--text)">${astro.birth_moon_phase}</div>
    </div>`;
  }

  document.getElementById('r-astrology').innerHTML = `
    ${bigThreeHTML}
    <div class="div-section" style="text-align:center">
      ${buildZodiacArtCard(astro.sign)}
      <p style="color:var(--accent2);font-size:.9rem;margin-bottom:16px">${astro.element} sign &bull; ${astro.modality} modality &bull; Ruled by ${astro.ruling_planet || 'the cosmos'}</p>
      <div style="width:40px;height:1px;background:var(--border2);margin:0 auto 16px"></div>
      <button class="read-btn" onclick="readAloud('astro-personality',this)">\ud83d\udd0a Read Aloud</button>
      <div id="astro-personality" style="font-size:.95rem;line-height:1.7;text-align:left;margin-bottom:16px">${astro.personality || ''}</div>
    </div>
    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.1rem;margin-bottom:10px">Strengths</h4>
      <p style="line-height:1.7">${astro.strengths || ''}</p>
    </div>
    <div class="div-section">
      <h4 style="color:var(--rose);font-size:1.1rem;margin-bottom:10px">Challenges</h4>
      <p style="line-height:1.7">${astro.challenges || ''}</p>
    </div>
    <div class="div-section">
      <h4 style="color:var(--accent);font-size:1.1rem;margin-bottom:10px">Compatibility</h4>
      <p style="line-height:1.7">Best matches: <span class="highlight">${astro.compatibility || ''}</span></p>
    </div>
    <div class="div-section" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">
      <div style="text-align:center;flex:1;min-width:100px">
        <div style="font-size:.7rem;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Lucky Numbers</div>
        <div style="color:var(--gold);font-weight:600">${astro.lucky_numbers || ''}</div>
      </div>
      <div style="text-align:center;flex:1;min-width:100px">
        <div style="font-size:.7rem;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Season</div>
        <div style="color:var(--accent2);font-size:.85rem">${astro.season || ''}</div>
      </div>
      <div style="text-align:center;flex:1;min-width:100px">
        <div style="font-size:.7rem;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Ruling Planet</div>
        <div style="color:var(--accent);font-weight:600">${astro.ruling_planet || ''}</div>
      </div>
    </div>
    ${planetsHTML}
    ${aspectsHTML}
    ${birthMoonHTML}
    <details class="div-section learn-more" style="cursor:pointer">
      <summary style="color:var(--accent);font-size:.85rem;font-weight:500">Learn More: How Your Astrology Was Compiled</summary>
      <div style="margin-top:12px;font-size:.85rem;line-height:1.7;color:var(--muted)">
        <h4 style="color:var(--gold);font-size:.95rem;margin-bottom:6px">History &amp; Origins</h4>
        <p>Western astrology traces back to Babylonian astronomers around 2,000 BCE who mapped celestial movements to earthly events. The Greeks refined it into the 12-sign zodiac we use today, with Ptolemy's <em>Tetrabiblos</em> (2nd century CE) becoming its foundational text. Each sign spans 30 degrees of the ecliptic — the Sun's apparent path across the sky.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">How Your Sign Was Determined</h4>
        <p>Your Sun sign is <strong style="color:var(--text)">${astro.sign}</strong> because you were born when the Sun was transiting that constellation's 30-degree arc. The <strong style="color:var(--text)">${astro.element}</strong> element comes from the ancient grouping of signs into four triplicities (Fire, Earth, Air, Water), each sharing core temperamental qualities. Your <strong style="color:var(--text)">${astro.modality}</strong> modality describes how you engage with change — Cardinal signs initiate, Fixed signs sustain, and Mutable signs adapt.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">Interpreting Your Results</h4>
        <p>Your ruling planet <strong style="color:var(--text)">${astro.ruling_planet || 'the cosmos'}</strong> colors how your sign's energy expresses itself. The ancient astrologers assigned each sign a planetary ruler based on observed correlations between planetary cycles and human behavior. Your element reveals your instinctive reaction style, while your modality shows your approach to life's challenges. Together, they form your astrological DNA.</p>
      </div>
    </details>
  `;
}

/* ════════════════════════════════════════════════════════════════
   CHINESE ZODIAC TAB
   ════════════════════════════════════════════════════════════════ */
function renderChineseTab(cn) {
  document.getElementById('r-chinese').innerHTML = `
    <div class="div-section" style="text-align:center">
      <div style="font-size:3.5rem;margin-bottom:12px">&#128009;</div>
      <h3 style="font-size:2rem;margin-bottom:4px">${cn.element} ${cn.animal}</h3>
      <p style="color:var(--accent2);font-size:.9rem;margin-bottom:16px">Year of the ${cn.animal} (${cn.year})</p>
      <div style="width:40px;height:1px;background:var(--border2);margin:0 auto 16px"></div>
      <p style="font-size:.95rem;line-height:1.7;text-align:left;margin-bottom:16px">${cn.personality || ''}</p>
    </div>
    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.1rem;margin-bottom:10px">Strengths</h4>
      <p style="line-height:1.7">${cn.strengths || ''}</p>
    </div>
    <div class="div-section">
      <h4 style="color:var(--rose);font-size:1.1rem;margin-bottom:10px">Challenges</h4>
      <p style="line-height:1.7">${cn.challenges || ''}</p>
    </div>
    <div class="div-section">
      <h4 style="color:var(--accent);font-size:1.1rem;margin-bottom:10px">Compatibility</h4>
      <p style="line-height:1.7">Best matches: <span class="highlight">${cn.compatibility || ''}</span></p>
    </div>
    <div class="div-section" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">
      <div style="text-align:center;flex:1;min-width:100px">
        <div style="font-size:.7rem;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Lucky Numbers</div>
        <div style="color:var(--gold);font-weight:600">${cn.lucky_numbers || ''}</div>
      </div>
      <div style="text-align:center;flex:1;min-width:100px">
        <div style="font-size:.7rem;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Lucky Colors</div>
        <div style="color:var(--accent2);font-size:.85rem">${cn.lucky_colors || ''}</div>
      </div>
    </div>
    <details class="div-section learn-more" style="cursor:pointer">
      <summary style="color:var(--accent);font-size:.85rem;font-weight:500">Learn More: How Your Zodiac Was Compiled</summary>
      <div style="margin-top:12px;font-size:.85rem;line-height:1.7;color:var(--muted)">
        <h4 style="color:var(--gold);font-size:.95rem;margin-bottom:6px">History &amp; Origins</h4>
        <p>The Chinese Zodiac dates back over 2,000 years to the Han Dynasty. Legend says the Jade Emperor held a great race across a river — the order the 12 animals finished determined the zodiac sequence: Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">How Your Sign Was Determined</h4>
        <p>You were born in <strong style="color:var(--text)">${cn.year}</strong>, a year of the <strong style="color:var(--text)">${cn.animal}</strong>. Your element <strong style="color:var(--text)">${cn.element}</strong> is derived from the Heavenly Stems cycle — the last digit of your birth year determines your element (0-1: Metal, 2-3: Water, 4-5: Wood, 6-7: Fire, 8-9: Earth). This creates a 60-year grand cycle where each animal-element combination repeats only once every six decades.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">Interpreting Your Results</h4>
        <p>The <strong style="color:var(--text)">${cn.element} ${cn.animal}</strong> is a unique combination that blends the ${cn.animal}'s core personality with the ${cn.element} element's qualities. ${cn.element === 'Water' ? 'Water brings adaptability and emotional depth.' : cn.element === 'Wood' ? 'Wood brings growth, creativity, and expansion.' : cn.element === 'Fire' ? 'Fire brings passion, charisma, and dynamism.' : cn.element === 'Metal' ? 'Metal brings determination, structure, and precision.' : 'Earth brings stability, reliability, and groundedness.'} Your lucky numbers and colors are traditionally associated with your specific animal-element pairing.</p>
      </div>
    </details>
  `;
}

/* ════════════════════════════════════════════════════════════════
   CELTIC TAB
   ════════════════════════════════════════════════════════════════ */
function renderCelticTab(celtic) {
  document.getElementById('r-celtic').innerHTML = `
    <div class="div-section" style="text-align:center">
      <div style="font-size:3.5rem;margin-bottom:12px">&#127795;</div>
      <h3 style="font-size:2rem;margin-bottom:4px">${celtic.tree}</h3>
      <p style="color:var(--accent2);font-size:.9rem;margin-bottom:16px">${celtic.meaning}</p>
      <div style="width:40px;height:1px;background:var(--border2);margin:0 auto 16px"></div>
      <p style="font-size:.95rem;line-height:1.7;text-align:left;margin-bottom:16px">${celtic.personality || ''}</p>
    </div>
    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.1rem;margin-bottom:10px">Strengths</h4>
      <p style="line-height:1.7">${celtic.strengths || ''}</p>
    </div>
    <div class="div-section" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">
      <div style="text-align:center;flex:1;min-width:140px">
        <div style="font-size:.7rem;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Sacred Animal</div>
        <div style="color:var(--accent2);font-size:.85rem;line-height:1.5">${celtic.sacred_animal || ''}</div>
      </div>
      <div style="text-align:center;flex:1;min-width:140px">
        <div style="font-size:.7rem;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Gemstone</div>
        <div style="color:var(--gold);font-size:.85rem;line-height:1.5">${celtic.gemstone || ''}</div>
      </div>
    </div>
    <details class="div-section learn-more" style="cursor:pointer">
      <summary style="color:var(--accent);font-size:.85rem;font-weight:500">Learn More: How Your Celtic Tree Was Compiled</summary>
      <div style="margin-top:12px;font-size:.85rem;line-height:1.7;color:var(--muted)">
        <h4 style="color:var(--gold);font-size:.95rem;margin-bottom:6px">History &amp; Origins</h4>
        <p>Celtic Tree Astrology originates from the Druids of ancient Britain and Ireland, who used the Ogham alphabet — a series of carved notches representing 20 sacred trees. The Ogham calendar divides the year into 13 lunar months, each governed by a tree whose characteristics mirror the energy of that season. This system predates written Western astrology in the British Isles by centuries.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">How Your Tree Was Determined</h4>
        <p>Your birth tree is <strong style="color:var(--text)">${celtic.tree}</strong>, assigned based on the lunar month of your birthday. Each tree governs a specific period of approximately 28 days (one lunar cycle). The Druids believed each tree held unique medicine for the soul — the ${celtic.tree} embodies "<em>${celtic.meaning}</em>." Your sacred animal <strong style="color:var(--text)">${celtic.sacred_animal || 'companion'}</strong> and gemstone <strong style="color:var(--text)">${celtic.gemstone || 'crystal'}</strong> are traditional correspondences passed down through Druidic lore.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">Interpreting Your Results</h4>
        <p>Your Celtic tree sign reveals qualities the Druids considered your birthright — innate gifts encoded in the season of your birth. The tree's character reflects your deepest nature: its roots represent your hidden depths, its trunk your core strength, and its branches the ways you reach toward the world.</p>
      </div>
    </details>
  `;
}

/* ════════════════════════════════════════════════════════════════
   MAYAN TAB
   ════════════════════════════════════════════════════════════════ */
function renderMayanTab(mayan) {
  document.getElementById('r-mayan').innerHTML = `
    <div class="div-section" style="text-align:center">
      <div style="font-size:3.5rem;margin-bottom:12px">&#127963;</div>
      <h3 style="font-size:1.8rem;margin-bottom:4px">${mayan.full_name}</h3>
      <p style="color:var(--accent2);font-size:.9rem;margin-bottom:4px">${mayan.meaning}</p>
      <p style="color:var(--dim);font-size:.8rem;margin-bottom:16px">Trecena: ${mayan.trecena} &bull; ${mayan.element || ''}</p>
      <div style="width:40px;height:1px;background:var(--border2);margin:0 auto 16px"></div>
      <p style="font-size:.95rem;line-height:1.7;text-align:left;margin-bottom:16px">${mayan.personality || ''}</p>
    </div>
    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.1rem;margin-bottom:10px">Strengths</h4>
      <p style="line-height:1.7">${mayan.strengths || ''}</p>
    </div>
    <div class="div-section">
      <h4 style="color:var(--rose);font-size:1.1rem;margin-bottom:10px">Shadow Side</h4>
      <p style="line-height:1.7">${mayan.shadow_side || ''}</p>
    </div>
    <details class="div-section learn-more" style="cursor:pointer">
      <summary style="color:var(--accent);font-size:.85rem;font-weight:500">Learn More: How Your Mayan Sign Was Compiled</summary>
      <div style="margin-top:12px;font-size:.85rem;line-height:1.7;color:var(--muted)">
        <h4 style="color:var(--gold);font-size:.95rem;margin-bottom:6px">History &amp; Origins</h4>
        <p>The Tzolkin is the sacred 260-day calendar of the ancient Maya, in continuous use for over 2,500 years. It interlocks 20 day signs (nawales) with 13 numbers (tones), producing 260 unique combinations — believed to mirror the rhythm of human gestation (roughly 260 days). The Maya considered this calendar the heartbeat of the cosmos itself.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">How Your Sign Was Determined</h4>
        <p>Your day sign <strong style="color:var(--text)">${mayan.full_name}</strong> was calculated by converting your Gregorian birthdate to the Tzolkin calendar. The calculation uses a correlation constant to align the two calendar systems, then your date is placed within the interlocking 20-day and 13-number cycles. Your trecena number <strong style="color:var(--text)">${mayan.trecena}</strong> adds a specific tone or intensity to your day sign's energy.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">Interpreting Your Results</h4>
        <p>The day sign reveals your soul's purpose and innate gifts. The trecena number amplifies certain aspects — lower numbers carry initiatory energy, while higher numbers carry mastery energy. The element <strong style="color:var(--text)">${mayan.element || 'assigned to your sign'}</strong> connects your Mayan profile to natural forces the Maya associated with specific directions and seasons.</p>
      </div>
    </details>
  `;
}

/* ════════════════════════════════════════════════════════════════
   HUMAN DESIGN TAB
   ════════════════════════════════════════════════════════════════ */
function renderHumanDesignTab(hd) {
  if (!hd) return;
  document.getElementById('r-humandesign').innerHTML = `
    <div class="div-section" style="text-align:center">
      <div style="font-size:3rem;margin-bottom:8px">&#9878;</div>
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:2px;color:var(--dim);margin-bottom:6px">Your Type</div>
      <h3 style="font-size:2rem;color:var(--gold);margin-bottom:4px">${hd.type}</h3>
      <p style="color:var(--accent2);font-size:.85rem;margin-bottom:16px">${hd.population} of humanity</p>
      <p style="font-size:.95rem;line-height:1.7;text-align:left">${hd.type_description}</p>
    </div>

    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.05rem;margin-bottom:8px">Strategy: ${hd.strategy}</h4>
      <p style="line-height:1.7;font-size:.92rem">${hd.strategy_description}</p>
      <div style="margin-top:12px;padding:12px 16px;background:var(--card);border:1px solid var(--border2);border-radius:12px">
        <span style="color:var(--rose);font-weight:600;font-size:.8rem">Not-Self Theme:</span>
        <span style="color:var(--muted);font-size:.85rem"> ${hd.not_self_theme}</span>
        <span style="margin-left:12px;color:var(--accent2);font-weight:600;font-size:.8rem">Signature:</span>
        <span style="color:var(--muted);font-size:.85rem"> ${hd.signature}</span>
      </div>
    </div>

    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.05rem;margin-bottom:8px">Authority: ${hd.authority}</h4>
      <p style="line-height:1.7;font-size:.92rem">${hd.authority_description}</p>
      <p style="color:var(--dim);font-size:.78rem;margin-top:6px">Center: ${hd.authority_center}</p>
    </div>

    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.05rem;margin-bottom:8px">Profile: ${hd.profile} — ${hd.profile_name}</h4>
      <p style="line-height:1.7;font-size:.92rem">${hd.profile_description}</p>
    </div>

    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.05rem;margin-bottom:10px">Your Gates</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:.65rem;text-transform:uppercase;color:var(--accent2);letter-spacing:1px;margin-bottom:4px">Conscious Sun</div>
          <div style="font-size:1.4rem;font-weight:700;color:var(--text)">${hd.conscious_sun.gate}</div>
          <div style="font-size:.85rem;color:var(--gold);margin:4px 0">${hd.conscious_sun.name}</div>
          <div style="font-size:.75rem;color:var(--muted);line-height:1.4">${hd.conscious_sun.theme}</div>
          <div style="font-size:.7rem;color:var(--dim);margin-top:4px">Line ${hd.conscious_sun.line}</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:.65rem;text-transform:uppercase;color:var(--rose);letter-spacing:1px;margin-bottom:4px">Unconscious Sun</div>
          <div style="font-size:1.4rem;font-weight:700;color:var(--text)">${hd.unconscious_sun.gate}</div>
          <div style="font-size:.85rem;color:var(--gold);margin:4px 0">${hd.unconscious_sun.name}</div>
          <div style="font-size:.75rem;color:var(--muted);line-height:1.4">${hd.unconscious_sun.theme}</div>
          <div style="font-size:.7rem;color:var(--dim);margin-top:4px">Line ${hd.unconscious_sun.line}</div>
        </div>
      </div>
    </div>

    <div class="div-section" style="text-align:center">
      <div style="font-size:.7rem;text-transform:uppercase;color:var(--muted);letter-spacing:1.2px;margin-bottom:6px">Definition</div>
      <p style="font-size:1rem;color:var(--text)">${hd.definition}</p>
    </div>

    <details class="div-section" style="cursor:pointer">
      <summary style="color:var(--accent);font-size:.85rem;font-weight:500">About Human Design</summary>
      <div style="margin-top:12px;font-size:.85rem;line-height:1.7;color:var(--muted)">
        <p>Human Design is a synthesis system created in 1987 that combines the I Ching, astrology, the Kabbalah, the Hindu-Brahmin chakra system, and quantum physics into a single framework for understanding your unique energetic blueprint.</p>
        <p style="margin-top:8px">Your <strong style="color:var(--text)">Type</strong> determines your fundamental role and energy pattern. Your <strong style="color:var(--text)">Strategy</strong> is how you're designed to make decisions and interact with the world. Your <strong style="color:var(--text)">Authority</strong> is your personal decision-making compass.</p>
        <p style="margin-top:8px">Your <strong style="color:var(--text)">Profile</strong> (derived from the line positions of your conscious and unconscious Sun gates) describes your life theme and how you learn. The <strong style="color:var(--text)">Conscious Sun</strong> represents the energy you're aware of, while the <strong style="color:var(--text)">Unconscious Sun</strong> (calculated from 88 days before birth) reveals deeper patterns operating beneath your awareness.</p>
        <p style="margin-top:8px">The 64 gates correspond to the 64 hexagrams of the I Ching, each carrying a specific theme and life lesson. When two gates connect across centers in your chart, they form a channel — a consistent life force that defines your <strong style="color:var(--text)">Definition</strong>.</p>
      </div>
    </details>
  `;
}

/* ════════════════════════════════════════════════════════════════
   AURA TAB
   ════════════════════════════════════════════════════════════════ */
function renderAuraTab(d, div) {
  setAuraGlow(d.aura_hex, d.aura_color);

  document.getElementById('r-aura').innerHTML = `
    <div class="div-section">
      <h3 style="font-size:1.3rem;margin-bottom:8px;color:${d.aura_hex}">Your ${d.aura_color} Aura</h3>
      <p style="color:var(--accent2);font-size:.9rem;margin-bottom:12px">${div.aura.meaning}</p>
      <p style="font-size:.95rem;line-height:1.7">${div.aura.description || ''}</p>
    </div>
    <div class="div-section" style="text-align:center">
      <div style="font-size:.7rem;text-transform:uppercase;color:var(--muted);margin-bottom:8px;letter-spacing:1.2px">Palm Archetype</div>
      <h3 style="font-size:1.4rem;margin-bottom:8px">${div.palm.archetype}</h3>
      <p style="color:var(--muted);line-height:1.6">${div.palm.meaning}</p>
    </div>
    <div class="div-section" style="padding:16px;text-align:center">
      <p style="font-size:.85rem;color:var(--muted);font-style:italic">Upload a selfie above to see your aura glow around you</p>
    </div>
    <details class="div-section learn-more" style="cursor:pointer">
      <summary style="color:var(--accent);font-size:.85rem;font-weight:500">Learn More: How Your Aura Was Compiled</summary>
      <div style="margin-top:12px;font-size:.85rem;line-height:1.7;color:var(--muted)">
        <h4 style="color:var(--gold);font-size:.95rem;margin-bottom:6px">History &amp; Origins</h4>
        <p>The concept of the human aura appears across cultures — from the Hindu concept of <em>prana</em> to the Chinese <em>qi</em>, from Christian halos in medieval art to Kirlian photography in the 1930s. Modern aura reading interprets the electromagnetic energy field surrounding the body as a reflection of emotional, mental, and spiritual states.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">How Your Aura Was Determined</h4>
        <p>Your dominant aura color <strong style="color:${d.aura_hex}">${d.aura_color}</strong> was derived from the convergence of multiple factors: your personality archetype (based on your 5 personality answers), your numerological vibration, and your astrological element. Each factor contributes a color frequency, and the dominant frequency becomes your aura color. Your palm archetype <strong style="color:var(--text)">${div.palm.archetype}</strong> adds another dimension by mapping your personality pattern to traditional hand-reading archetypes.</p>
        <h4 style="color:var(--gold);font-size:.95rem;margin:14px 0 6px">Interpreting Your Results</h4>
        <p>Each aura color operates on a specific frequency. Warm colors (red, orange, gold) indicate active, physical, and grounded energy. Cool colors (blue, indigo, violet) suggest intuitive, spiritual, and intellectual energy. Green represents healing and balance, while crystal/white auras indicate high sensitivity and amplification of surrounding energies. Upload a selfie above to see your aura visualized.</p>
      </div>
    </details>
  `;
}

function handleAuraPhoto(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById('aura-photo-img');
    const placeholder = document.getElementById('aura-photo-placeholder');
    img.src = e.target.result;
    img.style.display = 'block';
    placeholder.style.display = 'none';
    const glow = document.getElementById('aura-glow');
    glow.style.animation = 'auraPulse 3s ease-in-out infinite';
  };
  reader.readAsDataURL(input.files[0]);
}

function setAuraGlow(hex, color) {
  const glow = document.getElementById('aura-glow');
  glow.style.background = `radial-gradient(circle, ${hex}cc 0%, ${hex}66 40%, ${hex}22 70%, transparent 100%)`;
  glow.style.opacity = '0.8';
  const label = document.getElementById('aura-color-label');
  const sub = document.getElementById('aura-color-sub');
  if (label) label.innerHTML = `<span style="color:${hex}">${color}</span> Aura`;
  if (sub) sub.textContent = 'Your dominant energy frequency';
}