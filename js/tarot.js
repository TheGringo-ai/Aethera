/* ================================================================
   TAROT — Tarot card drawing and rendering
   ================================================================ */
const _SUIT_ICONS = {
  'Major Arcana': '\u2726',
  'Wands': '\u2662',
  'Cups': '\u2661',
  'Swords': '\u2660',
  'Pentacles': '\u2b50',
};

async function drawTarot() {
  const drawBtn = document.getElementById('tarotDrawBtn');
  const loading = document.getElementById('tarotLoading');
  const results = document.getElementById('tarotResults');
  const initial = document.getElementById('tarotInitial');

  initial.style.display = 'none';
  results.style.display = 'none';
  loading.style.display = 'block';

  const params = new URLSearchParams({
    name: readingData?.name || '',
    focus_area: focusArea || 'purpose',
    language: currentLang,
  });

  try {
    const authH = {};
    if (currentUser) try { authH['Authorization'] = 'Bearer ' + await currentUser.getIdToken(); } catch(e) {}
    const res = await fetch('/v1/aethera/tarot?' + params.toString(), {
      method: 'POST',
      headers: authH,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error ${res.status}`);
    }
    const data = await res.json();
    loading.style.display = 'none';
    renderTarotCards(data);
    results.style.display = 'block';
  } catch (e) {
    loading.style.display = 'none';
    initial.style.display = 'block';
    alert('Tarot reading failed: ' + e.message);
  }
}

function renderTarotCards(data) {
  const spreadEl = document.getElementById('tarotSpread');
  const interpEl = document.getElementById('tarotInterpretation');

  let cardsHTML = '';
  (data.cards || []).forEach((card, i) => {
    const isRev = card.is_reversed;
    const suitIcon = _SUIT_ICONS[card.suit] || '\u2726';
    const badgeClass = isRev ? 'reversed' : 'upright';
    const badgeText = isRev ? 'Reversed' : 'Upright';
    const reversedClass = isRev ? ' is-reversed' : '';

    const cardSlug = card.name.toLowerCase().replace(/\s+/g, '-');
    const imgUrl = `/v1/aethera/assets/${cardSlug}.jpg`;

    cardsHTML += `
      <div class="tarot-card${reversedClass}" id="tarot-card-${i}" style="opacity:0;transform:translateY(20px)">
        <div class="tarot-card-inner">
          <div class="tarot-card-face tarot-card-back">
            <div class="tcb-pattern"></div>
            <div class="tcb-pattern"></div>
            <div class="tcb-symbol">\u2728</div>
          </div>
          <div class="tarot-card-face tarot-card-front" id="tcf-${i}">
            <div class="tcf-position">${card.position}</div>
            <div class="tcf-name">${card.name}</div>
            <div class="tcf-suit-icon">${suitIcon}</div>
            <div class="tcf-suit">${card.suit}</div>
            <div class="tcf-badge ${badgeClass}">${badgeText}</div>
          </div>
        </div>
      </div>`;

    const testImg = new Image();
    testImg.onload = function() {
      const front = document.getElementById('tcf-' + i);
      if (front) {
        front.style.backgroundImage = 'url(' + imgUrl + ')';
        front.style.backgroundSize = 'cover';
        front.style.backgroundPosition = 'center';
        front.querySelector('.tcf-suit-icon').style.display = 'none';
        front.querySelector('.tcf-name').style.textShadow = '0 2px 8px rgba(0,0,0,.8)';
        front.querySelector('.tcf-position').style.textShadow = '0 2px 8px rgba(0,0,0,.8)';
      }
    };
    testImg.src = imgUrl;
  });
  spreadEl.innerHTML = cardsHTML;

  // Sequential reveal animation
  (data.cards || []).forEach((card, i) => {
    const cardEl = document.getElementById(`tarot-card-${i}`);
    setTimeout(() => {
      cardEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      cardEl.style.opacity = '1';
      cardEl.style.transform = 'translateY(0)';
    }, i * 600);
    setTimeout(() => {
      cardEl.classList.add('flipped');
    }, i * 600 + 400);
  });

  // Show interpretation after all cards flip
  const totalDelay = (data.cards || []).length * 600 + 800;
  setTimeout(() => {
    const paras = (data.interpretation || '').split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
    interpEl.innerHTML = `<button class="read-btn" onclick="readAloud('tarot-interp-text',this)">\ud83d\udd0a Read Aloud</button><div class="reading-text" id="tarot-interp-text">${paras}</div>`;
    interpEl.style.opacity = '0';
    interpEl.style.transition = 'opacity 0.8s ease';
    requestAnimationFrame(() => { interpEl.style.opacity = '1'; });
  }, totalDelay);
}