// --- Subject List Popup Logic ---
function openSubjectListPopup() {
  document.getElementById('subject-list-popup').style.display = 'block';
  updateSubjectList(); // Only update when popup is open
}

function closeSubjectListPopup() {
  document.getElementById('subject-list-popup').style.display = 'none';
}

// Optional: Close modal when clicking outside modal-content
window.addEventListener('click', function(event) {
  const modal = document.getElementById('subject-list-popup');
  if (event.target === modal) {
    closeSubjectListPopup();
  }
});
let attendanceData = [];
let subjects = [];

function saveSubjects() {
  localStorage.setItem('subjects', JSON.stringify(subjects));
}

function loadSubjects() {
  const stored = localStorage.getItem('subjects');
  subjects = stored ? JSON.parse(stored) : ['Math', 'Science', 'History'];
  updateSubjectSelect();
  updateSubjectList();
}

function updateSubjectSelect() {
  const select = document.getElementById('subject');
  select.innerHTML = '';
  subjects.forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = sub;
    select.appendChild(opt);
  });
}

function updateSubjectList() {
  const list = document.getElementById('subject-list');
  list.innerHTML = '';
  subjects.forEach((sub, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${sub}
      <button onclick="editSubject(${index})">✏️</button>
      <button onclick="deleteSubject(${index})">🗑️</button>
    `;
    list.appendChild(li);
  });
}

function addSubject() {
  const input = document.getElementById('new-subject');
  const newSub = input.value.trim();
  if (newSub && !subjects.includes(newSub)) {
    subjects.push(newSub);
    saveSubjects();
    updateSubjectSelect();
    updateSubjectList();
  }
  input.value = '';
}

function editSubject(index) {
  const oldName = subjects[index];
  const newName = prompt("Edit subject name:", oldName);
  if (newName && !subjects.includes(newName)) {
    subjects[index] = newName;
    // Update all attendanceData entries with the old subject name
    attendanceData.forEach(entry => {
      if (entry.subject === oldName) {
        entry.subject = newName;
      }
    });
    saveSubjects();
    saveAttendance();
    updateSubjectSelect();
    updateSubjectList();
    updateAttendanceSummary();
  }
}

function deleteSubject(index) {
  if (confirm(`Delete subject "${subjects[index]}"?`)) {
    subjects.splice(index, 1);
    saveSubjects();
    updateSubjectSelect();
    updateSubjectList();
  }
}

// Attendance logic
function addAttendance() {
  const subject = document.getElementById('subject').value;
  const status = document.getElementById('status').value;
  const date = new Date().toLocaleDateString();

  attendanceData.push({ subject, status, date });
  updateAttendanceSummary();
  saveAttendance();
}

function updateAttendanceSummary() {
  const summary = {};
  attendanceData.forEach(entry => {
    if (!summary[entry.subject]) summary[entry.subject] = { present: 0, absent: 0, 'not taken': 0 };
    // Support both old 'Excused' and new 'Not Taken' for backward compatibility
    let statusKey = entry.status.toLowerCase();
    if (statusKey === 'excused') statusKey = 'not taken';
    summary[entry.subject][statusKey]++;
  });

  const div = document.getElementById('attendance-summary');
  div.innerHTML = '';
  for (let subject in summary) {
    const { present, absent, 'not taken': notTaken } = summary[subject];
    const totalCounted = present + absent; // Only count present and absent for percentage
    let percent = '-';
    if (totalCounted > 0) {
      percent = ((present / totalCounted) * 100).toFixed(1);
    }
    div.innerHTML += `
      <div><strong>${subject}</strong> — Present: ${present}, Absent: ${absent}, Not Taken: ${notTaken}, Attendance: ${percent}%</div>
    `;
  }
}

function saveAttendance() {
  localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
}

function loadAttendance() {
  const data = localStorage.getItem('attendanceData');
  attendanceData = data ? JSON.parse(data) : [];
  updateAttendanceSummary();
}

document.addEventListener('DOMContentLoaded', () => {
  loadSubjects();
  loadAttendance();
});
