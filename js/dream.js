/* ================================================================
   DREAM — AI Dream Interpreter powered by cosmic profile
   ================================================================ */

let dreamInitialized = false;

function initDream() {
  if (dreamInitialized) return;
  dreamInitialized = true;
  // Show welcome state
  const container = document.getElementById('dream-results');
  if (container) container.innerHTML = '';
}

async function interpretDream() {
  const textarea = document.getElementById('dream-input');
  const dreamText = textarea.value.trim();
  if (!dreamText) { alert('Please describe your dream first.'); return; }
  if (dreamText.length < 10) { alert('Please provide more detail about your dream.'); return; }
  if (!currentUser) { showAuthModal('signup'); return; }

  const btn = document.getElementById('dream-submit-btn');
  const loading = document.getElementById('dream-loading');
  const results = document.getElementById('dream-results');

  btn.disabled = true;
  loading.style.display = 'block';
  results.innerHTML = '';

  try {
    const body = {
      dream_text: dreamText,
      language: currentLang,
      reading_context: readingData || null,
    };

    const res = await fetch('/v1/aethera/dream', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error ${res.status}`);
    }

    const data = await res.json();
    loading.style.display = 'none';
    btn.disabled = false;
    renderDreamResults(data);

  } catch (e) {
    loading.style.display = 'none';
    btn.disabled = false;
    results.innerHTML = `<div class="div-section" style="text-align:center;padding:24px">
      <p style="color:var(--rose)">The dream realm is veiled: ${e.message}</p>
      <p style="color:var(--muted);font-size:.85rem;margin-top:8px">Please try again in a moment.</p>
    </div>`;
  }
}

function renderDreamResults(data) {
  const results = document.getElementById('dream-results');

  // Dream archetype header
  let html = `
    <div class="div-section dream-archetype-card" style="text-align:center">
      <div style="font-size:2.5rem;margin-bottom:8px">&#127769;</div>
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:2px;color:var(--dim);margin-bottom:6px">Dream Archetype</div>
      <h3 style="font-size:1.6rem;color:var(--gold);margin-bottom:8px">${data.archetype || 'The Vision'}</h3>
    </div>
  `;

  // Interpretation
  const interpParas = (data.interpretation || '').split('\n').filter(p => p.trim()).map(p => '<p>' + p + '</p>').join('');
  html += `
    <div class="div-section">
      <h4 style="color:var(--gold);font-size:1.05rem;margin-bottom:10px">&#128302; Dream Interpretation</h4>
      <button class="read-btn" onclick="readAloud('dream-interp-text',this)">&#128264; Read Aloud</button>
      <div id="dream-interp-text" style="line-height:1.7;font-size:.92rem">${interpParas}</div>
    </div>
  `;

  // Dream symbols
  if (data.symbols && data.symbols.length) {
    html += `<div class="div-section">
      <h4 style="color:var(--gold);font-size:1.05rem;margin-bottom:12px">&#128300; Dream Symbols</h4>
      <div class="dream-symbols-grid">`;
    for (const sym of data.symbols) {
      html += `
        <div class="dream-symbol-card">
          <div class="dream-symbol-name">${sym.symbol || ''}</div>
          <div class="dream-symbol-meaning">${sym.meaning || ''}</div>
          ${sym.cosmic_connection ? '<div class="dream-symbol-cosmic">' + sym.cosmic_connection + '</div>' : ''}
        </div>`;
    }
    html += `</div></div>`;
  }

  // Cosmic connections
  if (data.cosmic_connections) {
    const cosmicParas = data.cosmic_connections.split('\n').filter(p => p.trim()).map(p => '<p>' + p + '</p>').join('');
    html += `
      <div class="div-section">
        <h4 style="color:var(--accent2);font-size:1.05rem;margin-bottom:10px">&#10024; Cosmic Connections</h4>
        <div style="line-height:1.7;font-size:.92rem">${cosmicParas}</div>
      </div>
    `;
  }

  // Guidance
  if (data.guidance) {
    html += `
      <div class="div-section" style="border-color:var(--accent);background:linear-gradient(165deg,var(--card),#0d1a2e)">
        <h4 style="color:var(--accent);font-size:1.05rem;margin-bottom:10px">&#127775; Guidance from the Dream</h4>
        <p style="line-height:1.7;font-size:.92rem;font-family:'Cormorant Garamond',serif;font-size:1.05rem">${data.guidance}</p>
      </div>
    `;
  }

  // Techniques used
  if (data.techniques_used && data.techniques_used.length) {
    html += `
      <div class="div-section" style="text-align:center">
        <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:1.5px;color:var(--dim);margin-bottom:8px">Analysis Techniques Used</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">
          ${data.techniques_used.map(t => '<span class="dream-technique-pill">' + t + '</span>').join('')}
        </div>
      </div>
    `;
  }

  // Share button
  html += `
    <div class="share-reading-bar">
      <button class="share-reading-btn" onclick="shareTabReading('tab-dream', 'My Dream Interpretation')">&#128228; Share This Interpretation</button>
    </div>
  `;

  // New dream button
  html += `
    <div style="text-align:center;margin-top:16px">
      <button class="upgrade-later" onclick="resetDream()">Interpret another dream</button>
    </div>
  `;

  results.innerHTML = html;
  results.scrollIntoView({behavior: 'smooth'});

  // Store dream context for follow-up chat
  window._lastDreamText = document.getElementById('dream-input').value.trim();
  window._lastDreamInterpretation = (data.archetype || '') + '. ' + (data.interpretation || '').substring(0, 200);

  // Show follow-up chat section
  const chatSection = document.getElementById('dream-chat-section');
  if (chatSection) {
    chatSection.style.display = 'block';
    document.getElementById('dream-chat-messages').innerHTML = '';
    appendDreamChat('aethera', 'I\'ve analyzed your dream. Ask me anything — what does a specific symbol mean for you? How does it connect to your life right now? Want to explore a particular part deeper?');
  }
}

function resetDream() {
  document.getElementById('dream-input').value = '';
  document.getElementById('dream-results').innerHTML = '';
  document.getElementById('dream-chat-section').style.display = 'none';
  document.getElementById('dream-chat-messages').innerHTML = '';
  window._lastDreamText = null;
  window._lastDreamInterpretation = null;
  document.getElementById('dream-input').focus();
}

/* ════════════════════════════════════════════════════════════════
   DREAM FOLLOW-UP CHAT — ask questions about the interpretation
   ════════════════════════════════════════════════════════════════ */
async function sendDreamFollowUp() {
  const input = document.getElementById('dream-chat-input');
  const question = input.value.trim();
  if (!question) return;
  if (!currentUser) { showAuthModal('signup'); return; }

  input.value = '';
  appendDreamChat('user', question);

  const typing = document.getElementById('dream-chat-typing');
  typing.style.display = 'block';

  try {
    // Use the chat endpoint with dream context baked in
    const dreamContext = 'The seeker described this dream: "' + (window._lastDreamText || '') +
      '"\n\nYour previous interpretation identified: ' + (window._lastDreamInterpretation || '') +
      '\n\nThe seeker now asks a follow-up question about this dream.';

    const body = {
      message: question + '\n\n[DREAM CONTEXT: ' + dreamContext + ']',
      language: currentLang,
      reading_context: readingData || null,
    };

    const res = await fetch('/v1/aethera/chat', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    typing.style.display = 'none';
    appendDreamChat('aethera', data.reply);

  } catch (e) {
    typing.style.display = 'none';
    appendDreamChat('aethera', 'The dream realm flickers... please try again.');
  }
}

function appendDreamChat(role, content) {
  const container = document.getElementById('dream-chat-messages');
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-msg chat-' + role;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble-' + role;
  bubble.textContent = content;
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}
