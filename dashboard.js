function getToday() {
  return new Date().toISOString().split('T')[0];
}

function loadAttendanceScore() {
  const today = getToday();
  const todayFormatted = new Date().toLocaleDateString(); // For attendance data comparison
  
  // Get today's class attendance responses
  const attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
  const todaysClasses = attendanceData.filter(entry => entry.date === todayFormatted);
  
  // Get today's event responses
  const eventResponses = JSON.parse(localStorage.getItem('eventResponses')) || [];
  const todaysEvents = eventResponses.filter(response => response.originalDate === today);
  
  // Calculate attendance for classes (Present and Not Taken count as attended, Cancelled classes are excluded)
  let classesAttended = 0;
  let totalClasses = 0;
  todaysClasses.forEach(entry => {
    if (entry.status !== 'Cancelled') {
      totalClasses++;
      if (entry.status === 'Present' || entry.status === 'Not Taken') {
        classesAttended++;
      }
    }
  });

  // Calculate attendance for events (Attended counts as attended, Cancelled events are excluded)
  let eventsAttended = 0;
  let totalEvents = 0;
  todaysEvents.forEach(response => {
    if (response.response !== 'Cancelled') {
      totalEvents++;
      if (response.response === 'Attended') {
        eventsAttended++;
      }
    }
  });

  // Calculate overall attendance percentage for today
  const totalAttended = classesAttended + eventsAttended;
  const totalItems = totalClasses + totalEvents;
  const percent = totalItems > 0 ? ((totalAttended / totalItems) * 100).toFixed(1) : 0;
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

// Notification system for schedule events and tasks
function loadNotifications() {
  const scheduleEvents = JSON.parse(localStorage.getItem('scheduleEvents')) || [];
  const respondedNotifications = JSON.parse(localStorage.getItem('respondedNotifications')) || [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Get today's events that have passed their start time
  const activeNotifications = scheduleEvents.filter(event => {
    if (event.date !== today) return false;
    
    // Check if already responded
    if (respondedNotifications.includes(event.id)) return false;
    
    // Check if event time has passed (for timed events) or is all-day
    if (event.allDay) {
      return true; // Show all-day events immediately
    }
    
    if (event.startTime) {
      const eventDateTime = new Date(`${event.date}T${event.startTime}`);
      return now >= eventDateTime; // Show only if event time has passed
    }
    
    return false;
  });
  
  // Get urgent tasks
  const urgentTasks = (typeof getUrgentTasks === 'function') ? getUrgentTasks() : 
                     (window.getUrgentTasks && typeof window.getUrgentTasks === 'function') ? window.getUrgentTasks() : 
                     getUrgentTasks();
  
  // Sort by time (all-day first, then by start time)
  activeNotifications.sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    if (a.allDay && b.allDay) return 0;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
  
  displayNotifications(activeNotifications, urgentTasks);
}

function displayNotifications(notifications, urgentTasks = []) {
  const container = document.getElementById('notifications-container');
  const section = document.getElementById('notifications-section');
  
  if (notifications.length === 0 && urgentTasks.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  container.innerHTML = '';
  
  // Display schedule notifications
  notifications.forEach(event => {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification-item ${event.type}-notification`;
    
    const timeDisplay = event.allDay ? 'All day' : 
      event.startTime ? formatTime(event.startTime) + (event.endTime ? ` - ${formatTime(event.endTime)}` : '') : '';
    
    const title = event.type === 'class' && event.subject ? 
      `${event.title} (${event.subject})` : event.title;
    
    notificationDiv.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">${title}</div>
        <div class="notification-time">${timeDisplay}</div>
      </div>
      <div class="notification-details">
        ${event.location ? `📍 ${event.location}<br>` : ''}
        ${event.description ? `${event.description}` : ''}
      </div>
      <div class="notification-actions">
        ${event.type === 'class' ? `
          <button class="notification-btn btn-present" onclick="respondToNotification('${event.id}', 'Present')">
            ✅ Present
          </button>
          <button class="notification-btn btn-absent" onclick="respondToNotification('${event.id}', 'Absent')">
            ❌ Absent
          </button>
          <button class="notification-btn btn-not-taken" onclick="respondToNotification('${event.id}', 'Not Taken')">
            ⚪ Not Taken
          </button>
          <button class="notification-btn btn-cancelled" onclick="respondToNotification('${event.id}', 'Cancelled')">
            🚫 Cancelled
          </button>
        ` : `
          <button class="notification-btn btn-attended" onclick="respondToNotification('${event.id}', 'Attended')">
            ✅ Attended
          </button>
          <button class="notification-btn btn-not-attended" onclick="respondToNotification('${event.id}', 'Not Attended')">
            ❌ Not Attended
          </button>
          <button class="notification-btn btn-cancelled" onclick="respondToNotification('${event.id}', 'Cancelled')">
            🚫 Cancelled
          </button>
        `}
      </div>
    `;
    
    container.appendChild(notificationDiv);
  });
  
  // Display task notifications
  urgentTasks.forEach((task, index) => {
    const taskIndex = JSON.parse(localStorage.getItem('taskData')).findIndex(t => 
      t.title === task.title && t.due === task.due && t.dueTime === task.dueTime
    );
    
    if (taskIndex === -1) return;
    
    // Get urgency using local function
    function getTaskUrgency(task) {
      if (task.completed) return null;
      
      const now = new Date();
      const deadline = new Date(`${task.due}T${task.dueTime}`);
      const timeLeft = (deadline - now) / (1000 * 60 * 60); // hours
      const minTime = task.minTime || 1;
      
      if (timeLeft < 0) {
        return { level: 'overdue', color: '#8B0000', text: 'OVERDUE' };
      } else if (timeLeft <= minTime) {
        return { level: 'very-urgent', color: '#FF0000', text: 'VERY URGENT' };
      } else if (timeLeft <= minTime * 2) {
        return { level: 'urgent-red', color: '#DC143C', text: 'URGENT' };
      } else if (timeLeft <= minTime * 4) {
        return { level: 'urgent-green', color: '#228B22', text: 'URGENT' };
      }
      
      return null;
    }
    
    const urgency = getTaskUrgency(task);
    if (!urgency) return;
    
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification-item task-notification';
    
    const deadline = new Date(`${task.due}T${task.dueTime}`);
    const timeLeft = Math.max(0, (deadline - new Date()) / (1000 * 60 * 60));
    
    // Format minimum time
    function formatMinTime(totalHours) {
      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24);
        const hours = Math.floor(totalHours % 24);
        const minutes = Math.round((totalHours % 1) * 60);
        if (minutes === 0 && hours === 0) return `${days}d`;
        if (minutes === 0) return `${days}d ${hours}h`;
        if (hours === 0) return `${days}d ${minutes}m`;
        return `${days}d ${hours}h ${minutes}m`;
      } else if (totalHours >= 1) {
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours % 1) * 60);
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
      } else {
        const minutes = Math.round(totalHours * 60);
        return `${minutes}m`;
      }
    }
    
    notificationDiv.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">📋 ${task.title}</div>
        <div class="notification-time">
          <span style="background-color: ${urgency.color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">
            ${urgency.text}
          </span>
        </div>
      </div>
      <div class="notification-details">
        Due: ${task.due} ${task.dueTime}<br>
        Time left: ${timeLeft.toFixed(1)} hours<br>
        Min time required: ${formatMinTime(task.minTime)}<br>
        Priority: ${task.importance.toUpperCase()}
      </div>
      <div class="notification-actions">
        <button class="notification-btn btn-present" onclick="handleTaskNotificationResponse(${taskIndex}, 'done')">
          ✅ Task Done
        </button>
        <button class="notification-btn btn-attended" onclick="handleTaskNotificationResponse(${taskIndex}, 'starting')">
          🚀 Starting Now
        </button>
        <button class="notification-btn btn-not-taken" onclick="handleTaskNotificationResponse(${taskIndex}, 'skipped')">
          ⏭️ Skip This Time
        </button>
      </div>
    `;
    
    container.appendChild(notificationDiv);
  });
}

function handleTaskNotificationResponse(taskIndex, action) {
  const taskData = JSON.parse(localStorage.getItem('taskData')) || [];
  const task = taskData[taskIndex];
  if (!task) return;
  
  switch(action) {
    case 'done':
      task.completed = true;
      break;
    case 'starting':
      task.started = new Date().toISOString();
      break;
    case 'skipped':
      task.skipped = (task.skipped || 0) + 1;
      break;
  }
  
  localStorage.setItem('taskData', JSON.stringify(taskData));
  
  // Refresh notifications and scores
  loadNotifications();
  calculateTotalScore();
}

function getUrgentTasks() {
  const taskData = JSON.parse(localStorage.getItem('taskData')) || [];
  
  function getTaskUrgency(task) {
    if (task.completed) return null;
    
    const now = new Date();
    const deadline = new Date(`${task.due}T${task.dueTime}`);
    const timeLeft = (deadline - now) / (1000 * 60 * 60); // hours
    const minTime = task.minTime || 1;
    
    if (timeLeft < 0) {
      return { level: 'overdue', color: '#8B0000', text: 'OVERDUE' };
    } else if (timeLeft <= minTime) {
      return { level: 'very-urgent', color: '#FF0000', text: 'VERY URGENT' };
    } else if (timeLeft <= minTime * 2) {
      return { level: 'urgent-red', color: '#DC143C', text: 'URGENT' };
    } else if (timeLeft <= minTime * 4) {
      return { level: 'urgent-green', color: '#228B22', text: 'URGENT' };
    }
    
    return null;
  }
  
  return taskData.filter(task => {
    if (task.completed) return false;
    const urgency = getTaskUrgency(task);
    return urgency && ['urgent-green', 'urgent-red', 'very-urgent', 'overdue'].includes(urgency.level);
  });
}

function respondToNotification(eventId, response) {
  // Mark notification as responded
  const respondedNotifications = JSON.parse(localStorage.getItem('respondedNotifications')) || [];
  if (!respondedNotifications.includes(eventId)) {
    respondedNotifications.push(eventId);
    localStorage.setItem('respondedNotifications', JSON.stringify(respondedNotifications));
  }
  
  // Get the event details
  const scheduleEvents = JSON.parse(localStorage.getItem('scheduleEvents')) || [];
  const event = scheduleEvents.find(e => e.id === eventId);
  
  if (event && event.type === 'class' && event.subject) {
    // Add to attendance data for classes
    const attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
    const now = new Date();
    
    attendanceData.push({
      subject: event.subject,
      status: response,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString()
    });
    
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
  }
  
  // For events, we could store the response in a separate eventResponses storage
  if (event && event.type === 'event') {
    const eventResponses = JSON.parse(localStorage.getItem('eventResponses')) || [];
    eventResponses.push({
      eventId: eventId,
      eventTitle: event.title,
      response: response,
      date: new Date().toISOString(),
      originalDate: event.date
    });
    localStorage.setItem('eventResponses', JSON.stringify(eventResponses));
  }
  
  // Refresh notifications and dashboard scores
  loadNotifications();
  calculateTotalScore();
}

function formatTime(timeString) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Clear old responded notifications daily
function clearOldNotifications() {
  const today = new Date().toISOString().split('T')[0];
  const lastClearDate = localStorage.getItem('lastNotificationClear');
  
  if (lastClearDate !== today) {
    // Clear responded notifications from previous days
    localStorage.removeItem('respondedNotifications');
    localStorage.setItem('lastNotificationClear', today);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  clearOldNotifications();
  calculateTotalScore();
  loadNotifications();
  
  // Refresh notifications every minute
  setInterval(loadNotifications, 60000);
});
