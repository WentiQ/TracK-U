// schedule.js
// Google Calendar-like agenda view with full event creation features

let currentWeekStart = new Date();
let events = [];
let editingEventId = null;
let subjects = [];

// Initialize the schedule page
document.addEventListener('DOMContentLoaded', function() {
  loadSubjects();
  loadEvents();
  setupEventListeners();
  setCurrentWeek();
  renderAgenda();
});

// Load subjects from attendance data
function loadSubjects() {
  const stored = localStorage.getItem('subjects');
  subjects = stored ? JSON.parse(stored) : ['Math', 'Science', 'History'];
  populateSubjectSelect();
}

function populateSubjectSelect() {
  const select = document.getElementById('event-subject');
  select.innerHTML = '<option value="">Select Subject</option>';
  subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    select.appendChild(option);
  });
}

// Set current week to this week
function setCurrentWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  currentWeekStart = startOfWeek;
  updateDateRange();
}

function updateDateRange() {
  const endOfWeek = new Date(currentWeekStart);
  endOfWeek.setDate(currentWeekStart.getDate() + 6);
  
  const startStr = formatDate(currentWeekStart);
  const endStr = formatDate(endOfWeek);
  
  document.getElementById('current-date-range').textContent = `${startStr} - ${endStr}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

function formatDateFull(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, tomorrow)) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
}

function isSameDay(date1, date2) {
  return date1.toDateString() === date2.toDateString();
}

// Event listeners setup
function setupEventListeners() {
  // Event type filter
  document.getElementById('event-type-filter').addEventListener('change', renderAgenda);
  // Navigation
  document.getElementById('prev-week').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    updateDateRange();
    renderAgenda();
  });
  
  document.getElementById('next-week').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    updateDateRange();
    renderAgenda();
  });
  
  document.getElementById('today-btn').addEventListener('click', () => {
    setCurrentWeek();
    renderAgenda();
  });

  // Modal controls
  document.getElementById('add-event-btn').addEventListener('click', openCreateEventModal);
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-btn').addEventListener('click', closeModal);
  document.getElementById('save-event-btn').addEventListener('click', saveEvent);
  document.getElementById('delete-event-btn').addEventListener('click', deleteEvent);

  // Event type change
  document.getElementById('event-type').addEventListener('change', function() {
    const subjectGroup = document.getElementById('subject-group');
    if (this.value === 'class') {
      subjectGroup.style.display = 'block';
      document.getElementById('event-subject').required = true;
    } else {
      subjectGroup.style.display = 'none';
      document.getElementById('event-subject').required = false;
    }
  });

  // All day checkbox
  document.getElementById('all-day').addEventListener('change', function() {
    const startTime = document.getElementById('start-time');
    const endTime = document.getElementById('end-time');
    
    if (this.checked) {
      startTime.disabled = true;
      endTime.disabled = true;
      startTime.value = '';
      endTime.value = '';
    } else {
      startTime.disabled = false;
      endTime.disabled = false;
    }
  });

  // Color picker
  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  // Close modal when clicking outside
  document.getElementById('event-modal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeModal();
    }
  });
  // Custom recurrence modal logic
  document.getElementById('repeat-option').addEventListener('change', function() {
    if (this.value === 'custom') {
      openCustomRecurrenceModal();
      // Reset to previous value if user cancels
      this.value = window._lastRepeatValue || 'none';
    } else {
      window._lastRepeatValue = this.value;
    }
  });

  document.getElementById('close-custom-recurrence').addEventListener('click', closeCustomRecurrenceModal);
  document.getElementById('cancel-custom-recurrence').addEventListener('click', closeCustomRecurrenceModal);
  document.getElementById('save-custom-recurrence').addEventListener('click', saveCustomRecurrence);

  // Show/hide weekdays for weekly
  document.getElementById('custom-frequency').addEventListener('change', function() {
    document.getElementById('custom-weekdays-group').style.display = this.value === 'week' ? 'block' : 'none';
  });

  // Recurring options modal
  document.getElementById('close-recurring-options').addEventListener('click', closeRecurringOptionsModal);
  document.getElementById('cancel-recurring-options').addEventListener('click', closeRecurringOptionsModal);
  
  document.getElementById('edit-this-only').addEventListener('click', () => handleRecurringEventOption('this-only'));
  document.getElementById('edit-this-and-following').addEventListener('click', () => handleRecurringEventOption('this-and-following'));
  document.getElementById('edit-all-events').addEventListener('click', () => handleRecurringEventOption('all'));

  // Close recurring modal when clicking outside
  document.getElementById('recurring-options-modal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeRecurringOptionsModal();
    }
  });
}
// Custom recurrence modal functions
let customRecurrence = null;
function openCustomRecurrenceModal() {
  // Reset form
  document.getElementById('custom-interval').value = 1;
  document.getElementById('custom-frequency').value = 'week';
  document.getElementById('custom-weekdays-group').style.display = 'block';
  document.querySelectorAll('.custom-weekday').forEach(cb => cb.checked = false);
  document.querySelector('input[name="custom-end"][value="never"]').checked = true;
  document.getElementById('custom-end-after').value = 10;
  document.getElementById('custom-end-on').value = '';
  document.getElementById('custom-recurrence-modal').style.display = 'block';
}
function closeCustomRecurrenceModal() {
  document.getElementById('custom-recurrence-modal').style.display = 'none';
}
function saveCustomRecurrence() {
  // Gather custom recurrence data
  const interval = parseInt(document.getElementById('custom-interval').value) || 1;
  const frequency = document.getElementById('custom-frequency').value;
  let weekdays = [];
  if (frequency === 'week') {
    document.querySelectorAll('.custom-weekday').forEach(cb => {
      if (cb.checked) weekdays.push(parseInt(cb.value));
    });
    if (weekdays.length === 0) {
      alert('Please select at least one weekday');
      return;
    }
  }
  let endType = document.querySelector('input[name="custom-end"]:checked').value;
  let endAfter = parseInt(document.getElementById('custom-end-after').value) || 10;
  let endOn = document.getElementById('custom-end-on').value;
  customRecurrence = { interval, frequency, weekdays, endType, endAfter, endOn };
  // Set repeat dropdown to custom
  document.getElementById('repeat-option').value = 'custom';
  window._lastRepeatValue = 'custom';
  closeCustomRecurrenceModal();
}

// Modal functions
function openCreateEventModal() {
  editingEventId = null;
  document.getElementById('modal-title').textContent = 'Create Event';
  document.getElementById('delete-event-btn').style.display = 'none';
  
  // Reset form
  document.getElementById('event-form').reset();
  document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
  document.querySelector('.color-option').classList.add('selected');
  
  // Set default date to today
  const today = new Date();
  document.getElementById('event-date').value = today.toISOString().split('T')[0];
  
  // Show subject group for default class type
  document.getElementById('subject-group').style.display = 'block';
  
  document.getElementById('event-modal').style.display = 'block';
}

function openEditEventModal(event) {
  // Always open the edit modal directly first, regardless of recurrence
  openEditEventModalDirect(event);
  
  // Store whether this is a recurring event to check later when saving/deleting
  if (isRecurringEvent(event)) {
    window.isEditingRecurringEvent = true;
  } else {
    window.isEditingRecurringEvent = false;
  }
}

function openEditEventModalDirect(event) {
  editingEventId = event.id;
  document.getElementById('modal-title').textContent = 'Edit Event';
  document.getElementById('delete-event-btn').style.display = 'block';
  
  // Populate form with event data
  document.getElementById('event-title').value = event.title;
  document.getElementById('event-type').value = event.type;
  document.getElementById('event-subject').value = event.subject || '';
  document.getElementById('event-date').value = event.date;
  document.getElementById('start-time').value = event.startTime || '';
  document.getElementById('end-time').value = event.endTime || '';
  document.getElementById('event-location').value = event.location || '';
  document.getElementById('event-description').value = event.description || '';
  document.getElementById('all-day').checked = event.allDay || false;
  document.getElementById('repeat-option').value = event.repeat || 'none';
  
  // Set color
  document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
  const colorOption = document.querySelector(`[data-color="${event.color}"]`);
  if (colorOption) {
    colorOption.classList.add('selected');
  }
  
  // Show/hide subject group
  const subjectGroup = document.getElementById('subject-group');
  if (event.type === 'class') {
    subjectGroup.style.display = 'block';
  } else {
    subjectGroup.style.display = 'none';
  }
  
  // Disable time inputs if all day
  const startTime = document.getElementById('start-time');
  const endTime = document.getElementById('end-time');
  if (event.allDay) {
    startTime.disabled = true;
    endTime.disabled = true;
  }
  
  document.getElementById('event-modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('event-modal').style.display = 'none';
  editingEventId = null;
}

// Recurring event helper functions
function isRecurringEvent(event) {
  return event.repeat && event.repeat !== 'none';
}

function getEventSeries(event) {
  // Find all events that belong to the same recurring series
  return events.filter(e => 
    e.title === event.title && 
    e.type === event.type && 
    e.subject === event.subject &&
    e.repeat === event.repeat &&
    e.created === event.created
  );
}

function showRecurringOptionsModal(event, action) {
  const modal = document.getElementById('recurring-options-modal');
  const title = document.getElementById('recurring-modal-title');
  const message = document.getElementById('recurring-modal-message');
  
  if (action === 'edit') {
    title.textContent = 'Edit Recurring Event';
    message.textContent = 'This is a recurring event. What would you like to edit?';
  } else if (action === 'delete') {
    title.textContent = 'Delete Recurring Event';
    message.textContent = 'This is a recurring event. What would you like to delete?';
    
    // Update button text for delete
    document.getElementById('edit-this-only').innerHTML = '🗑️ This event only';
    document.getElementById('edit-this-and-following').innerHTML = '🗑️➡️ This and following events';
    document.getElementById('edit-all-events').innerHTML = '🗑️🗑️ All events in the series';
  }
  
  modal.style.display = 'block';
  
  // Store current event for the option handlers
  window.currentRecurringEvent = event;
  window.currentRecurringAction = action;
}

function closeRecurringOptionsModal() {
  document.getElementById('recurring-options-modal').style.display = 'none';
  window.currentRecurringEvent = null;
  window.currentRecurringAction = null;
  
  // Reset button text
  document.getElementById('edit-this-only').innerHTML = '📅 This event only';
  document.getElementById('edit-this-and-following').innerHTML = '📅➡️ This and following events';
  document.getElementById('edit-all-events').innerHTML = '📅📅 All events in the series';
}

// Event CRUD operations
function saveEvent() {
  const form = document.getElementById('event-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const title = document.getElementById('event-title').value.trim();
  const type = document.getElementById('event-type').value;
  const subject = document.getElementById('event-subject').value;
  const date = document.getElementById('event-date').value;
  const startTime = document.getElementById('start-time').value;
  const endTime = document.getElementById('end-time').value;
  const location = document.getElementById('event-location').value.trim();
  const description = document.getElementById('event-description').value.trim();
  const allDay = document.getElementById('all-day').checked;
  const repeat = document.getElementById('repeat-option').value;
  const color = document.querySelector('.color-option.selected').dataset.color;

  // Validation
  if (!title) {
    alert('Please enter an event title');
    return;
  }

  if (type === 'class' && !subject) {
    alert('Please select a subject for the class');
    return;
  }

  if (!allDay && startTime && endTime && startTime >= endTime) {
    alert('End time must be after start time');
    return;
  }

  const eventData = {
    id: editingEventId || generateId(),
    title,
    type,
    subject: type === 'class' ? subject : null,
    date,
    startTime: allDay ? null : startTime,
    endTime: allDay ? null : endTime,
    location,
    description,
    allDay,
    repeat,
    color,
    customRecurrence: repeat === 'custom' ? customRecurrence : null,
    created: editingEventId ? events.find(e => e.id === editingEventId).created : new Date().toISOString()
  };

  // Store the eventData to use later after recurring options
  window.pendingEventData = eventData;

  if (editingEventId && window.isEditingRecurringEvent) {
    // If we're editing a recurring event, show options before saving
    const originalEvent = events.find(e => e.id === editingEventId);
    closeModal();
    showRecurringOptionsModal(originalEvent, 'edit');
    return;
  }

  // For new events or non-recurring edits, save directly
  saveEventWithData(eventData);
}

function saveEventWithData(eventData) {
  if (eventData.id && events.some(e => e.id === eventData.id)) {
    // Update existing event
    const index = events.findIndex(e => e.id === eventData.id);
    events[index] = eventData;
  } else {
    // Create new event
    events.push(eventData);
    // Handle recurring events
    if (eventData.repeat !== 'none') {
      if (eventData.repeat === 'custom' && eventData.customRecurrence) {
        createCustomRecurringEvents(eventData);
      } else {
        createRecurringEvents(eventData);
      }
    }
  }
  
  saveEvents();
  renderAgenda();
  closeModal();
}
// Custom recurring events logic
function createCustomRecurringEvents(eventData) {
  const recur = eventData.customRecurrence;
  if (!recur) return;
  const baseDate = new Date(eventData.date);
  let count = 1;
  let currentDate = new Date(baseDate);
  let maxCount = 500; // safety
  let endDate = null;
  if (recur.endType === 'on' && recur.endOn) {
    endDate = new Date(recur.endOn);
    endDate.setHours(23,59,59,999);
  }
  while (true) {
    if (recur.endType === 'after' && count >= recur.endAfter) break;
    if (recur.endType === 'on' && endDate && currentDate > endDate) break;
    if (recur.endType === 'never' && count > maxCount) break;
    // Calculate next date
    let nextDate = new Date(currentDate);
    switch (recur.frequency) {
      case 'day':
        nextDate.setDate(nextDate.getDate() + recur.interval);
        break;
      case 'week':
        nextDate.setDate(nextDate.getDate() + recur.interval * 7);
        break;
      case 'month':
        nextDate.setMonth(nextDate.getMonth() + recur.interval);
        break;
      case 'year':
        nextDate.setFullYear(nextDate.getFullYear() + recur.interval);
        break;
    }
    if (recur.frequency === 'week' && recur.weekdays && recur.weekdays.length > 0) {
      // For each week, add events on selected weekdays
      let weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() + 1); // start after base
      for (let i = 0; i < 7 * recur.interval; i++) {
        let d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        if (d > nextDate) break;
        if (recur.weekdays.includes(d.getDay())) {
          if (recur.endType === 'on' && endDate && d > endDate) continue;
          if (recur.endType === 'after' && count >= recur.endAfter) continue;
          const recurringEvent = {
            ...eventData,
            id: generateId(),
            date: d.toISOString().split('T')[0],
            created: new Date().toISOString(),
            customRecurrence: { ...recur }
          };
          events.push(recurringEvent);
          count++;
        }
      }
      currentDate = nextDate;
    } else {
      // For daily/monthly/yearly or weekly without weekdays
      const recurringEvent = {
        ...eventData,
        id: generateId(),
        date: nextDate.toISOString().split('T')[0],
        created: new Date().toISOString(),
        customRecurrence: { ...recur }
      };
      events.push(recurringEvent);
      currentDate = nextDate;
      count++;
    }
    if (recur.endType === 'never' && count > maxCount) break;
    if (recur.endType === 'after' && count >= recur.endAfter) break;
    if (recur.endType === 'on' && endDate && currentDate > endDate) break;
  }
}

function createRecurringEvents(eventData) {
  const baseDate = new Date(eventData.date);
  const endDate = new Date(baseDate);
  endDate.setFullYear(endDate.getFullYear() + 1); // Create events for 1 year
  
  let increment;
  switch (eventData.repeat) {
    case 'daily':
      increment = 1;
      break;
    case 'weekly':
      increment = 7;
      break;
    case 'monthly':
      increment = 30; // Approximate
      break;
    default:
      return;
  }
  
  let currentDate = new Date(baseDate);
  currentDate.setDate(currentDate.getDate() + increment);
  
  while (currentDate <= endDate) {
    const recurringEvent = {
      ...eventData,
      id: generateId(),
      date: currentDate.toISOString().split('T')[0],
      created: new Date().toISOString()
    };
    events.push(recurringEvent);
    
    if (eventData.repeat === 'monthly') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + increment);
    }
  }
}

function deleteEvent() {
  if (!editingEventId) return;
  
  const event = events.find(e => e.id === editingEventId);
  if (!event) return;
  
  if (!confirm('Are you sure you want to delete this event?')) {
    return;
  }
  
  // Check if this is a recurring event
  if (window.isEditingRecurringEvent) {
    closeModal(); // Close edit modal first
    showRecurringOptionsModal(event, 'delete');
    return;
  }
  
  // Non-recurring event - delete directly
  events = events.filter(e => e.id !== editingEventId);
  saveEvents();
  renderAgenda();
  closeModal();
}

function deleteEventDirect(eventId) {
  if (confirm('Are you sure you want to delete this event?')) {
    events = events.filter(e => e.id !== eventId);
    saveEvents();
    renderAgenda();
    closeModal();
  }
}

function handleRecurringEventOption(option) {
  const event = window.currentRecurringEvent;
  const action = window.currentRecurringAction;
  
  if (!event || !action) return;
  
  closeRecurringOptionsModal();
  
  if (action === 'edit') {
    handleRecurringEdit(event, option);
  } else if (action === 'delete') {
    handleRecurringDelete(event, option);
  }
}

function handleRecurringEdit(event, option) {
  const pendingEventData = window.pendingEventData;
  if (!pendingEventData) {
    return; // No pending data
  }
  
  switch (option) {
    case 'this-only':
      // Update only this single instance, removing recurrence
      const singleEvent = { ...pendingEventData, repeat: 'none', customRecurrence: null };
      // Find and update the single event
      const index = events.findIndex(e => e.id === event.id);
      if (index !== -1) {
        events[index] = singleEvent;
      }
      break;
      
    case 'this-and-following':
      // Update this and all future events in the series
      const eventSeries = getEventSeries(event);
      const eventDate = new Date(event.date);
      const futureEvents = eventSeries.filter(e => new Date(e.date) >= eventDate);
      
      futureEvents.forEach(e => {
        const idx = events.findIndex(event => event.id === e.id);
        if (idx !== -1) {
          // Keep the original date but update other properties
          events[idx] = { 
            ...pendingEventData, 
            id: e.id, 
            date: e.date 
          };
        }
      });
      break;
      
    case 'all':
      // Update all events in the series
      const allSeries = getEventSeries(event);
      
      allSeries.forEach(e => {
        const idx = events.findIndex(event => event.id === e.id);
        if (idx !== -1) {
          // Keep the original date but update other properties
          events[idx] = { 
            ...pendingEventData, 
            id: e.id, 
            date: e.date 
          };
        }
      });
      break;
  }
  
  // Clean up pending data
  window.pendingEventData = null;
  
  // Save and update the view
  saveEvents();
  renderAgenda();
}

function handleRecurringDelete(event, option) {
  switch (option) {
    case 'this-only':
      // Delete only this single instance
      events = events.filter(e => e.id !== event.id);
      break;
      
    case 'this-and-following':
      // Delete this and all future events in the series
      const eventSeries = getEventSeries(event);
      const eventDate = new Date(event.date);
      const idsToDelete = eventSeries
        .filter(e => new Date(e.date) >= eventDate)
        .map(e => e.id);
      events = events.filter(e => !idsToDelete.includes(e.id));
      break;
      
    case 'all':
      // Delete all events in the series
      const allSeries = getEventSeries(event);
      const allIdsToDelete = allSeries.map(e => e.id);
      events = events.filter(e => !allIdsToDelete.includes(e.id));
      break;
  }
  
  saveEvents();
  renderAgenda();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Data persistence
function saveEvents() {
  localStorage.setItem('scheduleEvents', JSON.stringify(events));
}

function loadEvents() {
  const stored = localStorage.getItem('scheduleEvents');
  events = stored ? JSON.parse(stored) : [];
}

// Agenda rendering
function renderAgenda() {
  const agendaView = document.getElementById('agenda-view');
  agendaView.innerHTML = '';

  // Get filter value
  const filter = document.getElementById('event-type-filter')?.value || 'all';
  let weekEvents = getWeekEvents();
  if (filter === 'class') {
    weekEvents = weekEvents.filter(e => e.type === 'class');
  } else if (filter === 'event') {
    weekEvents = weekEvents.filter(e => e.type === 'event');
  }

  if (weekEvents.length === 0) {
    agendaView.innerHTML = '<div class="no-events">No events this week</div>';
    return;
  }

  // Group events by date
  const eventsByDate = {};
  weekEvents.forEach(event => {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = [];
    }
    eventsByDate[event.date].push(event);
  });

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort();

  sortedDates.forEach(date => {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'agenda-day';

    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    dayHeader.textContent = formatDateFull(new Date(date));
    dayDiv.appendChild(dayHeader);

    const dayEvents = document.createElement('div');
    dayEvents.className = 'day-events';

    // Sort events by time
    const sortedEvents = eventsByDate[date].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      if (a.allDay && b.allDay) return 0;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    sortedEvents.forEach(event => {
      const eventDiv = document.createElement('div');
      eventDiv.className = 'event-item';
      eventDiv.onclick = () => openEditEventModal(event);

      const colorBar = document.createElement('div');
      colorBar.className = 'event-color';
      colorBar.style.backgroundColor = event.color;
      eventDiv.appendChild(colorBar);

      const timeDiv = document.createElement('div');
      timeDiv.className = 'event-time';
      if (event.allDay) {
        timeDiv.textContent = 'All day';
      } else if (event.startTime) {
        const startTime = formatTime(event.startTime);
        const endTime = event.endTime ? formatTime(event.endTime) : '';
        timeDiv.textContent = endTime ? `${startTime} - ${endTime}` : startTime;
      }
      eventDiv.appendChild(timeDiv);

      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'event-details';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'event-title';
      if (event.type === 'class' && event.subject) {
        titleDiv.textContent = `${event.title} (${event.subject})`;
      } else {
        titleDiv.textContent = event.title;
      }
      detailsDiv.appendChild(titleDiv);

      if (event.location) {
        const locationDiv = document.createElement('div');
        locationDiv.className = 'event-location';
        locationDiv.textContent = event.location;
        detailsDiv.appendChild(locationDiv);
      }

      eventDiv.appendChild(detailsDiv);
      dayEvents.appendChild(eventDiv);
    });

    dayDiv.appendChild(dayEvents);
    agendaView.appendChild(dayDiv);
  });
}

function getWeekEvents() {
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  return events.filter(event => {
    const eventDate = new Date(event.date);
    
    // Check if event is within the current week
    if (eventDate < currentWeekStart || eventDate > weekEnd) {
      return false;
    }
    
    // For today's events, check if the time has passed
    if (event.date === today) {
      // If it's an all-day event, always show it (until the day ends)
      if (event.allDay) {
        return true;
      }
      
      // If event has an end time, check if it has completely passed
      if (event.endTime) {
        const eventEndDateTime = new Date(`${event.date}T${event.endTime}`);
        return now <= eventEndDateTime;
      }
      
      // If event only has start time, check if it has started (give some buffer time)
      if (event.startTime) {
        const eventStartDateTime = new Date(`${event.date}T${event.startTime}`);
        // Add 2 hours buffer after start time for events without end time
        const eventEndEstimate = new Date(eventStartDateTime.getTime() + (2 * 60 * 60 * 1000));
        return now <= eventEndEstimate;
      }
      
      // Events without time specifications are treated as all-day
      return true;
    }
    
    // For future dates, always show the event
    if (event.date > today) {
      return true;
    }
    
    // For past dates, don't show the event
    return false;
  });
}

function formatTime(timeString) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Auto-refresh subjects when they change in attendance
window.addEventListener('storage', function(e) {
  if (e.key === 'subjects') {
    loadSubjects();
  }
});
