// Spiritual tracking functionality
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Initialize spiritual data for today
function initializeSpiritualData() {
  const today = getToday();
  const spiritualData = JSON.parse(localStorage.getItem('spiritualData')) || {};
  
  if (!spiritualData[today]) {
    spiritualData[today] = {
      wakeupTime: null,
      wakeupScore: 0,
      targetRounds: 16,
      completedRounds: 0,
      chantingScore: 0,
      mangalaArati: false,
      mangalaScore: 0,
      narasimhaArati: false,
      narasimhaScore: 0,
      tulasiArati: false,
      tulasiScore: 0,
      targetReading: 30,
      actualReading: 0,
      readingScore: 0,
      freshClothes: null,
      clothesScore: 0,
      washingClothes: false,
      washingScore: 0,
      roomCleaning: false,
      cleaningScore: 0,
      sleepTime: null,
      sleepScore: 0,
      totalScore: 0
    };
  }
  
  return spiritualData;
}

// Save spiritual data
function saveSpiritualData(data) {
  localStorage.setItem('spiritualData', JSON.stringify(data));
}

// Calculate wake-up time score
function calculateWakeupScore(wakeupTime) {
  if (!wakeupTime) return 0;
  
  const [hours, minutes] = wakeupTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // Before 4:00 AM (0-240 minutes) = 100 points
  if (totalMinutes <= 240) return 100;
  // Before 4:15 AM (241-255 minutes) = 75 points
  if (totalMinutes <= 255) return 75;
  // Before 4:30 AM (256-270 minutes) = 50 points
  if (totalMinutes <= 270) return 50;
  // After 4:30 AM = 0 points
  return 0;
}

// Calculate chanting score
function calculateChantingScore(completed, target) {
  if (target === 0) return 0;
  const percentage = Math.min(completed / target, 1);
  return Math.round(percentage * 100);
}

// Calculate reading score
function calculateReadingScore(actual, target) {
  if (target === 0) return 0;
  const percentage = Math.min(actual / target, 1);
  return Math.round(percentage * 100);
}

// Calculate sleep time score
function calculateSleepScore(sleepTime) {
  if (!sleepTime) return 0;
  
  const [hours, minutes] = sleepTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // Before 21:00 (9:00 PM) = 100 points
  if (totalMinutes <= 1260) return 100;
  // Before 21:15 (9:15 PM) = 75 points
  if (totalMinutes <= 1275) return 75;
  // Before 21:30 (9:30 PM) = 50 points
  if (totalMinutes <= 1290) return 50;
  // After 21:30 (9:30 PM) = 0 points
  return 0;
}

// Calculate total spiritual score
function calculateTotalSpiritualScore(data) {
  const today = getToday();
  const todayData = data[today];
  
  if (!todayData) return 0;
  
  // Each category has equal weight (10 points each for 10 categories = 100 total)
  const scores = [
    todayData.wakeupScore * 0.1,      // 10% weight
    todayData.chantingScore * 0.1,    // 10% weight
    todayData.mangalaScore * 0.1,     // 10% weight
    todayData.narasimhaScore * 0.1,   // 10% weight
    todayData.tulasiScore * 0.1,      // 10% weight
    todayData.readingScore * 0.1,     // 10% weight
    todayData.clothesScore * 0.1,     // 10% weight
    todayData.washingScore * 0.1,     // 10% weight
    todayData.cleaningScore * 0.1,    // 10% weight
    todayData.sleepScore * 0.1        // 10% weight
  ];
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0));
}

// Update display
function updateSpiritualDisplay() {
  const data = initializeSpiritualData();
  const today = getToday();
  const todayData = data[today];
  
  // Update individual scores
  document.getElementById('wakeup-score').textContent = todayData.wakeupScore;
  document.getElementById('chanting-score').textContent = todayData.chantingScore;
  document.getElementById('mangala-score').textContent = todayData.mangalaScore;
  document.getElementById('narasimha-score').textContent = todayData.narasimhaScore;
  document.getElementById('tulasi-score').textContent = todayData.tulasiScore;
  document.getElementById('reading-score').textContent = todayData.readingScore;
  document.getElementById('clothes-score').textContent = todayData.clothesScore;
  document.getElementById('washing-score').textContent = todayData.washingScore;
  document.getElementById('cleaning-score').textContent = todayData.cleaningScore;
  document.getElementById('sleep-score').textContent = todayData.sleepScore;
  
  // Calculate and update total score
  todayData.totalScore = calculateTotalSpiritualScore(data);
  document.getElementById('total-spiritual-score').textContent = todayData.totalScore;
  
  // Update form values
  if (todayData.wakeupTime) {
    document.getElementById('wakeup-time').value = todayData.wakeupTime;
  }
  
  document.getElementById('target-rounds').value = todayData.targetRounds;
  document.getElementById('completed-rounds').value = todayData.completedRounds;
  
  document.getElementById('mangala-arati').checked = todayData.mangalaArati;
  document.getElementById('narasimha-arati').checked = todayData.narasimhaArati;
  document.getElementById('tulasi-arati').checked = todayData.tulasiArati;
  
  document.getElementById('target-reading').value = todayData.targetReading;
  document.getElementById('actual-reading').value = todayData.actualReading;
  
  if (todayData.freshClothes !== null) {
    const clothesRadio = document.querySelector(`input[name="clothes-status"][value="${todayData.freshClothes ? 'all-fresh' : 'not-all-fresh'}"]`);
    if (clothesRadio) clothesRadio.checked = true;
  }
  
  document.getElementById('washing-clothes').checked = todayData.washingClothes;
  document.getElementById('room-cleaning').checked = todayData.roomCleaning;
  
  if (todayData.sleepTime) {
    document.getElementById('sleep-time').value = todayData.sleepTime;
  }
  
  // Save updated data
  saveSpiritualData(data);
  
  // Update status displays
  updateStatusDisplays(todayData);
}

// Update status displays with color coding
function updateStatusDisplays(todayData) {
  updateWakeupStatus(todayData.wakeupScore);
  updateChantingStatus(todayData.chantingScore, todayData.completedRounds, todayData.targetRounds);
  updateAratiStatus('mangala', todayData.mangalaArati);
  updateAratiStatus('narasimha', todayData.narasimhaArati);
  updateAratiStatus('tulasi', todayData.tulasiArati);
  updateReadingStatus(todayData.readingScore, todayData.actualReading, todayData.targetReading);
  updateClothesStatus(todayData.clothesScore);
  updateWashingStatus(todayData.washingClothes);
  updateCleaningStatus(todayData.roomCleaning);
  updateSleepStatus(todayData.sleepScore);
}

function updateWakeupStatus(score) {
  const statusDiv = document.getElementById('wakeup-status');
  if (score === 100) {
    statusDiv.className = 'status-display excellent';
    statusDiv.textContent = 'Excellent! Woke up before 4:00 AM';
  } else if (score === 75) {
    statusDiv.className = 'status-display good';
    statusDiv.textContent = 'Good! Woke up before 4:15 AM';
  } else if (score === 50) {
    statusDiv.className = 'status-display fair';
    statusDiv.textContent = 'Fair. Woke up before 4:30 AM';
  } else if (score === 0) {
    statusDiv.className = 'status-display poor';
    statusDiv.textContent = 'Poor. Woke up after 4:30 AM';
  } else {
    statusDiv.className = 'status-display';
    statusDiv.textContent = 'Please log your wake-up time';
  }
}

function updateChantingStatus(score, completed, target) {
  const statusDiv = document.getElementById('chanting-status');
  if (score === 100) {
    statusDiv.className = 'status-display excellent';
    statusDiv.textContent = `Perfect! Completed ${completed}/${target} rounds`;
  } else if (score >= 80) {
    statusDiv.className = 'status-display good';
    statusDiv.textContent = `Great! Completed ${completed}/${target} rounds (${score}%)`;
  } else if (score >= 50) {
    statusDiv.className = 'status-display fair';
    statusDiv.textContent = `Good effort! Completed ${completed}/${target} rounds (${score}%)`;
  } else if (score > 0) {
    statusDiv.className = 'status-display poor';
    statusDiv.textContent = `Keep trying! Completed ${completed}/${target} rounds (${score}%)`;
  } else {
    statusDiv.className = 'status-display';
    statusDiv.textContent = 'Please log your chanting rounds';
  }
}

function updateAratiStatus(type, attended) {
  const statusDiv = document.getElementById(`${type}-status`);
  if (attended) {
    statusDiv.className = 'status-display excellent';
    statusDiv.textContent = 'Attended! +100 points';
  } else {
    statusDiv.className = 'status-display poor';
    statusDiv.textContent = 'Not attended. 0 points';
  }
}

function updateReadingStatus(score, actual, target) {
  const statusDiv = document.getElementById('reading-status');
  if (score === 100) {
    statusDiv.className = 'status-display excellent';
    statusDiv.textContent = `Perfect! Read for ${actual}/${target} minutes`;
  } else if (score >= 80) {
    statusDiv.className = 'status-display good';
    statusDiv.textContent = `Great! Read for ${actual}/${target} minutes (${score}%)`;
  } else if (score >= 50) {
    statusDiv.className = 'status-display fair';
    statusDiv.textContent = `Good effort! Read for ${actual}/${target} minutes (${score}%)`;
  } else if (score > 0) {
    statusDiv.className = 'status-display poor';
    statusDiv.textContent = `Keep trying! Read for ${actual}/${target} minutes (${score}%)`;
  } else {
    statusDiv.className = 'status-display';
    statusDiv.textContent = 'Please log your reading time';
  }
}

function updateClothesStatus(score) {
  const statusDiv = document.getElementById('clothes-status');
  if (score === 100) {
    statusDiv.className = 'status-display excellent';
    statusDiv.textContent = 'Perfect! All clothes are fresh after bath';
  } else {
    statusDiv.className = 'status-display poor';
    statusDiv.textContent = 'At least one item is not fresh. 0 points';
  }
}

function updateWashingStatus(washed) {
  const statusDiv = document.getElementById('washing-status');
  if (washed) {
    statusDiv.className = 'status-display excellent';
    statusDiv.textContent = 'Great! Washed own clothes today';
  } else {
    statusDiv.className = 'status-display poor';
    statusDiv.textContent = 'Did not wash own clothes today';
  }
}

function updateCleaningStatus(cleaned) {
  const statusDiv = document.getElementById('cleaning-status');
  if (cleaned) {
    statusDiv.className = 'status-display excellent';
    statusDiv.textContent = 'Excellent! Cleaned personal room today';
  } else {
    statusDiv.className = 'status-display poor';
    statusDiv.textContent = 'Did not clean personal room today';
  }
}

function updateSleepStatus(score) {
  const statusDiv = document.getElementById('sleep-status');
  if (score === 100) {
    statusDiv.className = 'status-display excellent';
    statusDiv.textContent = 'Perfect! Slept before 9:00 PM';
  } else if (score === 75) {
    statusDiv.className = 'status-display good';
    statusDiv.textContent = 'Good! Slept before 9:15 PM';
  } else if (score === 50) {
    statusDiv.className = 'status-display fair';
    statusDiv.textContent = 'Fair. Slept before 9:30 PM';
  } else if (score === 0) {
    statusDiv.className = 'status-display poor';
    statusDiv.textContent = 'Poor. Slept after 9:30 PM';
  } else {
    statusDiv.className = 'status-display';
    statusDiv.textContent = 'Please log your sleep time';
  }
}

// Event handlers
function logWakeupTime() {
  const wakeupTime = document.getElementById('wakeup-time').value;
  if (!wakeupTime) {
    alert('Please select a wake-up time');
    return;
  }
  
  const data = initializeSpiritualData();
  const today = getToday();
  
  data[today].wakeupTime = wakeupTime;
  data[today].wakeupScore = calculateWakeupScore(wakeupTime);
  
  saveSpiritualData(data);
  updateSpiritualDisplay();
}

function logChantingRounds() {
  const targetRounds = parseInt(document.getElementById('target-rounds').value) || 0;
  const completedRounds = parseInt(document.getElementById('completed-rounds').value) || 0;
  
  if (targetRounds <= 0) {
    alert('Please set a valid target for chanting rounds');
    return;
  }
  
  const data = initializeSpiritualData();
  const today = getToday();
  
  data[today].targetRounds = targetRounds;
  data[today].completedRounds = completedRounds;
  data[today].chantingScore = calculateChantingScore(completedRounds, targetRounds);
  
  saveSpiritualData(data);
  updateSpiritualDisplay();
}

function logAratiAttendance(type) {
  const checkbox = document.getElementById(`${type}-arati`);
  const attended = checkbox.checked;
  
  const data = initializeSpiritualData();
  const today = getToday();
  
  data[today][`${type}Arati`] = attended;
  data[today][`${type}Score`] = attended ? 100 : 0;
  
  saveSpiritualData(data);
  updateSpiritualDisplay();
}

function logReadingTime() {
  const targetReading = parseInt(document.getElementById('target-reading').value) || 0;
  const actualReading = parseInt(document.getElementById('actual-reading').value) || 0;
  
  if (targetReading <= 0) {
    alert('Please set a valid target for reading time');
    return;
  }
  
  const data = initializeSpiritualData();
  const today = getToday();
  
  data[today].targetReading = targetReading;
  data[today].actualReading = actualReading;
  data[today].readingScore = calculateReadingScore(actualReading, targetReading);
  
  saveSpiritualData(data);
  updateSpiritualDisplay();
}

function logClothesStatus() {
  const clothesStatus = document.querySelector('input[name="clothes-status"]:checked');
  if (!clothesStatus) return;
  
  const allFresh = clothesStatus.value === 'all-fresh';
  
  const data = initializeSpiritualData();
  const today = getToday();
  
  data[today].freshClothes = allFresh;
  data[today].clothesScore = allFresh ? 100 : 0;
  
  saveSpiritualData(data);
  updateSpiritualDisplay();
}

function logWashingClothes() {
  const checkbox = document.getElementById('washing-clothes');
  const washed = checkbox.checked;
  
  const data = initializeSpiritualData();
  const today = getToday();
  
  data[today].washingClothes = washed;
  data[today].washingScore = washed ? 100 : 0;
  
  saveSpiritualData(data);
  updateSpiritualDisplay();
}

function logRoomCleaning() {
  const checkbox = document.getElementById('room-cleaning');
  const cleaned = checkbox.checked;
  
  const data = initializeSpiritualData();
  const today = getToday();
  
  data[today].roomCleaning = cleaned;
  data[today].cleaningScore = cleaned ? 100 : 0;
  
  saveSpiritualData(data);
  updateSpiritualDisplay();
}

function logSleepTime() {
  const sleepTime = document.getElementById('sleep-time').value;
  if (!sleepTime) {
    alert('Please select a sleep time');
    return;
  }
  
  const data = initializeSpiritualData();
  const today = getToday();
  
  data[today].sleepTime = sleepTime;
  data[today].sleepScore = calculateSleepScore(sleepTime);
  
  saveSpiritualData(data);
  updateSpiritualDisplay();
}

// Load spiritual history
function loadSpiritualHistory() {
  const data = JSON.parse(localStorage.getItem('spiritualData')) || {};
  const historyContainer = document.getElementById('spiritual-history');
  
  const dates = Object.keys(data).sort().reverse().slice(0, 7); // Last 7 days
  
  if (dates.length === 0) {
    historyContainer.innerHTML = '<p>No spiritual tracking history yet.</p>';
    return;
  }
  
  historyContainer.innerHTML = '';
  
  dates.forEach(date => {
    const dayData = data[date];
    const totalScore = calculateTotalSpiritualScore({[date]: dayData});
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    historyItem.innerHTML = `
      <div class="history-date">${formattedDate}</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; margin: 0.5rem 0;">
        <small>🌅 Wake: ${dayData.wakeupScore}pts</small>
        <small>📿 Chant: ${dayData.chantingScore}pts</small>
        <small>🛐 Mangala: ${dayData.mangalaScore}pts</small>
        <small>🦁 Narasimha: ${dayData.narasimhaScore}pts</small>
        <small>🌿 Tulasi: ${dayData.tulasiScore}pts</small>
        <small>📖 Read: ${dayData.readingScore}pts</small>
        <small>👕 Clothes: ${dayData.clothesScore}pts</small>
        <small>🧺 Wash: ${dayData.washingScore}pts</small>
        <small>🧹 Clean: ${dayData.cleaningScore}pts</small>
        <small>😴 Sleep: ${dayData.sleepScore}pts</small>
      </div>
      <div class="history-score">Total: ${totalScore}/100</div>
    `;
    
    historyContainer.appendChild(historyItem);
  });
}

// Get today's spiritual score for dashboard
function getTodaySpiritualScore() {
  const data = JSON.parse(localStorage.getItem('spiritualData')) || {};
  const today = getToday();
  
  if (!data[today]) {
    return 0;
  }
  
  return calculateTotalSpiritualScore(data);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  updateSpiritualDisplay();
  loadSpiritualHistory();
});

// Export function for dashboard integration
window.getTodaySpiritualScore = getTodaySpiritualScore;
