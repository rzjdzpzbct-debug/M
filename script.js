// ====== إعدادات ======
const DAILY_LIMIT = 5;
const STORAGE_KEY = 'vc_usage';

// ====== عناصر ======
const panels = document.querySelectorAll('.panel');
const steps = document.querySelectorAll('.step');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const progressWrap = document.getElementById('progress-wrap');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const preview = document.getElementById('preview');
const downloadLink = document.getElementById('download-link');
const restartBtn = document.getElementById('restart');
const usageText = document.getElementById('usage-text');
const countdown = document.getElementById('countdown');

let selectedFile = null;
let compressedUrl = null;

// ====== التنقل ======
function goToStep(n) {
  panels.forEach(p => p.classList.remove('active'));
  document.getElementById('step-' + n).classList.add('active');
  steps.forEach((s, i) => {
    s.classList.toggle('active', i === n - 1);
    s.classList.toggle('done', i < n - 1);
  });
}

// ====== الاستخدام اليومي ======
function getUsage() {
  const today = new Date().toISOString().slice(0, 10);
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  if (data.date !== today) return { date: today, used: 0 };
  return data;
}
function saveUsage(used) {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, used }));
}
function updateUsageUI() {
  const { used } = getUsage();
  const left = DAILY_LIMIT - used;
  usageText.textContent = `FREE ACCESS · ${left} of ${DAILY_LIMIT} uses left today`;
  usageText.style.color = left <= 0 ? '#ff5757' : '#8b95a8';
}
function canUse() { return getUsage().used < DAILY_LIMIT; }

// ====== المؤقت ======
function tickCountdown() {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const diff = midnight - now;
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  countdown.textContent = `${h}:${m}:${s}`;
}
setInterval(tickCountdown, 1000);
tickCountdown();

// ====== اختيار الفيديو ======
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('hover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('hover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('hover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) handleFile(file);
  else alert('من فضلك اختر ملف فيديو صالح');
});
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});
function handleFile(file) {
  if (!canUse()) { alert('⚠️ وصلت الحد اليومي (5 استخدامات).'); return; }
  selectedFile = file;
  goToStep(2);
}

// ====== الضغط بـ MediaRecorder ======
document.querySelectorAll('.option').forEach(btn => {
  btn.addEventListener('click', async () => {
    if (!selectedFile) return alert('لا يوجد فيديو محدد');
    const quality = btn.dataset.quality;
    await compressVideo(selectedFile, quality);
  });
});

async function compressVideo(file, quality) {
  progressWrap.classList.remove('hidden');
  progressBar.style.width = '0%';
  progressText.textContent = 'جاري المعالجة...';

  // إعدادات الجودة
  const settings = {
    high:   { videoBitsPerSecond: 2500000, scale: 1 },
    medium: { videoBitsPerSecond: 1000000, scale: 0.75 },
    low:    { videoBitsPerSecond: 500000,  scale: 0.5 }
  };
  const cfg = settings[quality] || settings.medium;

  try {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    await new Promise(res => { video.onloadedmetadata = res; });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth * cfg.scale;
    canvas.height = video.videoHeight * cfg.scale;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: cfg.videoBitsPerSecond
    });

    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      compressedUrl = URL.createObjectURL(blob);
      preview.src = compressedUrl;
      downloadLink.href = compressedUrl;

      const { used } = getUsage();
      saveUsage(used + 1);
      updateUsageUI();
      goToStep(3);
    };

    recorder.start();
    video.play();

    const draw = () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pct = Math.round((video.currentTime / video.duration) * 100);
      progressBar.style.width = pct + '%';
      progressText.textContent = pct + '%';
      requestAnimationFrame(draw);
    };
    draw();

    video.onended = () => {
      recorder.stop();
    };
  } catch (err) {
    console.error(err);
    alert('❌ خطأ: ' + err.message);
  }
}

// ====== إعادة ======
restartBtn.addEventListener('click', () => {
  selectedFile = null;
  if (compressedUrl) URL.revokeObjectURL(compressedUrl);
  compressedUrl = null;
  fileInput.value = '';
  progressWrap.classList.add('hidden');
  goToStep(1);
});

updateUsageUI();
goToStep(1);
