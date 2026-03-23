/* ================================================================
   PALM — Palm reading upload and rendering
   ================================================================ */

function handlePalmUpload(input) {
  if (!input.files || !input.files[0]) return;
  palmFile = input.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('palmImg').src = e.target.result;
    document.getElementById('palmZone').style.display = 'none';
    document.getElementById('palmPreview').style.display = 'block';
    document.getElementById('palmResults').style.display = 'none';
  };
  reader.readAsDataURL(palmFile);
}

async function analyzePalm() {
  if (!palmFile) return;
  const btn = document.getElementById('palmBtn');
  btn.disabled = true;
  document.getElementById('palmPreview').style.display = 'none';
  document.getElementById('palmLoading').style.display = 'block';

  const formData = new FormData();
  formData.append('image', palmFile);
  formData.append('name', readingData?.name || '');
  formData.append('language', currentLang);

  try {
    const authH = {};
    if (currentUser) try { authH['Authorization'] = 'Bearer ' + await currentUser.getIdToken(); } catch(e) {}
    const res = await fetch('/v1/aethera/palm-reading', {
      method: 'POST',
      headers: authH,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error ${res.status}`);
    }
    const data = await res.json();
    renderPalmResults(data);
  } catch (e) {
    alert('Palm reading failed: ' + e.message);
    document.getElementById('palmPreview').style.display = 'block';
  } finally {
    document.getElementById('palmLoading').style.display = 'none';
    btn.disabled = false;
  }
}

function renderPalmResults(data) {
  const lines = data.line_map || [];
  if (lines.length > 0 && palmFile) {
    const palmImg = document.getElementById('palmImg');
    const container = palmImg.parentElement;

    let canvas = document.getElementById('palmCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'palmCanvas';
      canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;border-radius:16px';
      container.style.position = 'relative';
      container.style.display = 'inline-block';
      container.appendChild(canvas);
    }

    const drawLines = () => {
      const w = palmImg.naturalWidth || palmImg.width;
      const h = palmImg.naturalHeight || palmImg.height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);

      lines.forEach(line => {
        const sx = (line.start_x / 100) * w;
        const sy = (line.start_y / 100) * h;
        const cx = (line.curve_x / 100) * w;
        const cy = (line.curve_y / 100) * h;
        const ex = (line.end_x / 100) * w;
        const ey = (line.end_y / 100) * h;

        ctx.save();
        ctx.shadowColor = line.color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = line.color;
        ctx.lineWidth = Math.max(3, w * 0.006);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.stroke();
        ctx.restore();

        const mx = (sx + 2*cx + ex) / 4;
        const my = (sy + 2*cy + ey) / 4 - w * 0.02;
        ctx.font = `bold ${Math.max(12, w * 0.025)}px Inter, sans-serif`;
        ctx.fillStyle = line.color;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(line.name, mx, my);
        ctx.shadowBlur = 0;
      });
    };

    if (palmImg.complete) drawLines();
    else palmImg.onload = drawLines;
  }

  // Line legend
  let legendHTML = '';
  if (lines.length > 0) {
    legendHTML = '<div style="margin-bottom:16px">';
    lines.forEach(line => {
      legendHTML += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:.85rem">
        <div style="width:20px;height:3px;background:${line.color};border-radius:2px;flex-shrink:0;box-shadow:0 0 6px ${line.color}"></div>
        <strong style="color:${line.color};min-width:80px">${line.name}</strong>
        <span style="color:var(--muted)">${line.description || ''}</span>
      </div>`;
    });
    legendHTML += '</div>';
  }

  // Highlights
  let hlHTML = '';
  (data.highlights || []).forEach(h => {
    hlHTML += `<div class="palm-highlight-item"><div class="phi-dot"></div><div>${h}</div></div>`;
  });
  document.getElementById('palmHighlights').innerHTML = legendHTML + hlHTML;

  // Reading
  const paras = (data.reading || '').split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
  document.getElementById('palmReadingText').innerHTML = paras;

  // Detail
  const analysis = data.palm_analysis || {};
  const keys = Object.keys(analysis);
  if (keys.length) {
    let detailHTML = '';
    keys.forEach(k => {
      detailHTML += `<div class="pd-row"><span class="pd-key">${k.replace(/_/g, ' ')}</span><span>${analysis[k]}</span></div>`;
    });
    document.getElementById('palmDetail').innerHTML = detailHTML;
    document.getElementById('palmDetail').style.display = 'block';
  } else {
    document.getElementById('palmDetail').style.display = 'none';
  }

  document.getElementById('palmResults').style.display = 'block';
}
