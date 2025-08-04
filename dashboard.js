function getToday() {
  return new Date().toISOString().split('T')[0];
}

function loadAttendanceScore() {
  const data = JSON.parse(localStorage.getItem('attendanceData')) || [];
  const summary = {};
  data.forEach(entry => {
    if (!summary[entry.subject]) summary[entry.subject] = { present: 0, total: 0 };
    summary[entry.subject].total++;
    if (entry.status === 'Present') summary[entry.subject].present++;
  });

  let totalPresent = 0, total = 0;
  for (let s in summary) {
    totalPresent += summary[s].present;
    total += summary[s].total;
  }

  const percent = total > 0 ? ((totalPresent / total) * 100).toFixed(1) : 0;
  document.getElementById('attendance-score').innerText = percent;
  return parseFloat(percent);
}

function loadTaskScore() {
  const data = JSON.parse(localStorage.getItem('taskData')) || [];
  const total = data.length;
  const completed = data.filter(t => t.completed).length;
  const percent = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
  document.getElementById('task-score').innerText = percent;
  return parseFloat(percent);
}

function loadHabitScore() {
  const data = JSON.parse(localStorage.getItem('habitData')) || {};
  const today = getToday();
  const total = Object.keys(data).length;
  const completed = Object.values(data).filter(h => h.completed.includes(today)).length;
  const percent = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
  document.getElementById('habit-score').innerText = percent;
  return parseFloat(percent);
}

function loadEventScore() {
  const data = JSON.parse(localStorage.getItem('eventData')) || [];
  const total = data.length;
  const attended = data.filter(e => e.status === 'Attended').length;
  const percent = total > 0 ? ((attended / total) * 100).toFixed(1) : 0;
  document.getElementById('event-score').innerText = percent;
  return parseFloat(percent);
}

function loadTodoScore() {
  const data = JSON.parse(localStorage.getItem('todoData')) || {};
  const today = getToday();
  const todos = data[today] || [];
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  const percent = total > 0 ? ((done / total) * 100).toFixed(1) : 0;
  document.getElementById('todo-score').innerText = percent;
  return parseFloat(percent);
}

function calculateTotalScore() {
  const a = loadAttendanceScore();
  const t = loadTaskScore();
  const h = loadHabitScore();
  const e = loadEventScore();
  const d = loadTodoScore();

  // Score weights
  const score = (
    (a * 0.3) +
    (t * 0.2) +
    (h * 0.15) +
    (e * 0.15) +
    (d * 0.2)
  ).toFixed(1);

  document.getElementById('total-score').innerText = score;
}

document.addEventListener('DOMContentLoaded', calculateTotalScore);
