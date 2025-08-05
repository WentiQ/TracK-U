// subject.js
// Loads and displays attendance analysis for a subject
// Requires Chart.js and html2pdf.js (for export)

// Dynamically load html2pdf.js for PDF export
(function() {
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  document.head.appendChild(script);
})();

document.addEventListener('DOMContentLoaded', function() {
  // Back button
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.onclick = function() {
      window.location.href = 'attendance.html';
    };
  }

  // Get subject from query param
  const urlParams = new URLSearchParams(window.location.search);
  const subject = urlParams.get('subject');
  if (!subject) {
    document.getElementById('subject-title').textContent = 'Subject Not Found';
    return;
  }
  document.getElementById('subject-title').textContent = subject + ' Attendance';

  // Load attendance data
  const data = JSON.parse(localStorage.getItem('attendanceData') || '[]');
  const subjectData = data.filter(entry => entry.subject === subject);

  // Chart: Attendance breakdown
  const statusCounts = { Present: 0, Absent: 0, 'Not Taken': 0 };
  subjectData.forEach(entry => {
    let status = entry.status;
    if (status === 'Excused') status = 'Not Taken';
    if (!statusCounts[status]) statusCounts[status] = 0;
    statusCounts[status]++;
  });
  const ctx = document.getElementById('attendanceChart').getContext('2d');

  // Calculate attendance percentage (Present / (Present + Absent))
  const present = statusCounts['Present'];
  const absent = statusCounts['Absent'];
  const totalCounted = present + absent;
  let percent = '-';
  if (totalCounted > 0) {
    percent = ((present / totalCounted) * 100).toFixed(1) + '%';
  }

  // Chart.js plugin for center text
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart) {
      if (percent === '-') return;
      const {ctx, chartArea: {left, right, top, bottom}} = chart;
      ctx.save();
      ctx.font = 'bold 2rem Arial';
      ctx.fillStyle = '#2c3e50';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(percent, (left + right) / 2, (top + bottom) / 2);
      ctx.restore();
    }
  };

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Present', 'Absent', 'Not Taken'],
      datasets: [{
        data: [statusCounts['Present'], statusCounts['Absent'], statusCounts['Not Taken']],
        backgroundColor: ['#2ecc71', '#e74c3c', '#95a5a6'],
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' },
        centerText: true
      }
    },
    plugins: [centerTextPlugin]
  });

  // Table: Full attendance records
  const tbody = document.querySelector('#attendance-table tbody');
  tbody.innerHTML = '';
  subjectData.forEach(entry => {
    const tr = document.createElement('tr');
    // If entry.date includes time, split; else, show only date
    let date = entry.date, time = '';
    if (date.includes(',')) {
      // e.g. '8/5/2025, 10:30:00 AM'
      [date, time] = date.split(',').map(s => s.trim());
    } else if (entry.time) {
      time = entry.time;
    }
    tr.innerHTML = `<td>${date}</td><td>${time || '-'}</td><td>${entry.status === 'Excused' ? 'Not Taken' : entry.status}</td>`;
    tbody.appendChild(tr);
  });

  // Export as PDF
  document.getElementById('export-pdf-btn').onclick = function() {
    const content = document.querySelector('main');
    html2pdf().from(content).save(`${subject}_attendance.pdf`);
  };
});
