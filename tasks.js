let taskData = [];

function parseMinTime(minTimeInput) {
  const value = minTimeInput.trim();
  
  // Check if it's in days:hours:minutes format
  if (value.includes(':')) {
    const parts = value.split(':');
    if (parts.length === 3) {
      const days = parseInt(parts[0]) || 0;
      const hours = parseInt(parts[1]) || 0;
      const minutes = parseInt(parts[2]) || 0;
      return days * 24 + hours + minutes / 60; // Convert to total hours
    } else if (parts.length === 2) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      return hours + minutes / 60; // Convert to total hours
    }
  }
  
  // Check if it's just minutes (ends with 'm' or 'min')
  if (value.toLowerCase().endsWith('m') || value.toLowerCase().endsWith('min')) {
    const numValue = value.toLowerCase().replace(/[^\d.]/g, '');
    const minutes = parseFloat(numValue) || 0;
    return minutes / 60; // Convert minutes to hours
  }
  
  // Check if it's just hours (ends with 'h' or 'hr')
  if (value.toLowerCase().endsWith('h') || value.toLowerCase().endsWith('hr')) {
    const numValue = value.toLowerCase().replace(/[^\d.]/g, '');
    return parseFloat(numValue) || 0;
  }
  
  // Check if it's just days (ends with 'd' or 'day')
  if (value.toLowerCase().endsWith('d') || value.toLowerCase().includes('day')) {
    const numValue = value.toLowerCase().replace(/[^\d.]/g, '');
    const days = parseFloat(numValue) || 0;
    return days * 24; // Convert days to hours
  }
  
  // If it's just a number, check if it's likely minutes or hours
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    // If the number is greater than 24, assume it's minutes
    if (numValue > 24) {
      return numValue / 60; // Convert minutes to hours
    } else {
      return numValue; // Assume it's hours
    }
  }
  
  return 0;
}

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

function addTask() {
  const title = document.getElementById('task-title').value.trim();
  const due = document.getElementById('task-due').value;
  const dueTime = document.getElementById('task-due-time').value;
  const minTimeInput = document.getElementById('task-min-time').value;
  const minTime = parseMinTime(minTimeInput);
  const importance = document.getElementById('task-importance').value;

  console.log('Adding task:', { title, due, dueTime, minTimeInput, minTime, importance });

  if (!title || !due || !dueTime || !minTimeInput || minTime <= 0) {
    alert("Please fill all fields with valid values. For minimum time, use formats like: 30m, 2h, 1:30, 2:30:00, or just numbers.");
    return;
  }

  const newTask = {
    title,
    due,
    dueTime,
    minTime, // in hours
    importance,
    completed: false,
    created: new Date().toISOString()
  };

  taskData.push(newTask);
  console.log('Task added to array:', newTask);
  console.log('Current taskData:', taskData);

  document.getElementById('task-title').value = '';
  document.getElementById('task-due').value = '';
  document.getElementById('task-due-time').value = '';
  document.getElementById('task-min-time').value = '';
  document.getElementById('task-importance').value = 'low';

  saveTasks();
  updateTaskList();
}

function toggleTask(index) {
  taskData[index].completed = !taskData[index].completed;
  saveTasks();
  updateTaskList();
}

function getTaskUrgency(task) {
  if (task.completed) return null;
  const now = new Date();
  const deadline = new Date(`${task.due}T${task.dueTime}`);
  const timeLeft = (deadline - now) / (1000 * 60 * 60); // hours
  const minTime = task.minTime;
  if (timeLeft < 0) {
    return { level: 'overdue', color: '#8B0000', text: 'OVERDUE' };
  } else if (timeLeft <= minTime) {
    return { level: 'very-urgent', color: '#FF0000', text: 'VERY URGENT' };
  } else if (timeLeft <= minTime * 2) {
    return { level: 'urgent-red', color: '#DC143C', text: 'URGENT' };
  } else if (timeLeft <= minTime * 4) {
    return { level: 'urgent-green', color: '#228B22', text: 'URGENT' };
  } else {
    return null; // No urgent tag if more than 4x minTime left
  }
}

function getImportanceColor(importance) {
  const colors = {
    'optional': '#808080',
    'low': '#4169E1',
    'medium': '#FF8C00',
    'high': '#FF4500'
  };
  return colors[importance] || '#808080';
}

function updateTaskList() {
  const taskListDiv = document.getElementById('task-list');
  if (!taskListDiv) {
    console.error('task-list element not found!');
    return;
  }
  
  console.log('Updating task list with', taskData.length, 'tasks');
  taskListDiv.innerHTML = '';

  // Sort tasks: completed to bottom, then overdue, then urgency, then due date
  const sortedTasks = taskData.map((task, index) => ({ ...task, originalIndex: index }))
    .sort((a, b) => {
      // Completed tasks go to bottom
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      if (a.completed && b.completed) return 0;

      // Overdue tasks first
      const urgencyA = getTaskUrgency(a);
      const urgencyB = getTaskUrgency(b);
      if (urgencyA?.level === 'overdue' && urgencyB?.level !== 'overdue') return -1;
      if (urgencyA?.level !== 'overdue' && urgencyB?.level === 'overdue') return 1;

      // If neither is urgent, sort by due date
      const urgencyOrder = ['very-urgent', 'urgent-red', 'urgent-green'];
      const aOrder = urgencyA ? urgencyOrder.indexOf(urgencyA.level) : -1;
      const bOrder = urgencyB ? urgencyOrder.indexOf(urgencyB.level) : -1;
      if (aOrder === -1 && bOrder === -1) {
        return new Date(`${a.due}T${a.dueTime}`) - new Date(`${b.due}T${b.dueTime}`);
      }
      // If only one is urgent, urgent comes first
      if (aOrder === -1) return 1;
      if (bOrder === -1) return -1;
      // Both urgent, sort by urgency
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Same urgency, sort by due date
      return new Date(`${a.due}T${a.dueTime}`) - new Date(`${b.due}T${b.dueTime}`);
    });

  console.log('Sorted tasks:', sortedTasks);

  sortedTasks.forEach((task) => {
    const urgency = getTaskUrgency(task);
    const importanceColor = getImportanceColor(task.importance);
    
    const urgencyTag = urgency ? 
      `<span class="urgency-tag" style="background-color: ${urgency.color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 5px;">${urgency.text}</span>` : '';
    
    const importanceTag = `<span class="importance-tag" style="background-color: ${importanceColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 5px;">${task.importance.toUpperCase()}</span>`;
    
    taskListDiv.innerHTML += `
      <div class="task-item ${task.completed ? 'done dull' : ''}">
        <input type="checkbox" onchange="toggleTask(${task.originalIndex})" ${task.completed ? 'checked' : ''} />
        <span class="${task.completed ? 'done' : ''}">${task.title}</span>
        <div class="task-details">
          <small>Due: ${task.due} ${task.dueTime} | Min time: ${formatMinTime(task.minTime)}</small>
          ${importanceTag}
          ${urgencyTag}
        </div>
      </div>
    `;
  });

  console.log('Task list HTML updated');
  updateTaskSummary();
}

function updateTaskSummary() {
  const completed = taskData.filter(t => t.completed).length;
  const total = taskData.length;
  const percent = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
  document.getElementById('task-summary').innerHTML = `
    <p>✅ Completed: ${completed} / ${total} (${percent}%)</p>
  `;
}

function saveTasks() {
  localStorage.setItem('taskData', JSON.stringify(taskData));
}

function loadTasks() {
  const stored = localStorage.getItem('taskData');
  if (stored) {
    taskData = JSON.parse(stored);
    updateTaskList();
  }
}

// Task notifications
function getUrgentTasks() {
  return taskData.filter(task => {
    if (task.completed) return false;
    const urgency = getTaskUrgency(task);
    return urgency && ['urgent-green', 'urgent-red', 'very-urgent', 'overdue'].includes(urgency.level);
  });
}

function respondToTaskNotification(taskIndex, action) {
  const task = taskData[taskIndex];
  if (!task) return;
  
  switch(action) {
    case 'done':
      task.completed = true;
      break;
    case 'starting':
      // Mark as started (could add a started timestamp)
      task.started = new Date().toISOString();
      break;
    case 'skipped':
      // Mark as skipped for this time (could add skip count)
      task.skipped = (task.skipped || 0) + 1;
      break;
  }
  
  saveTasks();
  updateTaskList();
  
  // Refresh dashboard scores
  if (typeof calculateTotalScore === 'function') {
    calculateTotalScore();
  }
}

// Make functions globally available
window.getUrgentTasks = getUrgentTasks;
window.getTaskUrgency = getTaskUrgency;
window.respondToTaskNotification = respondToTaskNotification;
window.formatMinTime = formatMinTime;
window.parseMinTime = parseMinTime;

document.addEventListener('DOMContentLoaded', function() {
  // Add task form fields if not present (fallback)
  const existingTitle = document.getElementById('task-title');
  const existingTime = document.getElementById('task-due-time');
  
  if (existingTitle && !existingTime) {
    const form = existingTitle.parentNode;
    
    // Add missing fields
    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.id = 'task-due-time';
    timeInput.required = true;
    
    const minTimeInput = document.createElement('input');
    minTimeInput.type = 'text';
    minTimeInput.id = 'task-min-time';
    minTimeInput.placeholder = 'Min time: 30m, 2h, 1:30, 2:30:00';
    minTimeInput.title = 'Format: 30m (minutes), 2h (hours), 1:30 (hours:minutes), 2:30:00 (days:hours:minutes), or just numbers';
    minTimeInput.required = true;
    
    const importanceSelect = document.createElement('select');
    importanceSelect.id = 'task-importance';
    importanceSelect.required = true;
    importanceSelect.innerHTML = `
      <option value="optional">Optional</option>
      <option value="low" selected>Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    `;
    
    // Insert after due date
    const dueInput = document.getElementById('task-due');
    if (dueInput) {
      dueInput.parentNode.insertBefore(timeInput, dueInput.nextSibling);
      dueInput.parentNode.insertBefore(minTimeInput, timeInput.nextSibling);
      dueInput.parentNode.insertBefore(importanceSelect, minTimeInput.nextSibling);
    }
  }
  
  loadTasks();
});
