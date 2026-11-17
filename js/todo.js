let tasks = JSON.parse(localStorage.getItem("nebula_today_tasks") || "[]");

document.getElementById("todo-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("todo-input");
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ id: Date.now(), text });
  saveAndRenderTodos();
  input.value = "";
});

function deleteTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  saveAndRenderTodos();
}

function saveAndRenderTodos() {
  localStorage.setItem("nebula_today_tasks", JSON.stringify(tasks));
  renderTodos();
}

function renderTodos() {
  const list = document.getElementById("todo-list");
  document.getElementById("task-counter").textContent = `${tasks.length} Tasks`;
  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.innerHTML = `
      <span><strong>${index + 1}.</strong> ${task.text}</span>
      <button class="delete-task-btn" onclick="deleteTask(${task.id})">✓ Done</button>
    `;
    list.appendChild(li);
  });
}