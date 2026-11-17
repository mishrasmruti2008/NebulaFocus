async function logCompletedStudySession(minutes) {
  if (!currentUser) return;
  await supabaseClient.from("study_logs").insert([
    { user_id: currentUser.id, minutes: minutes }
  ]);
}

async function toggleDashboard() {
  const modal = document.getElementById("dashboard-modal");
  modal.classList.toggle("active");

  if (modal.classList.contains("active")) {
    await loadAnalyticsData();
  }
}

async function loadAnalyticsData() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabaseClient
    .from("study_logs")
    .select("minutes, created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (error) return console.error(error);

  const todayStr = new Date().toISOString().split("T")[0];
  let todayMins = 0;
  let weekMins = 0;

  // Prepare last 7 days map
  const dailyMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = { label: d.toLocaleDateString("en-US", { weekday: "short" }), mins: 0 };
  }

  data.forEach(row => {
    const dayKey = row.created_at.split("T")[0];
    weekMins += row.minutes;
    if (dayKey === todayStr) todayMins += row.minutes;
    if (dailyMap[dayKey]) dailyMap[dayKey].mins += row.minutes;
  });

  document.getElementById("today-minutes").textContent = `${todayMins} mins`;
  document.getElementById("week-minutes").textContent = `${weekMins} mins`;

  renderWeeklyChart(Object.values(dailyMap));
}

function renderWeeklyChart(daysArray) {
  const chart = document.getElementById("weekly-chart");
  chart.innerHTML = "";
  const maxMins = Math.max(...daysArray.map(d => d.mins), 60);

  daysArray.forEach(day => {
    const heightPct = Math.round((day.mins / maxMins) * 100);
    const col = document.createElement("div");
    col.className = "bar-col";
    col.innerHTML = `
      <span class="bar-val">${day.mins}m</span>
      <div class="bar-fill" style="height: ${heightPct}%"></div>
      <span class="bar-label">${day.label}</span>
    `;
    chart.appendChild(col);
  });
}