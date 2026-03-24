/* ================================================================
   AUTH — Firebase auth, signup, signin, profile management
   Loads LAST because onAuthStateChanged kicks off the app.
   ================================================================ */

function showAuthModal(mode) {
  isAuthMode = mode || 'signup';
  const overlay = document.getElementById('authOverlay');
  const title = document.getElementById('authTitle');
  const submitBtn = document.getElementById('authSubmitBtn');
  const toggle = document.getElementById('authToggle');
  document.getElementById('authError').textContent = '';
  document.getElementById('auth-email').value = '';
  document.getElementById('auth-password').value = '';

  if (isAuthMode === 'signin') {
    title.textContent = 'Sign In';
    submitBtn.textContent = 'Sign In';
    toggle.innerHTML = 'Don\'t have an account? <a onclick="toggleAuthMode()">Create Account</a>';
  } else {
    title.textContent = 'Create Account';
    submitBtn.textContent = 'Create Account';
    toggle.innerHTML = 'Already have an account? <a onclick="toggleAuthMode()">Sign In</a>';
  }
  overlay.classList.add('active');
}

function closeAuthModal() {
  document.getElementById('authOverlay').classList.remove('active');
}

function toggleAuthMode() {
  showAuthModal(isAuthMode === 'signup' ? 'signin' : 'signup');
}

async function googleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    document.getElementById('authError').textContent = '';
    const result = await fbAuth.signInWithPopup(provider);
    closeAuthModal();
  } catch (e) {
    document.getElementById('authError').textContent = e.message;
  }
}

async function emailAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('authError');
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Please enter email and password.';
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters.';
    return;
  }

  const btn = document.getElementById('authSubmitBtn');
  btn.disabled = true;

  try {
    let result;
    if (isAuthMode === 'signup') {
      result = await fbAuth.createUserWithEmailAndPassword(email, password);
    } else {
      result = await fbAuth.signInWithEmailAndPassword(email, password);
    }
    closeAuthModal();
  } catch (e) {
    let msg = e.message;
    if (e.code === 'auth/email-already-in-use') msg = 'This email is already registered. Try signing in.';
    if (e.code === 'auth/wrong-password') msg = 'Incorrect password.';
    if (e.code === 'auth/user-not-found') msg = 'No account found with this email.';
    if (e.code === 'auth/invalid-email') msg = 'Invalid email address.';
    errorEl.textContent = msg;
  } finally {
    btn.disabled = false;
  }
}

async function loadUserProfile(uid) {
  try {
    const doc = await fbDb.collection('aethera_users').doc(uid).get();
    if (doc.exists) {
      userProfile = doc.data();
      // Restore saved language preference
      if (userProfile.language && userProfile.language !== currentLang) {
        currentLang = userProfile.language;
        buildLangBar();
        applyTranslations();
      }
    } else {
      const localProfile = getProfile();
      const localReading = getLastReading();
      userProfile = {
        email: currentUser.email || '',
        name: localProfile?.name || currentUser.displayName || '',
        birthdate: localProfile?.birthdate || '',
        personality_answers: localProfile?.personality_answers || [0,0,0,0,0],
        focus_area: localProfile?.focus_area || '',
        language: localProfile?.language || currentLang,
        created_at: firebase.firestore.Timestamp.now(),
        trial_start: firebase.firestore.Timestamp.now(),
        is_premium: false,
        readings_count: localProfile?.readings_count || 0,
        last_reading: localReading || null,
      };
      await fbDb.collection('aethera_users').doc(uid).set(userProfile);
    }
  } catch (e) {
    console.error('Error loading user profile:', e);
    userProfile = null;
  }
}

async function saveUserProfile(uid, data) {
  try {
    await fbDb.collection('aethera_users').doc(uid).set(data, {merge: true});
    userProfile = {...(userProfile || {}), ...data};
  } catch (e) {
    console.error('Error saving user profile:', e);
  }
}

async function saveReadingToFirestore(uid, reading) {
  try {
    await fbDb.collection('aethera_users').doc(uid).set({
      last_reading: reading,
      readings_count: firebase.firestore.FieldValue.increment(1),
    }, {merge: true});
  } catch (e) {
    console.error('Error saving reading to Firestore:', e);
  }
}

async function signOut() {
  if (!confirm('Sign out of Aethera?')) return;
  try {
    await fbAuth.signOut();
  } catch(e) {
    console.error('Sign out error:', e);
  }
  localStorage.removeItem('aethera_profile');
  localStorage.removeItem('aethera_last_reading');
  localStorage.removeItem('aethera_settings');
  _currentAvatarBase64 = null;
  currentUser = null;
  userProfile = null;
  readingData = null;
}

async function loadFirestoreSettings() {
  if (!currentUser) return;
  try {
    const doc = await fbDb.collection('aethera_users').doc(currentUser.uid).get();
    if (doc.exists) {
      const d = doc.data();
      const settings = {
        display_name: d.settings_display_name || d.name || '',
        bio: d.settings_bio || '',
        avatar: d.settings_avatar || null,
        voice_mode: d.settings_voice_mode || 'browser',
      };
      try {
        localStorage.setItem('aethera_settings', JSON.stringify(settings));
      } catch(e) {}
      if (settings.avatar) _currentAvatarBase64 = settings.avatar;
      if (settings.voice_mode && settings.voice_mode !== 'browser') {
        _voiceMode = settings.voice_mode;
        const vs = document.getElementById('voiceSelect');
        if (vs) vs.value = settings.voice_mode;
      }
      updateTabBarAvatar(settings);
    }
  } catch(e) { console.error('Error loading Firestore settings:', e); }
}

/* ════════════════════════════════════════════════════════════════
   INIT — DOMContentLoaded + onAuthStateChanged
   ════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initStars();
  buildLangBar();
  applyTranslations();
  document.getElementById('inp-name').addEventListener('input', checkReady);
  document.getElementById('inp-email').addEventListener('input', checkReady);
  document.getElementById('inp-birthdate').addEventListener('input', checkReady);

  // Firebase auth state listener — drives the entire UX flow
  fbAuth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      await loadUserProfile(user.uid);
      if (typeof loadFirestoreSettings === 'function') loadFirestoreSettings();
      if (typeof applyFeatureGating === 'function') applyFeatureGating();
      hideAllScreens();
      showWelcomeScreen();
      checkProfileCompletion();
    } else {
      currentUser = null;
      userProfile = null;
      hideAllScreens();
      showLandingScreen();
    }
  });
});
