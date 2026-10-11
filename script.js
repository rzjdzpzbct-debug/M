const reciterMap = {
  "Abdul_Basit_Murattal_64kbps": "https://everyayah.com/data/Abdul_Basit_Murattal_64kbps",
  "Mishary_Alafasy_128kbps": "https://everyayah.com/data/Mishary_Alafasy_128kbps",
  "AbdulSamad_64kbps_Rawat": "https://everyayah.com/data/AbdulSamad_64kbps_Rawat"
};

const quranApi = "https://api.alquran.cloud/v1";

let surahList = [];
let currentSurahIndex = 0;
let currentAyahIndex = 0;
let isPlaying = false;

const DOM = {
  surahList: document.getElementById('surahList'),
  sidebarSearch: document.getElementById('sidebarSearch'),
  studyName: document.getElementById('studyName'),
  verseArabic: document.getElementById('verseArabic'),
  verseEnglish: document.getElementById('verseEnglish'),
  ayahBadge: document.getElementById('ayahBadge'),
  playerTitle: document.getElementById('playerTitle'),
  playerTime: document.getElementById('playerTime'),
  ayahSelect: document.getElementById('ayahSelect'),
  reciterSelect: document.getElementById('reciterSelect'),
  audioPlayer: document.getElementById('audioPlayer'),
  playBtn: document.getElementById('playBtn'),
  prevAyahBtn: document.getElementById('prevAyahBtn'),
  nextAyahBtn: document.getElementById('nextAyahBtn'),
  prevSurahBtn: document.getElementById('prevSurahBtn'),
  nextSurahBtn: document.getElementById('nextSurahBtn'),
  volumeSlider: document.getElementById('volumeSlider')
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatTime(sec) {
  if (!sec || Number.isNaN(sec)) return '00:00';
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${pad(minutes)}:${pad(seconds)}`;
}

function renderSurahList(filter = '') {
  const normalized = filter.trim().toLowerCase();
  const list = surahList.filter((surah) => {
    return !normalized || surah.name.toLowerCase().includes(normalized) || surah.englishName.toLowerCase().includes(normalized);
  });

  DOM.surahList.innerHTML = list.map((surah, idx) => {
    const realIndex = surahList.findIndex((item) => item.number === surah.number);
    const active = realIndex === currentSurahIndex ? 'active' : '';
    return `
      <button class="surah-item ${active}" data-index="${realIndex}" type="button">
        <span class="surah-item-name">${surah.name}</span>
        <span class="surah-item-count">${surah.number}</span>
      </button>
    `;
  }).join('');

  DOM.surahList.querySelectorAll('.surah-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index);
      loadSurah(index);
    });
  });
}

async function fetchSurahList() {
  try {
    const response = await fetch(`${quranApi}/surah`);
    const result = await response.json();
    surahList = result.data;
    renderSurahList();
    await loadSurah(0);
  } catch (error) {
    console.error('خطأ في جلب قائمة السور:', error);
  }
}

async function loadSurah(index) {
  currentSurahIndex = index;
  const surah = surahList[index];
  if (!surah) return;

  DOM.studyName.textContent = surah.name;
  DOM.playerTitle.textContent = surah.name;
  DOM.ayahBadge.textContent = `آية 1`;

  try {
    const [surahRes, transRes] = await Promise.all([
      fetch(`${quranApi}/surah/${surah.number}`),
      fetch(`${quranApi}/surah/${surah.number}/en.asad`)
    ]);

    const surahData = await surahRes.json();
    const transData = await transRes.json();

    const ayahs = surahData.data.ayahs;
    const translations = transData.data.ayahs;
    currentAyahIndex = 0;

    populateAyahSelect(ayahs.length);
    renderCurrentAyah(ayahs, translations);
    updateAudioSource(surah.number, currentReciter);
    renderSurahList();
  } catch (error) {
    console.error('خطأ في جلب محتوى السورة:', error);
  }
}

function populateAyahSelect(count) {
  DOM.ayahSelect.innerHTML = Array.from({ length: count }, (_, idx) => {
    return `<option value="${idx}">آية ${idx + 1}</option>`;
  }).join('');
  DOM.ayahSelect.value = String(currentAyahIndex);
}

function renderCurrentAyah(ayahs, translations) {
  const ayah = ayahs[currentAyahIndex];
  const translation = translations[currentAyahIndex];

  if (!ayah || !translation) return;

  DOM.verseArabic.textContent = ayah.text;
  DOM.verseEnglish.textContent = translation.text;
  DOM.ayahBadge.textContent = `آية ${ayah.numberInSurah}`;
  DOM.ayahSelect.value = String(currentAyahIndex);
}

function updateAudioSource(surahNumber, reciterKey) {
  const base = reciterMap[reciterKey];
  const number = String(surahNumber).padStart(3, '0');
  const audioUrl = `${base}/${number}.mp3`;
  DOM.audioPlayer.src = audioUrl;
  DOM.audioPlayer.load();
  DOM.playerTime.textContent = '00:00 / 00:00';
  if (isPlaying) {
    DOM.audioPlayer.play();
  }
}

function changeAyah(step) {
  const surah = surahList[currentSurahIndex];
  if (!surah) return;

  const maxIndex = surah.numberOfAyahs - 1;
  currentAyahIndex = Math.min(Math.max(currentAyahIndex + step, 0), maxIndex);
  DOM.ayahSelect.value = String(currentAyahIndex);

  // re-fetch current surah ayah data from API to reflect selection; lightweight but okay
  loadSurah(currentSurahIndex);
}

DOM.sidebarSearch.addEventListener('input', (e) => renderSurahList(e.target.value));

DOM.ayahSelect.addEventListener('change', (e) => {
  currentAyahIndex = Number(e.target.value);
  const surah = surahList[currentSurahIndex];
  fetch(`${quranApi}/surah/${surah.number}`)
    .then(res => res.json())
    .then(data => {
      const ayahs = data.data.ayahs;
      fetch(`${quranApi}/surah/${surah.number}/en.asad`)
        .then(res2 => res2.json())
        .then(data2 => {
          renderCurrentAyah(ayahs, data2.data.ayahs);
        });
    });
});

DOM.prevAyahBtn.addEventListener('click', () => changeAyah(-1));
DOM.nextAyahBtn.addEventListener('click', () => changeAyah(1));

DOM.prevSurahBtn.addEventListener('click', () => {
  if (currentSurahIndex > 0) loadSurah(currentSurahIndex - 1);
});

DOM.nextSurahBtn.addEventListener('click', () => {
  if (currentSurahIndex < surahList.length - 1) loadSurah(currentSurahIndex + 1);
});

DOM.playBtn.addEventListener('click', () => {
  if (DOM.audioPlayer.paused) {
    DOM.audioPlayer.play();
    isPlaying = true;
    DOM.playBtn.textContent = '⏸';
  } else {
    DOM.audioPlayer.pause();
    isPlaying = false;
    DOM.playBtn.textContent = '▶';
  }
});

DOM.reciterSelect.addEventListener('change', (e) => {
  const selected = e.target.value;
  updateAudioSource(surahList[currentSurahIndex].number, selected);
  if (isPlaying) DOM.audioPlayer.play();
});

DOM.volumeSlider.addEventListener('input', (e) => {
  DOM.audioPlayer.volume = Number(e.target.value) / 100;
});

DOM.audioPlayer.addEventListener('timeupdate', () => {
  const current = formatTime(DOM.audioPlayer.currentTime);
  const total = formatTime(DOM.audioPlayer.duration || 0);
  DOM.playerTime.textContent = `${current} / ${total}`;
});

DOM.audioPlayer.addEventListener('ended', () => {
  const currentSurah = surahList[currentSurahIndex];
  if (currentAyahIndex < currentSurah.numberOfAyhs - 1) {
    currentAyahIndex += 1;
    loadSurah(currentSurahIndex);
  }
});

fetchSurahList();
