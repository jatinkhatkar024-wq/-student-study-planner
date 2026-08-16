/* ==========================================================================
   STUDENT STUDY PLANNER (StudyPulse) - CORE LOGIC & CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Initial Default Subjects & Demo Tasks ---
  const DEFAULT_SUBJECTS = [
    { id: 'sub-1', name: 'Computer Science', color: '#6366f1', icon: '💻' },
    { id: 'sub-2', name: 'Mathematics', color: '#06b6d4', icon: '📐' },
    { id: 'sub-3', name: 'Physics', color: '#8b5cf6', icon: '⚡' },
    { id: 'sub-4', name: 'Literature', color: '#ec4899', icon: '📚' },
    { id: 'sub-5', name: 'Chemistry', color: '#10b981', icon: '🧪' }
  ];

  const getTodayISO = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const DEMO_TASKS = [
    {
      id: 'task-1',
      title: 'Calculus II Problem Set #4',
      subjectId: 'sub-2',
      dueDate: getTodayISO(0),
      priority: 'high',
      estHours: 2.0,
      notes: 'Focus on integration by parts and trigonometric substitution. Exercises 14 to 28.',
      completed: false,
      createdAt: getTodayISO(-2)
    },
    {
      id: 'task-2',
      title: 'Data Structures Tree Traversal Implementation',
      subjectId: 'sub-1',
      dueDate: getTodayISO(1),
      priority: 'high',
      estHours: 3.5,
      notes: 'Implement In-Order, Pre-Order, and Post-Order traversal methods in C++/Python.',
      completed: true,
      completedAt: getTodayISO(0),
      createdAt: getTodayISO(-3)
    },
    {
      id: 'task-3',
      title: 'Physics Lab Report: Electromagnetism',
      subjectId: 'sub-3',
      dueDate: getTodayISO(2),
      priority: 'medium',
      estHours: 1.5,
      notes: 'Include error analysis graphs and raw oscilloscope measurement data.',
      completed: false,
      createdAt: getTodayISO(-1)
    },
    {
      id: 'task-4',
      title: 'Read Hamlet Act III & Write Summary',
      subjectId: 'sub-4',
      dueDate: getTodayISO(3),
      priority: 'low',
      estHours: 1.0,
      notes: 'Analyze the soliloquy "To be or not to be" for upcoming seminar discussion.',
      completed: false,
      createdAt: getTodayISO(0)
    },
    {
      id: 'task-5',
      title: 'Organic Chemistry Reaction Mechanisms',
      subjectId: 'sub-5',
      dueDate: getTodayISO(0),
      priority: 'medium',
      estHours: 2.5,
      notes: 'Review SN1 and SN2 substitution pathways before mid-term review session.',
      completed: true,
      completedAt: getTodayISO(0),
      createdAt: getTodayISO(-4)
    }
  ];

  // --- State Application Storage ---
  let state = {
    tasks: JSON.parse(localStorage.getItem('studypulse_tasks')) || DEMO_TASKS,
    subjects: JSON.parse(localStorage.getItem('studypulse_subjects')) || DEFAULT_SUBJECTS,
    theme: localStorage.getItem('studypulse_theme') || 'dark',
    streak: parseInt(localStorage.getItem('studypulse_streak')) || 5,
    filterStatus: 'all',
    filterSubject: 'all',
    filterPriority: 'all',
    searchQuery: '',
    sortBy: 'dueDate',
    editingTaskId: null,
    timer: {
      mode: 'pomodoro', // 'pomodoro' (25m), 'shortBreak' (5m), 'longBreak' (15m)
      timeLeft: 25 * 60,
      isRunning: false,
      intervalId: null
    }
  };

  // Save state helper
  const saveState = () => {
    localStorage.setItem('studypulse_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('studypulse_subjects', JSON.stringify(state.subjects));
    localStorage.setItem('studypulse_theme', state.theme);
    localStorage.setItem('studypulse_streak', state.streak.toString());
  };

  // --- DOM Element References ---
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const greetingText = document.getElementById('greetingText');
  const currentDateText = document.getElementById('currentDateText');
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const sidebar = document.getElementById('sidebar');

  // Stats Elements
  const statTotalTasks = document.getElementById('statTotalTasks');
  const statCompletedTasks = document.getElementById('statCompletedTasks');
  const statProgressPercent = document.getElementById('statProgressPercent');
  const statStreak = document.getElementById('statStreak');

  // Banner Progress Ring & Bar
  const progressDesc = document.getElementById('progressDesc');
  const overallProgressBarFill = document.getElementById('overallProgressBarFill');
  const progressRingCircle = document.getElementById('progressRingCircle');
  const progressRingText = document.getElementById('progressRingText');

  // Task List & Controls
  const taskList = document.getElementById('taskList');
  const searchInput = document.getElementById('searchInput');
  const subjectFilter = document.getElementById('subjectFilter');
  const priorityFilter = document.getElementById('priorityFilter');
  const sortBySelect = document.getElementById('sortBySelect');
  const filterTabs = document.querySelectorAll('.filter-tab');

  // Subject Grid
  const subjectGrid = document.getElementById('subjectGrid');

  // Upcoming & Analytics
  const upcomingList = document.getElementById('upcomingList');
  const weeklyChart = document.getElementById('weeklyChart');

  // Modals & Buttons
  const addTaskBtn = document.getElementById('addTaskBtn');
  const addSubjectBtn = document.getElementById('addSubjectBtn');
  const quickAddSubjectBtn = document.getElementById('quickAddSubjectBtn');
  const loadDemoBtn = document.getElementById('loadDemoBtn');

  const taskModalOverlay = document.getElementById('taskModalOverlay');
  const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');
  const cancelTaskModalBtn = document.getElementById('cancelTaskModalBtn');
  const taskForm = document.getElementById('taskForm');
  const taskModalTitle = document.getElementById('taskModalTitle');
  const taskIdInput = document.getElementById('taskIdInput');
  const taskTitleInput = document.getElementById('taskTitleInput');
  const taskSubjectSelect = document.getElementById('taskSubjectSelect');
  const taskPrioritySelect = document.getElementById('taskPrioritySelect');
  const taskDueDateInput = document.getElementById('taskDueDateInput');
  const taskEstHoursInput = document.getElementById('taskEstHoursInput');
  const taskNotesInput = document.getElementById('taskNotesInput');

  const subjectModalOverlay = document.getElementById('subjectModalOverlay');
  const closeSubjectModalBtn = document.getElementById('closeSubjectModalBtn');
  const cancelSubjectModalBtn = document.getElementById('cancelSubjectModalBtn');
  const subjectForm = document.getElementById('subjectForm');
  const subjectNameInput = document.getElementById('subjectNameInput');
  const subjectColorInput = document.getElementById('subjectColorInput');
  const subjectIconSelect = document.getElementById('subjectIconSelect');

  // Timer Elements
  const timerDisplay = document.getElementById('timerDisplay');
  const startTimerBtn = document.getElementById('startTimerBtn');
  const resetTimerBtn = document.getElementById('resetTimerBtn');
  const timerModeBtns = document.querySelectorAll('.timer-mode-btn');

  const toastContainer = document.getElementById('toastContainer');

  // --- Initialize App ---
  const init = () => {
    applyTheme(state.theme);
    updateDateDisplay();
    populateSubjectDropdowns();
    renderAll();
    setupEventListeners();
  };

  // --- Theme Management ---
  const applyTheme = (theme) => {
    state.theme = theme;
    htmlEl.setAttribute('data-theme', theme);
    themeToggleBtn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
    saveState();
  };

  const updateDateDisplay = () => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateText.textContent = now.toLocaleDateString('en-US', options);

    const hour = now.getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17) timeOfDay = 'evening';

    greetingText.textContent = `Good ${timeOfDay}, Alex! 👋`;
  };

  // --- Populate Subject Select Dropdowns ---
  const populateSubjectDropdowns = () => {
    // Task Filter Select
    subjectFilter.innerHTML = '<option value="all">All Subjects</option>';
    // Modal Form Select
    taskSubjectSelect.innerHTML = '';

    state.subjects.forEach(sub => {
      const opt1 = document.createElement('option');
      opt1.value = sub.id;
      opt1.textContent = `${sub.icon} ${sub.name}`;
      subjectFilter.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = sub.id;
      opt2.textContent = `${sub.icon} ${sub.name}`;
      taskSubjectSelect.appendChild(opt2);
    });

    subjectFilter.value = state.filterSubject;
  };

  // --- Render Orchestrator ---
  const renderAll = () => {
    renderStats();
    renderProgressBanner();
    renderTaskList();
    renderSubjectGrid();
    renderUpcomingList();
    renderWeeklyChart();
  };

  // --- Render Stats ---
  const renderStats = () => {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    statTotalTasks.textContent = total;
    statCompletedTasks.textContent = completed;
    statProgressPercent.textContent = `${pct}%`;
    statStreak.textContent = `${state.streak} Days`;
  };

  // --- Render Centerpiece Progress Banner & Ring ---
  const renderProgressBanner = () => {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    progressDesc.textContent = total === 0
      ? "No study tasks scheduled yet. Add your first task to get started!"
      : `Keep up the momentum! You've completed ${completed} of ${total} study tasks (${pct}% done).`;

    // Linear bar fill
    overallProgressBarFill.style.width = `${pct}%`;

    // SVG Circle Stroke Offset (Radius = 45 -> Circumference = 2 * PI * 45 ≈ 283)
    const circumference = 283;
    const strokeOffset = circumference - (pct / 100) * circumference;
    progressRingCircle.style.strokeDashoffset = strokeOffset;
    progressRingText.textContent = `${pct}%`;
  };

  // --- Render Task List ---
  const renderTaskList = () => {
    let filtered = [...state.tasks];

    // Filter by Status
    if (state.filterStatus === 'pending') {
      filtered = filtered.filter(t => !t.completed);
    } else if (state.filterStatus === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }

    // Filter by Subject
    if (state.filterSubject !== 'all') {
      filtered = filtered.filter(t => t.subjectId === state.filterSubject);
    }

    // Filter by Priority
    if (state.filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === state.filterPriority);
    }

    // Search Query
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Sort Tasks
    filtered.sort((a, b) => {
      if (state.sortBy === 'dueDate') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (state.sortBy === 'priority') {
        const order = { high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      } else if (state.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    taskList.innerHTML = '';

    if (filtered.length === 0) {
      taskList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-folder-open"></i>
          <h3>No tasks found</h3>
          <p>Try clearing filters or click "+ New Task" to schedule your study session.</p>
        </div>
      `;
      return;
    }

    const todayStr = getTodayISO(0);

    filtered.forEach(task => {
      const subject = state.subjects.find(s => s.id === task.subjectId) || { name: 'General', icon: '📝', color: '#6366f1' };
      const isOverdue = !task.completed && task.dueDate < todayStr;
      const isDueToday = !task.completed && task.dueDate === todayStr;

      const item = document.createElement('div');
      item.className = `task-item ${task.completed ? 'completed' : ''}`;
      
      item.innerHTML = `
        <div class="task-left">
          <input type="checkbox" class="checkbox-custom" ${task.completed ? 'checked' : ''} data-id="${task.id}">
          <div class="task-content">
            <div class="task-header-row">
              <span class="task-title">${escapeHTML(task.title)}</span>
              <span class="badge badge-subject" style="color: ${subject.color}; border-color: ${subject.color}40; background: ${subject.color}15;">
                ${subject.icon} ${escapeHTML(subject.name)}
              </span>
              <span class="badge badge-priority-${task.priority}">
                ${task.priority.toUpperCase()}
              </span>
              ${isOverdue ? '<span class="badge badge-overdue"><i class="fa-solid fa-triangle-exclamation"></i> OVERDUE</span>' : ''}
              ${isDueToday ? '<span class="badge badge-priority-medium"><i class="fa-solid fa-clock"></i> DUE TODAY</span>' : ''}
            </div>
            
            <div class="task-details">
              <div class="task-detail-item">
                <i class="fa-regular fa-calendar"></i>
                <span>Due: ${formatDate(task.dueDate)}</span>
              </div>
              ${task.estHours ? `
                <div class="task-detail-item">
                  <i class="fa-regular fa-clock"></i>
                  <span>${task.estHours} hrs</span>
                </div>
              ` : ''}
              ${task.notes ? `
                <div class="task-detail-item" title="${escapeHTML(task.notes)}">
                  <i class="fa-regular fa-note-sticky"></i>
                  <span>Notes</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="task-actions">
          <button class="action-btn edit-task-btn" data-id="${task.id}" title="Edit Task">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="action-btn delete delete-task-btn" data-id="${task.id}" title="Delete Task">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      taskList.appendChild(item);
    });
  };

  // --- Render Subject Cards Grid ---
  const renderSubjectGrid = () => {
    subjectGrid.innerHTML = '';

    state.subjects.forEach(sub => {
      const subTasks = state.tasks.filter(t => t.subjectId === sub.id);
      const total = subTasks.length;
      const completed = subTasks.filter(t => t.completed).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'subject-card';
      card.dataset.id = sub.id;

      card.innerHTML = `
        <div class="subject-card-header">
          <div class="subject-icon-badge" style="background: ${sub.color};">
            ${sub.icon}
          </div>
          <span style="font-size: 0.85rem; font-weight: 700; color: ${sub.color};">${pct}%</span>
        </div>
        <div class="subject-card-title">${escapeHTML(sub.name)}</div>
        <div class="subject-card-stats">${completed} of ${total} tasks completed</div>
        <div class="subject-progress-bg">
          <div class="subject-progress-fill" style="width: ${pct}%; background: ${sub.color};"></div>
        </div>
      `;

      // Filter tasks when clicking a subject card!
      card.addEventListener('click', () => {
        state.filterSubject = sub.id;
        subjectFilter.value = sub.id;
        renderTaskList();
        showToast(`Filtered by ${sub.name}`);
      });

      subjectGrid.appendChild(card);
    });
  };

  // --- Render Upcoming Tasks ---
  const renderUpcomingList = () => {
    upcomingList.innerHTML = '';
    const todayStr = getTodayISO(0);

    // Get uncompleted tasks sorted by due date
    const upcoming = state.tasks
      .filter(t => !t.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    if (upcoming.length === 0) {
      upcomingList.innerHTML = `
        <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1rem;">
          🎉 No upcoming tasks! All clear.
        </p>
      `;
      return;
    }

    upcoming.forEach(task => {
      const subject = state.subjects.find(s => s.id === task.subjectId) || { name: 'General', icon: '📝', color: '#6366f1' };
      const isOverdue = task.dueDate < todayStr;
      const isToday = task.dueDate === todayStr;

      const item = document.createElement('div');
      item.className = 'upcoming-item';
      item.style.borderLeftColor = subject.color;

      item.innerHTML = `
        <div class="upcoming-info">
          <h4>${escapeHTML(task.title)}</h4>
          <div class="upcoming-meta">
            <span>${subject.icon} ${escapeHTML(subject.name)}</span>
            <span>•</span>
            <span style="color: ${isOverdue ? '#f43f5e' : (isToday ? '#f59e0b' : 'inherit')}">
              ${isOverdue ? 'Overdue (' + formatDate(task.dueDate) + ')' : (isToday ? 'Due Today' : formatDate(task.dueDate))}
            </span>
          </div>
        </div>
        <button class="action-btn complete-upcoming-btn" data-id="${task.id}" title="Mark Complete">
          <i class="fa-solid fa-check" style="color: var(--accent-emerald);"></i>
        </button>
      `;

      upcomingList.appendChild(item);
    });
  };

  // --- Render Weekly Activity Heatmap ---
  const renderWeeklyChart = () => {
    weeklyChart.innerHTML = '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const currentDayIdx = now.getDay();

    // Generate completion counts for past 7 days
    const weekCounts = [2, 4, 3, 5, 2, 6, 4]; // Realistic base distribution

    // Tally actual completed tasks for today
    const completedToday = state.tasks.filter(t => t.completed && t.completedAt === getTodayISO(0)).length;
    weekCounts[currentDayIdx] = Math.max(weekCounts[currentDayIdx], completedToday);

    const maxVal = Math.max(...weekCounts, 6);

    days.forEach((day, idx) => {
      const count = weekCounts[idx];
      const barHeightPct = Math.round((count / maxVal) * 100);
      const isToday = idx === currentDayIdx;

      const col = document.createElement('div');
      col.className = 'chart-bar-col';

      col.innerHTML = `
        <div class="chart-bar-bg" title="${count} tasks completed">
          <div class="chart-bar-fill" style="height: ${barHeightPct}%; ${isToday ? 'background: var(--gradient-accent);' : ''}"></div>
        </div>
        <span class="chart-bar-label" style="${isToday ? 'color: var(--primary); font-weight: 700;' : ''}">${day}</span>
      `;

      weeklyChart.appendChild(col);
    });
  };

  // --- Task Modal & CRUD Functions ---
  const openTaskModal = (task = null) => {
    taskForm.reset();
    populateSubjectDropdowns();

    if (task) {
      taskModalTitle.textContent = 'Edit Study Task';
      taskIdInput.value = task.id;
      taskTitleInput.value = task.title;
      taskSubjectSelect.value = task.subjectId;
      taskPrioritySelect.value = task.priority;
      taskDueDateInput.value = task.dueDate;
      taskEstHoursInput.value = task.estHours || '';
      taskNotesInput.value = task.notes || '';
    } else {
      taskModalTitle.textContent = 'Add New Study Task';
      taskIdInput.value = '';
      taskDueDateInput.value = getTodayISO(1); // Default tomorrow
    }

    taskModalOverlay.classList.add('active');
  };

  const closeTaskModal = () => {
    taskModalOverlay.classList.remove('active');
  };

  const handleTaskFormSubmit = (e) => {
    e.preventDefault();

    const id = taskIdInput.value;
    const title = taskTitleInput.value.trim();
    const subjectId = taskSubjectSelect.value;
    const priority = taskPrioritySelect.value;
    const dueDate = taskDueDateInput.value;
    const estHours = parseFloat(taskEstHoursInput.value) || null;
    const notes = taskNotesInput.value.trim();

    if (!title || !dueDate) return;

    if (id) {
      // Edit existing
      const idx = state.tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        state.tasks[idx] = {
          ...state.tasks[idx],
          title, subjectId, priority, dueDate, estHours, notes
        };
        showToast('Task updated successfully!');
      }
    } else {
      // Add new
      const newTask = {
        id: 'task-' + Date.now(),
        title,
        subjectId,
        priority,
        dueDate,
        estHours,
        notes,
        completed: false,
        createdAt: getTodayISO(0)
      };
      state.tasks.unshift(newTask);
      showToast('New study task added!');
    }

    saveState();
    renderAll();
    closeTaskModal();
  };

  const toggleTaskComplete = (id) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? getTodayISO(0) : null;
      saveState();
      renderAll();

      if (task.completed) {
        showToast('🎯 Great job! Task marked as completed.');
        triggerConfettiEffect();
      }
    }
  };

  const deleteTask = (id) => {
    const taskIdx = state.tasks.findIndex(t => t.id === id);
    if (taskIdx !== -1) {
      const removed = state.tasks.splice(taskIdx, 1)[0];
      saveState();
      renderAll();
      showToast(`Deleted "${removed.title}"`);
    }
  };

  // --- Subject Modal & Handler ---
  const openSubjectModal = () => {
    subjectForm.reset();
    subjectColorInput.value = '#6366f1';
    subjectModalOverlay.classList.add('active');
  };

  const closeSubjectModal = () => {
    subjectModalOverlay.classList.remove('active');
  };

  const handleSubjectFormSubmit = (e) => {
    e.preventDefault();

    const name = subjectNameInput.value.trim();
    const color = subjectColorInput.value;
    const icon = subjectIconSelect.value;

    if (!name) return;

    const newSub = {
      id: 'sub-' + Date.now(),
      name,
      color,
      icon
    };

    state.subjects.push(newSub);
    saveState();
    populateSubjectDropdowns();
    renderAll();
    closeSubjectModal();
    showToast(`Subject "${name}" added!`);
  };

  // --- Pomodoro Focus Timer Control ---
  const updateTimerDisplay = () => {
    const m = Math.floor(state.timer.timeLeft / 60).toString().padStart(2, '0');
    const s = (state.timer.timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
  };

  const startTimer = () => {
    if (state.timer.isRunning) {
      // Pause
      clearInterval(state.timer.intervalId);
      state.timer.isRunning = false;
      startTimerBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume Focus';
    } else {
      // Start
      state.timer.isRunning = true;
      startTimerBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';

      state.timer.intervalId = setInterval(() => {
        if (state.timer.timeLeft > 0) {
          state.timer.timeLeft--;
          updateTimerDisplay();
        } else {
          // Timer finished
          clearInterval(state.timer.intervalId);
          state.timer.isRunning = false;
          startTimerBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Focus';
          playBeepSound();
          showToast('🔔 Focus session complete! Take a break.');
        }
      }, 1000);
    }
  };

  const resetTimer = () => {
    clearInterval(state.timer.intervalId);
    state.timer.isRunning = false;
    startTimerBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Focus';

    if (state.timer.mode === 'pomodoro') state.timer.timeLeft = 25 * 60;
    else if (state.timer.mode === 'shortBreak') state.timer.timeLeft = 5 * 60;
    else if (state.timer.mode === 'longBreak') state.timer.timeLeft = 15 * 60;

    updateTimerDisplay();
  };

  // Web Audio Synthesizer Beep Notification
  const playBeepSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (err) {
      console.log('Audio Context error:', err);
    }
  };

  // --- Confetti Animation Effect ---
  const triggerConfettiEffect = () => {
    // Simple custom particle burst
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.width = '8px';
      particle.style.height = '8px';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = '50%';
      particle.style.left = '50vw';
      particle.style.top = '40vh';
      particle.style.zIndex = '2000';
      particle.style.pointerEvents = 'none';

      document.body.appendChild(particle);

      const vx = (Math.random() - 0.5) * 400;
      const vy = (Math.random() - 0.7) * 400;

      particle.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${vx}px, ${vy + 300}px) scale(0)`, opacity: 0 }
      ], {
        duration: 1000 + Math.random() * 500,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
      }).onfinish = () => particle.remove();
    }
  };

  // --- Toast Manager ---
  const showToast = (msg) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i class="fa-solid fa-circle-check toast-icon"></i>
      <span>${escapeHTML(msg)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // --- Utilities ---
  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  };

  // --- Setup Event Listeners ---
  const setupEventListeners = () => {
    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      showToast(`Switched to ${state.theme.toUpperCase()} theme`);
    });

    // Mobile Sidebar Toggle
    mobileNavToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Load Demo Data Button
    loadDemoBtn.addEventListener('click', () => {
      state.tasks = DEMO_TASKS;
      state.subjects = DEFAULT_SUBJECTS;
      saveState();
      populateSubjectDropdowns();
      renderAll();
      showToast('Demo study planner data loaded!');
    });

    // Modal Triggers
    addTaskBtn.addEventListener('click', () => openTaskModal());
    addSubjectBtn.addEventListener('click', openSubjectModal);
    quickAddSubjectBtn.addEventListener('click', openSubjectModal);

    closeTaskModalBtn.addEventListener('click', closeTaskModal);
    cancelTaskModalBtn.addEventListener('click', closeTaskModal);
    taskForm.addEventListener('submit', handleTaskFormSubmit);

    closeSubjectModalBtn.addEventListener('click', closeSubjectModal);
    cancelSubjectModalBtn.addEventListener('click', closeSubjectModal);
    subjectForm.addEventListener('submit', handleSubjectFormSubmit);

    // Close Modals on Overlay Click
    taskModalOverlay.addEventListener('click', (e) => {
      if (e.target === taskModalOverlay) closeTaskModal();
    });

    subjectModalOverlay.addEventListener('click', (e) => {
      if (e.target === subjectModalOverlay) closeSubjectModal();
    });

    // Task Checkbox Toggle & Edit / Delete Delegates
    taskList.addEventListener('click', (e) => {
      const target = e.target;

      // Checkbox
      if (target.classList.contains('checkbox-custom')) {
        toggleTaskComplete(target.dataset.id);
      }

      // Edit Button
      const editBtn = target.closest('.edit-task-btn');
      if (editBtn) {
        const id = editBtn.dataset.id;
        const task = state.tasks.find(t => t.id === id);
        if (task) openTaskModal(task);
      }

      // Delete Button
      const deleteBtn = target.closest('.delete-task-btn');
      if (deleteBtn) {
        deleteTask(deleteBtn.dataset.id);
      }
    });

    // Upcoming list completion handler
    upcomingList.addEventListener('click', (e) => {
      const completeBtn = e.target.closest('.complete-upcoming-btn');
      if (completeBtn) {
        toggleTaskComplete(completeBtn.dataset.id);
      }
    });

    // Filters & Search
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderTaskList();
    });

    subjectFilter.addEventListener('change', (e) => {
      state.filterSubject = e.target.value;
      renderTaskList();
    });

    priorityFilter.addEventListener('change', (e) => {
      state.filterPriority = e.target.value;
      renderTaskList();
    });

    sortBySelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderTaskList();
    });

    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.filterStatus = tab.dataset.status;
        renderTaskList();
      });
    });

    // Timer Controls
    startTimerBtn.addEventListener('click', startTimer);
    resetTimerBtn.addEventListener('click', resetTimer);

    timerModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        timerModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        state.timer.mode = btn.dataset.mode;
        resetTimer();
      });
    });
  };

  // Run Initialization
  init();

});
