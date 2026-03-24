/* ================================================================
   UTILS — Shared utilities (getProfile, saveProfile, canDoReading, etc.)
   ================================================================ */

async function getAuthHeaders() {
  const headers = {'Content-Type': 'application/json'};
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = 'Bearer ' + token;
    } catch(e) { /* token fetch failed, send without */ }
  }
  return headers;
}

function getProfile() {
  try {
    const raw = localStorage.getItem('aethera_profile');
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function saveProfile(body) {
  const existing = getProfile();
  const profile = {
    name: body.name,
    email: body.email || '',
    birthdate: body.birthdate,
    birth_time: body.birth_time,
    location: body.location,
    personality_answers: body.personality_answers,
    focus_area: body.focus_area,
    language: body.language || currentLang,
    created_at: existing ? existing.created_at : Date.now(),
    trial_start: existing ? existing.trial_start : Date.now(),
    readings_count: existing ? existing.readings_count : 0,
    readings_today: existing ? existing.readings_today : 0,
    last_reading_date: existing ? existing.last_reading_date : null,
    is_premium: existing ? existing.is_premium : false,
  };
  try { localStorage.setItem('aethera_profile', JSON.stringify(profile)); } catch(e) {}

  // Update in-memory userProfile so subsequent checks see the data immediately
  if (userProfile) {
    userProfile.name = profile.name;
    userProfile.birthdate = profile.birthdate;
    userProfile.birth_time = profile.birth_time || null;
    userProfile.location = profile.location || null;
    userProfile.personality_answers = profile.personality_answers;
    userProfile.focus_area = profile.focus_area;
    userProfile.language = profile.language;
    userProfile.email = profile.email || userProfile.email;
  }

  // Sync to Firestore
  if (currentUser) {
    saveUserProfile(currentUser.uid, {
      name: profile.name,
      email: profile.email || currentUser.email,
      birthdate: profile.birthdate,
      birth_time: profile.birth_time || null,
      location: profile.location || null,
      personality_answers: profile.personality_answers,
      focus_area: profile.focus_area,
      language: profile.language,
    });
  }
}

function incrementReadingCount() {
  // Update profile counter
  const profile = getProfile();
  if (!profile) return;
  const today = new Date().toISOString().split('T')[0];
  if (profile.last_reading_date !== today) {
    profile.readings_today = 0;
    profile.last_reading_date = today;
  }
  profile.readings_today++;
  profile.readings_count++;
  try { localStorage.setItem('aethera_profile', JSON.stringify(profile)); } catch(e) {}
}

function canDoReading() {
  // Must be signed in
  if (!currentUser) return false;

  // Signed in
  const profile = userProfile || getProfile();
  if (!profile) return true;
  if (profile.is_premium) return true;

  const today = new Date().toISOString().split('T')[0];
  let readingsToday = profile.readings_today || 0;
  if (profile.last_reading_date !== today) readingsToday = 0;

  let trialStartMs;
  if (profile.trial_start && typeof profile.trial_start.toMillis === 'function') {
    trialStartMs = profile.trial_start.toMillis();
  } else if (profile.trial_start && profile.trial_start.seconds) {
    trialStartMs = profile.trial_start.seconds * 1000;
  } else {
    trialStartMs = profile.trial_start || profile.created_at || Date.now();
  }

  const daysSinceSignup = (Date.now() - trialStartMs) / (1000*60*60*24);
  const inTrial = daysSinceSignup <= 30;
  const maxReadings = inTrial ? 3 : 1;
  return readingsToday < maxReadings;
}

function canAccess(feature) {
  // Not signed in: basic features only
  if (!currentUser) {
    const premiumFeatures = ['compatibility', 'tarot', 'palm', 'premium_voice'];
    return !premiumFeatures.includes(feature);
  }

  const profile = userProfile || getProfile();
  if (!profile) return false;
  if (profile.is_premium) return true;

  let trialStartMs;
  if (profile.trial_start && typeof profile.trial_start.toMillis === 'function') {
    trialStartMs = profile.trial_start.toMillis();
  } else if (profile.trial_start && profile.trial_start.seconds) {
    trialStartMs = profile.trial_start.seconds * 1000;
  } else {
    trialStartMs = profile.trial_start || profile.created_at || Date.now();
  }

  const daysSinceSignup = (Date.now() - trialStartMs) / (1000*60*60*24);
  const inTrial = daysSinceSignup <= 30;
  if (inTrial) return true;

  const premiumFeatures = ['compatibility', 'tarot', 'palm', 'premium_voice'];
  return !premiumFeatures.includes(feature);
}

function getTierInfo() {
  const profile = userProfile || getProfile();
  if (!profile) return {tier:'new', label:'', badge:''};
  if (profile.is_premium) return {tier:'premium', label:'Premium member', badge:'wb-tier-premium'};

  let trialStartMs;
  if (profile.trial_start && typeof profile.trial_start.toMillis === 'function') {
    trialStartMs = profile.trial_start.toMillis();
  } else if (profile.trial_start && profile.trial_start.seconds) {
    trialStartMs = profile.trial_start.seconds * 1000;
  } else {
    trialStartMs = profile.trial_start || profile.created_at || Date.now();
  }

  const daysSinceSignup = (Date.now() - trialStartMs) / (1000*60*60*24);
  const daysLeft = Math.max(0, Math.ceil(30 - daysSinceSignup));

  if (daysLeft > 0) {
    return {tier:'trial', label: daysLeft + ' days left in trial', badge:'wb-tier-trial', daysLeft};
  }

  const today = new Date().toISOString().split('T')[0];
  let used = profile.readings_today || 0;
  if (profile.last_reading_date !== today) used = 0;
  return {tier:'free', label: used + '/1 readings used today', badge:'wb-tier-free'};
}

function getLastReading() {
  try {
    const raw = localStorage.getItem('aethera_last_reading');
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

// checkReturningUser is now handled by Firebase onAuthStateChanged
function checkReturningUser() {
  // Legacy — no longer called directly. Auth state drives the flow.
}

function toggleExpand(i) {
  document.getElementById(`exp-${i}`).classList.toggle('open');
}

function scrollToCard(n) {
  const card = document.getElementById(`card-${n}`);
  if (card) card.scrollIntoView({behavior: 'smooth'});
}

/* ════════════════════════════════════════════════════════════════
   FORM LOGIC
   ════════════════════════════════════════════════════════════════ */
function answer(q, val) {
  answers[q] = val;
  const btns = document.querySelectorAll(`.question[data-q="${q}"] button`);
  btns.forEach(b => b.classList.remove('selected'));
  event.target.classList.add('selected');
  checkReady();
}

function setFocus(area) {
  focusArea = area;
  document.querySelectorAll('.focus-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector(`.focus-btn[data-focus="${area}"]`).classList.add('selected');
  checkReady();
}

function checkReady() {
  const name = document.getElementById('inp-name').value.trim();
  const bd = document.getElementById('inp-birthdate').value;

  if (freeTrialMode) {
    document.getElementById('submitBtn').disabled = !(name && bd && focusArea);
  } else {
    const email = document.getElementById('inp-email').value.trim();
    const allAnswered = answers.every(a => a > 0);
    const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    document.getElementById('submitBtn').disabled = !(name && emailValid && bd && allAnswered && focusArea);
  }
}

/* ════════════════════════════════════════════════════════════════
   UPGRADE MODAL
   ════════════════════════════════════════════════════════════════ */
function showUpgradeModal() {
  const modal = document.getElementById('upgradeModalContent');
  const isSignedIn = !!currentUser;
  const profile = userProfile || getProfile();
  const trialExpired = isSignedIn && profile && !profile.is_premium && (() => {
    let ts = profile.trial_start;
    if (ts && typeof ts.toMillis === 'function') ts = ts.toMillis();
    else if (ts && ts.seconds) ts = ts.seconds * 1000;
    else ts = ts || Date.now();
    return (Date.now() - ts) / (1000*60*60*24) > 30;
  })();

  if (!isSignedIn) {
    modal.innerHTML = `
      <div style="font-size:2.5rem;margin-bottom:12px">&#10024;</div>
      <h2 style="font-size:1.6rem;margin-bottom:16px">Create a Free Account</h2>
      <p style="color:var(--muted);font-size:.9rem;line-height:1.7;margin-bottom:20px;text-align:left">
        Sign up to unlock <strong style="color:var(--gold)">all features free for 30 days</strong> — no credit card needed:
      </p>
      <ul class="upgrade-features" style="margin-bottom:24px">
        <li>&#9889; <strong>3 readings per day</strong></li>
        <li>&#127183; <strong>Tarot card readings</strong></li>
        <li>&#9995; <strong>AI palm reading</strong></li>
        <li>&#10084;&#65039; <strong>Compatibility checker</strong></li>
        <li>&#127911; <strong>Premium AI voices</strong></li>
        <li>&#128302; <strong>Aura photo</strong></li>
      </ul>
      <button class="upgrade-btn" onclick="closeUpgradeModal();showAuthModal('signup')" style="background:linear-gradient(135deg,var(--accent),#9b59b6);margin-bottom:12px">
        Create Free Account
      </button>
      <div style="font-size:.75rem;color:var(--dim);margin-bottom:12px">Free for 30 days &bull; No credit card &bull; Cancel anytime</div>
      <button class="upgrade-later" onclick="closeUpgradeModal();showAuthModal('signin')">Already have an account? Sign in</button>
    `;
  } else if (trialExpired) {
    modal.innerHTML = `
      <div style="font-size:2rem;margin-bottom:8px">&#11088;</div>
      <div style="font-size:.85rem;color:var(--muted);margin-bottom:12px">Your free trial has ended</div>
      <h2>Upgrade to Aethera Premium</h2>
      <div class="upgrade-price">$4.99/month</div>
      <ul class="upgrade-features">
        <li>Unlimited readings every day</li>
        <li>Premium AI voices (Shimmer, Nova, Fable...)</li>
        <li>Compatibility checker</li>
        <li>Tarot card readings</li>
        <li>Palm reading analysis</li>
        <li>Aura photo generation</li>
        <li>Human Design blueprint</li>
      </ul>
      <button class="upgrade-btn" onclick="closeUpgradeModal()" style="opacity:.5;cursor:default">Coming Soon</button>
      <button class="upgrade-later" onclick="closeUpgradeModal()">Stay on free plan</button>
      <div style="font-size:.75rem;color:var(--dim);margin-top:8px">Free plan: 1 basic reading per day</div>
    `;
  } else {
    modal.innerHTML = `
      <div style="font-size:2rem;margin-bottom:8px">&#10024;</div>
      <div style="font-size:.85rem;color:var(--muted);margin-bottom:12px">You've used your readings for today</div>
      <h2 style="font-size:1.4rem">Come back tomorrow</h2>
      <p style="color:var(--muted);font-size:.9rem;margin:16px 0">Your cosmic energy shifts daily — tomorrow's reading will reveal new insights.</p>
      <button class="upgrade-later" onclick="closeUpgradeModal()" style="margin-top:8px">OK</button>
    `;
  }

  document.getElementById('upgradeOverlay').classList.add('active');
}

function closeUpgradeModal() {
  document.getElementById('upgradeOverlay').classList.remove('active');
}

// Close modals on overlay click or ESC key
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'upgradeOverlay') closeUpgradeModal();
  if (e.target && e.target.id === 'authOverlay') closeAuthModal();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (document.getElementById('upgradeOverlay').classList.contains('active')) closeUpgradeModal();
    if (document.getElementById('authOverlay').classList.contains('active')) closeAuthModal();
    const shareOv = document.getElementById('shareOverlay');
    if (shareOv && shareOv.classList.contains('active')) shareOv.classList.remove('active');
  }
});
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'shareOverlay') e.target.classList.remove('active');
});

/* ════════════════════════════════════════════════════════════════
   FEATURE GATING
   ════════════════════════════════════════════════════════════════ */
function applyFeatureGating() {
  const voiceSelect = document.getElementById('voiceSelect');
  if (voiceSelect) {
    const premiumVoices = ['shimmer','nova','fable','onyx','echo','alloy'];
    premiumVoices.forEach(v => {
      const opt = voiceSelect.querySelector(`option[value="${v}"]`);
      if (opt) {
        if (!canAccess('premium_voice')) {
          opt.disabled = true;
          if (!opt.dataset.origText) opt.dataset.origText = opt.textContent;
          opt.textContent = opt.dataset.origText + ' (Premium)';
        } else {
          opt.disabled = false;
          if (opt.dataset.origText) opt.textContent = opt.dataset.origText;
        }
      }
    });
    if (!canAccess('premium_voice') && premiumVoices.includes(voiceSelect.value)) {
      voiceSelect.value = 'browser';
      setVoiceMode('browser');
    }
  }

  gateTab('tab-compat', 'compatibility', 'Cosmic Compatibility', 'Check the cosmic chemistry between two souls');
  gateTab('tab-tarot', 'tarot', 'Tarot Card Readings', 'Draw cards to reveal your past, present, and future');
  gateTab('tab-palm', 'palm', 'Palm Reading', 'AI-powered palmistry analysis of your hand');
}

function gateTab(tabId, feature, title, description) {
  const tab = document.getElementById(tabId);
  if (!tab) return;
  if (!canAccess(feature)) {
    if (!tab.dataset.gatedOriginal) {
      tab.dataset.gatedOriginal = tab.innerHTML;
    }
    const isSignedIn = !!currentUser;
    const ctaText = isSignedIn ? 'Upgrade to Premium' : 'Sign Up Free — 30 Days Unlimited';
    const ctaAction = isSignedIn ? 'showUpgradeModal()' : "showAuthModal('signup')";
    const subText = isSignedIn
      ? '<p style="color:var(--gold);font-size:.85rem;margin-bottom:16px">Available with Aethera Premium — $4.99/month</p>'
      : '<p style="color:var(--accent2);font-size:.85rem;margin-bottom:16px">Create a free account to unlock this for 30 days</p>';
    tab.innerHTML = `
      <div class="premium-gate">
        <div style="font-size:2.5rem;margin-bottom:12px">&#128274;</div>
        <h3>${title}</h3>
        <p>${description}</p>
        ${subText}
        <button class="cta" style="max-width:300px;margin:0 auto" onclick="${ctaAction}">${ctaText}</button>
      </div>
    `;
  } else if (tab.dataset.gatedOriginal) {
    tab.innerHTML = tab.dataset.gatedOriginal;
    delete tab.dataset.gatedOriginal;
  }
}

/* ════════════════════════════════════════════════════════════════
   SIGNUP BANNER
   ════════════════════════════════════════════════════════════════ */
function showSignupBanner() {
  if (currentUser || signupBannerDismissed) return;
  document.getElementById('signupBanner').style.display = 'block';
}

function dismissSignupBanner() {
  signupBannerDismissed = true;
  document.getElementById('signupBanner').style.display = 'none';
}

/* ════════════════════════════════════════════════════════════════
   PROFILE COMPLETION BANNER
   ════════════════════════════════════════════════════════════════ */
let profileBannerDismissed = false;

function checkProfileCompletion() {
  if (!currentUser || profileBannerDismissed) return;
  const profile = userProfile || getProfile() || {};

  const missing = [];
  if (!profile.birth_time) missing.push('birth time');
  if (!profile.location) missing.push('birth location');
  if (!profile.birthdate) missing.push('date of birth');
  if (!profile.name) missing.push('name');

  const banner = document.getElementById('profileBanner');
  if (!banner) return;

  if (missing.length > 0) {
    const sub = document.getElementById('profileBannerSub');
    if (missing.includes('date of birth') || missing.includes('name')) {
      sub.textContent = 'Add your birth details for personalized readings';
    } else if (missing.includes('birth time') && missing.includes('birth location')) {
      sub.textContent = 'Add birth time & location for accurate Human Design & Rising sign';
    } else if (missing.includes('birth time')) {
      sub.textContent = 'Add your birth time for precise Human Design & Ascendant';
    } else {
      sub.textContent = 'Add birth location for accurate Rising sign & transits';
    }
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

function dismissProfileBanner() {
  profileBannerDismissed = true;
  document.getElementById('profileBanner').style.display = 'none';
}

/* ════════════════════════════════════════════════════════════════
   DAILY REMINDER
   ════════════════════════════════════════════════════════════════ */
function requestReminder() {
  const btn = document.getElementById('reminderBtn');
  if ('Notification' in window) {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        btn.innerHTML = '&#10003; Reminder Set';
        btn.style.background = 'var(--accent2)';
        btn.style.color = '#000';
        btn.style.borderColor = 'var(--accent2)';
        new Notification('Aethera', {
          body: 'You\'ll receive your daily cosmic update here.',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="80">\u2728</text></svg>',
        });
      } else {
        btn.innerHTML = '&#128276; Notifications blocked';
        btn.style.opacity = '0.5';
      }
    });
  } else {
    btn.innerHTML = '&#128276; Not supported in this browser';
    btn.style.opacity = '0.5';
  }
}
