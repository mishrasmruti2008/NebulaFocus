let studyMinutes = 25;
let breakMinutes = 5;
let timeLeftSeconds = 25 * 60;
let timerInterval = null;
let currentPhase = "IDLE"; // "IDLE" | "STUDY" | "BREAK"
let roomChannel = null;

function connectToRealtimeRoom(roomId) {
  roomChannel = supabaseClient.channel(`study-room-${roomId}`);

  roomChannel
    .on("broadcast", { event: "peer-joined" }, ({ payload }) => {
      callFriendPeer(payload.peerId);
    })
    .on("broadcast", { event: "timer-sync" }, ({ payload }) => {
      applyTimerState(payload);
    })
    .subscribe();
}

function selectPreset(study, brk, btnElement) {
  if (currentPhase !== "IDLE") {
    return alert("Reset the current timer before switching Pomodoro modes.");
  }
  document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
  btnElement.classList.add("active");

  broadcastTimerState({
    phase: "IDLE",
    studyMins: study,
    breakMins: brk,
    secondsLeft: study * 60
  });
}

function startSyncedTimer() {
  if (currentPhase === "STUDY") return; // Already running

  broadcastTimerState({
    phase: "STUDY",
    studyMins: studyMinutes,
    breakMins: breakMinutes,
    secondsLeft: studyMinutes * 60
  });
}

function resetSyncedTimer() {
  broadcastTimerState({
    phase: "IDLE",
    studyMins: studyMinutes,
    breakMins: breakMinutes,
    secondsLeft: studyMinutes * 60
  });
}

function broadcastTimerState(state) {
  applyTimerState(state);
  if (roomChannel) {
    roomChannel.send({
      type: "broadcast",
      event: "timer-sync",
      payload: state
    });
  }
}

function applyTimerState(state) {
  clearInterval(timerInterval);
  currentPhase = state.phase;
  studyMinutes = state.studyMins;
  breakMinutes = state.breakMins;
  timeLeftSeconds = state.secondsLeft;

  document.getElementById("cycle-info").textContent = `${studyMinutes}m Study • ${breakMinutes}m Break`;
  updateTimerDisplay();

  if (currentPhase === "IDLE") {
    document.getElementById("phase-label").textContent = "READY TO FOCUS";
    setStudyFocusMediaLock(false);
    return;
  }

  if (currentPhase === "STUDY") {
    document.getElementById("phase-label").textContent = "🔥 DEEP FOCUS SESSION";
    setStudyFocusMediaLock(true); // Auto-pause audio & video
  } else if (currentPhase === "BREAK") {
    document.getElementById("phase-label").textContent = "☕ BREAK TIME — HANG OUT!";
    setStudyFocusMediaLock(false); // Auto-resume audio & video
  }

  timerInterval = setInterval(() => {
    timeLeftSeconds--;
    updateTimerDisplay();

    if (timeLeftSeconds <= 0) {
      clearInterval(timerInterval);
      handlePhaseComplete();
    }
  }, 1000);
}

async function handlePhaseComplete() {
  if (currentPhase === "STUDY") {
    // Save completed study minutes to Supabase for Daily & Weekly Dashboard
    await logCompletedStudySession(studyMinutes);

    // Automatically transition to Break Mode (Audio & Video turn back ON)
    applyTimerState({
      phase: "BREAK",
      studyMins: studyMinutes,
      breakMins: breakMinutes,
      secondsLeft: breakMinutes * 60
    });
  } else if (currentPhase === "BREAK") {
    // Break finished, return to Ready state
    applyTimerState({
      phase: "IDLE",
      studyMins: studyMinutes,
      breakMins: breakMinutes,
      secondsLeft: studyMinutes * 60
    });
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(timeLeftSeconds / 60);
  const secs = timeLeftSeconds % 60;
  document.getElementById("time-display").textContent =
    `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}