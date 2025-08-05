// --- Modal for Attendance Data Deletion ---
function showDeleteAttendanceModal(subject, onConfirm) {
  let modal = document.getElementById('delete-attendance-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'delete-attendance-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close" onclick="closeDeleteAttendanceModal()">&times;</span>
        <h3>Delete Attendance Data</h3>
        <p>Type the subject name (<b>${subject}</b>) to confirm:</p>
        <input type="text" id="confirm-subject-input" placeholder="Subject name" />
        <p>Enter your password:</p>
        <input type="password" id="confirm-password-input" placeholder="Password" />
        <button id="confirm-delete-btn">Delete</button>
        <div id="delete-attendance-message"></div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.querySelector('b').textContent = subject;
    modal.querySelector('#confirm-subject-input').value = '';
    modal.querySelector('#confirm-password-input').value = '';
    modal.querySelector('#delete-attendance-message').textContent = '';
  }
  modal.style.display = 'block';
  modal.querySelector('#confirm-delete-btn').onclick = function() {
    const subInput = modal.querySelector('#confirm-subject-input').value.trim();
    const passInput = modal.querySelector('#confirm-password-input').value;
    const msg = modal.querySelector('#delete-attendance-message');
    if (subInput !== subject) {
      msg.textContent = 'Subject name does not match.';
      msg.style.color = 'red';
      return;
    }
    const storedPass = localStorage.getItem('userPassword') || '';
    if (storedPass && passInput !== storedPass) {
      msg.textContent = 'Password incorrect.';
      msg.style.color = 'red';
      return;
    }
    msg.textContent = '';
    closeDeleteAttendanceModal();
    onConfirm();
  };
}

function closeDeleteAttendanceModal() {
  const modal = document.getElementById('delete-attendance-modal');
  if (modal) modal.style.display = 'none';
}

// --- Long Press Delete on Attendance Summary ---
function addLongPressDeleteToSummary() {
  const div = document.getElementById('attendance-summary');
  div.querySelectorAll('div').forEach(summaryDiv => {
    let timeout;
    let pressed = false;
    summaryDiv.onmousedown = function(e) {
      pressed = true;
      timeout = setTimeout(() => {
        pressed = false;
        const subject = summaryDiv.querySelector('strong').textContent;
        showDeleteAttendanceModal(subject, function() {
          // Delete all attendance data for this subject
          attendanceData = attendanceData.filter(entry => entry.subject !== subject);
          saveAttendance();
          updateAttendanceSummary();
        });
      }, 800); // 800ms for long press
    };
    summaryDiv.onmouseup = summaryDiv.onmouseleave = function() {
      if (timeout) clearTimeout(timeout);
      pressed = false;
    };
  });
}

// Call after updating summary
const origUpdateAttendanceSummary = updateAttendanceSummary;
updateAttendanceSummary = function() {
  origUpdateAttendanceSummary();
  addLongPressDeleteToSummary();
};
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
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();

  attendanceData.push({ subject, status, date, time });
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
      <div class="attendance-summary-item" style="cursor:pointer;">
        <strong onclick="window.location.href='subject.html?subject=' + encodeURIComponent('${subject}')">${subject}</strong> — Present: ${present}, Absent: ${absent}, Not Taken: ${notTaken}, Attendance: ${percent}%
      </div>
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
