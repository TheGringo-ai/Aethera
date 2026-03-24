/* ================================================================
   SETTINGS — User settings, avatar, profile persistence
   ================================================================ */

/* ════════════════════════════════════════════════════════════════
   COSMIC PROFILE — birth data for accurate readings
   ════════════════════════════════════════════════════════════════ */
function loadCosmicProfile() {
  const profile = userProfile || getProfile() || {};

  const nameEl = document.getElementById('settings-fullname');
  const bdEl = document.getElementById('settings-birthdate');
  const btEl = document.getElementById('settings-birthtime');
  const locEl = document.getElementById('settings-location');
  const focusEl = document.getElementById('settings-focus');

  if (nameEl) nameEl.value = profile.name || currentUser?.displayName || '';
  if (bdEl) bdEl.value = profile.birthdate || '';
  if (btEl) btEl.value = profile.birth_time || '';
  if (locEl) locEl.value = profile.location || '';
  if (focusEl) focusEl.value = profile.focus_area || 'purpose';

  // Load social links
  const igEl = document.getElementById('settings-instagram');
  const ttEl = document.getElementById('settings-tiktok');
  const twEl = document.getElementById('settings-twitter');
  const fbEl = document.getElementById('settings-facebook');
  if (igEl) igEl.value = profile.settings_social_instagram || '';
  if (ttEl) ttEl.value = profile.settings_social_tiktok || '';
  if (twEl) twEl.value = profile.settings_social_twitter || '';
  if (fbEl) fbEl.value = profile.settings_social_facebook || '';
}

function saveCosmicProfile() {
  const name = (document.getElementById('settings-fullname').value || '').trim();
  const birthdate = document.getElementById('settings-birthdate').value;
  const birth_time = document.getElementById('settings-birthtime').value || null;
  const location = (document.getElementById('settings-location').value || '').trim() || null;
  const focus_area = document.getElementById('settings-focus').value || 'purpose';
  const instagram = (document.getElementById('settings-instagram').value || '').trim();
  const tiktok = (document.getElementById('settings-tiktok').value || '').trim();
  const twitter = (document.getElementById('settings-twitter').value || '').trim();
  const facebook = (document.getElementById('settings-facebook').value || '').trim();

  if (!name || !birthdate) {
    alert('Please enter your name and date of birth.');
    return;
  }

  // Save to localStorage profile
  const existing = getProfile() || {};
  const profile = {
    ...existing,
    name,
    birthdate,
    birth_time,
    location,
    focus_area,
  };
  try { localStorage.setItem('aethera_profile', JSON.stringify(profile)); } catch(e) {}

  // Save to Firestore
  if (currentUser) {
    fbDb.collection('aethera_users').doc(currentUser.uid).update({
      name,
      birthdate,
      birth_time: birth_time || null,
      location: location || null,
      focus_area,
      settings_social_instagram: instagram,
      settings_social_tiktok: tiktok,
      settings_social_twitter: twitter,
      settings_social_facebook: facebook,
    }).catch(e => console.error('Cosmic profile save error:', e));

    // Update in-memory profile
    if (userProfile) {
      userProfile.name = name;
      userProfile.birthdate = birthdate;
      userProfile.birth_time = birth_time;
      userProfile.location = location;
      userProfile.focus_area = focus_area;
    }
  }

  // Also sync the display name if empty
  const displayNameEl = document.getElementById('settings-name');
  if (displayNameEl && !displayNameEl.value.trim()) {
    displayNameEl.value = name;
  }

  const msg = document.getElementById('cosmicSavedMsg');
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 3000);

  checkProfileCompletion();
}

/* ════════════════════════════════════════════════════════════════
   DISPLAY SETTINGS — avatar, name, bio, socials
   ════════════════════════════════════════════════════════════════ */
function loadUserSettings() {
  let settings = null;
  try {
    const raw = localStorage.getItem('aethera_settings');
    if (raw) settings = JSON.parse(raw);
  } catch(e) {}

  if (!settings) settings = {};

  if (settings.voice_mode) {
    _voiceMode = settings.voice_mode;
    const vs = document.getElementById('voiceSelect');
    if (vs) vs.value = settings.voice_mode;
  }

  const nameEl = document.getElementById('settings-name');
  const bioEl = document.getElementById('settings-bio');
  if (nameEl) nameEl.value = settings.display_name || (userProfile?.name || currentUser?.displayName || '');
  if (bioEl) { bioEl.value = settings.bio || ''; updateBioCount(); }

  if (settings.avatar) {
    showAvatarImage(settings.avatar);
  } else {
    const name = settings.display_name || userProfile?.name || currentUser?.displayName || '';
    showAvatarLetter(name);
  }

  updateTabBarAvatar(settings);
  loadCosmicProfile();
  populateAccountSection();
}

function saveUserSettings() {
  const settings = {
    display_name: (document.getElementById('settings-name').value || '').trim(),
    bio: (document.getElementById('settings-bio').value || '').trim(),
    avatar: _currentAvatarBase64 || null,
    voice_mode: _voiceMode,
  };
  try {
    localStorage.setItem('aethera_settings', JSON.stringify(settings));
  } catch(e) {}

  if (currentUser) {
    fbDb.collection('aethera_users').doc(currentUser.uid).update({
      settings_display_name: settings.display_name,
      settings_bio: settings.bio,
      settings_avatar: settings.avatar,
      settings_voice_mode: settings.voice_mode,
    }).catch(e => console.error('Settings save error:', e));
  }

  updateTabBarAvatar(settings);

  const msg = document.getElementById('settingsSavedMsg');
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 2500);
}

function handleAvatarUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    compressAvatar(e.target.result, function(compressed) {
      _currentAvatarBase64 = compressed;
      showAvatarImage(compressed);
      updateTabBarAvatar({ avatar: compressed, display_name: document.getElementById('settings-name').value });
    });
  };
  reader.readAsDataURL(file);
}

function compressAvatar(dataUrl, callback) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    const size = Math.min(img.width, img.height);
    const sx = (img.width - size) / 2;
    const sy = (img.height - size) / 2;
    ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
    const compressed = canvas.toDataURL('image/jpeg', 0.7);
    callback(compressed);
  };
  img.src = dataUrl;
}

function showAvatarImage(src) {
  const circle = document.getElementById('settingsAvatar');
  circle.innerHTML = '<img src="' + src + '" alt="Avatar">';
}

function showAvatarLetter(name) {
  const letter = (name || '?').charAt(0).toUpperCase();
  const el = document.getElementById('settingsAvatarLetter');
  if (el) el.textContent = letter;
  const circle = document.getElementById('settingsAvatar');
  if (circle && !circle.querySelector('img')) {
    circle.innerHTML = '<div class="avatar-letter">' + letter + '</div>';
  }
}

function updateTabBarAvatar(settings) {
  const container = document.getElementById('tabBarAvatar');
  if (!container) return;
  if (settings && settings.avatar) {
    container.innerHTML = '<img src="' + settings.avatar + '" alt="">';
    container.style.display = 'flex';
  } else {
    const name = (settings && settings.display_name) || userProfile?.name || currentUser?.displayName || '';
    if (name) {
      const letter = name.charAt(0).toUpperCase();
      container.innerHTML = '<div class="tba-letter">' + letter + '</div>';
      container.style.display = 'flex';
    } else {
      container.style.display = 'none';
    }
  }
}

function updateBioCount() {
  const bio = document.getElementById('settings-bio');
  const count = document.getElementById('bioCharCount');
  if (bio && count) count.textContent = (bio.value || '').length + '/150';
}

function populateAccountSection() {
  const el = document.getElementById('settingsAccountContent');
  if (!el) return;

  if (currentUser) {
    const profile = userProfile || {};
    const tier = getTierInfo();
    let planText = 'Free';
    if (tier.tier === 'premium') planText = 'Premium';
    else if (tier.tier === 'trial') planText = 'Trial (' + (tier.daysLeft || 0) + ' days remaining)';

    let createdDate = 'Unknown';
    if (profile.created_at) {
      let ts;
      if (typeof profile.created_at.toMillis === 'function') ts = profile.created_at.toMillis();
      else if (profile.created_at.seconds) ts = profile.created_at.seconds * 1000;
      else ts = profile.created_at;
      createdDate = new Date(ts).toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'});
    }

    el.innerHTML = `
      <div class="settings-account-info">
        <div>Email: <strong>${currentUser.email || 'N/A'}</strong></div>
        <div>Member since: <strong>${createdDate}</strong></div>
        <div>Plan: <strong>${planText}</strong></div>
      </div>
      <div style="margin-top:12px;font-size:.8rem;color:var(--accent2)">All features free during beta</div>
      <button class="settings-btn-danger" style="margin-top:12px" onclick="signOut()">Sign Out</button>
    `;
  } else {
    el.innerHTML = `
      <p style="color:var(--muted);font-size:.9rem;margin-bottom:16px">Create an account to save your profile across devices</p>
      <button class="settings-btn" onclick="showAuthModal('signup')">Create Account</button>
      <button class="settings-btn-secondary" style="margin-top:8px" onclick="showAuthModal('signin')">Sign In</button>
    `;
  }
}

/* ════════════════════════════════════════════════════════════════
   VOICE PERSISTENCE (wraps setVoiceMode)
   ════════════════════════════════════════════════════════════════ */
(function() {
  const _origSetVoiceMode = setVoiceMode;
  setVoiceMode = function(mode) {
    _origSetVoiceMode(mode);
    try {
      const raw = localStorage.getItem('aethera_settings');
      const settings = raw ? JSON.parse(raw) : {};
      settings.voice_mode = mode;
      localStorage.setItem('aethera_settings', JSON.stringify(settings));
    } catch(e) {}
  };
})();

/* ════════════════════════════════════════════════════════════════
   LOAD SETTINGS ON STARTUP
   ════════════════════════════════════════════════════════════════ */
(function() {
  try {
    const raw = localStorage.getItem('aethera_settings');
    if (raw) {
      const s = JSON.parse(raw);
      if (s.voice_mode) {
        _voiceMode = s.voice_mode;
        const vs = document.getElementById('voiceSelect');
        if (vs) vs.value = s.voice_mode;
      }
      if (s.avatar || s.display_name) {
        updateTabBarAvatar(s);
      }
      _currentAvatarBase64 = s.avatar || null;
    }
  } catch(e) {}
})();
