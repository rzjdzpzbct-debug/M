// ====== إعدادات ======
const DAILY_LIMIT = 5;
const STORAGE_KEY = 'vc_usage';

// ====== عناصر ======
const panels = document.querySelectorAll('.panel');
const steps = document.querySelectorAll('.step');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const urlInput = document.getElementById('url-input');
const urlBtn = document.getElementById('url-btn');
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

// ====== التنقل بين الخطوات ======
function goToStep(n) {
  panels.forEach(p => p.classList.remove('active'));
  document.getElementById('step-' + n).classList.add('active');
  steps.forEach((s, i) => {
    s.classList.toggle('active', i === n - 1);
    s.classList.toggle('done', i < n - 1);
  });
}

// ====== إدارة الاستخدام اليومي ======
function getUsage() {
  const today = new Date().toISOString().slice(0, 10);
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  if (data.date !== today) {
    return { date: today, used: 0 };
  }
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
  if (left <= 0) {
    usageText.style.color = '#ff5757';
  }
}

function canUse() {
  return getUsage().used < DAILY_LIMIT;
}

// ====== المؤقت التنازلي (منتصف الليل UTC) ======
function tickCountdown() {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  ));
  const diff = midnight - now;
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  countdown.textContent = `${h}:${m}:${s}`;
}
setInterval(tickCountdown, 1000);
tickCountdown();

// ====== اختيار الفيديو ======
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('hover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('hover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('hover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) {
    handleFile(file);
  } else {
    alert('من فضلك اختر ملف فيديو صالح');
  }
});

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  if (!canUse()) {
    alert('⚠️ وصلت الحد اليومي (5 استخدامات). حاول غدًا.');
    return;
  }
  selectedFile = file;
  alert(`✅ تم اختيار: ${file.name}\nالحجم: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  goToStep(2);
}

// ====== رابط البث ======
urlBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) return alert('الرجاء لصق رابط أولاً');
  if (!canUse()) return alert('⚠️ وصلت الحد اليومي.');

  try {
    const res = await fetch(url);
    const blob = await res.blob();
    selectedFile = new File([blob], 'from-url.mp4', { type: blob.type });
    alert('✅ تم تحميل الفيديو من الرابط');
    goToStep(2);
  } catch (err) {
    alert('❌ فشل تحميل الرابط (قد يكون بسبب CORS)');
  }
});

// ====== الضغط بـ FFmpeg.wasm ======
document.querySelectorAll('.option').forEach(btn => {
  btn.addEventListener('click', async () => {
    if (!selectedFile) return alert('لا يوجد فيديو محدد');
    const crf = btn.dataset.crf;
    await compressVideo(selectedFile, crf);
  });
});

async function compressVideo(file, crf) {
  progressWrap.classList.remove('hidden');
  progressBar.style.width = '0%';
  progressText.textContent = 'جاري التحميل...';

  const { FFmpeg } = FFmpegWASM;
  const { fetchFile } = FFmpegUtil;
  const ffmpeg = new FFmpeg();

  ffmpeg.on('progress', ({ progress }) => {
    const pct = Math.round(progress * 100);
    progressBar.style.width = pct + '%';
    progressText.textContent = pct + '%';
  });

  try {
    await ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
    });

    await ffmpeg.writeFile('input.mp4', await fetchFile(file));
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vcodec', 'libx264',
      '-crf', crf,
      '-preset', 'fast',
      'output.mp4'
    ]);
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    compressedUrl = URL.createObjectURL(blob);

    preview.src = compressedUrl;
    downloadLink.href = compressedUrl;

    // حدّث العداد
    const { used } = getUsage();
    saveUsage(used + 1);
    updateUsageUI();

    goToStep(3);
  } catch (err) {
    console.error(err);
    alert('❌ حدث خطأ أثناء الضغط: ' + err.message);
  }
}

// ====== إعادة البدء ======
restartBtn.addEventListener('click', () => {
  selectedFile = null;
  if (compressedUrl) URL.revokeObjectURL(compressedUrl);
  compressedUrl = null;
  fileInput.value = '';
  urlInput.value = '';
  progressWrap.classList.add('hidden');
  goToStep(1);
});

// ====== التهيئة ======
updateUsageUI();
goToStep(1);
