/* ================================================================
   COMPATIBILITY — Compatibility checker
   ================================================================ */

async function checkCompatibility() {
  const name2 = document.getElementById('compat-name').value.trim();
  const bd2 = document.getElementById('compat-birthdate').value;
  if (!name2 || !bd2 || !readingData) {
    alert('Please enter a name and birthdate.');
    return;
  }

  document.getElementById('compatForm').style.display = 'none';
  document.getElementById('compatLoading').style.display = 'block';
  document.getElementById('compatResults').style.display = 'none';

  const body = {
    name1: readingData.name,
    birthdate1: document.getElementById('inp-birthdate').value,
    name2: name2,
    birthdate2: bd2,
    language: currentLang,
  };

  try {
    const res = await fetch('/v1/aethera/compatibility', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error ${res.status}`);
    }
    const data = await res.json();
    renderCompatResults(data);
  } catch (e) {
    alert('Compatibility check failed: ' + e.message);
    resetCompat();
  } finally {
    document.getElementById('compatLoading').style.display = 'none';
  }
}

function renderCompatResults(data) {
  document.getElementById('compatResults').style.display = 'block';

  const score = data.score;
  const circumference = 2 * Math.PI * 68;
  const target = (score / 100) * circumference;
  setTimeout(() => {
    document.getElementById('compatRingPath').setAttribute('stroke-dasharray', `${target} ${circumference}`);
  }, 100);

  let current = 0;
  const scoreEl = document.getElementById('compatScoreNum');
  const step = () => {
    current += Math.ceil(score / 40);
    if (current >= score) { current = score; scoreEl.textContent = current + '%'; return; }
    scoreEl.textContent = current + '%';
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);

  const bd = data.breakdown;
  const breakdownHTML = `
    <div class="div-section" style="padding:16px">
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
          <span style="font-size:.8rem;color:var(--muted)">Element Harmony</span>
          <span style="font-size:.85rem;font-weight:600;color:var(--accent2)">${bd.element_harmony.score}/${bd.element_harmony.max}</span>
        </div>
        <div style="height:4px;background:#1e1e3a;border-radius:2px;overflow:hidden"><div style="height:100%;width:${(bd.element_harmony.score/bd.element_harmony.max)*100}%;background:var(--accent2);border-radius:2px;transition:width 1s ease"></div></div>
        <div style="font-size:.7rem;color:var(--dim);margin-top:2px">${bd.element_harmony.detail}</div>
      </div>
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
          <span style="font-size:.8rem;color:var(--muted)">Life Path Match</span>
          <span style="font-size:.85rem;font-weight:600;color:var(--gold)">${bd.life_path.score}/${bd.life_path.max}</span>
        </div>
        <div style="height:4px;background:#1e1e3a;border-radius:2px;overflow:hidden"><div style="height:100%;width:${(bd.life_path.score/bd.life_path.max)*100}%;background:var(--gold);border-radius:2px;transition:width 1s ease"></div></div>
        <div style="font-size:.7rem;color:var(--dim);margin-top:2px">${bd.life_path.detail}</div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
          <span style="font-size:.8rem;color:var(--muted)">Chinese Zodiac</span>
          <span style="font-size:.85rem;font-weight:600;color:var(--rose)">${bd.chinese_zodiac.score}/${bd.chinese_zodiac.max}</span>
        </div>
        <div style="height:4px;background:#1e1e3a;border-radius:2px;overflow:hidden"><div style="height:100%;width:${(bd.chinese_zodiac.score/bd.chinese_zodiac.max)*100}%;background:var(--rose);border-radius:2px;transition:width 1s ease"></div></div>
        <div style="font-size:.7rem;color:var(--dim);margin-top:2px">${bd.chinese_zodiac.detail}</div>
      </div>
    </div>
  `;
  document.getElementById('compatBreakdown').innerHTML = breakdownHTML;

  const paras = (data.ai_narrative || '').split('\n').filter(p => p.trim()).map(p => `<p style="margin-bottom:12px">${p}</p>`).join('');
  document.getElementById('compatNarrative').innerHTML = paras;

  window._compatData = data;
}

function resetCompat() {
  document.getElementById('compatForm').style.display = 'block';
  document.getElementById('compatResults').style.display = 'none';
  document.getElementById('compatLoading').style.display = 'none';
  document.getElementById('compatScoreNum').textContent = '0%';
  document.getElementById('compatRingPath').setAttribute('stroke-dasharray', '0 428');
}

function shareMatch() {
  const d = window._compatData;
  if (!d) return;
  const text = `${d.person1.name} (${d.person1.sign}) + ${d.person2.name} (${d.person2.sign}) = ${d.score}% cosmic match! Discover yours at aethera.live`;
  if (navigator.share) {
    navigator.share({ title: 'Aethera Cosmic Match', text, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => alert('Match copied to clipboard!'));
  }
}
