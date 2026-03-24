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
   SHARE TAB READING — social share menu
   ════════════════════════════════════════════════════════════════ */
function shareTabReading(tabId, title) {
  // Build rich share text from reading data
  const d = readingData;
  const lines = [];
  if (d) {
    const astro = d.divination?.western_astrology;
    const hd = d.divination?.human_design;
    const num = d.divination?.numerology;
    const cn = d.divination?.chinese_zodiac;
    if (d.cosmic_archetype) lines.push('My cosmic archetype: ' + d.cosmic_archetype);
    const signs = [];
    if (astro?.sign) signs.push(astro.symbol + ' ' + astro.sign + ' Sun');
    if (astro?.moon_sign) signs.push(astro.moon_sign + ' Moon');
    if (astro?.rising_sign) signs.push(astro.rising_sign + ' Rising');
    if (signs.length) lines.push(signs.join(' | '));
    if (hd?.type) lines.push('Human Design: ' + hd.type + (hd.profile ? ' ' + hd.profile : ''));
    if (num?.life_path) lines.push('Life Path ' + num.life_path.number);
    if (cn?.animal) lines.push(cn.element + ' ' + cn.animal);
    if (d.aura_color) lines.push('Aura: ' + d.aura_color);
  }
  if (!lines.length) lines.push(title);
  lines.push('');
  lines.push('Discover your cosmic identity at aethera.live');

  const shareText = lines.join('\n');
  const oneLiner = lines.slice(0, 3).join(' | ');

  // Build personalized share URL with OG tags
  let url = 'https://aethera.live';
  if (d) {
    const astro = d.divination?.western_astrology;
    const hd = d.divination?.human_design;
    const num = d.divination?.numerology;
    const shareData = {
      n: (d.name || '').split(' ')[0],
      a: d.cosmic_archetype || '',
      s: astro?.sign ? (astro.symbol + ' ' + astro.sign) : '',
      m: astro?.moon_sign || '',
      r: astro?.rising_sign || '',
      h: hd?.type || '',
      l: num?.life_path?.number || '',
      au: d.aura_color || '',
    };
    try {
      const shareId = btoa(JSON.stringify(shareData)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
      url = 'https://aethera.live/v1/aethera/share/' + shareId;
    } catch(e) {}
  }
  const encodedText = encodeURIComponent(shareText);
  const encodedOneLiner = encodeURIComponent(oneLiner);
  const encodedUrl = encodeURIComponent(url);

  // Store for copy
  window._pendingShareText = shareText;

  // Show share modal
  const overlay = document.getElementById('shareOverlay');
  const content = document.getElementById('shareModalContent');
  content.innerHTML = `
    <div style="font-size:2rem;margin-bottom:12px">&#128228;</div>
    <h2 style="font-size:1.4rem;margin-bottom:16px">Share Your Reading</h2>
    <div class="share-preview">${shareText.replace(/\n/g, '<br>')}</div>
    <p style="color:var(--accent2);font-size:.75rem;margin-bottom:16px">Your reading text is auto-copied when you tap a platform</p>
    <div class="share-social-grid">
      <button class="share-social-btn share-facebook" onclick="shareToFacebook('${encodedUrl}')">
        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Facebook
      </button>
      <a class="share-social-btn share-twitter" href="https://twitter.com/intent/tweet?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener" onclick="autoCopyShare()">
        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X / Twitter
      </a>
      <button class="share-social-btn share-instagram" onclick="autoCopyShare();shareToInstagram()">
        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        Instagram
      </button>
      <a class="share-social-btn share-tiktok" href="https://www.tiktok.com/share?url=${encodedUrl}&text=${encodedText}" target="_blank" rel="noopener" onclick="autoCopyShare()">
        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.81-.06l-.38.04z"/></svg>
        TikTok
      </a>
      <a class="share-social-btn share-snapchat" href="https://www.snapchat.com/share?url=${encodedUrl}" target="_blank" rel="noopener" onclick="autoCopyShare()">
        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.214.04-.012.06-.012.08-.012.26 0 .479.12.58.32.1.18.06.399-.06.58-.12.18-.36.32-.659.42-.18.06-.38.12-.58.159l-.06.018a2.89 2.89 0 00-.72.24c-.24.12-.42.3-.479.54-.06.24.06.54.36.84.42.42.78.72 1.14 1.02.36.24.72.48 1.02.78.3.3.48.66.42 1.02-.06.3-.3.6-.66.84-.48.3-1.14.48-1.92.54h-.06c-.06.06-.12.18-.18.36-.06.12-.12.24-.24.36-.3.24-.72.36-1.26.42-.36.06-.78.06-1.2.12-.36.06-.72.12-1.14.24-.54.18-1.08.48-1.68.78-.78.42-1.74.9-3.24.9h-.06c-1.5 0-2.46-.48-3.24-.9-.6-.3-1.14-.6-1.68-.78-.42-.12-.78-.18-1.14-.24-.42-.06-.84-.06-1.2-.12-.54-.06-.96-.18-1.26-.42-.12-.12-.18-.24-.24-.36-.06-.18-.12-.3-.18-.36h-.06c-.78-.06-1.44-.24-1.92-.54-.36-.24-.6-.54-.66-.84-.06-.36.12-.72.42-1.02.3-.3.66-.54 1.02-.78.36-.3.72-.6 1.14-1.02.3-.3.42-.6.36-.84-.06-.24-.24-.42-.48-.54a2.89 2.89 0 00-.72-.24l-.06-.018c-.2-.04-.4-.1-.58-.16-.3-.1-.54-.24-.66-.42-.12-.18-.16-.4-.06-.58.1-.2.32-.32.58-.32.02 0 .04 0 .08.012.26.094.62.198.92.214.2 0 .33-.045.4-.09a9.89 9.89 0 01-.03-.51l-.003-.06c-.104-1.628-.23-3.654.3-4.847C6.447 1.069 9.806.793 10.796.793h1.41z"/></svg>
        Snapchat
      </a>
      <a class="share-social-btn share-whatsapp" href="https://wa.me/?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener" onclick="autoCopyShare()">
        <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </a>
    </div>
    <div style="margin-top:16px;display:flex;gap:8px">
      <button class="share-action-btn" onclick="copyShareTextFromPending()">&#128203; Copy Text</button>
      <button class="share-action-btn" onclick="nativeShareFromPending()">&#128228; More...</button>
    </div>
    <button class="upgrade-later" onclick="closeShareModal()" style="margin-top:12px">Close</button>
  `;
  overlay.classList.add('active');
}

function copyShareTextFromPending() {
  const text = (window._pendingShareText || '') + '\nhttps://aethera.live';
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied! Paste it anywhere.');
  }).catch(() => {});
}

function nativeShareFromPending() {
  const text = window._pendingShareText || '';
  if (navigator.share) {
    navigator.share({title: 'My Aethera Reading', text: text, url: 'https://aethera.live'}).catch(() => {});
  } else {
    copyShareTextFromPending();
  }
}

function autoCopyShare() {
  const text = window._pendingShareText || '';
  if (text) navigator.clipboard.writeText(text + '\nhttps://aethera.live').catch(() => {});
}

function shareToFacebook(encodedUrl) {
  const text = window._pendingShareText || '';
  const url = decodeURIComponent(encodedUrl);
  // Copy reading text + link to clipboard
  navigator.clipboard.writeText(text + '\n' + url).then(() => {
    // Open Facebook share dialog with the personalized URL
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl, '_blank');
    // Brief delay then notify
    setTimeout(() => {
      alert('Your reading has been copied! Paste it in the Facebook post text above the preview card.');
    }, 1000);
  }).catch(() => {
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl, '_blank');
  });
}

function shareToInstagram() {
  alert('Your reading has been copied! Open Instagram, create a post or story, and paste your reading. Add #aethera #cosmicprofile');
}


function closeShareModal() {
  document.getElementById('shareOverlay').classList.remove('active');
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