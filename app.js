// ── Constants ──────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0];

const MOOD_LABELS = {
  '😄': 'Senang banget!',
  '🙂': 'Oke nih',
  '😐': 'Biasa aja',
  '😔': 'Kurang mood',
  '😤': 'Frustrasi',
};

const MOOD_IMAGES = {
  '😄': 'img/mood-happy.jpg',
  '🙂': 'img/mood-ok.jpg',
  '😐': 'img/mood-neutral.jpg',
  '😔': 'img/mood-sad.jpg',
  '😤': 'img/mood-angry.mp4',
};

const MOOD_QUOTES = {
  '😄': 'Hari yang luar biasa! Selesaikan tugas-tugas penting sekarang. 💪',
  '🙂': 'Kamu di jalur yang benar. Tetap konsisten! 👍',
  '😐': 'Mulai dari yang kecil. Satu tugas selesai sudah berarti. 🎯',
  '😔': 'Tidak apa-apa untuk pelan-pelan. Fokus hal ringan dulu. 💙',
  '😤': 'Tarik napas. Kerjakan satu hal dalam satu waktu. 🧘',
};

const THEMES = {
  '😄': { accent: '#f5a623', accentDark: '#e09415', bg: '#fffbf0', light: '#fff8e1', border: '#fde9b0' },
  '🙂': { accent: '#4f8ef7', accentDark: '#3a78e0', bg: '#f0f2f5', light: '#eef4ff', border: '#c5d8fc' },
  '😐': { accent: '#78909c', accentDark: '#607d8b', bg: '#f4f5f6', light: '#eceff1', border: '#cfd8dc' },
  '😔': { accent: '#7c4dff', accentDark: '#651fff', bg: '#f5f3ff', light: '#ede7f6', border: '#d1c4e9' },
  '😤': { accent: '#e53935', accentDark: '#c62828', bg: '#fff5f5', light: '#ffebee', border: '#ffcdd2' },
};

// mood 😔 dan 😤 dianggap "low mood" untuk reminder
const LOW_MOODS = new Set(['😔', '😤']);

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// ── State ───────────────────────────────────────────────────
let currentFilter  = 'semua';
let editingIndex   = null;
let insightsOpen   = false;
let chromaKeyFrame = null;

// ── Elements ────────────────────────────────────────────────
const taskInput        = document.getElementById('taskInput');
const addBtn           = document.getElementById('addBtn');
const taskList         = document.getElementById('taskList');
const categoryInput    = document.getElementById('categoryInput');
const priorityInput    = document.getElementById('priorityInput');
const deadlineInput    = document.getElementById('deadlineInput');
const moodQuote        = document.getElementById('moodQuote');
const streakBadge      = document.getElementById('streakBadge');
const historySection   = document.getElementById('historySection');
const reminderBanner   = document.getElementById('reminderBanner');
const reminderText     = document.getElementById('reminderText');
const dismissReminder  = document.getElementById('dismissReminder');
const insightsToggle   = document.getElementById('insightsToggle');
const insightsContent  = document.getElementById('insightsContent');
const insightsArrow    = document.getElementById('insightsArrow');
const recommendHint    = document.getElementById('recommendHint');
const editModal        = document.getElementById('editModal');
const editTaskInput    = document.getElementById('editTaskInput');
const editCategoryInput = document.getElementById('editCategoryInput');
const editPriorityInput = document.getElementById('editPriorityInput');
const editDeadlineInput = document.getElementById('editDeadlineInput');
const saveEditBtn      = document.getElementById('saveEditBtn');
const cancelEditBtn    = document.getElementById('cancelEditBtn');

// ── Init ────────────────────────────────────────────────────
(function init() {
  const savedMood = getMoodHistory()[TODAY];
  if (savedMood) applyMoodUI(savedMood, false);

  renderStreak();
  renderHistory();
  renderReminder();
  renderInsights();
  renderTasks(getFilteredTasks());
})();

// ── Mood Selection ───────────────────────────────────────────
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mood = btn.dataset.mood;
    const history = getMoodHistory();
    history[TODAY] = mood;
    saveMoodHistory(history);

    applyMoodUI(mood);
    renderStreak();
    renderHistory();
    renderReminder();
    renderInsights();
    renderTasks(getFilteredTasks()); // re-sort berdasarkan mood baru
  });
});

function showMoodImage(mood, animate) {
  const img    = document.getElementById('moodImg');
  const canvas = document.getElementById('moodCanvas');
  const video  = document.getElementById('moodVideo');
  const src    = MOOD_IMAGES[mood];

  stopChromaKey();

  if (!src) {
    img.className    = 'mood-img';
    canvas.className = 'mood-img';
    return;
  }

  const isVideo = src.endsWith('.mp4') || src.endsWith('.webm');

  if (isVideo) {
    img.className = 'mood-img'; // sembunyikan img
    video.src = src;
    video.load();
    video.play();
    video.oncanplay = () => startChromaKey();

    if (animate) {
      canvas.className = 'mood-img';
      void canvas.offsetWidth;
      canvas.className = 'mood-img spinning';
    } else {
      canvas.className = 'mood-img visible';
    }
  } else {
    video.pause();
    canvas.className = 'mood-img'; // sembunyikan canvas
    img.src = src;
    img.onerror = () => { img.className = 'mood-img'; };
    if (animate) {
      img.className = 'mood-img';
      void img.offsetWidth;
      img.className = 'mood-img spinning';
    } else {
      img.className = 'mood-img visible';
    }
  }
}

function startChromaKey() {
  const video  = document.getElementById('moodVideo');
  const canvas = document.getElementById('moodCanvas');
  const ctx    = canvas.getContext('2d');

  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;

  function draw() {
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] < 40 && d[i + 1] < 40 && d[i + 2] < 40) {
        d[i + 3] = 0; // pixel hitam → transparan
      }
    }
    ctx.putImageData(imageData, 0, 0);
    chromaKeyFrame = requestAnimationFrame(draw);
  }

  chromaKeyFrame = requestAnimationFrame(draw);
}

function stopChromaKey() {
  if (chromaKeyFrame) {
    cancelAnimationFrame(chromaKeyFrame);
    chromaKeyFrame = null;
  }
}

function applyMoodUI(mood, animate = true) {
  // Highlight tombol
  document.querySelectorAll('.mood-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.mood === mood);
  });

  // Quote
  moodQuote.textContent = MOOD_QUOTES[mood] || '';

  // Recommend hint
  if (mood === '😄' || mood === '🙂') {
    recommendHint.textContent = '✨ Mood bagus! Tugas prioritas tinggi ditampilkan duluan.';
  } else if (mood === '😔' || mood === '😤') {
    recommendHint.textContent = '💙 Santai dulu. Tugas yang lebih ringan ditampilkan duluan.';
  } else {
    recommendHint.textContent = '';
  }

  // Tema warna
  applyTheme(mood);

  // Gambar mood
  showMoodImage(mood, animate);
}

function applyTheme(mood) {
  const t = THEMES[mood] || THEMES['🙂'];
  const r = document.documentElement;
  r.style.setProperty('--accent',      t.accent);
  r.style.setProperty('--accent-dark', t.accentDark);
  r.style.setProperty('--bg',          t.bg);
  r.style.setProperty('--light',       t.light);
  r.style.setProperty('--border',      t.border);
}

// ── Streak ───────────────────────────────────────────────────
function renderStreak() {
  const streak = calcStreak();
  if (streak === 0) {
    streakBadge.textContent = 'Mulai tracking mood!';
  } else {
    streakBadge.textContent = `🔥 ${streak} hari streak`;
  }
}

function calcStreak() {
  const history = getMoodHistory();
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (!history[key]) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ── 7-Day History ────────────────────────────────────────────
function renderHistory() {
  const history = getMoodHistory();
  historySection.innerHTML = '';

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key     = d.toISOString().split('T')[0];
    const dayName = DAY_NAMES[d.getDay()];
    const mood    = history[key];
    const isToday = key === TODAY;

    const div = document.createElement('div');
    div.className = 'history-day' + (isToday ? ' today' : '');
    div.innerHTML = `
      <span class="day-name">${dayName}</span>
      ${mood
        ? `<span class="day-emoji" title="${MOOD_LABELS[mood]}">${mood}</span>`
        : `<span class="day-empty">—</span>`}
    `;
    historySection.appendChild(div);
  }
}

// ── Reminder ─────────────────────────────────────────────────
function renderReminder() {
  const dismissed = sessionStorage.getItem('reminderDismissed');
  if (dismissed) return;

  const history = getMoodHistory();
  let lowCount = 0;

  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (LOW_MOODS.has(history[key])) lowCount++;
    else break;
  }

  if (lowCount >= 3) {
    reminderBanner.classList.remove('hidden');
    reminderText.textContent =
      '💙 Kamu sudah 3 hari merasa kurang baik. Istirahat dulu, jangan terlalu keras pada diri sendiri.';
  } else {
    reminderBanner.classList.add('hidden');
  }
}

dismissReminder.addEventListener('click', () => {
  reminderBanner.classList.add('hidden');
  sessionStorage.setItem('reminderDismissed', '1');
});

// ── Insights ─────────────────────────────────────────────────
insightsToggle.addEventListener('click', () => {
  insightsOpen = !insightsOpen;
  insightsContent.classList.toggle('hidden', !insightsOpen);
  insightsArrow.textContent = insightsOpen ? '▲' : '▼';
});

function renderInsights(selectedDate) {
  if (selectedDate === undefined) selectedDate = TODAY;

  const history = getMoodHistory();
  const moods   = Object.keys(MOOD_LABELS);
  const allTasks   = getTasks();

  // ── Pie chart data ──
  const filtered = selectedDate === 'semua'
    ? allTasks
    : allTasks.filter(t => t.createdDate === selectedDate || (!t.createdDate && selectedDate === 'semua'));

  const doneCount  = filtered.filter(t => t.done).length;
  const totalCount = filtered.length;

  // ── Korelasi mood vs produktivitas ──
  const moodStats = getMoodStats();
  const maxCount  = Math.max(...Object.values(moodStats), 1);

  const streak = calcStreak();
  let bestMood = null, bestVal = -1;
  moods.forEach(m => {
    if ((moodStats[m] || 0) > bestVal) { bestVal = moodStats[m] || 0; bestMood = m; }
  });
  if (bestVal === 0) bestMood = null;

  insightsContent.innerHTML = `
    <div class="insight-block">
      <h4>Streak</h4>
      <p style="font-size:0.9rem;color:#555">
        ${streak > 0
          ? `🔥 Kamu sudah <strong>${streak} hari</strong> berturut-turut tracking mood!`
          : 'Belum ada streak. Pilih mood hari ini!'}
      </p>
    </div>

    <div class="insight-block">
      <h4>Progress Tugas</h4>
      <div class="pie-controls">
        <label for="pieDate" style="font-size:0.82rem;color:#888">Tampilkan tugas:</label>
        <select id="pieDate">
          <option value="${TODAY}" ${selectedDate === TODAY ? 'selected' : ''}>Hari ini</option>
          <option value="semua"   ${selectedDate === 'semua'   ? 'selected' : ''}>Semua</option>
        </select>
      </div>
      <div class="pie-wrap">
        ${drawPieChart(doneCount, totalCount)}
        <div class="pie-legend">
          <div class="legend-item">
            <span class="legend-dot done-dot"></span>
            <span>Selesai <strong>${doneCount}</strong></span>
          </div>
          <div class="legend-item">
            <span class="legend-dot belum-dot"></span>
            <span>Belum <strong>${totalCount - doneCount}</strong></span>
          </div>
          <div class="pie-total">Total: ${totalCount} tugas</div>
        </div>
      </div>
    </div>

    <div class="insight-block">
      <h4>Mood vs Produktivitas</h4>
      ${moods.map(m => `
        <div class="correlation-row">
          <span class="ci-mood">${m}</span>
          <div class="correlation-bar-wrap">
            <div class="correlation-bar" style="width:${(moodStats[m] || 0) / maxCount * 100}%"></div>
          </div>
          <span class="ci-val">
            ${moodStats[m] ? `${moodStats[m]} tugas` : '—'}
          </span>
        </div>
      `).join('')}
    </div>

    ${bestMood ? `
      <div class="insight-block">
        <h4>Paling Produktif</h4>
        <p style="font-size:0.9rem;color:#555">
          Kamu paling banyak menyelesaikan tugas saat mood ${bestMood}
          <strong>(${bestVal} tugas total)</strong>.
        </p>
      </div>
    ` : ''}
  `;

  // Event listener untuk date selector
  document.getElementById('pieDate').addEventListener('change', e => {
    renderInsights(e.target.value);
  });
}

function drawPieChart(done, total) {
  if (total === 0) {
    return `<svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="50" fill="#f0f2f5"/>
      <text x="60" y="65" text-anchor="middle" font-size="11" fill="#bbb">Kosong</text>
    </svg>`;
  }

  const belum = total - done;
  const r = 50, cx = 60, cy = 60;

  // Full circle cases
  if (done === total) {
    return `<svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--accent)"/>
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="13" font-weight="bold" fill="#fff">100%</text>
    </svg>`;
  }
  if (done === 0) {
    return `<svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#e2e5ea"/>
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="13" font-weight="bold" fill="#aaa">0%</text>
    </svg>`;
  }

  const pct   = done / total;
  const angle = pct * 2 * Math.PI;
  // Mulai dari atas (−π/2)
  const startAngle = -Math.PI / 2;
  const endAngle   = startAngle + angle;

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = angle > Math.PI ? 1 : 0;

  const pctLabel = Math.round(pct * 100);

  return `<svg width="120" height="120" viewBox="0 0 120 120">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#e2e5ea"/>
    <path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z"
          fill="var(--accent)"/>
    <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="13" font-weight="bold" fill="#444">${pctLabel}%</text>
  </svg>`;
}

// ── Task Functions ───────────────────────────────────────────
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const tasks = getTasks();
  const currentMood = getMoodHistory()[TODAY] || null;

  tasks.push({
    text,
    done: false,
    category:        categoryInput.value,
    priority:        priorityInput.value,
    deadline:        deadlineInput.value,
    moodAtCreation:  currentMood,
    createdDate:     TODAY,
  });
  saveTasks(tasks);
  renderTasks(getFilteredTasks());

  taskInput.value    = '';
  categoryInput.value = '';
  priorityInput.value = '';
  deadlineInput.value = '';
  taskInput.focus();
}

function renderTasks(tasks) {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.innerHTML = '<p style="color:#bbb;text-align:center;padding:20px 0">Tidak ada tugas</p>';
    return;
  }

  // Sort berdasarkan mood hari ini
  const todayMood = getMoodHistory()[TODAY];
  const sorted = [...tasks];

  const PRIORITY_SCORE = { 'Tinggi': 0, 'Sedang': 1, 'Rendah': 2, '': 3 };

  if (todayMood === '😄' || todayMood === '🙂') {
    // Mood bagus → prioritas tinggi duluan (untuk yang belum selesai)
    sorted.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return PRIORITY_SCORE[a.priority] - PRIORITY_SCORE[b.priority];
    });
  } else if (todayMood === '😔' || todayMood === '😤') {
    // Mood buruk → prioritas rendah duluan
    sorted.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority];
    });
  }

  const today = TODAY;

  sorted.forEach(task => {
    const realIndex = task._index;
    const li = document.createElement('li');
    if (task.done) li.classList.add('done');
    if (task.priority) li.classList.add(`priority-${task.priority}`);

    const isOverdue = task.deadline && task.deadline < today && !task.done;

    li.innerHTML = `
      <div class="task-main">
        <input type="checkbox" ${task.done ? 'checked' : ''} data-index="${realIndex}" />
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
          <button class="edit-btn"   data-index="${realIndex}" title="Edit">✏️</button>
          <button class="delete-btn" data-index="${realIndex}" title="Hapus">✕</button>
        </div>
      </div>
      <div class="task-meta">
        ${task.moodAtCreation ? `<span class="badge-mood" title="Mood saat dibuat">${task.moodAtCreation}</span>` : ''}
        ${task.category ? `<span class="badge badge-category">${escapeHtml(task.category)}</span>` : ''}
        ${task.priority ? `<span class="badge badge-priority-${task.priority}">${task.priority}</span>` : ''}
        ${task.deadline ? `<span class="badge badge-deadline ${isOverdue ? 'overdue' : ''}">${isOverdue ? '⚠ ' : ''}${formatDate(task.deadline)}</span>` : ''}
      </div>
    `;

    li.querySelector('input[type="checkbox"]').addEventListener('change', toggleTask);
    li.querySelector('.edit-btn').addEventListener('click', openEdit);
    li.querySelector('.delete-btn').addEventListener('click', deleteTask);

    taskList.appendChild(li);
  });
}

function toggleTask(e) {
  const index = parseInt(e.target.dataset.index);
  const tasks = getTasks();
  const task  = tasks[index];
  task.done   = !task.done;

  const moodStats   = getMoodStats();
  const currentMood = getMoodHistory()[TODAY];

  if (task.done) {
    // Simpan mood saat task di-done
    task.completedMood = currentMood || null;
    if (currentMood) moodStats[currentMood] = (moodStats[currentMood] || 0) + 1;
  } else {
    // Batalkan — kurangi dari mood yang tercatat saat selesai
    if (task.completedMood) {
      moodStats[task.completedMood] = Math.max(0, (moodStats[task.completedMood] || 1) - 1);
    }
    task.completedMood = null;
  }

  saveMoodStats(moodStats);
  saveTasks(tasks);
  renderInsights();
  renderTasks(getFilteredTasks());
}

function deleteTask(e) {
  const index = parseInt(e.target.dataset.index);
  const tasks = getTasks();
  tasks.splice(index, 1);
  saveTasks(tasks);
  renderTasks(getFilteredTasks());
}

// ── Edit Modal ───────────────────────────────────────────────
function openEdit(e) {
  editingIndex = parseInt(e.target.dataset.index);
  const task = getTasks()[editingIndex];

  editTaskInput.value      = task.text;
  editCategoryInput.value  = task.category || '';
  editPriorityInput.value  = task.priority || '';
  editDeadlineInput.value  = task.deadline || '';

  editModal.classList.remove('hidden');
  editTaskInput.focus();
}

function saveEdit() {
  const text = editTaskInput.value.trim();
  if (!text) return;

  const tasks = getTasks();
  tasks[editingIndex] = {
    ...tasks[editingIndex],
    text,
    category: editCategoryInput.value,
    priority: editPriorityInput.value,
    deadline: editDeadlineInput.value,
  };
  saveTasks(tasks);
  renderTasks(getFilteredTasks());
  closeModal();
}

function closeModal() {
  editModal.classList.add('hidden');
  editingIndex = null;
}

saveEditBtn.addEventListener('click', saveEdit);
cancelEditBtn.addEventListener('click', closeModal);
editModal.addEventListener('click', e => { if (e.target === editModal) closeModal(); });

// ── Filter ───────────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks(getFilteredTasks());
  });
});

function getFilteredTasks() {
  const tasks = getTasks();
  const indexed = tasks.map((task, i) => ({ ...task, _index: i }));
  if (currentFilter === 'belum')   return indexed.filter(t => !t.done);
  if (currentFilter === 'selesai') return indexed.filter(t => t.done);
  return indexed;
}

// ── Storage ───────────────────────────────────────────────────
// ── Clear Data ───────────────────────────────────────────────
const clearDataBtn    = document.getElementById('clearDataBtn');
const clearModal      = document.getElementById('clearModal');
const confirmClearBtn = document.getElementById('confirmClearBtn');
const cancelClearBtn  = document.getElementById('cancelClearBtn');

clearDataBtn.addEventListener('click', () => clearModal.classList.remove('hidden'));
cancelClearBtn.addEventListener('click', () => clearModal.classList.add('hidden'));
clearModal.addEventListener('click', e => { if (e.target === clearModal) clearModal.classList.add('hidden'); });

confirmClearBtn.addEventListener('click', () => {
  localStorage.clear();
  clearModal.classList.add('hidden');
  location.reload();
});

// ── Storage ───────────────────────────────────────────────────
function getTasks()        { return JSON.parse(localStorage.getItem('tasks')      || '[]'); }
function saveTasks(t)      { localStorage.setItem('tasks', JSON.stringify(t)); }
function getMoodHistory()  { return JSON.parse(localStorage.getItem('moodHistory') || '{}'); }
function saveMoodHistory(h){ localStorage.setItem('moodHistory', JSON.stringify(h)); }
function getMoodStats()    { return JSON.parse(localStorage.getItem('moodStats')   || '{}'); }
function saveMoodStats(s)  { localStorage.setItem('moodStats', JSON.stringify(s)); }

// ── Helpers ───────────────────────────────────────────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
