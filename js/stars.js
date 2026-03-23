/* ================================================================
   STARS — Animated star canvas background
   ================================================================ */
function initStars() {
  const canvas = document.getElementById('stars-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  const COUNT = 120;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.01,
      dy: Math.random() * 0.15 + 0.02,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.a += s.da;
      if (s.a > 1 || s.a < 0.1) s.da *= -1;
      s.y += s.dy;
      if (s.y > canvas.height + 5) { s.y = -5; s.x = Math.random() * canvas.width; }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.a * 0.6})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}
