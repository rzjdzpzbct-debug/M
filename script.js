// ====== شاشة البداية ======
const intro = document.getElementById('intro');
const home = document.getElementById('home');
const skipBtn = document.getElementById('skip-intro');

function showHome() {
  console.log('✅ الانتقال شغال');
  intro.classList.add('hide');
  skipBtn.classList.add('hide');
  setTimeout(() => {
    intro.style.display = 'none';
    home.classList.remove('hidden');
    requestAnimationFrame(() => home.classList.add('show'));
  }, 800);
}

// زر تخطي يدوي
skipBtn.addEventListener('click', showHome);

// انتظار 3 ثواني بدل 4
setTimeout(showHome, 3000);

// ====== نجوم ======
const canvas = document.getElementById('stars');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 12000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.phase += s.speed;
      const alpha = s.a + Math.sin(s.phase) * 0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 175, 55, ${Math.max(0, alpha)})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

// ====== البطاقات ======
document.querySelectorAll('.path-card').forEach(card => {
  card.addEventListener('click', e => {
    e.preventDefault();
    const path = card.dataset.path;
    console.log('اخترت:', path);
    alert(`🚧 صفحة "${card.querySelector('h3').textContent}" قيد الإنشاء`);
  });
});

console.log('✅ Script loaded successfully');
