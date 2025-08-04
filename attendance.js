let attendanceData = [];

function addAttendance() {
  const subject = document.getElementById('subject').value;
  const status = document.getElementById('status').value;
  const date = new Date().toLocaleDateString();

  attendanceData.push({ subject, status, date });

  updateAttendanceSummary();
  saveToLocalStorage();
}

function updateAttendanceSummary() {
  let summary = {};

  attendanceData.forEach(entry => {
    const key = entry.subject;
    if (!summary[key]) {
      summary[key] = { present: 0, absent: 0, excused: 0 };
    }
    summary[key][entry.status.toLowerCase()] += 1;
  });

  const summaryDiv = document.getElementById('attendance-summary');
  summaryDiv.innerHTML = '';

  for (let subject in summary) {
    const { present, absent, excused } = summary[subject];
    const total = present + absent + excused;
    const percent = ((present / total) * 100).toFixed(1);
    summaryDiv.innerHTML += `
      <div><strong>${subject}</strong> — Present: ${present}, Absent: ${absent}, Excused: ${excused}, Attendance: ${percent}%</div>
    `;
  }
}

function saveToLocalStorage() {
  localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem('attendanceData');
  if (data) {
    attendanceData = JSON.parse(data);
    updateAttendanceSummary();
  }
}

document.addEventListener('DOMContentLoaded', loadFromLocalStorage);
