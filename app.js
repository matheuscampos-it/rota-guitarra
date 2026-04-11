// ==========================================
// ESTADOS GLOBAIS E LOCALSTORAGE
// ==========================================
let userProgress = JSON.parse(localStorage.getItem('jornadaProgress')) || [];
let myRigOverrides = JSON.parse(localStorage.getItem('myRigOverrides')) || {};
let learnedSongs = JSON.parse(localStorage.getItem('learnedSongs')) || [];

// Declarar as variáveis globais vazias
let planData = [];
let roadieDb = [];
let chordDb = [];
let pedalData = [];
let digitechPresets = [];

// ==========================================
// CARREGAMENTO DE DADOS
// ==========================================
async function loadDatabases() {
  const version = new Date().getTime();
  
  try {
    const [planRes, roadieRes, chordRes, pedalRes, presetsRes] = await Promise.all([
      fetch(`data/planData.json?v=${version}`),
      fetch(`data/roadieDb.json?v=${version}`),
      fetch(`data/chordDb.json?v=${version}`),
      fetch(`data/pedalData.json?v=${version}`),
      fetch(`data/digitechPresets.json?v=${version}`)
    ]);

    const responses = { planData: planRes, roadieDb: roadieRes, chordDb: chordRes, pedalData: pedalRes, digitechPresets: presetsRes };

    for (const [name, res] of Object.entries(responses)) {
        if (!res.ok) throw new Error(`Erro: O ficheiro ${name}.json não foi encontrado.`);
    }

    planData = await planRes.json() || [];
    roadieDb = await roadieRes.json() || [];
    chordDb = await chordRes.json() || [];
    pedalData = await pedalRes.json() || [];
    digitechPresets = await presetsRes.json() || [];

    if (!Array.isArray(planData)) planData = planData.data || [];
    if (!Array.isArray(roadieDb)) roadieDb = roadieDb.data || [];
    if (!Array.isArray(chordDb)) chordDb = chordDb.data || [];
    if (!Array.isArray(pedalData)) pedalData = pedalData.data || [];
    if (!Array.isArray(digitechPresets)) digitechPresets = digitechPresets.data || [];

    initChordsPanel();
    renderPlanTabs();
    renderPedalLab();
    initLocalRoadie();
    updateStreakUI();
    
  } catch (error) {
    console.error("Erro crítico ao carregar as bases de dados:", error);
    alert(error.message);
  }
}

// ==========================================
// BACKUP: IMPORTAR / EXPORTAR
// ==========================================
function exportBackup() {
    const dataToExport = {
        jornadaProgress: userProgress,
        myRigOverrides: myRigOverrides,
        learnedSongs: learnedSongs,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "jornada_guitarra_backup_v2.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if(importedData.jornadaProgress !== undefined) {
                userProgress = importedData.jornadaProgress;
                localStorage.setItem('jornadaProgress', JSON.stringify(userProgress));
            }
            if(importedData.myRigOverrides !== undefined) {
                myRigOverrides = importedData.myRigOverrides;
                localStorage.setItem('myRigOverrides', JSON.stringify(myRigOverrides));
            }
            if(importedData.learnedSongs !== undefined) {
                learnedSongs = importedData.learnedSongs;
                localStorage.setItem('learnedSongs', JSON.stringify(learnedSongs));
            }
            
            alert('Backup restaurado com sucesso! 🎉 Bem-vindo de volta.');
            location.reload();
            
        } catch (error) {
            alert('Erro ao ler o ficheiro de backup.');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// ROTEAMENTO (Navegação SPA)
// ==========================================
function handleRouting() {
  let hash = window.location.hash.replace('#', '') || 'home';
  
  document.querySelectorAll('.page-section').forEach(page => page.classList.remove('active'));

  const target = document.getElementById(`page-${hash}`);
  if(target) target.classList.add('active');
  else document.getElementById('page-home').classList.add('active');

  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.target === hash) {
      link.classList.remove('text-slate-500', 'dark:text-slate-400');
      link.classList.add('text-primary-600', 'dark:text-primary-400');
    } else {
      link.classList.remove('text-primary-600', 'dark:text-primary-400');
      link.classList.add('text-slate-500', 'dark:text-slate-400');
    }
  });

  if(hash !== 'tuner' && typeof isTuning !== 'undefined' && isTuning) toggleTuner();

  if(hash === 'science') {
    if(!window.chartRendered) {
        renderChart();
        window.chartRendered = true;
    }
    renderProficiencyChart(); 
  }
}

// ==========================================
// LÓGICA DO STREAK E CHECK-IN
// ==========================================
function updateStreakUI(animate = false) {
  const streakCountEl = document.getElementById('streak-count');
  const streakBarEl = document.getElementById('streak-bar');
  const streakMsgEl = document.getElementById('streak-msg');
  if(!streakCountEl) return;

  const totalDays = 50; 
  const completed = userProgress.length;
  
  streakCountEl.innerText = completed;
  streakBarEl.style.width = `${(completed / totalDays) * 100}%`;
  
  if(completed > 0) streakMsgEl.innerText = `Está no dia ${completed}/${totalDays}. Não quebre a corrente!`;
  else streakMsgEl.innerText = `Complete um dia do protocolo para iniciar a sua corrente!`;

  if(animate) {
    streakBarEl.parentElement.classList.remove('animate-pulse');
    void streakBarEl.parentElement.offsetWidth; 
    streakBarEl.parentElement.classList.add('animate-pulse');
  }
}

function toggleDay(dayStr) {
  let isAdding = false;
  if (userProgress.includes(dayStr)) userProgress = userProgress.filter(d => d !== dayStr); 
  else { userProgress.push(dayStr); isAdding = true; }
  
  localStorage.setItem('jornadaProgress', JSON.stringify(userProgress));
  updateStreakUI(isAdding); 
  
  const activeTab = document.querySelector('#week-tabs button.bg-slate-900, #week-tabs button.dark\\:bg-primary-900\\/40');
  if(activeTab) activeTab.click(); 
}

// ==========================================
// PROTOCOLO 50 DIAS
// ==========================================
function renderPlanTabs() {
  const tabsContainer = document.getElementById('week-tabs');
  if(!tabsContainer) return;
  tabsContainer.innerHTML = '';

  planData?.forEach((data, index) => {
    const btn = document.createElement('button');
    btn.className = `shrink-0 snap-start px-6 py-3 rounded-full font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-primary-500 transition-all whitespace-nowrap`;
    if(index === 0) btn.classList.add('bg-slate-900', 'text-white', 'dark:bg-primary-900/40', 'dark:border-primary-500', 'dark:text-white', 'shadow-md');
    
    btn.innerText = `Semana ${data.week}`;
    btn.onclick = (e) => selectWeek(index, e.currentTarget);
    tabsContainer.appendChild(btn);
  });

  if(planData?.length > 0) selectWeek(0);
}

function selectWeek(index, clickedBtn) {
  if(clickedBtn) {
    document.querySelectorAll('#week-tabs button').forEach(btn => {
      btn.className = `shrink-0 snap-start px-6 py-3 rounded-full font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-primary-500 transition-all whitespace-nowrap`;
    });
    clickedBtn.classList.add('bg-slate-900', 'text-white', 'dark:bg-primary-900/40', 'dark:border-primary-500', 'dark:text-white', 'shadow-md');
    clickedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  const week = planData[index];
  if (!week) return;

  document.getElementById('week-title').innerText = week.title || `Semana ${week.week}`;
  document.getElementById('week-focus').innerText = week.focus || '';

  const daysGrid = document.getElementById('days-grid');
  daysGrid.innerHTML = '';

  week.days?.forEach(day => {
    const isCompleted = userProgress.includes(day.day);
    const btnClass = isCompleted 
      ? 'bg-slate-900 dark:bg-primary-500 text-white shadow-md border-transparent dark:border-primary-400' 
      : 'bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-500 dark:hover:border-primary-500 hover:text-slate-900 dark:hover:text-white';
    
    let tasksHtml = '';
    ['t1', 't2', 't3'].forEach((tKey, i) => {
        if(day[tKey]) {
            const isLast = (i === 2) || (!day['t3'] && i === 1);
            const borderStyle = isLast ? 'style="border-left-color:transparent;"' : '';
            
            let detailsHtml = '';
            if(day[tKey].pickup) detailsHtml += `<div class="inline-block bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-primary-300 text-xs px-2.5 py-1 rounded mt-2 mb-1 shadow-sm">🎸 Chave: ${day[tKey].pickup}</div>`;
            if(day[tKey].ytLink) detailsHtml += `<a href="${day[tKey].ytLink}" target="_blank" class="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 mt-2 mb-1 ml-2 bg-rose-50 dark:bg-rose-900/20 px-2.5 py-1 rounded border border-rose-200 dark:border-rose-900/50 transition-colors shadow-sm">📺 Vídeo de Apoio</a>`;
            
            if(day[tKey].theory_pill) {
                detailsHtml += `<div class="mt-3 mb-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-500/30 p-3.5 rounded-xl shadow-sm">
                    <p class="text-[10px] text-primary-600 dark:text-primary-300 font-bold uppercase tracking-wider mb-1">🧠 Pílula de Teoria</p>
                    <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">${day[tKey].theory_pill}</p>
                </div>`;
            }

            if(day[tKey].desc) detailsHtml += `<p class="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-4 leading-relaxed">${day[tKey].desc}</p>`;
            else detailsHtml += `<div class="mb-4"></div>`;

            tasksHtml += `<div class="time-block" ${borderStyle}>
                <span class="inline-block text-slate-700 dark:text-primary-300 font-bold text-xs mb-2 bg-slate-100 dark:bg-primary-900/30 px-2 py-0.5 rounded border border-slate-200 dark:border-transparent">${day[tKey].time}</span>
                <p class="text-base text-slate-900 dark:text-white font-semibold">${day[tKey].task}</p>
                ${detailsHtml}
            </div>`;
        }
    });

    daysGrid.innerHTML += `
    <div class="bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary-400 dark:hover:border-primary-500 transition-all flex flex-col h-full">
      <div class="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <span class="text-3xl bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">${day.icon || '🎸'}</span>
        <h4 class="font-black text-slate-900 dark:text-white text-2xl">${day.day}</h4>
      </div>
      <div class="flex-grow">${tasksHtml}</div>
      <button onclick="toggleDay('${day.day}')" class="mt-6 w-full py-3.5 rounded-xl font-bold transition-all border ${btnClass}">
        ${isCompleted ? '✓ Treino Concluído' : 'Marcar como Concluído'}
      </button>
    </div>`;
  });
}

// ==========================================
// ROADIE LOCAL E MODAL FOCUS
// ==========================================
function initLocalRoadie() {
  const searchInput = document.getElementById('roadieSearch');
  const artistFilter = document.getElementById('roadieArtistFilter');
  const levelFilter = document.getElementById('roadieLevelFilter');
  if(!searchInput || !roadieDb || roadieDb.length === 0) return;

  const uniqueArtists = [...new Set(roadieDb.map(s => s.artist || 'Desconhecido'))].sort();
  artistFilter.innerHTML = '<option value="all">Todos os Artistas</option>'; 
  
  uniqueArtists.forEach(artist => {
    const opt = document.createElement('option');
    opt.value = artist;
    opt.innerText = artist;
    artistFilter.appendChild(opt);
  });

  searchInput.addEventListener('input', renderRoadieCards);
  artistFilter.addEventListener('change', renderRoadieCards);
  levelFilter.addEventListener('change', renderRoadieCards);
  
  renderRoadieCards();
}

function renderRoadieCards() {
  const searchInput = document.getElementById('roadieSearch');
  const artistFilter = document.getElementById('roadieArtistFilter');
  const levelFilter = document.getElementById('roadieLevelFilter');
  const resultsContainer = document.getElementById('roadieResults');

  if(!resultsContainer) return;

  const searchStr = searchInput.value.toLowerCase();
  const artistSel = artistFilter.value;
  const levelSel = levelFilter.value;

  const filtered = roadieDb?.filter(song => {
    const title = song.title ? song.title.toLowerCase() : '';
    const artist = song.artist ? song.artist.toLowerCase() : '';
    return (title.includes(searchStr) || artist.includes(searchStr)) && 
           (artistSel === 'all' || song.artist === artistSel) && 
           (levelSel === 'all' || (song.level && song.level.toString() === levelSel));
  }) || [];

  document.getElementById('roadieCount').innerText = filtered.length;
  resultsContainer.innerHTML = '';

  filtered.forEach(song => {
    const isLearned = learnedSongs.includes(song.title);
    const badge = isLearned ? `<span class="absolute -top-3 -right-3 text-2xl drop-shadow-md">🏆</span>` : '';
    
    // Classes V2.0 para os cards
    const cardClass = isLearned 
        ? "border-primary-500 shadow-md shadow-primary-500/20 bg-primary-50/50 dark:bg-slate-950 dark:shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-primary-400 dark:hover:border-primary-500 shadow-sm";

    const card = document.createElement('div');
    card.className = `p-6 rounded-2xl border transition-all duration-200 flex flex-col gap-4 cursor-pointer relative ${cardClass}`;
    card.onclick = () => openFocusPlayer(song.title);

    card.innerHTML = `
      ${badge}
      <div class="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3">
        <div class="pr-2">
            <h4 class="text-lg font-bold text-slate-900 dark:text-white mb-1 leading-tight">${song.title || 'Música'}</h4>
            <p class="text-sm text-primary-600 dark:text-primary-400 font-semibold">${song.artist || 'Artista'}</p>
        </div>
        <span class="px-2.5 py-1 rounded-lg text-xs font-bold border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm shrink-0">Nível ${song.level || '?'}</span>
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"><strong class="text-slate-900 dark:text-white">Técnica:</strong> ${song.tech || '-'}</p>
      <div class="bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-auto shadow-sm">
        <p class="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed">${myRigOverrides[song.title] || song.equip || 'Base'}</p>
      </div>
    `;
    resultsContainer.appendChild(card);
  });
}

function openFocusPlayer(songTitle) {
    const song = roadieDb.find(s => s.title === songTitle);
    if(!song) return;

    document.getElementById('focus-title').innerText = song.title;
    document.getElementById('focus-artist').innerText = song.artist || 'Artista';
    document.getElementById('focus-equip').innerText = myRigOverrides[song.title] || song.equip || 'Configuração base';
    
    const eq = song.eq_meteoro || { bass: 5, mid: 5, treble: 5 };
    document.getElementById('focus-eq-bass').innerText = eq.bass;
    document.getElementById('focus-eq-mid').innerText = eq.mid;
    document.getElementById('focus-eq-treble').innerText = eq.treble;
    document.getElementById('focus-dynamic').innerText = song.dynamic || 'Média';

    // Link da Tablatura
    const tabQuery = encodeURIComponent(`${song.artist || ''} ${song.title} guitar tab`);
    document.getElementById('focus-tab-link').href = `https://www.songsterr.com/a/wa/search?pattern=${tabQuery}`;
    
    // ==========================================
    // NOVA LÓGICA DO YOUTUBE (Com suporte ao yt_id)
    // ==========================================
    const ytLinkBtn = document.getElementById('focus-yt-link');
    
    if (song.yt_id) {
        // Se o nosso script de scraping achou um vídeo, manda direto pro link exato!
        ytLinkBtn.href = `https://www.youtube.com/watch?v=${song.yt_id}`;
    } else {
        // Fallback Inteligente: Se for uma música nova que você ainda não rodou o script,
        // ou se o robô falhou, usamos o truque do DuckDuckGo para abrir o primeiro vídeo automaticamente.
        const ytQuery = encodeURIComponent(`${song.artist || ''} ${song.title} guitar lesson`);
        ytLinkBtn.href = `https://duckduckgo.com/?q=!yt+${ytQuery}`;
    }

    // Atualiza o botão de "Marcar como Dominada" V2.0
    const btnLearned = document.getElementById('btn-toggle-learned');
    if (learnedSongs.includes(song.title)) {
        btnLearned.innerHTML = '<span class="text-xl">🏆</span> Música Dominada';
        btnLearned.className = "w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-primary-600 border border-transparent text-white font-bold py-4 px-4 rounded-xl transition-all shadow-md";
    } else {
        btnLearned.innerHTML = '<span class="text-xl">🎯</span> Marcar como Dominada';
        btnLearned.className = "w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 text-slate-800 dark:text-white font-bold py-4 px-4 rounded-xl transition-all shadow-sm";
    }
    
    btnLearned.onclick = () => toggleLearnedSong(song.title);
    document.getElementById('focus-modal').classList.remove('hidden');
}

function toggleLearnedSong(songTitle) {
    if (learnedSongs.includes(songTitle)) {
        learnedSongs = learnedSongs.filter(s => s !== songTitle);
    } else {
        learnedSongs.push(songTitle);
    }
    localStorage.setItem('learnedSongs', JSON.stringify(learnedSongs));
    openFocusPlayer(songTitle);
    renderRoadieCards(); 
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ==========================================
// METRÓNOMO
// ==========================================
let isMetronomeExpanded = false;
function toggleMetronomeUI() {
    const panel = document.getElementById('metronome-panel');
    const fab = document.getElementById('fab-metronome');
    if(!panel || !fab) return;
    
    if (isMetronomeExpanded) {
        panel.classList.replace('opacity-100', 'opacity-0');
        panel.classList.replace('scale-100', 'scale-90');
        panel.classList.add('pointer-events-none');
        setTimeout(() => panel.classList.add('hidden'), 300);
        fab.innerHTML = '⏱️';
    } else {
        panel.classList.remove('hidden');
        setTimeout(() => {
            panel.classList.replace('opacity-0', 'opacity-100');
            panel.classList.replace('scale-90', 'scale-100');
            panel.classList.remove('pointer-events-none');
            panel.classList.add('flex');
        }, 10);
        fab.innerHTML = '+'; 
    }
    isMetronomeExpanded = !isMetronomeExpanded;
}

let audioCtx = null;
let isPlaying = false;
let currentBpm = 120;
let nextNoteTime = 0.0;
let timerID;
let lastTapTime = 0;

function handleTapTempo() {
    const now = new Date().getTime();
    if (lastTapTime !== 0) {
        const delta = now - lastTapTime;
        if (delta < 2000) {
            let calculatedBpm = Math.round(60000 / delta);
            updateBPM(Math.max(40, Math.min(240, calculatedBpm)));
            document.getElementById('metro-slider').value = currentBpm;
        }
    }
    lastTapTime = now;
}

function updateBPM(val) {
  currentBpm = val;
  const display = document.getElementById('metro-bpm-display');
  if(display) display.innerHTML = `${val} <span class="text-xs font-normal text-slate-500">BPM</span>`;
}

function scheduleNote() {
  if(!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const envelope = audioCtx.createGain();
  osc.frequency.value = 800; 
  envelope.gain.value = 1;
  envelope.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(envelope);
  envelope.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.1);
}

function nextNote() {
  nextNoteTime += 60.0 / currentBpm;
}

function scheduler() {
  if(!audioCtx) return;
  while (nextNoteTime < audioCtx.currentTime + 0.1) { scheduleNote(); nextNote(); }
  timerID = requestAnimationFrame(scheduler);
}

function toggleMetronome() {
  const btn = document.getElementById('btn-metro-play');
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (isPlaying) {
    cancelAnimationFrame(timerID);
    btn.innerText = '▶️';
  } else {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    nextNoteTime = audioCtx.currentTime + 0.05;
    scheduler();
    btn.innerText = '⏸';
  }
  isPlaying = !isPlaying;
}

// ==========================================
// AFINADOR
// ==========================================
let isTuning = false;
let tunerAudioCtx = null;
let analyser = null;
let microphone = null;
let tunerRafId = null;

const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length, rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; 
    
    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    buf = buf.slice(r1, r2); SIZE = buf.length;
    
    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i];
    
    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) { if (c[i] > maxval) { maxval = c[i]; maxpos = i; } }
    return sampleRate / maxpos;
}

function updatePitch() {
    if(!analyser) return;
    let buf = new Float32Array(2048);
    analyser.getFloatTimeDomainData(buf);
    let ac = autoCorrelate(buf, tunerAudioCtx.sampleRate);

    const noteEl = document.getElementById('tuner-note');
    const centsEl = document.getElementById('tuner-cents');
    const needleEl = document.getElementById('tuner-needle');

    if (ac == -1) {
        if(needleEl) needleEl.style.transform = `rotate(0deg)`;
    } else {
        let noteNum = Math.round(12 * (Math.log(ac / 440) / Math.log(2))) + 69;
        let note = NOTE_STRINGS[noteNum % 12];
        let freqNote = 440 * Math.pow(2, (noteNum - 69) / 12);
        let cents = Math.floor(1200 * Math.log(ac / freqNote) / Math.log(2));
        
        if(noteEl) noteEl.innerText = note;
        if(centsEl) centsEl.innerText = `${cents > 0 ? '+' : ''}${cents} cents`;
        if(needleEl) needleEl.style.transform = `rotate(${Math.max(-45, Math.min(45, (cents / 50) * 45))}deg)`;
    }
    if (isTuning) tunerRafId = requestAnimationFrame(updatePitch);
}

async function toggleTuner() {
    const btn = document.getElementById('btn-tuner-start');
    if (isTuning) {
        isTuning = false;
        if(tunerRafId) cancelAnimationFrame(tunerRafId);
        btn.innerHTML = '🎙️ Ativar Microfone';
    } else {
        try {
            tunerAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            analyser = tunerAudioCtx.createAnalyser();
            microphone = tunerAudioCtx.createMediaStreamSource(stream);
            microphone.connect(analyser);
            isTuning = true;
            updatePitch();
            btn.innerHTML = '⏹️ Parar Afinador';
        } catch (err) {
            alert('Erro no microfone. Verifique as permissões do navegador.');
        }
    }
}

// ==========================================
// ACORDES
// ==========================================
function initChordsPanel() {
  const groupMajor = document.getElementById('btn-group-major');
  const groupMinor = document.getElementById('btn-group-minor');
  const groupPower = document.getElementById('btn-group-power');
  if(!groupMajor || !chordDb || chordDb.length === 0) return;

  chordDb.forEach(chord => {
    const btn = document.createElement('button');
    btn.className = `chord-btn px-4 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-primary-400 transition-all shadow-sm`;
    btn.innerText = chord.symbol || '?';
    btn.onclick = () => renderChordVisualizer(chord.symbol, btn);
    if(chord.type === 'major') groupMajor.appendChild(btn);
    else if(chord.type === 'minor') groupMinor.appendChild(btn);
    else groupPower.appendChild(btn);
  });
  if(chordDb.length > 0) renderChordVisualizer(chordDb[0].symbol, null);
}

function renderChordVisualizer(symbol, clickedBtn) {
  if(clickedBtn) {
    document.querySelectorAll('.chord-btn').forEach(b => {
        b.classList.remove('bg-slate-900', 'dark:bg-primary-600', 'text-white', 'dark:text-white');
        b.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
    });
    clickedBtn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
    clickedBtn.classList.add('bg-slate-900', 'dark:bg-primary-600', 'text-white', 'dark:text-white');
  }
  const chord = chordDb.find(c => c.symbol === symbol);
  if(!chord) return;
  document.getElementById('chordTitle').innerText = chord.symbol;
  document.getElementById('chordName').innerText = chord.name || '';
  
  document.getElementById('chordHeader').innerHTML = chord.frets.map(f => {
    if(f === 'X') return `<span class="w-4 text-center text-rose-500 font-bold">X</span>`;
    if(f === 0 || f === 'O') return `<span class="w-4 text-center text-primary-600 dark:text-primary-500 font-bold">O</span>`;
    return `<span class="w-4 text-center text-slate-400">|</span>`;
  }).join('');

  let dotsHTML = '';
  chord.frets.forEach((fretPos, stringIndex) => {
    if (fretPos !== 'X' && fretPos !== 0 && fretPos !== 'O') {
      dotsHTML += `<div class="absolute w-5 h-5 rounded-full bg-slate-900 dark:bg-primary-500 shadow-md dark:shadow-[0_0_10px_#8b5cf6]" style="left: calc(${stringIndex * 20}% - 10px); top: ${(fretPos - 1) * 62.5 + 20}px;"></div>`;
    }
  });
  document.getElementById('chordDots').innerHTML = dotsHTML;
}

// ==========================================
// LAB & PRESETS
// ==========================================
function renderPedalLab() {
  const effectSelectors = document.getElementById('effect-selectors');
  if(!effectSelectors || !pedalData || pedalData.length === 0) return;
  effectSelectors.innerHTML = '';
  pedalData.forEach((effect, index) => {
    const btn = document.createElement('button');
    btn.className = `effect-btn text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-500 transition-all w-full mb-3 shadow-sm`;
    btn.innerHTML = `<span class="font-bold text-slate-900 dark:text-white">${effect.icon || '🎛️'} ${effect.name}</span>`;
    btn.onclick = (e) => selectEffect(index, e.currentTarget);
    effectSelectors.appendChild(btn);
  });
  selectEffect(0);
  renderPresetsList();
}

function selectEffect(index) {
  const effect = pedalData[index];
  if(!effect) return;
  document.getElementById('effect-details').innerHTML = `
    <h3 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">${effect.name}</h3>
    <p class="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">${effect.desc || '-'}</p>
    <div class="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300 shadow-inner">${effect.digitech?.replace(/\n/g, '<br>')}</div>
  `;
}

function renderPresetsList(filter = '') {
  const grid = document.getElementById('presetsGrid');
  if(!grid) return;
  grid.innerHTML = '';
  digitechPresets?.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())).forEach(preset => {
    grid.innerHTML += `<div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><h4 class="font-bold text-slate-900 dark:text-white text-lg mb-1">${preset.id} ${preset.name}</h4><p class="text-sm font-semibold text-primary-600 dark:text-primary-400">${preset.artist}</p></div>`;
  });
}

// ==========================================
// GRÁFICOS (Motivação e Proficiência V2.0)
// ==========================================
let motivationChartInstance = null;
let proficiencyChartInstance = null;

function renderChart() {
  const canvas = document.getElementById('motivationChart');
  if(!canvas) return;
  
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 vs slate-500
  const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'; // slate-700 vs slate-200

  if(motivationChartInstance) motivationChartInstance.destroy();

  motivationChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'],
      datasets: [
        { label: 'Tradicional', data: [80, 50, 30, 20, 15, 10, 5, 5, 0, 0], borderColor: isDark ? '#475569' : '#94a3b8', fill: false, tension: 0.3 },
        { label: 'Jornada', data: [85, 82, 88, 85, 89, 92, 90, 95, 96, 98], borderColor: '#8b5cf6', backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.15)', fill: true, tension: 0.3 }
      ]
    },
    options: {
        scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } }
        },
        plugins: { legend: { labels: { color: textColor, font: { family: 'Inter' } } } }
    }
  });
}

function renderProficiencyChart() {
    const canvas = document.getElementById('proficiencyChart');
    if (!canvas) return;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b'; 
    const gridColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'; 

    const skills = { 'Acordes & Ritmo': 10, 'Power Chords': 10, 'Dedilhado/Arpejos': 10, 'Riffs & Solos': 10, 'Dinâmica & Muting': 10, 'Velocidade': 10 };

    learnedSongs.forEach(title => {
        const song = roadieDb.find(s => s.title === title);
        if (song && song.tech) {
            const t = song.tech.toLowerCase();
            if (t.includes('acorde') || t.includes('batida') || t.includes('ritmo')) skills['Acordes & Ritmo'] += 8;
            if (t.includes('power chord')) skills['Power Chords'] += 10;
            if (t.includes('dedilhado') || t.includes('arpejo')) skills['Dedilhado/Arpejos'] += 10;
            if (t.includes('riff') || t.includes('solo') || t.includes('lick') || t.includes('nota')) skills['Riffs & Solos'] += 8;
            if (t.includes('abafad') || t.includes('palm mute') || t.includes('groove') || t.includes('staccato')) skills['Dinâmica & Muting'] += 10;
            if (t.includes('rápido') || t.includes('veloz') || t.includes('palhetada') || t.includes('16th')) skills['Velocidade'] += 10;
        }
    });

    const dataValues = Object.values(skills).map(v => Math.min(100, v));

    if(proficiencyChartInstance) proficiencyChartInstance.destroy();

    proficiencyChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: {
            labels: Object.keys(skills),
            datasets: [{
                label: 'Nível',
                data: dataValues,
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                borderColor: '#8b5cf6',
                pointBackgroundColor: isDark ? '#fff' : '#8b5cf6',
                pointBorderColor: '#8b5cf6',
                borderWidth: 2,
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor },
                    pointLabels: { color: textColor, font: { size: 12, family: 'Inter', weight: '600' } },
                    ticks: { display: false, min: 0, max: 100 }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadDatabases();
  const ps = document.getElementById('presetSearch');
  if(ps) ps.addEventListener('input', (e) => renderPresetsList(e.target.value));
  window.addEventListener('hashchange', handleRouting);
  handleRouting();

  // Registra o Service Worker para funcionar offline
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✅ Service Worker registrado com sucesso!', reg.scope))
        .catch(err => console.error('❌ Erro ao registrar Service Worker:', err));
    });
  }
});