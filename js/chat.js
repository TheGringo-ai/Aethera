/* ================================================================
   CHAT — Conversational AI with Aethera
   ================================================================ */

let chatMessages = [];
let chatInitialized = false;

function initChat() {
  if (chatInitialized) return;
  chatInitialized = true;

  const container = document.getElementById('chat-messages');
  if (!container) return;

  // Welcome message
  const name = (userProfile?.name || readingData?.name || 'Traveler').split(' ')[0];
  const div = readingData?.divination;
  let welcome;
  if (div) {
    const sign = div.western_astrology?.sign || '';
    const hdType = div.human_design?.type || '';
    welcome = `Welcome, ${name}. I am your Celestial Guide. I sense the energy of a ${sign}${hdType ? ' ' + hdType : ''} before me. The cosmos has much to reveal — ask me anything about your chart, your design, your transits, or what the stars hold for you.`;
  } else {
    welcome = `Welcome, ${name}. I am your Celestial Guide — here to illuminate your path through the stars. Get a reading first to unlock the full depth of our conversation, or ask me anything about astrology, numerology, or Human Design.`;
  }
  appendChatMessage('aethera', welcome);
  renderSuggestions();
}

function renderSuggestions() {
  const container = document.getElementById('chat-suggestions');
  if (!container) return;

  const suggestions = [];
  const div = readingData?.divination;
  if (div?.human_design) {
    suggestions.push(`What does being a ${div.human_design.type} mean for me?`);
  }
  if (div?.western_astrology?.moon_sign) {
    suggestions.push(`How does my ${div.western_astrology.moon_sign} Moon affect my emotions?`);
  }
  if (div?.numerology?.life_path) {
    suggestions.push(`Tell me about Life Path ${div.numerology.life_path.number}`);
  }
  if (!div) {
    suggestions.push('What is Human Design?', 'Tell me about numerology', 'What can you reveal about me?');
  }
  suggestions.push('What should I focus on today?');

  container.innerHTML = suggestions.map(s =>
    `<button class="chat-chip" onclick="sendChip(this)">${s}</button>`
  ).join('');
}

function sendChip(btn) {
  document.getElementById('chat-input').value = btn.textContent;
  sendChatMessage();
  // Hide suggestions after first use
  const container = document.getElementById('chat-suggestions');
  if (container) container.style.display = 'none';
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;
  if (!currentUser) { showAuthModal('signup'); return; }

  input.value = '';
  appendChatMessage('user', message);

  // Show typing indicator
  const typing = document.getElementById('chat-typing');
  typing.style.display = 'block';
  document.getElementById('chat-send-btn').disabled = true;

  try {
    const body = {
      message: message,
      language: currentLang,
      reading_context: readingData || null,
    };

    const res = await fetch('/v1/aethera/chat', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error ${res.status}`);
    }

    const data = await res.json();
    typing.style.display = 'none';
    document.getElementById('chat-send-btn').disabled = false;
    appendChatMessage('aethera', data.reply);

    // Update suggestion chips if provided
    if (data.suggestions && data.suggestions.length) {
      const container = document.getElementById('chat-suggestions');
      if (container) {
        container.innerHTML = data.suggestions.map(s =>
          `<button class="chat-chip" onclick="sendChip(this)">${s}</button>`
        ).join('');
        container.style.display = 'flex';
      }
    }

  } catch (e) {
    typing.style.display = 'none';
    document.getElementById('chat-send-btn').disabled = false;
    appendChatMessage('aethera', 'The cosmic channels flicker... please try again in a moment.');
  }
}

function appendChatMessage(role, content) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'chat-msg chat-' + role;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble-' + role;
  bubble.textContent = content;

  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;

  chatMessages.push({role, content, timestamp: Date.now()});
}
