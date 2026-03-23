/* ================================================================
   VOICE — TTS (browser + OpenAI), readAloud, stopReading
   ================================================================ */
let _voiceMode = 'browser';
let _readBtnEl = null;
let _currentUtterance = null;
let _currentAudio = null;

function setVoiceMode(mode) {
  _voiceMode = mode;
}

async function readAloud(elementId, btnEl) {
  stopReading();

  const el = document.getElementById(elementId);
  if (!el) return;
  const text = (el.innerText || el.textContent || '').trim();
  if (!text) return;

  _readBtnEl = btnEl || null;
  if (_readBtnEl) { _readBtnEl.classList.add('speaking'); _readBtnEl.innerHTML = '\u23f9 Stop'; }

  if (_voiceMode === 'browser') {
    _readBrowserVoice(text);
  } else {
    await _readOpenAIVoice(text, _voiceMode);
  }
}

function _readBrowserVoice(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 0.9;
  utterance.lang = currentLang === 'zh' ? 'zh-CN' : currentLang === 'pt' ? 'pt-BR' : currentLang;

  const voices = speechSynthesis.getVoices();
  const langPrefix = utterance.lang.substring(0, 2);
  const femaleVoice = voices.find(v => v.lang.startsWith(langPrefix) && /female|woman|samantha|karen|fiona|victoria|zira|hazel/i.test(v.name))
    || voices.find(v => v.lang.startsWith(langPrefix))
    || voices.find(v => v.lang.startsWith('en') && /female|woman|samantha|karen|fiona|victoria|zira|hazel/i.test(v.name));
  if (femaleVoice) utterance.voice = femaleVoice;

  _currentUtterance = utterance;
  utterance.onend = () => { _cleanupReading(); };
  utterance.onerror = () => { _cleanupReading(); };
  speechSynthesis.speak(utterance);
}

async function _readOpenAIVoice(text, voice) {
  try {
    const truncated = text.substring(0, 4000);

    const res = await fetch('/v1/aethera/tts', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ text: truncated, voice: voice }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.detail && err.detail.includes('not configured')) {
        alert('Premium voices require an OpenAI API key. Using free voice.');
        setVoiceMode('browser');
        document.getElementById('voiceSelect').value = 'browser';
        _readBrowserVoice(text);
        return;
      }
      throw new Error(err.detail || 'TTS failed');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    _currentAudio = new Audio(url);
    _currentAudio.onended = () => { _cleanupReading(); URL.revokeObjectURL(url); };
    _currentAudio.onerror = () => { _cleanupReading(); URL.revokeObjectURL(url); };
    _currentAudio.play();
  } catch (e) {
    console.error('OpenAI TTS error:', e);
    _cleanupReading();
    _readBrowserVoice(text);
  }
}

function stopReading() {
  if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  _cleanupReading();
}

function _cleanupReading() {
  if (_readBtnEl) { _readBtnEl.classList.remove('speaking'); _readBtnEl.innerHTML = '\ud83d\udd0a Listen'; }
  _readBtnEl = null;
  _currentUtterance = null;
}

// Preload browser voices
if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = () => {};

function previewVoice() {
  const statusEl = document.getElementById('voicePreviewStatus');
  if (statusEl) statusEl.textContent = 'Playing...';
  const tempId = '_voice_preview_temp';
  let el = document.getElementById(tempId);
  if (!el) {
    el = document.createElement('div');
    el.id = tempId;
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  el.textContent = 'The stars have a message for you. The cosmos aligns in your favor today.';
  readAloud(tempId, null);
  setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 5000);
}
