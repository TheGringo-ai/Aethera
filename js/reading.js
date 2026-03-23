/* ================================================================
   READING — getReading, renderResults, form logic
   ================================================================ */

async function getReading(fromWelcome) {
  if (!currentUser) { showAuthModal('signup'); return; }
  if (!canDoReading()) {
    showUpgradeModal();
    return;
  }

  document.getElementById('landing-screen').style.display = 'none';
  document.getElementById('intro-screen').style.display = 'none';
  document.getElementById('welcome-screen').classList.remove('active');
  const loadScreen = document.getElementById('loading-screen');
  loadScreen.classList.add('active');

  const msgs = t('loading_msgs') || translations.en.loading_msgs;
  let msgIdx = 0;
  const msgTimer = setInterval(() => {
    msgIdx = (msgIdx + 1) % msgs.length;
    document.getElementById('loadMsg').textContent = msgs[msgIdx];
  }, 2500);

  let body;
  if (fromWelcome && (userProfile || getProfile())) {
    const profile = userProfile || getProfile();
    body = {
      name: profile.name,
      email: profile.email || currentUser?.email || '',
      birthdate: profile.birthdate,
      birth_time: profile.birth_time || null,
      location: profile.location || null,
      personality_answers: profile.personality_answers || [0,0,0,0,0],
      focus_area: profile.focus_area || focusArea || 'purpose',
      language: profile.language || currentLang,
    };
  } else {
    body = {
      name: document.getElementById('inp-name').value.trim(),
      email: document.getElementById('inp-email').value.trim() || '',
      birthdate: document.getElementById('inp-birthdate').value,
      birth_time: document.getElementById('inp-birth-time').value || null,
      location: document.getElementById('inp-location').value || null,
      personality_answers: answers,
      focus_area: focusArea,
      language: currentLang,
    };
    saveProfile(body);
  }

  try {
    const res = await fetch('/v1/aethera/reading', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error ${res.status}`);
    }
    readingData = await res.json();
    clearInterval(msgTimer);

    incrementReadingCount();
    try { localStorage.setItem('aethera_last_reading', JSON.stringify(readingData)); } catch(e) {}

    if (currentUser) {
      saveReadingToFirestore(currentUser.uid, readingData);
    }

    renderResults(readingData);
    applyFeatureGating();
    loadScreen.classList.remove('active');
    document.getElementById('results-screen').classList.add('active');

  } catch (e) {
    clearInterval(msgTimer);
    loadScreen.classList.remove('active');
    if (fromWelcome) {
      document.getElementById('welcome-screen').classList.add('active');
    } else {
      document.getElementById('intro-screen').style.display = '';
    }
    alert('Something went wrong: ' + e.message);
  }
}

function renderResults(d) {
  const div = d.divination;
  const astro = div.western_astrology;
  const cn = div.chinese_zodiac;
  const num = div.numerology;
  const bio = div.biorhythm;

  // Profile
  document.getElementById('r-name').textContent = d.name;
  document.getElementById('r-archetype').textContent = d.cosmic_archetype;
  document.getElementById('r-tagline').textContent = d.tagline;

  const signsHTML = `
    <div class="sign-item"><div class="s-label">Sun Sign</div><div class="s-value">${astro.symbol} ${astro.sign}</div></div>
    <div class="sign-item"><div class="s-label">Life Path</div><div class="s-value">${num.life_path.number}</div></div>
    <div class="sign-item"><div class="s-label">Chinese</div><div class="s-value">${cn.animal}</div></div>
    <div class="sign-item"><div class="s-label">Element</div><div class="s-value">${astro.element}</div></div>
    <div class="sign-item"><div class="s-label">Aura</div><div class="s-value"><div class="aura-dot" style="background:${d.aura_hex};--aura-glow:${d.aura_hex}"></div>${d.aura_color}</div></div>
    <div class="sign-item"><div class="s-label">Celtic Tree</div><div class="s-value">${div.celtic_tree.tree}</div></div>
  `;
  document.getElementById('r-signs').innerHTML = signsHTML;

  // Profile tab: Tension + Shock
  document.getElementById('r-tension').textContent = d.tension || '';
  document.getElementById('r-shock').textContent = d.shock_line || '';

  // Render divination tabs
  renderNumerologyTab(num);
  renderAstrologyTab(astro);
  renderChineseTab(cn);
  renderCelticTab(div.celtic_tree);
  renderMayanTab(div.mayan_tzolkin);
  if (div.human_design) {
    renderHumanDesignTab(div.human_design);
  } else {
    document.getElementById('r-humandesign').innerHTML = `
      <div class="div-section" style="text-align:center;padding:40px 20px">
        <div style="font-size:2.5rem;margin-bottom:12px">&#9878;</div>
        <h3 style="color:var(--gold);margin-bottom:8px">Human Design Available</h3>
        <p style="color:var(--muted);font-size:.9rem;margin-bottom:20px">Get a new reading to see your Human Design blueprint — your Type, Strategy, Authority, and Profile.</p>
        <button class="cta" style="max-width:260px;margin:0 auto;font-size:1rem;padding:12px" onclick="newReading()">Get New Reading</button>
      </div>`;
  }
  renderAuraTab(d, div);
  renderTodayTab(bio, d, div);
  renderReadingTab(d);

  // Store share text
  window._shareText = d.share_text;

  // Populate Instagram-style share card
  populateShareCard(d);
}

/* ════════════════════════════════════════════════════════════════
   TODAY TAB (biorhythm, moon, mercury)
   ════════════════════════════════════════════════════════════════ */
function renderTodayTab(bio, d, div) {
  const bioColors = {physical:'#dc143c', emotional:'#4169e1', intellectual:'#ffd700'};
  const bioLabels = {physical:'Physical', emotional:'Emotional', intellectual:'Intellectual'};
  let ringsHTML = '';
  for (const [key, color] of Object.entries(bioColors)) {
    const val = bio[key];
    const pct = Math.round((val + 100) / 2);
    const r = 30, cx = 36, cy = 36, stroke = 5;
    const circumference = 2 * Math.PI * r;
    const dashLen = (pct / 100) * circumference;
    ringsHTML += `
      <div class="bio-ring">
        <div class="ring-label">${bioLabels[key]}</div>
        <svg viewBox="0 0 72 72">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e1e3a" stroke-width="${stroke}"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
            stroke-dasharray="${dashLen} ${circumference}" stroke-dashoffset="0"
            transform="rotate(-90 ${cx} ${cy})" stroke-linecap="round" style="transition:stroke-dasharray 1.5s ease"/>
        </svg>
        <div class="ring-val" style="color:${color}">${val > 0 ? '+' : ''}${val}%</div>
      </div>`;
  }
  document.getElementById('r-bio-rings').innerHTML = ringsHTML;

  // Biorhythm interpretations
  let bioInterpHTML = '';
  const bioInterpKeys = [
    {key: 'physical', label: 'Physical', color: '#dc143c', interp: bio.physical_interpretation},
    {key: 'emotional', label: 'Emotional', color: '#4169e1', interp: bio.emotional_interpretation},
    {key: 'intellectual', label: 'Intellectual', color: '#ffd700', interp: bio.intellectual_interpretation},
  ];
  for (const b of bioInterpKeys) {
    if (b.interp) {
      bioInterpHTML += `<div class="div-section" style="border-left:3px solid ${b.color}">
        <h4 style="color:${b.color};font-size:1rem;margin-bottom:8px">${b.label} Cycle</h4>
        <p style="font-size:.9rem;line-height:1.7;color:var(--muted)">${b.interp}</p>
      </div>`;
    }
  }
  bioInterpHTML += `<details class="div-section" style="cursor:pointer">
    <summary style="color:var(--accent);font-size:.85rem;font-weight:500">About Biorhythms</summary>
    <p style="margin-top:12px;font-size:.85rem;line-height:1.7;color:var(--muted)">Biorhythm theory proposes that your life is influenced by three natural cycles that begin at birth: Physical (23 days), Emotional (28 days), and Intellectual (33 days). Each cycle oscillates like a sine wave between positive peaks (+100%) and negative valleys (-100%). When a cycle crosses zero, it's called a "critical day" — a moment of transition where that area of life may feel unstable. Peaks are optimal for that type of activity, while valleys signal times to rest and recharge. The theory gained popularity in the early 20th century and remains a fascinating lens for self-awareness.</p>
  </details>`;
  document.getElementById('r-today').innerHTML = bioInterpHTML;
  if (d.today_guidance) {
    document.getElementById('r-today').innerHTML += `<div class="div-section"><p style="font-size:.9rem;line-height:1.7">${d.today_guidance}</p></div>`;
  }

  // Moon Phase
  const moon = div.moon_phase;
  if (moon) {
    document.getElementById('r-moon-emoji').textContent = moon.emoji || '';
    document.getElementById('r-moon-name').textContent = moon.phase || '';
    document.getElementById('r-moon-illum').textContent = `${moon.illumination || 0}% illuminated`;
    document.getElementById('r-moon-guidance').textContent = moon.guidance || '';
    document.getElementById('r-moon-full-days').textContent = `${moon.days_until_full || '--'}d`;
    document.getElementById('r-moon-new-days').textContent = `${moon.days_until_new || '--'}d`;
  }

  // Personal Transits
  if (div.transits && div.transits.length > 0) {
    const TRANSIT_ASPECT_SYMBOLS = {conjunction:'\u260C', sextile:'\u2739', square:'\u25A1', trine:'\u25B3', opposition:'\u260D'};
    let transitsHTML = `<div class="div-section">
      <h4 style="color:var(--gold);font-size:1.1rem;margin-bottom:14px">Personal Transits</h4>`;
    for (const tr of div.transits) {
      const aspectKey = (tr.aspect || '').toLowerCase();
      const sym = TRANSIT_ASPECT_SYMBOLS[aspectKey] || tr.aspect;
      const colorClass = (aspectKey === 'trine' || aspectKey === 'sextile') ? 'aspect-harmonious'
        : (aspectKey === 'square' || aspectKey === 'opposition') ? 'aspect-challenging'
        : 'aspect-neutral';
      transitsHTML += `<div class="transit-card ${colorClass}">
        <div class="transit-header">
          <span class="transit-planets">${tr.transit_planet} ${sym} ${tr.natal_planet}</span>
          ${tr.orb ? `<span class="transit-orb">orb ${tr.orb}\u00B0</span>` : ''}
        </div>
        ${tr.meaning ? `<p class="transit-meaning">${tr.meaning}</p>` : ''}
      </div>`;
    }
    transitsHTML += '</div>';
    document.getElementById('r-today').innerHTML += transitsHTML;
  }

  // Mercury Retrograde
  const mercury = div.mercury_retrograde;
  if (mercury) {
    const mercEl = document.getElementById('r-mercury-status');
    if (mercury.is_retrograde) {
      mercEl.innerHTML = `<div class="retro-status retro-active">
        <div class="retro-icon">&#9888;&#65039;</div>
        <div class="retro-label" style="color:#ff4444">Mercury Retrograde Active</div>
        <div style="color:#ff8888;font-size:.9rem;margin-bottom:6px">${mercury.days_remaining} days remaining (${mercury.start} to ${mercury.end})</div>
        <div class="retro-text">${mercury.guidance || ''}</div>
      </div>`;
    } else if (mercury.approaching) {
      mercEl.innerHTML = `<div class="retro-status retro-approaching">
        <div class="retro-icon">&#9888;&#65039;</div>
        <div class="retro-label" style="color:#ffaa44">Mercury Retrograde in ${mercury.starts_in} Days</div>
        <div class="retro-text">${mercury.guidance || ''}</div>
      </div>`;
    } else {
      mercEl.innerHTML = `<div class="retro-status retro-clear">
        <div class="retro-icon">&#10004;&#65039;</div>
        <div class="retro-label" style="color:#44ff44">Mercury Direct</div>
        <div style="color:var(--muted);font-size:.85rem;margin-bottom:6px">${mercury.next_retrograde ? 'Next retrograde: ' + mercury.next_retrograde + ' (' + mercury.days_until + ' days)' : ''}</div>
        <div class="retro-text">${mercury.guidance || ''}</div>
      </div>`;
    }
  }

  // Add share button to Today tab
  const todayTab = document.getElementById('tab-today');
  if (todayTab && !todayTab.querySelector('.share-reading-bar')) {
    const shareBar = document.createElement('div');
    shareBar.className = 'share-reading-bar';
    shareBar.innerHTML = '<button class="share-reading-btn" onclick="shareTabReading(\'tab-today\', \'My Daily Cosmic Energy\')">&#128228; Share This Reading</button>';
    todayTab.querySelector('div').appendChild(shareBar);
  }
}

/* ════════════════════════════════════════════════════════════════
   READING TAB (focus + full reading)
   ════════════════════════════════════════════════════════════════ */
function renderReadingTab(d) {
  const focusLabels = translations[currentLang]?.focus_labels || translations.en.focus_labels;
  document.getElementById('r-focus-label').textContent = focusLabels[focusArea] || 'Your Reading';
  const focusParas = (d.focus_reading || '').split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
  document.getElementById('r-focus-body').innerHTML = focusParas || '<p>The cosmos speaks to your path...</p>';

  let readingText = d.cosmic_reading || '';
  readingText = readingText.replace(/^(ARCHETYPE|TAGLINE|SHOCK_LINE|TENSION|TODAY_GUIDANCE|FOCUS_READING|READING):.*$/gm, '');
  if (d.focus_reading && d.focus_reading.length > 50) {
    const focusSnippet = d.focus_reading.substring(0, 80);
    if (readingText.includes(focusSnippet)) {
      readingText = readingText.replace(d.focus_reading, '').trim();
    }
  }
  const readingParas = readingText.split('\n').filter(p => p.trim().length > 10).map(p => `<p>${p}</p>`).join('');
  document.getElementById('r-reading').innerHTML = readingParas || '<p>Your cosmic reading is being woven...</p>';

  // Add share button to Reading tab
  const readingTab = document.getElementById('tab-reading');
  if (readingTab && !readingTab.querySelector('.share-reading-bar')) {
    const shareBar = document.createElement('div');
    shareBar.className = 'share-reading-bar';
    shareBar.innerHTML = '<button class="share-reading-btn" onclick="shareTabReading(\'tab-reading\', \'My Cosmic Reading\')">&#128228; Share This Reading</button>';
    readingTab.querySelector('div').appendChild(shareBar);
  }
}

/* ════════════════════════════════════════════════════════════════
   SHARE
   ════════════════════════════════════════════════════════════════ */
function copyShare() {
  navigator.clipboard.writeText(window._shareText || '').then(() => {
    const btn = document.getElementById('copyBtn');
    const orig = btn.innerHTML;
    btn.textContent = '\u2713 Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2000);
  });
}

function shareNative() {
  if (navigator.share) {
    navigator.share({
      title: 'My Aethera Cosmic Profile',
      text: window._shareText || '',
      url: window.location.href,
    }).catch(() => {});
  } else {
    copyShare();
  }
}

function takeScreenshot() {
  const card = document.getElementById('cosmicCard');
  if (!card || typeof html2canvas === 'undefined') {
    copyShare();
    return;
  }
  html2canvas(card, {
    backgroundColor: '#0a0a1a',
    scale: 2,
    useCORS: true,
  }).then(canvas => {
    canvas.toBlob(blob => {
      if (navigator.share && navigator.canShare && navigator.canShare({files: [new File([blob], 'aethera.png', {type: 'image/png'})]})) {
        navigator.share({
          files: [new File([blob], 'aethera-cosmic-profile.png', {type: 'image/png'})],
          title: 'My Aethera Cosmic Profile',
        }).catch(() => {});
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'aethera-cosmic-profile.png';
        a.click();
        URL.revokeObjectURL(a.href);
      }
    }, 'image/png');
  });
}

function saveShareCard() {
  const card = document.getElementById('shareCard');
  if (!card || typeof html2canvas === 'undefined') {
    copyShare();
    return;
  }
  html2canvas(card, {
    backgroundColor: '#0a0a1a',
    scale: 3,
    useCORS: true,
    width: 320,
  }).then(canvas => {
    canvas.toBlob(blob => {
      if (navigator.share && navigator.canShare && navigator.canShare({files: [new File([blob], 'aethera.png', {type: 'image/png'})]})) {
        navigator.share({
          files: [new File([blob], 'aethera-cosmic-card.png', {type: 'image/png'})],
          title: 'My Aethera Cosmic Profile',
        }).catch(() => {});
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'aethera-cosmic-card.png';
        a.click();
        URL.revokeObjectURL(a.href);
      }
    }, 'image/png');
  });
}

/* ════════════════════════════════════════════════════════════════
   SHARE TAB READING (reusable for every divination tab)
   ════════════════════════════════════════════════════════════════ */
async function shareTabReading(tabId, title) {
  const tab = document.getElementById(tabId);
  if (!tab) return;

  // Add temporary watermark
  const watermark = document.createElement('div');
  watermark.className = 'share-watermark';
  watermark.innerHTML = '&#10024; aethera.live';
  tab.appendChild(watermark);

  try {
    if (typeof html2canvas === 'undefined') {
      // Fallback: copy text
      const text = title + ' — Discover your cosmic identity at aethera.live';
      await navigator.clipboard.writeText(text);
      alert('Link copied! Share it with friends.');
      return;
    }

    const canvas = await html2canvas(tab, {
      backgroundColor: '#0a0a1a',
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
    });

    canvas.toBlob(async (blob) => {
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'aethera-reading.png', {type: 'image/png'});
        try {
          await navigator.share({
            title: title,
            text: 'Discover your cosmic identity at aethera.live',
            url: 'https://aethera.live',
            files: [file],
          });
        } catch(e) {
          // Share cancelled or unsupported, download instead
          downloadBlob(blob, 'aethera-reading.png');
        }
      } else {
        downloadBlob(blob, 'aethera-reading.png');
      }
    }, 'image/png');

  } finally {
    watermark.remove();
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function populateShareCard(d) {
  if (!d) return;
  const div = d.divination;
  document.getElementById('share-name').textContent = d.name;
  document.getElementById('share-archetype').textContent = d.cosmic_archetype;
  document.getElementById('share-tagline').textContent = d.tagline;

  const astro = div.western_astrology;
  const cn = div.chinese_zodiac;
  const num = div.numerology;
  const celtic = div.celtic_tree;
  const mayan = div.mayan_tzolkin;

  document.getElementById('share-signs').innerHTML = `
    <div style="text-align:center"><div style="font-size:.55rem;text-transform:uppercase;letter-spacing:1px;color:#555577;margin-bottom:3px">Sun</div><div style="font-family:'Cormorant Garamond',serif;font-size:.9rem;color:#e0dfe8">${astro.symbol} ${astro.sign}</div></div>
    <div style="text-align:center"><div style="font-size:.55rem;text-transform:uppercase;letter-spacing:1px;color:#555577;margin-bottom:3px">Life Path</div><div style="font-family:'Cormorant Garamond',serif;font-size:.9rem;color:#e0dfe8">${num.life_path.number}</div></div>
    <div style="text-align:center"><div style="font-size:.55rem;text-transform:uppercase;letter-spacing:1px;color:#555577;margin-bottom:3px">Chinese</div><div style="font-family:'Cormorant Garamond',serif;font-size:.9rem;color:#e0dfe8">${cn.animal}</div></div>
    <div style="text-align:center"><div style="font-size:.55rem;text-transform:uppercase;letter-spacing:1px;color:#555577;margin-bottom:3px">Aura</div><div style="font-family:'Cormorant Garamond',serif;font-size:.9rem;color:#e0dfe8"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${d.aura_hex};box-shadow:0 0 8px ${d.aura_hex};vertical-align:middle;margin-right:4px"></span>${d.aura_color}</div></div>
    <div style="text-align:center"><div style="font-size:.55rem;text-transform:uppercase;letter-spacing:1px;color:#555577;margin-bottom:3px">Celtic</div><div style="font-family:'Cormorant Garamond',serif;font-size:.9rem;color:#e0dfe8">${celtic.tree}</div></div>
    <div style="text-align:center"><div style="font-size:.55rem;text-transform:uppercase;letter-spacing:1px;color:#555577;margin-bottom:3px">Mayan</div><div style="font-family:'Cormorant Garamond',serif;font-size:.9rem;color:#e0dfe8">${mayan.day_sign || mayan.full_name.split(' ').pop()}</div></div>
  `;
}