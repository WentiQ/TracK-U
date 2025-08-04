let eventData = [];

function addEvent() {
  const name = document.getElementById('event-name').value.trim();
  const date = document.getElementById('event-date').value;
  const status = document.getElementById('event-status').value;

  if (!name || !date || !status) {
    alert("Please fill in all event details.");
    return;
  }

  eventData.push({ name, date, status });
  document.getElementById('event-name').value = '';
  document.getElementById('event-date').value = '';
  document.getElementById('event-status').value = 'Attended';

  updateEventList();
  saveEvents();
}

function updateEventList() {
  const list = document.getElementById('event-list');
  list.innerHTML = '';

  eventData.forEach((event, index) => {
    list.innerHTML += `
      <div class="event-item ${event.status.toLowerCase()}">
        <strong>${event.name}</strong> on ${event.date} — <em>${event.status}</em>
      </div>
    `;
  });

  updateEventSummary();
}

function updateEventSummary() {
  const total = eventData.length;
  const attended = eventData.filter(e => e.status === 'Attended').length;
  const percent = total > 0 ? ((attended / total) * 100).toFixed(1) : 0;

  document.getElementById('event-summary').innerHTML = `
    <p>🎟️ Attended: ${attended} / ${total} (${percent}%)</p>
  `;
}

function saveEvents() {
  localStorage.setItem('eventData', JSON.stringify(eventData));
}

function loadEvents() {
  const stored = localStorage.getItem('eventData');
  if (stored) {
    eventData = JSON.parse(stored);
    updateEventList();
  }
}

document.addEventListener('DOMContentLoaded', loadEvents);
