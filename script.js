const surahSearch = document.getElementById('surahSearch');
const surahList = document.getElementById('surahList');
const ayahSelect = document.getElementById('ayahSelect');
const ayahText = document.getElementById('ayahText');
const ayahTranslation = document.getElementById('ayahTranslation');
const ayahNumberTag = document.getElementById('ayahNumberTag');
const selectedSurahBadge = document.getElementById('selectedSurahBadge');
const studyTitle = document.getElementById('studyTitle');
const studyVerse = document.getElementById('studyVerse');
const studyMeter = document.getElementById('studyMeter');
const playerTitle = document.getElementById('playerTitle');
const reciterSelect = document.getElementById('reciterSelect');
const audioPlayer = document.getElementById('audioPlayer');
const playerTime = document.getElementById('playerTime');
const playBtn = document.getElementById('playBtn');
const playToggle = document.getElementById('playToggle');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let surahs = [];
let currentSurahIndex = 0;
let currentAyahIndex = 0;
let currentAudioSources = [];
let currentReciter = reciterSelect.value;

const audioReciters = {
  Abdul_Basit_Murattal_64kbps: [
    'https://everyayah.com/data/Abdul_Basit_Murattal_64kbps/{num}.mp3',
    'https://server8.mp3quran.net/afs/{num}.mp3'
  ],
  Mishary_Alafasy_128kbps: [
    'https://everyayah.com/data/Mishary_Alafasy_128kbps/{num}.mp3',
    'https://server8.mp3quran.net/mishaari/ {num}.mp3'.replace(' ', '')
  ]
};

function padNumber(number) {
  return String(number).padStart(3, '0');
}

function formatSurahName(name) {
  return name.replace(/\s*\([^\)]*\)/g, '');
}

async function fetchSurahs() {
  try {
    const response = await fetch('https://api.alquran.cloud/v1/surah');
    if (!response.ok) throw new Error('Failed to fetch surah list');
    const result = await response.json();
    surahs = result.data;
    renderSurahList();
    setCurrentSurah(0);
  } catch (error) {
    console.error(error);
    surahList.innerHTML = '<div class="surah-item"><span>تعذر تحميل السور. حاول لاحقًا.</span></div>';
  }
}

function renderSurahList() {
  const query = surahSearch.value.trim().toLowerCase();
  const filtered = surahs.filter((surah) => {
    const name = `${surah.englishName} ${surah.name}`.toLowerCase();
    return !query || name.includes(query);
  });

  surahList.innerHTML = filtered
    .map((surah, index) => {
      const realIndex = surahs.findIndex((item) => item.number === surah.number);
      const active = realIndex === currentSurahIndex ? 'active' : '';
      return `
        <button class="surah-item ${active}" type="button" data-index="${realIndex}">
          <span class="surah-name">
            <span class="surah-index">${surah.number}</span>
            <span>${formatSurahName(surah.name)}</span>
          </span>
          <span class="surah-en">${surah.englishName}</span>
        </button>
      `;
    })
    .join('');

  document.querySelectorAll('.surah-item').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      setCurrentSurah(index);
    });
  });
}

async function setCurrentSurah(index) {
  currentSurahIndex = index;
  currentAyahIndex = 0;
  const surah = surahs[index];

  if (!surah) return;

  selectedSurahBadge.textContent = surah.englishName;
  studyTitle.textContent = surah.name;
  studyVerse.textContent = `${surah.numberOfAyahs} آية`;
  studyMeter.textContent = `${surah.revelationType}`;
  playerTitle.textContent = surah.name;

  renderSurahList();

  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`);
    const result = await response.json();

    const surahData = result.data;
    const englishResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/en.asad`);
    const englishResult = await englishResponse.json();
    const englishData = englishResult.data;

    surah.ayahs = surahData.ayahs;
    surah.englishAyahs = englishData.ayahs;

    populateAyahList();
    renderCurrentAyah();
    setSurahAudio();
  } catch (error) {
    console.error(error);
  }
}

function populateAyahList() {
  const surah = surahs[currentSurahIndex];
  const options = surah.ayahs
    .map((ayah, idx) => `<option value="${idx}">${ayah.numberInSurah}</option>`)
    .join('');

  ayahSelect.innerHTML = options;
  ayahSelect.value = String(currentAyahIndex);
}

function renderCurrentAyah() {
  const surah = surahs[currentSurahIndex];
  const ayah = surah.ayahs[currentAyahIndex];
  const translation = surah.englishAyahs[currentAyahIndex];

  if (!ayah || !translation) return;

  ayahText.textContent = ayah.text;
  ayahTranslation.textContent = translation.text;
  ayahNumberTag.textContent = `${surah.number}:${ayah.numberInSurah}`;
  ayahSelect.value = String(currentAyahIndex);
}

function setSurahAudio() {
  const surah = surahs[currentSurahIndex];
  const surahNumber = padNumber(surah.number);
  const reciterUrls = audioReciters[currentReciter] || audioReciters.Abdul_Basit_Murattal_64kbps;

  currentAudioSources = reciterUrls.map((url) => url.replace('{num}', surahNumber));
  audioPlayer.src = currentAudioSources[0];
  audioPlayer.pause();
  audioPlayer.load();
  playerTime.textContent = '00:00';
}

function tryNextAudioSource() {
  if (!currentAudioSources.length) return;

  const currentSrc = audioPlayer.src;
  const index = currentAudioSources.indexOf(currentSrc);

  if (index < currentAudioSources.length - 1) {
    audioPlayer.src = currentAudioSources[index + 1];
    audioPlayer.load();
    playAudio();
  }
}

function playAudio() {
  audioPlayer.play().catch((error) => {
    console.warn('Audio playback was blocked:', error);
  });
}

function jumpAyah(step) {
  const surah = surahs[currentSurahIndex];
  const maxIndex = surah.ayahs.length - 1;
  currentAyahIndex = Math.min(Math.max(currentAyahIndex + step, 0), maxIndex);
  renderCurrentAyah();
  setSurahAudio();
}

ayahSelect.addEventListener('change', (event) => {
  currentAyahIndex = Number(event.target.value);
  renderCurrentAyah();
  setSurahAudio();
});

surahSearch.addEventListener('input', renderSurahList);

playBtn.addEventListener('click', () => {
  if (audioPlayer.paused) {
    playAudio();
    playBtn.textContent = '❚❚';
    playToggle.textContent = '❚❚';
  } else {
    audioPlayer.pause();
    playBtn.textContent = '▶';
    playToggle.textContent = '▶';
  }
});

playToggle.addEventListener('click', () => {
  playBtn.click();
});

prevBtn.addEventListener('click', () => {
  jumpAyah(-1);
});

nextBtn.addEventListener('click', () => {
  jumpAyah(1);
});

reciterSelect.addEventListener('change', () => {
  currentReciter = reciterSelect.value;
  setSurahAudio();
  if (!audioPlayer.paused) {
    playAudio();
  }
});

audioPlayer.addEventListener('timeupdate', () => {
  const minutes = Math.floor(audioPlayer.currentTime / 60);
  const seconds = Math.floor(audioPlayer.currentTime % 60);
  playerTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

audioPlayer.addEventListener('ended', () => {
  if (currentAyahIndex < surahs[currentSurahIndex].ayahs.length - 1) {
    currentAyahIndex += 1;
    renderCurrentAyah();
    setSurahAudio();
    playAudio();
  }
});

audioPlayer.addEventListener('error', () => {
  tryNextAudioSource();
});

fetchSurahs();

const tabs = document.querySelectorAll('.tab-pill');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.add('muted'));
    tab.classList.remove('muted');
    tab.classList.add('active');
  });
});

const allSurahBadge = document.getElementById('selectedSurahBadge');
allSurahBadge.textContent = 'الفاتحة';
