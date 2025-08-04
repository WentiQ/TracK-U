let taskData = [];

function addTask() {
  const title = document.getElementById('task-title').value.trim();
  const due = document.getElementById('task-due').value;

  if (!title || !due) {
    alert("Please enter both task title and due date.");
    return;
  }

  taskData.push({
    title,
    due,
    completed: false
  });

  document.getElementById('task-title').value = '';
  document.getElementById('task-due').value = '';

  updateTaskList();
  saveTasks();
}

function toggleTask(index) {
  taskData[index].completed = !taskData[index].completed;
  updateTaskList();
  saveTasks();
}

function updateTaskList() {
  const taskListDiv = document.getElementById('task-list');
  taskListDiv.innerHTML = '';

  taskData.forEach((task, index) => {
    taskListDiv.innerHTML += `
      <div class="task-item ${task.completed ? 'done' : ''}">
        <input type="checkbox" onchange="toggleTask(${index})" ${task.completed ? 'checked' : ''} />
        <span>${task.title} - Due: ${task.due}</span>
      </div>
    `;
  });

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

document.addEventListener('DOMContentLoaded', loadTasks);
