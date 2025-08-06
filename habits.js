let habitData = {};

function getTodayDate() {
  return new Date().toISOString().split('T')[0]; // e.g. "2025-08-04"
}

function addHabit() {
  const habitName = document.getElementById('habit-name').value.trim();
  if (!habitName) return;

  // Get end condition
  const endType = document.getElementById('habit-end-type').value;
  let endValue = null;
  if (endType === 'date') {
    endValue = document.getElementById('habit-end-date').value;
    if (!endValue) {
      alert('Please select an end date.');
      return;
    }
  } else if (endType === 'days') {
    endValue = parseInt(document.getElementById('habit-end-days').value, 10);
    if (isNaN(endValue) || endValue <= 0) {
      alert('Please enter a valid number of days.');
      return;
    }
  }

  if (!habitData[habitName]) {
    habitData[habitName] = {
      completed: [],
      endType: endType,
      endValue: endValue,
      created: getTodayDate(),
    };
  }

  document.getElementById('habit-name').value = '';
  // Reset end fields
  document.getElementById('habit-end-type').value = 'off';
  document.getElementById('habit-end-date').value = '';
  document.getElementById('habit-end-days').value = '';
  updateHabitList();
  saveHabits();
}

function toggleHabit(habit) {
  const today = getTodayDate();
  const index = habitData[habit].completed.indexOf(today);

  if (index > -1) {
    habitData[habit].completed.splice(index, 1); // uncheck
  } else {
    habitData[habit].completed.push(today); // check
  }

  updateHabitList();
  saveHabits();
}

function updateHabitList() {
  const list = document.getElementById('habit-list');
  list.innerHTML = '';

  const today = getTodayDate();

  // Sort habits: incomplete first, then completed
  const sortedHabits = Object.keys(habitData).sort((a, b) => {
    const aDone = habitData[a].completed.includes(today);
    const bDone = habitData[b].completed.includes(today);
    if (aDone === bDone) return 0;
    return aDone ? 1 : -1; // incomplete first
  });

  for (const habit of sortedHabits) {
    const isDone = habitData[habit].completed.includes(today);
    const streak = getHabitStreak(habitData[habit].completed);
    let endInfo = '';
    if (habitData[habit].endType === 'date') {
      endInfo = `Ends on: ${habitData[habit].endValue}`;
    } else if (habitData[habit].endType === 'days') {
      endInfo = `Ends in: ${habitData[habit].endValue} days`;
    } else {
      endInfo = 'No end';
    }
    list.innerHTML += `
      <div class="habit-item${isDone ? ' dull' : ''}">
        <input type="checkbox" onchange="toggleHabit('${habit}')" ${isDone ? 'checked' : ''} />
        <span class="${isDone ? 'done' : ''}">${habit}</span>
        <span class="habit-streak" title="Current streak">🔥 ${streak}</span>
        <span class="habit-end-info">${endInfo}</span>
      </div>
    `;
  }
// Calculate current streak (consecutive days up to today)
function getHabitStreak(completedArr) {
  if (!Array.isArray(completedArr) || completedArr.length === 0) return 0;
  const days = completedArr.slice().sort();
  let streak = 0;
  let current = new Date(getTodayDate());
  for (let i = days.length - 1; i >= 0; i--) {
    const d = new Date(days[i]);
    if (
      d.getFullYear() === current.getFullYear() &&
      d.getMonth() === current.getMonth() &&
      d.getDate() === current.getDate()
    ) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

  updateHabitSummary();
}

function updateHabitSummary() {
  const total = Object.keys(habitData).length;
  const today = getTodayDate();
  const completedToday = Object.values(habitData).filter(h => h.completed.includes(today)).length;

  const percent = total > 0 ? ((completedToday / total) * 100).toFixed(1) : 0;
  document.getElementById('habit-summary').innerHTML = `
    <p>🌟 Completed Today: ${completedToday} / ${total} (${percent}%)</p>
  `;
}

function saveHabits() {
  localStorage.setItem('habitData', JSON.stringify(habitData));
}

function loadHabits() {
  const stored = localStorage.getItem('habitData');
  if (stored) {
    habitData = JSON.parse(stored);
    updateHabitList();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Add end condition UI if not present
  if (!document.getElementById('habit-end-type')) {
    const form = document.getElementById('habit-form') || document.getElementById('add-habit-form') || document.body;
    const container = document.createElement('div');
    container.id = 'habit-end-container';
    container.innerHTML = `
      <label for="habit-end-type">End on: </label>
      <select id="habit-end-type">
        <option value="off">Off</option>
        <option value="date">Date</option>
        <option value="days">Days</option>
      </select>
      <input type="date" id="habit-end-date" style="display:none;" />
      <input type="number" id="habit-end-days" min="1" placeholder="Days" style="display:none;width:60px;" />
    `;
    // Insert after habit name input
    const nameInput = document.getElementById('habit-name');
    if (nameInput && nameInput.parentNode) {
      nameInput.parentNode.insertBefore(container, nameInput.nextSibling);
    } else {
      form.appendChild(container);
    }
    // Show/hide fields on change
    container.querySelector('#habit-end-type').addEventListener('change', function(e) {
      const type = e.target.value;
      container.querySelector('#habit-end-date').style.display = type === 'date' ? '' : 'none';
      container.querySelector('#habit-end-days').style.display = type === 'days' ? '' : 'none';
    });
  }
  loadHabits();
});
