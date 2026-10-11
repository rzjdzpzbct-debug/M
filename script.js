const API_BASE = 'https://api.alquran.cloud/v1';
const AUDIO_RECITERS = {
    'abdul-basit': 'https://everyayah.com/data/Abdul_Basit_Murattal_64kbps',
    'mishary': 'https://everyayah.com/data/Mishary_Alafasy_128kbps',
    'sudais': 'https://everyayah.com/data/Sudais_64kbps'
};

let surahs = [];
let currentSurah = 0;
let currentReciter = 'abdul-basit';
let isPlaying = false;

const DOM = {
    surahList: document.getElementById('surahList'),
    searchInput: document.getElementById('searchInput'),
    sidebarSearch: document.getElementById('sidebarSearch'),
    surahInfo: document.getElementById('surahInfo'),
    surahNameAr: document.getElementById('surahNameAr'),
    surahDetails: document.getElementById('surahDetails'),
    versesContainer: document.getElementById('versesContainer'),
    ayahJump: document.getElementById('ayahJump'),
    playerTitle: document.getElementById('playerTitle'),
    playerTime: document.getElementById('playerTime'),
    playBtn: document.getElementById('playBtn'),
    reciterSelect: document.getElementById('reciterSelect'),
    audioPlayer: document.getElementById('audioPlayer'),
    volumeSlider: document.getElementById('volumeSlider'),
    prevSurahBtn: document.getElementById('prevSurahBtn'),
    nextSurahBtn: document.getElementById('nextSurahBtn'),
    prevVerseBtn: document.getElementById('prevVerseBtn'),
    nextVerseBtn: document.getElementById('nextVerseBtn')
};

// تحميل السور
async function loadSurahs() {
    try {
        const response = await fetch(`${API_BASE}/surah`);
        const data = await response.json();
        surahs = data.data;
        renderSurahList();
        loadSurah(0);
    } catch (error) {
        console.error('خطأ في تحميل السور:', error);
    }
}

// عرض قائمة السور
function renderSurahList(filter = '') {
    DOM.surahList.innerHTML = surahs
        .filter(s => !filter || s.name.includes(filter) || s.englishName.toLowerCase().includes(filter.toLowerCase()))
        .map((surah, idx) => `
            <button class="surah-item ${idx === currentSurah ? 'active' : ''}" onclick="loadSurah(${idx})">
                <div>
                    <div class="surah-item-name">${surah.name}</div>
                    <div class="surah-item-count">${surah.englishName}</div>
                </div>
                <span>${surah.numberOfAyahs}</span>
            </button>
        `)
        .join('');
}

// تحميل السورة
async function loadSurah(index) {
    currentSurah = index;
    const surah = surahs[index];
    
    DOM.surahNameAr.textContent = surah.name;
    DOM.surahDetails.textContent = `السورة ${surah.number} | ${surah.numberOfAyahs} آيات | ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}`;
    DOM.playerTitle.textContent = surah.name;
    
    renderSurahList();
    
    try {
        // تحميل النص العربي
        const quranRes = await fetch(`${API_BASE}/surah/${surah.number}`);
        const quranData = await quranRes.json();
        
        // تحميل الترجمة
        const translationRes = await fetch(`${API_BASE}/surah/${surah.number}/en.asad`);
        const translationData = await translationRes.json();
        
        renderVerses(quranData.data.ayahs, translationData.data.ayahs);
        populateAyahJump(surah.numberOfAyahs);
        setSurahAudio(surah.number);
    } catch (error) {
        console.error('خطأ في تحميل السورة:', error);
    }
}

// عرض الآيات
function renderVerses(ayahs, translations) {
    DOM.versesContainer.innerHTML = ayahs
        .map((ayah, idx) => `
            <div class="verse-card">
                <span class="verse-number">آية ${ayah.numberInSurah}</span>
                <div class="verse-text">${ayah.text}</div>
                <div class="verse-translation">${translations[idx]?.text || ''}</div>
            </div>
        `)
        .join('');
}

// إعداد قائمة الآيات
function populateAyahJump(count) {
    DOM.ayahJump.innerHTML = Array.from({length: count}, (_, i) => 
        `<option value="${i}">${i + 1}</option>`
    ).join('');
}

// تعيين رابط الصوت
function setSurahAudio(surahNumber) {
    const baseUrl = AUDIO_RECITERS[currentReciter];
    const paddedNumber = String(surahNumber).padStart(3, '0');
    DOM.audioPlayer.src = `${baseUrl}/${paddedNumber}.mp3`;
}

// تحديث وقت التشغيل
DOM.audioPlayer.addEventListener('timeupdate', () => {
    const current = formatTime(DOM.audioPlayer.currentTime);
    const duration = formatTime(DOM.audioPlayer.duration || 0);
    DOM.playerTime.textContent = `${current} / ${duration}`;
});

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// أزرار التحكم
DOM.playBtn.addEventListener('click', () => {
    if (DOM.audioPlayer.paused) {
        DOM.audioPlayer.play();
        DOM.playBtn.textContent = '⏸';
        isPlaying = true;
    } else {
        DOM.audioPlayer.pause();
        DOM.playBtn.textContent = '▶';
        isPlaying = false;
    }
});

DOM.reciterSelect.addEventListener('change', (e) => {
    currentReciter = e.target.value;
    setSurahAudio(surahs[currentSurah].number);
    if (isPlaying) DOM.audioPlayer.play();
});

DOM.prevSurahBtn.addEventListener('click', () => {
    if (currentSurah > 0) loadSurah(currentSurah - 1);
});

DOM.nextSurahBtn.addEventListener('click', () => {
    if (currentSurah < surahs.length - 1) loadSurah(currentSurah + 1);
});

DOM.volumeSlider.addEventListener('input', (e) => {
    DOM.audioPlayer.volume = e.target.value / 100;
});

DOM.ayahJump.addEventListener('change', (e) => {
    const ayahIndex = e.target.value;
    const element = document.querySelectorAll('.verse-card')[ayahIndex];
    element?.scrollIntoView({ behavior: 'smooth' });
});

// البحث
DOM.searchInput.addEventListener('input', (e) => {
    renderSurahList(e.target.value);
});

DOM.sidebarSearch.addEventListener('input', (e) => {
    renderSurahList(e.target.value);
});

// تنقل الآيات
DOM.prevVerseBtn.addEventListener('click', () => {
    const current = parseInt(DOM.ayahJump.value) || 0;
    if (current > 0) {
        DOM.ayahJump.value = current - 1;
        const element = document.querySelectorAll('.verse-card')[current - 1];
        element?.scrollIntoView({ behavior: 'smooth' });
    }
});

DOM.nextVerseBtn.addEventListener('click', () => {
    const current = parseInt(DOM.ayahJump.value) || 0;
    if (current < DOM.ayahJump.options.length - 1) {
        DOM.ayahJump.value = current + 1;
        const element = document.querySelectorAll('.verse-card')[current + 1];
        element?.scrollIntoView({ behavior: 'smooth' });
    }
});

// تطبيقات أوضاع العرض
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const mode = e.target.dataset.mode;
        console.log('تم تبديل الوضع إلى:', mode);
    });
});

// تشغيل التطبيق
loadSurahs();
DOM.audioPlayer.volume = 0.7;

console.log('✅ تطبيق Quranic Studio جاهز للاستخدام');
