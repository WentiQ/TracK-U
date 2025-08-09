// Focus Timer (Pomodoro) - Vanilla JS, localStorage, styled for this app
// Audio files should be placed in /assets/sounds/ as per your note

const DEFAULT_SOUND = "assets/sounds/default-pomodoro.mp3";
const VOICE_SOUNDS = {
  "Focus timer ended": "assets/sounds/voice-focus-ended.mp3",
  "Short break ended": "assets/sounds/voice-short-break-ended.mp3",
  "Long break ended": "assets/sounds/voice-long-break-ended.mp3",
  "Focus Time": "assets/sounds/voice-focus-begin.mp3",
  "Short break time": "assets/sounds/voice-short-break-begin.mp3",
  "Long break time": "assets/sounds/voice-long-break-begin.mp3"
};
const SETTINGS_KEY = "pomodoro-settings-v1";
const SESSIONS_KEY = "pomodoro-sessions-v1";
const STATE_KEY = "pomodoro-state-v1";
const LAST_TIMESTAMP_KEY = "pomodoro-last-timestamp-v1";

// Global state
let currentSettings = null;
let currentSession = "work";
let timeLeft = 0;
let isRunning = false;
let completedPomodoros = 0;
let totalSessions = 0;
let currentTask = "";
let sessions = [];
let timerInterval = null;
let firstFocusStarted = false;
let customSound = null;
let activeTab = "timer";

function getDefaultSettings() {
  return {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    soundVolume: 50,
    theme: "classic",
    notificationSoundType: "default",
    voiceSoundSelection: "Focus timer ended",
    customSoundDataUrl: null
  };
}

function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return getDefaultSettings();
  try {
    return { ...getDefaultSettings(), ...JSON.parse(raw) };
  } catch {
    return getDefaultSettings();
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSessions() {
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function loadState() {
  const raw = localStorage.getItem(STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadLastTimestamp() {
  const raw = localStorage.getItem(LAST_TIMESTAMP_KEY);
  if (!raw) return null;
  return Number(raw);
}

function saveLastTimestamp(timestamp) {
  localStorage.setItem(LAST_TIMESTAMP_KEY, String(timestamp));
}

// Timer logic
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function getSessionDuration() {
  switch (currentSession) {
    case "work":
      return currentSettings.workDuration * 60;
    case "shortBreak":
      return currentSettings.shortBreakDuration * 60;
    case "longBreak":
      return currentSettings.longBreakDuration * 60;
  }
}

function playNotificationSound(phase, sessionType) {
  if (!currentSettings.soundEnabled) return;
  
  let soundSrc;
  
  if (currentSettings.notificationSoundType === "custom" && customSound) {
    soundSrc = customSound;
  } else if (currentSettings.notificationSoundType === "voice") {
    let key = "";
    if (phase === "begin") {
      if (sessionType === "work") key = "Focus Time";
      if (sessionType === "shortBreak") key = "Short break time";
      if (sessionType === "longBreak") key = "Long break time";
    } else if (phase === "ended") {
      if (sessionType === "work") key = "Focus timer ended";
      if (sessionType === "shortBreak") key = "Short break ended";
      if (sessionType === "longBreak") key = "Long break ended";
    }
    soundSrc = VOICE_SOUNDS[key];
  } else {
    soundSrc = DEFAULT_SOUND;
  }
  
  if (soundSrc) {
    const audio = new Audio(soundSrc);
    audio.volume = currentSettings.soundVolume / 100;
    audio.play().catch(console.error);
  }
  
  if ("vibrate" in navigator) {
    navigator.vibrate([400, 200, 400]);
  }
}

function handleSessionComplete() {
  isRunning = false;
  
  // Play notification sound
  playNotificationSound("ended", currentSession);
  
  // Show browser notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(
      `${currentSession === "work" ? "Work" : "Break"} session completed!`,
      {
        body: currentSession === "work" ? "Time for a break!" : "Ready to get back to work?",
        icon: "/favicon.ico"
      }
    );
  }
  
  // Record session
  const session = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    type: currentSession,
    duration: currentSession === "work" ? currentSettings.workDuration : 
             currentSession === "shortBreak" ? currentSettings.shortBreakDuration : 
             currentSettings.longBreakDuration,
    completedAt: new Date().toISOString(),
    task: currentTask
  };
  sessions.unshift(session);
  saveSessions(sessions);
  
  // Update counters
  if (currentSession === "work") {
    completedPomodoros++;
    const nextSession = (completedPomodoros % currentSettings.longBreakInterval === 0) ? "longBreak" : "shortBreak";
    totalSessions++;
    
    if (currentSettings.autoStartBreaks) {
      setTimeout(() => {
        currentSession = nextSession;
        timeLeft = getSessionDuration();
        isRunning = true;
        startTimer();
        renderTimer();
      }, 1000);
    } else {
      currentSession = nextSession;
      timeLeft = getSessionDuration();
    }
  } else {
    totalSessions++;
    if (currentSettings.autoStartPomodoros) {
      setTimeout(() => {
        currentSession = "work";
        timeLeft = getSessionDuration();
        isRunning = true;
        startTimer();
        renderTimer();
      }, 1000);
    } else {
      currentSession = "work";
      timeLeft = getSessionDuration();
    }
  }
  
  saveCurrentState();
  renderTimer();
  if (activeTab === "stats") renderStats();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleSessionComplete();
      return;
    }
    timeLeft--;
    renderTimer();
    saveLastTimestamp(Date.now());
  }, 1000);
  
  saveLastTimestamp(Date.now());
}

function toggleTimer() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
  
  isRunning = !isRunning;
  
  if (isRunning) {
    if (currentSession === "work" && !firstFocusStarted) {
      firstFocusStarted = true;
      playNotificationSound("begin", "work");
    }
    startTimer();
  } else {
    if (timerInterval) clearInterval(timerInterval);
  }
  
  saveCurrentState();
  renderTimer();
}

function resetTimer() {
  isRunning = false;
  if (timerInterval) clearInterval(timerInterval);
  currentSession = "work";
  timeLeft = currentSettings.workDuration * 60;
  firstFocusStarted = false;
  saveCurrentState();
  renderTimer();
}

function skipSession() {
  if (timerInterval) clearInterval(timerInterval);
  timeLeft = 0;
  handleSessionComplete();
}

function saveCurrentState() {
  saveState({
    currentSession,
    timeLeft,
    isRunning,
    completedPomodoros,
    totalSessions,
    currentTask,
    firstFocusStarted
  });
}

// Analytics functions
function getStatsForPeriod(startDate, endDate) {
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.completedAt);
    return sessionDate >= startDate && sessionDate <= endDate;
  });
  
  const workSessions = filteredSessions.filter(s => s.type === "work");
  const breakSessions = filteredSessions.filter(s => s.type !== "work");
  const totalFocusTime = workSessions.reduce((sum, s) => sum + s.duration, 0);
  
  return {
    pomodoros: workSessions.length,
    focusTime: totalFocusTime,
    breaks: breakSessions.length,
    sessions: filteredSessions
  };
}

function getTodayStats() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return getStatsForPeriod(startOfDay, endOfDay);
}

function getThisWeekStats() {
  const now = new Date();
  const firstDay = new Date(now);
  firstDay.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  firstDay.setHours(0, 0, 0, 0);
  const lastDay = new Date(firstDay);
  lastDay.setDate(firstDay.getDate() + 7);
  return getStatsForPeriod(firstDay, lastDay);
}

function getThisMonthStats() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return getStatsForPeriod(firstDay, lastDay);
}

function getThisYearStats() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const lastDay = new Date(now.getFullYear() + 1, 0, 1);
  return getStatsForPeriod(firstDay, lastDay);
}

// UI Rendering
function renderTimer() {
  const timerSection = document.querySelector('#focus-timer-app');
  if (!timerSection) return;
  
  const progress = ((getSessionDuration() - timeLeft) / getSessionDuration()) * 100;
  const sessionColor = currentSession === "work" ? "from-red-500 to-orange-500" : 
                      currentSession === "shortBreak" ? "from-green-500 to-teal-500" : 
                      "from-blue-500 to-purple-500";
  
  const sessionTitle = currentSession === "work" ? "Focus Time" : 
                      currentSession === "shortBreak" ? "Short Break" : "Long Break";
  
  const sessionIcon = currentSession === "work" ? "🧠" : "☕";
  
  timerSection.innerHTML = `
    <div class="focus-timer-tabs">
      <button class="focus-timer-tab ${activeTab === 'timer' ? 'active' : ''}" onclick="switchTab('timer')">Timer</button>
      <button class="focus-timer-tab ${activeTab === 'settings' ? 'active' : ''}" onclick="switchTab('settings')">Settings</button>
      <button class="focus-timer-tab ${activeTab === 'stats' ? 'active' : ''}" onclick="switchTab('stats')">Statistics</button>
    </div>
    
    <div id="timer-content" style="display: ${activeTab === 'timer' ? 'block' : 'none'}">
      <div class="focus-timer-header session-${currentSession}">
        <div class="focus-timer-title">
          ${sessionIcon} ${sessionTitle}
        </div>
        <div class="focus-timer-desc">${currentTask || "Stay focused and productive"}</div>
      </div>
      
      <div class="focus-timer-timer">${formatTime(timeLeft)}</div>
      
      <div class="focus-timer-progress">
        <div class="focus-timer-progress-bar" style="width: ${progress}%"></div>
      </div>
      
      <div class="focus-timer-controls">
        <button class="focus-timer-btn" onclick="toggleTimer()">
          ${isRunning ? "⏸️ Pause" : "▶️ Start"}
        </button>
        <button class="focus-timer-btn" onclick="resetTimer()">🔄 Reset</button>
        <button class="focus-timer-btn" onclick="skipSession()">⏭️ Skip</button>
      </div>
      
      <div class="focus-timer-indicators">
        ${Array.from({ length: currentSettings.longBreakInterval }, (_, i) => 
          `<div class="indicator ${i < completedPomodoros % currentSettings.longBreakInterval ? 'completed' : ''}"></div>`
        ).join('')}
      </div>
      
      <div class="focus-timer-task">
        <label>Current Task:</label>
        <input type="text" id="current-task" value="${currentTask}" 
               onchange="currentTask = this.value; saveCurrentState(); renderTimer()" 
               placeholder="What are you working on?">
      </div>
      
      <div class="focus-timer-today-stats">
        <div class="stat-card">
          <div class="stat-value">${getTodayStats().pomodoros}</div>
          <div class="stat-label">Today's Pomodoros</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.floor(getTodayStats().focusTime / 60)}h ${getTodayStats().focusTime % 60}m</div>
          <div class="stat-label">Focus Time</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${getTodayStats().breaks}</div>
          <div class="stat-label">Breaks</div>
        </div>
      </div>
    </div>
    
    <div id="settings-content" style="display: ${activeTab === 'settings' ? 'block' : 'none'}">
      ${renderSettings()}
    </div>
    
    <div id="stats-content" style="display: ${activeTab === 'stats' ? 'block' : 'none'}">
      ${renderStats()}
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="focus-timer-settings">
      <h3>Timer Settings</h3>
      
      <div class="setting-group">
        <label>Work Duration (minutes):</label>
        <input type="number" value="${currentSettings.workDuration}" min="1" max="60" 
               onchange="updateSetting('workDuration', parseInt(this.value))">
      </div>
      
      <div class="setting-group">
        <label>Short Break (minutes):</label>
        <input type="number" value="${currentSettings.shortBreakDuration}" min="1" max="30" 
               onchange="updateSetting('shortBreakDuration', parseInt(this.value))">
      </div>
      
      <div class="setting-group">
        <label>Long Break (minutes):</label>
        <input type="number" value="${currentSettings.longBreakDuration}" min="1" max="60" 
               onchange="updateSetting('longBreakDuration', parseInt(this.value))">
      </div>
      
      <div class="setting-group">
        <label>Long Break Interval:</label>
        <select onchange="updateSetting('longBreakInterval', parseInt(this.value))">
          <option value="2" ${currentSettings.longBreakInterval === 2 ? 'selected' : ''}>Every 2 pomodoros</option>
          <option value="3" ${currentSettings.longBreakInterval === 3 ? 'selected' : ''}>Every 3 pomodoros</option>
          <option value="4" ${currentSettings.longBreakInterval === 4 ? 'selected' : ''}>Every 4 pomodoros</option>
          <option value="5" ${currentSettings.longBreakInterval === 5 ? 'selected' : ''}>Every 5 pomodoros</option>
        </select>
      </div>
      
      <div class="setting-group">
        <label>
          <input type="checkbox" ${currentSettings.autoStartBreaks ? 'checked' : ''} 
                 onchange="updateSetting('autoStartBreaks', this.checked)">
          Auto-start breaks
        </label>
      </div>
      
      <div class="setting-group">
        <label>
          <input type="checkbox" ${currentSettings.autoStartPomodoros ? 'checked' : ''} 
                 onchange="updateSetting('autoStartPomodoros', this.checked)">
          Auto-start pomodoros
        </label>
      </div>
      
      <div class="setting-group">
        <label>
          <input type="checkbox" ${currentSettings.soundEnabled ? 'checked' : ''} 
                 onchange="updateSetting('soundEnabled', this.checked)">
          Sound notifications
        </label>
      </div>
      
      ${currentSettings.soundEnabled ? `
        <div class="setting-group">
          <label>Volume: ${currentSettings.soundVolume}%</label>
          <input type="range" min="0" max="100" value="${currentSettings.soundVolume}" 
                 onchange="updateSetting('soundVolume', parseInt(this.value))">
        </div>
        
        <div class="setting-group">
          <label>Notification Sound:</label>
          <select onchange="updateSetting('notificationSoundType', this.value)">
            <option value="default" ${currentSettings.notificationSoundType === 'default' ? 'selected' : ''}>Default Sound</option>
            <option value="custom" ${currentSettings.notificationSoundType === 'custom' ? 'selected' : ''}>Custom Sound</option>
            <option value="voice" ${currentSettings.notificationSoundType === 'voice' ? 'selected' : ''}>Voice Notification</option>
          </select>
        </div>
        
        ${currentSettings.notificationSoundType === 'custom' ? `
          <div class="setting-group">
            <label>Custom Sound:</label>
            <input type="file" accept="audio/*" onchange="handleSoundUpload(this)">
            ${customSound ? `<audio controls src="${customSound}"></audio>` : ''}
          </div>
        ` : ''}
      ` : ''}
    </div>
  `;
}

function renderStats() {
  const todayStats = getTodayStats();
  const weekStats = getThisWeekStats();
  const monthStats = getThisMonthStats();
  const yearStats = getThisYearStats();
  
  return `
    <div class="focus-timer-stats">
      <h3>Statistics</h3>
      
      <div class="stats-period-selector">
        <button onclick="showCustomDateRange()">Custom Range</button>
      </div>
      
      <div class="stats-grid">
        <div class="stats-period">
          <h4>Today</h4>
          <div class="stat-item">🍅 ${todayStats.pomodoros} pomodoros</div>
          <div class="stat-item">⏱️ ${Math.floor(todayStats.focusTime / 60)}h ${todayStats.focusTime % 60}m focus</div>
          <div class="stat-item">☕ ${todayStats.breaks} breaks</div>
        </div>
        
        <div class="stats-period">
          <h4>This Week</h4>
          <div class="stat-item">🍅 ${weekStats.pomodoros} pomodoros</div>
          <div class="stat-item">⏱️ ${Math.floor(weekStats.focusTime / 60)}h ${weekStats.focusTime % 60}m focus</div>
          <div class="stat-item">☕ ${weekStats.breaks} breaks</div>
        </div>
        
        <div class="stats-period">
          <h4>This Month</h4>
          <div class="stat-item">🍅 ${monthStats.pomodoros} pomodoros</div>
          <div class="stat-item">⏱️ ${Math.floor(monthStats.focusTime / 60)}h ${monthStats.focusTime % 60}m focus</div>
          <div class="stat-item">☕ ${monthStats.breaks} breaks</div>
        </div>
        
        <div class="stats-period">
          <h4>This Year</h4>
          <div class="stat-item">🍅 ${yearStats.pomodoros} pomodoros</div>
          <div class="stat-item">⏱️ ${Math.floor(yearStats.focusTime / 60)}h ${yearStats.focusTime % 60}m focus</div>
          <div class="stat-item">☕ ${yearStats.breaks} breaks</div>
        </div>
      </div>
      
      <div class="recent-sessions">
        <h4>Recent Sessions</h4>
        <div class="sessions-list">
          ${sessions.slice(0, 10).map(session => `
            <div class="session-item">
              <span class="session-type">${session.type === 'work' ? '🧠' : '☕'} ${
                session.type === 'work' ? 'Work' : 
                session.type === 'shortBreak' ? 'Short Break' : 'Long Break'
              }</span>
              <span class="session-duration">${session.duration}m</span>
              <span class="session-date">${new Date(session.completedAt).toLocaleString()}</span>
              ${session.task ? `<span class="session-task">${session.task}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Event handlers
function switchTab(tab) {
  activeTab = tab;
  renderTimer();
}

function updateSetting(key, value) {
  currentSettings[key] = value;
  saveSettings(currentSettings);
  
  // Update timer if duration changed
  if (['workDuration', 'shortBreakDuration', 'longBreakDuration'].includes(key) && !isRunning) {
    timeLeft = getSessionDuration();
  }
  
  renderTimer();
}

function handleSoundUpload(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      customSound = event.target.result;
      currentSettings.customSoundDataUrl = customSound;
      saveSettings(currentSettings);
      renderTimer();
    };
    reader.readAsDataURL(file);
  }
}

function showCustomDateRange() {
  const startDate = prompt("Enter start date (YYYY-MM-DD):");
  const endDate = prompt("Enter end date (YYYY-MM-DD):");
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1); // Include end date
    
    const customStats = getStatsForPeriod(start, end);
    alert(`Custom Range Stats:\n🍅 ${customStats.pomodoros} pomodoros\n⏱️ ${Math.floor(customStats.focusTime / 60)}h ${customStats.focusTime % 60}m focus\n☕ ${customStats.breaks} breaks`);
  }
}

// Initialize
function initializeFocusTimer() {
  currentSettings = loadSettings();
  sessions = loadSessions();
  customSound = currentSettings.customSoundDataUrl;
  
  // Restore state
  const state = loadState();
  const lastTimestamp = loadLastTimestamp();
  
  if (state) {
    currentSession = state.currentSession;
    completedPomodoros = state.completedPomodoros;
    totalSessions = state.totalSessions;
    currentTask = state.currentTask;
    firstFocusStarted = state.firstFocusStarted;
    
    // Restore time left based on elapsed time if was running
    if (lastTimestamp && state.isRunning && state.timeLeft > 0) {
      const now = Date.now();
      const elapsed = Math.floor((now - lastTimestamp) / 1000);
      const newTimeLeft = state.timeLeft - elapsed;
      
      if (newTimeLeft > 0) {
        timeLeft = newTimeLeft;
        isRunning = true;
        startTimer();
      } else {
        timeLeft = 0;
        handleSessionComplete();
      }
    } else {
      timeLeft = state.timeLeft;
      isRunning = state.isRunning;
    }
  } else {
    timeLeft = currentSettings.workDuration * 60;
  }
  
  renderTimer();
}

// Global functions for HTML onclick handlers
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.skipSession = skipSession;
window.switchTab = switchTab;
window.updateSetting = updateSetting;
window.handleSoundUpload = handleSoundUpload;
window.showCustomDateRange = showCustomDateRange;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initializeFocusTimer);
