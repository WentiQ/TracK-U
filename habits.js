let habitData = {};

function getTodayDate() {
  return new Date().toISOString().split('T')[0]; // e.g. "2025-08-04"
}

function addHabit() {
  const habitName = document.getElementById('habit-name').value.trim();
  if (!habitName) return;

  if (!habitData[habitName]) {
    habitData[habitName] = {
      completed: [],
    };
  }

  document.getElementById('habit-name').value = '';
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

  for (const habit in habitData) {
    const isDone = habitData[habit].completed.includes(today);
    list.innerHTML += `
      <div class="habit-item ${isDone ? 'done' : ''}">
        <input type="checkbox" onchange="toggleHabit('${habit}')" ${isDone ? 'checked' : ''} />
        <span>${habit}</span>
      </div>
    `;
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

document.addEventListener('DOMContentLoaded', loadHabits);
