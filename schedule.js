// schedule.js
// Handles schedule CRUD and display

document.addEventListener('DOMContentLoaded', function() {
  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.onclick = () => window.location.href = 'index.html';

  const scheduleSection = document.getElementById('schedule-section');
  const addSection = document.getElementById('add-schedule-section');
  const addBtn = document.getElementById('add-schedule-btn');
  const form = document.getElementById('schedule-form');
  const tableBody = document.querySelector('#schedule-table tbody');
  let editIndex = null;

  function getSchedule() {
    return JSON.parse(localStorage.getItem('scheduleData') || '[]');
  }
  function saveSchedule(data) {
    localStorage.setItem('scheduleData', JSON.stringify(data));
  }

  function renderTable() {
    const data = getSchedule();
    tableBody.innerHTML = '';
    if (data.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" style="text-align:center;">No schedule found.</td>';
      tableBody.appendChild(tr);
      return;
    }
    data.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.day}</td>
        <td>${item.time}</td>
        <td>${item.subject}</td>
        <td>${item.notes || ''}</td>
        <td>
          <button class="edit-btn" data-idx="${idx}">Edit</button>
          <button class="delete-btn" data-idx="${idx}">Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  addBtn.onclick = () => {
    form.reset();
    editIndex = null;
    scheduleSection.style.display = 'none';
    addSection.style.display = '';
  };

  form.onsubmit = function(e) {
    e.preventDefault();
    const day = document.getElementById('day-input').value;
    const time = document.getElementById('time-input').value;
    const subject = document.getElementById('subject-input').value;
    const notes = document.getElementById('notes-input').value;
    const data = getSchedule();
    const entry = { day, time, subject, notes };
    if (editIndex !== null) {
      data[editIndex] = entry;
    } else {
      data.push(entry);
    }
    saveSchedule(data);
    renderTable();
    addSection.style.display = 'none';
    scheduleSection.style.display = '';
  };

  document.getElementById('cancel-btn').onclick = function() {
    addSection.style.display = 'none';
    scheduleSection.style.display = '';
  };

  tableBody.onclick = function(e) {
    if (e.target.classList.contains('edit-btn')) {
      const idx = +e.target.dataset.idx;
      const data = getSchedule();
      const item = data[idx];
      document.getElementById('day-input').value = item.day;
      document.getElementById('time-input').value = item.time;
      document.getElementById('subject-input').value = item.subject;
      document.getElementById('notes-input').value = item.notes || '';
      editIndex = idx;
      scheduleSection.style.display = 'none';
      addSection.style.display = '';
    } else if (e.target.classList.contains('delete-btn')) {
      const idx = +e.target.dataset.idx;
      const data = getSchedule();
      if (confirm('Delete this schedule entry?')) {
        data.splice(idx, 1);
        saveSchedule(data);
        renderTable();
      }
    }
  };

  renderTable();
});
