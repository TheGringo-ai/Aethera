/* ================================================================
   NAVIGATION — Nav system (navTo, showTab, bottom nav, sub-nav)
   ================================================================ */

const NAV_SECTIONS = {
  home: {
    tabs: [
      {id:'profile', icon:'&#10022;', label:'Profile'},
      {id:'reading', icon:'&#128302;', label:'Reading'},
      {id:'today', icon:'&#9889;', label:'Today'},
    {id:'chat', icon:'&#10024;', label:'Guide'},
    ],
    default: 'profile',
  },
  explore: {
    tabs: [
      {id:'numerology', icon:'&#128290;', label:'Numbers'},
      {id:'astrology', icon:'&#9800;', label:'Stars'},
      {id:'chinese', icon:'&#128009;', label:'Zodiac'},
      {id:'celtic', icon:'&#127795;', label:'Celtic'},
      {id:'mayan', icon:'&#127963;', label:'Mayan'},
      {id:'humandesign', icon:'&#9878;', label:'Design'},
      {id:'aura', icon:'&#128302;', label:'Aura'},
    ],
    default: 'numerology',
  },
  tools: {
    tabs: [
      {id:'dream', icon:'&#127769;', label:'Dreams'},
      {id:'tarot', icon:'&#127183;', label:'Tarot'},
      {id:'palm', icon:'&#9995;', label:'Palm'},
    ],
    default: 'dream',
  },
  social: {
    tabs: [
      {id:'compat', icon:'&#10084;&#65039;', label:'Match'},
      {id:'share', icon:'&#128228;', label:'Share'},
    ],
    default: 'compat',
  },
  me: {
    tabs: [
      {id:'settings', icon:'&#9881;', label:'Settings'},
    ],
    default: 'settings',
  },
};

let currentNav = 'home';

function navTo(section) {
  currentNav = section;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.nav-btn[data-nav="${section}"]`);
  if (btn) btn.classList.add('active');

  const config = NAV_SECTIONS[section];
  const subNav = document.getElementById('subNav');
  const contentArea = document.querySelector('.tab-content-area');
  if (config.tabs.length > 1) {
    subNav.innerHTML = config.tabs.map(t =>
      `<button class="sub-btn" data-sub="${t.id}" onclick="showTab('${t.id}')">${t.icon} ${t.label}</button>`
    ).join('');
    subNav.classList.add('visible');
    if (contentArea) contentArea.classList.remove('no-subnav');
  } else {
    subNav.innerHTML = '';
    subNav.classList.remove('visible');
    if (contentArea) contentArea.classList.add('no-subnav');
  }

  showTab(config.default);
}

function showTab(name) {
  stopReading();
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const pane = document.getElementById('tab-' + name);
  if (pane) pane.classList.add('active');

  document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
  const subBtn = document.querySelector(`.sub-btn[data-sub="${name}"]`);
  if (subBtn) subBtn.classList.add('active');

  window.scrollTo({top: 0, behavior: 'smooth'});

  // Load settings when settings tab is shown
  if (name === 'dream') {
    initDream();
  }
  if (name === 'chat') {
    initChat();
  }
  if (name === 'settings') {
    loadUserSettings();
  }

  if (currentUser) checkProfileCompletion();
}

/* ════════════════════════════════════════════════════════════════
   SCREEN MANAGEMENT
   ════════════════════════════════════════════════════════════════ */
function hideAllScreens() {
  document.getElementById('landing-screen').style.display = 'none';
  document.getElementById('intro-screen').style.display = 'none';
  document.getElementById('welcome-screen').classList.remove('active');
  document.getElementById('results-screen').classList.remove('active');
  document.getElementById('loading-screen').classList.remove('active');
}

function showLandingScreen() {
  document.getElementById('landing-screen').style.display = 'flex';
}

function showFreeTrialForm() {
  // Require account creation — redirect to auth modal
  showAuthModal('signup');
}

function showFullProfileForm() {
  freeTrialMode = false;
  document.getElementById('intro-screen').style.display = '';
  document.querySelectorAll('.full-profile-only').forEach(el => el.style.display = '');
  document.getElementById('submitBtn').textContent = t('cta_reveal') || 'Reveal My Cosmic Profile';
  checkReady();
}

function showWelcomeScreen() {
  const ws = document.getElementById('welcome-screen');
  ws.classList.add('active');
  populateWelcomeScreen();
}

function populateWelcomeScreen() {
  if (!userProfile && !currentUser) return;

  let settingsData = null;
  try { const raw = localStorage.getItem('aethera_settings'); if (raw) settingsData = JSON.parse(raw); } catch(e) {}
  const displayName = (settingsData?.display_name || userProfile?.name || currentUser?.displayName || '').split(' ')[0] || 'Traveler';
  document.getElementById('wb-greeting').innerHTML = 'Welcome back, ' + displayName + ' &#10024;';

  const heroImg = document.querySelector('#welcome-screen .hero-image');
  if (heroImg && settingsData?.avatar) {
    heroImg.innerHTML = '<img src="' + settingsData.avatar + '" alt="Avatar" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #fff2;box-shadow:0 0 40px #7c5bf533,0 0 80px #00d4aa22">';
  }

  const lastReading = userProfile?.last_reading || getLastReading();
  if (lastReading && lastReading.divination) {
    const div = lastReading.divination;
    const astro = div.western_astrology;
    const num = div.numerology;
    const cn = div.chinese_zodiac;

    document.getElementById('wb-signs').textContent =
      astro.symbol + ' ' + astro.sign + ' | Life Path ' + num.life_path.number + ' | ' + cn.element + ' ' + cn.animal;

    document.getElementById('wb-signs-grid').innerHTML = `
      <div class="sign-item"><div class="s-label">Sun Sign</div><div class="s-value">${astro.symbol} ${astro.sign}</div></div>
      <div class="sign-item"><div class="s-label">Life Path</div><div class="s-value">${num.life_path.number}</div></div>
      <div class="sign-item"><div class="s-label">Chinese</div><div class="s-value">${cn.animal}</div></div>
      <div class="sign-item"><div class="s-label">Element</div><div class="s-value">${astro.element}</div></div>
      <div class="sign-item"><div class="s-label">Aura</div><div class="s-value"><div class="aura-dot" style="background:${lastReading.aura_hex};--aura-glow:${lastReading.aura_hex}"></div>${lastReading.aura_color}</div></div>
      <div class="sign-item"><div class="s-label">Celtic</div><div class="s-value">${div.celtic_tree.tree}</div></div>
    `;

    document.getElementById('wb-view-last').style.display = 'block';
  } else {
    document.getElementById('wb-signs').textContent = '';
    document.getElementById('wb-signs-grid').innerHTML = '<p style="color:var(--muted);font-size:.9rem;grid-column:1/-1">Get your first reading to see your cosmic profile</p>';
    document.getElementById('wb-view-last').style.display = 'none';
  }

  const tier = getTierInfo();
  const badgeEl = document.getElementById('wb-tier-badge');
  badgeEl.textContent = tier.tier === 'premium' ? '\u2b50 ' + tier.label : tier.label;
  badgeEl.className = 'wb-tier-badge ' + tier.badge;

  if (tier.tier === 'trial' && tier.daysLeft <= 5) {
    badgeEl.textContent += ' \u2014 Upgrade to keep all features!';
    badgeEl.style.cursor = 'pointer';
    badgeEl.onclick = showUpgradeModal;
  }
}

function getReturnReading() {
  // Gather profile data from ALL sources
  const fsProfile = userProfile || {};
  const localProfile = getProfile() || {};
  const lastReading = fsProfile.last_reading || getLastReading();
  const name = fsProfile.name || localProfile.name || currentUser?.displayName || '';
  let birthdate = fsProfile.birthdate || localProfile.birthdate || '';

  // Recover birthdate from last reading's request data if stored
  if (!birthdate && lastReading && lastReading.birthdate) {
    birthdate = lastReading.birthdate;
  }

  // If signed in and we have both, persist any recovered data and go straight to reading
  if (name && birthdate) {
    // If birthdate was recovered (not in Firestore), save it now
    if (currentUser && !fsProfile.birthdate && birthdate) {
      fbDb.collection('aethera_users').doc(currentUser.uid).update({ birthdate }).catch(() => {});
      if (userProfile) userProfile.birthdate = birthdate;
    }
    // Profile is complete — merge and go straight to reading
    _mergeProfileData(fsProfile, localProfile, name, birthdate);
    getReading(true);
    return;
  }

  // Missing data — but first, save whatever we DO have to Firestore
  // so it's not lost (fixes the empty-Firestore-profile bug)
  if (currentUser && (name || birthdate)) {
    const updates = {};
    if (name && !fsProfile.name) updates.name = name;
    if (birthdate && !fsProfile.birthdate) updates.birthdate = birthdate;
    if (Object.keys(updates).length) {
      fbDb.collection('aethera_users').doc(currentUser.uid).update(updates).catch(() => {});
      if (userProfile) Object.assign(userProfile, updates);
    }
  }

  // Show simplified form
  hideAllScreens();
  document.getElementById('landing-screen').style.display = 'none';
  document.getElementById('intro-screen').style.display = 'flex';
  if (currentUser) {
    document.querySelectorAll('.full-profile-only').forEach(el => el.style.display = 'none');
    document.getElementById('submitBtn').textContent = 'Get My Reading';
  }
  document.getElementById('inp-name').value = name || '';
  document.getElementById('inp-email').value = currentUser?.email || '';
  if (birthdate) document.getElementById('inp-birthdate').value = birthdate;
  const bt = fsProfile.birth_time || localProfile.birth_time || '';
  const loc = fsProfile.location || localProfile.location || '';
  if (bt) document.getElementById('inp-birth-time').value = bt;
  if (loc) document.getElementById('inp-location').value = loc;
  const fa = fsProfile.focus_area || localProfile.focus_area || '';
  if (fa) {
    focusArea = fa;
    document.querySelectorAll('.focus-btn').forEach(b => b.classList.remove('selected'));
    const fb = document.querySelector('.focus-btn[data-focus="' + fa + '"]');
    if (fb) fb.classList.add('selected');
  }
  freeTrialMode = !!currentUser;
  checkReady();
  return;
}

function _mergeProfileData(fsProfile, localProfile, name, birthdate) {
  // Merge best data into userProfile so getReading(true) uses it
  if (userProfile) {
    if (!userProfile.name) userProfile.name = name;
    if (!userProfile.birthdate) userProfile.birthdate = birthdate;
    if (!userProfile.birth_time) userProfile.birth_time = fsProfile.birth_time || localProfile.birth_time || null;
    if (!userProfile.location) userProfile.location = fsProfile.location || localProfile.location || null;
    if (!userProfile.focus_area) userProfile.focus_area = fsProfile.focus_area || localProfile.focus_area || 'purpose';
    if (!userProfile.personality_answers || userProfile.personality_answers.every(a => a === 0)) {
      userProfile.personality_answers = localProfile.personality_answers || [0,0,0,0,0];
    }
    // Sync missing fields to Firestore so they persist
    if (currentUser) {
      fbDb.collection('aethera_users').doc(currentUser.uid).update({
        name: userProfile.name,
        birthdate: userProfile.birthdate,
        birth_time: userProfile.birth_time || null,
        location: userProfile.location || null,
        focus_area: userProfile.focus_area || 'purpose',
      }).catch(() => {});
    }
  }
}

function showLastReading() {
  const lastReading = (userProfile && userProfile.last_reading) || getLastReading();
  if (!lastReading) return;
  readingData = lastReading;
  document.getElementById('welcome-screen').classList.remove('active');
  renderResults(readingData);
  applyFeatureGating();
  document.getElementById('results-screen').classList.add('active');
  if (currentUser) {
    document.getElementById('signupBanner').style.display = 'none';
  }
}

function editProfile() {
  document.getElementById('welcome-screen').classList.remove('active');
  showFullProfileForm();

  const profile = userProfile || getProfile();
  if (profile) {
    document.getElementById('inp-name').value = profile.name || '';
    document.getElementById('inp-email').value = profile.email || currentUser?.email || '';
    document.getElementById('inp-birthdate').value = profile.birthdate || '';
    if (profile.birth_time) {
      document.getElementById('inp-birth-time').value = profile.birth_time;
      document.querySelector('.optional-fields').classList.add('show');
    }
    if (profile.location) {
      document.getElementById('inp-location').value = profile.location;
      document.querySelector('.optional-fields').classList.add('show');
    }
    if (profile.personality_answers) {
      answers = [...profile.personality_answers];
      answers.forEach((val, i) => {
        if (val > 0) {
          const btns = document.querySelectorAll(`.question[data-q="${i}"] button`);
          btns.forEach(b => b.classList.remove('selected'));
          if (btns[val - 1]) btns[val - 1].classList.add('selected');
        }
      });
    }
    if (profile.focus_area) {
      focusArea = profile.focus_area;
      document.querySelectorAll('.focus-btn').forEach(b => b.classList.remove('selected'));
      const fb = document.querySelector(`.focus-btn[data-focus="${focusArea}"]`);
      if (fb) fb.classList.add('selected');
    }
    if (profile.language) {
      currentLang = profile.language;
      buildLangBar();
      applyTranslations();
    }
    checkReady();
  }
}

function newReading() {
  if (!currentUser) { showAuthModal('signup'); return; }
  if (!canDoReading()) { showUpgradeModal(); return; }
  document.getElementById('results-screen').classList.remove('active');
  getReading(true);
}
