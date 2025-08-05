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
    // Create a custom container for PDF export
    const pdfContainer = document.createElement('div');
    pdfContainer.style.padding = '24px';
    pdfContainer.style.fontFamily = 'Arial, sans-serif';
    pdfContainer.style.width = '100%';

    // Summary section
    const summary = document.createElement('div');
    summary.style.marginBottom = '18px';
    summary.style.fontSize = '1.1rem';
    summary.innerHTML = `
      <div style="font-weight:bold;font-size:1.3rem;margin-bottom:8px;">${subject} Attendance Summary</div>
      <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:4px;">
        <span>Present: <b>${statusCounts['Present']}</b></span>
        <span>Absent: <b>${statusCounts['Absent']}</b></span>
        <span>Not Taken: <b>${statusCounts['Not Taken']}</b></span>
        <span>Attendance %: <b>${percent}</b></span>
      </div>
    `;
    pdfContainer.appendChild(summary);

    // Table section
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '1rem';
    table.innerHTML = `
      <thead>
        <tr style="background:#f4f4f4;">
          <th style="border:1px solid #bbb;padding:8px 4px;text-align:left;">Date</th>
          <th style="border:1px solid #bbb;padding:8px 4px;text-align:left;">Time</th>
          <th style="border:1px solid #bbb;padding:8px 4px;text-align:left;">Status</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const pdfTbody = table.querySelector('tbody');
    subjectData.forEach(entry => {
      let date = entry.date, time = '';
      if (date.includes(',')) {
        [date, time] = date.split(',').map(s => s.trim());
      } else if (entry.time) {
        time = entry.time;
      }
      const status = entry.status === 'Excused' ? 'Not Taken' : entry.status;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="border:1px solid #bbb;padding:6px 4px;">${date}</td>
        <td style="border:1px solid #bbb;padding:6px 4px;">${time || '-'}</td>
        <td style="border:1px solid #bbb;padding:6px 4px;">${status}</td>
      `;
      pdfTbody.appendChild(tr);
    });
    pdfContainer.appendChild(table);

    // Export using html2pdf
    html2pdf().set({
      margin: 0,
      filename: `${subject}_attendance.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }).from(pdfContainer).save();
  };
});
