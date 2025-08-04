let todoData = {};

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function addTodo() {
  const text = document.getElementById('todo-text').value.trim();
  const today = getToday();

  if (!text) return;

  if (!todoData[today]) todoData[today] = [];

  todoData[today].push({ text, done: false });
  document.getElementById('todo-text').value = '';

  updateTodoList();
  saveTodos();
}

function toggleTodo(index) {
  const today = getToday();
  if (todoData[today]) {
    todoData[today][index].done = !todoData[today][index].done;
    updateTodoList();
    saveTodos();
  }
}

function updateTodoList() {
  const listDiv = document.getElementById('todo-list');
  const today = getToday();
  const todos = todoData[today] || [];

  listDiv.innerHTML = '';
  todos.forEach((todo, index) => {
    listDiv.innerHTML += `
      <div class="todo-item ${todo.done ? 'done' : ''}">
        <input type="checkbox" onchange="toggleTodo(${index})" ${todo.done ? 'checked' : ''} />
        <span>${todo.text}</span>
      </div>
    `;
  });

  updateTodoSummary();
}

function updateTodoSummary() {
  const today = getToday();
  const todos = todoData[today] || [];
  const done = todos.filter(t => t.done).length;
  const percent = todos.length > 0 ? ((done / todos.length) * 100).toFixed(1) : 0;

  document.getElementById('todo-summary').innerHTML = `
    <p>✅ Completed: ${done} / ${todos.length} (${percent}%)</p>
  `;
}

function saveTodos() {
  localStorage.setItem('todoData', JSON.stringify(todoData));
}

function loadTodos() {
  const stored = localStorage.getItem('todoData');
  if (stored) {
    todoData = JSON.parse(stored);
    updateTodoList();
  }
}

document.addEventListener('DOMContentLoaded', loadTodos);
