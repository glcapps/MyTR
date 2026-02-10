const workInput = document.getElementById("work-input");
const restInput = document.getElementById("rest-input");
const roundsInput = document.getElementById("rounds-input");
const preview = document.getElementById("preview");
const sessionLength = document.getElementById("session-length");
const presetList = document.getElementById("preset-list");
const cacheStatus = document.getElementById("cache-status");
const saveBtn = document.getElementById("save-btn");
const resetBtn = document.getElementById("reset-btn");
const installBtn = document.getElementById("install-btn");
const historyList = document.getElementById("history-list");
const historyCountEl = document.getElementById("history-count");
const historyTotalEl = document.getElementById("history-total");
const startBtn = document.getElementById("start-btn");
const quickRestartBtn = document.getElementById("quick-restart");
const clearHistoryBtn = document.getElementById("clear-history");
const nameInput = document.getElementById("name-input");
const timerDisplay = document.getElementById("timer-display");
const roundDisplay = document.getElementById("round-display");
const totalRemainingEl = document.getElementById("total-remaining");
const currentNameEl = document.getElementById("current-name");
const nextPhaseEl = document.getElementById("next-phase");
const elapsedTimeEl = document.getElementById("elapsed-time");
const completeBanner = document.getElementById("complete-banner");
const phasePill = document.getElementById("phase-pill");
const progressBar = document.getElementById("progress-bar");
const pauseBtn = document.getElementById("pause-btn");
const stopBtn = document.getElementById("stop-btn");
const nextBtn = document.getElementById("next-btn");
const endBtn = document.getElementById("end-btn");
const soundToggle = document.getElementById("sound-toggle");
const workoutBtn = document.getElementById("workout-btn");
const exitWorkoutBtn = document.getElementById("exit-workout-btn");
const vibrateToggle = document.getElementById("vibrate-toggle");
const templateButtons = document.querySelectorAll(".template-btn");
const startSoundToggle = document.getElementById("start-sound");
const keepAwakeToggle = document.getElementById("keep-awake");
const autoWorkoutToggle = document.getElementById("auto-workout");

let deferredInstallPrompt = null;

const STORAGE_KEY = "mytr-presets-v1";
const HISTORY_KEY = "mytr-history-v1";
const LAST_SESSION_KEY = "mytr-last-session-v1";
const SETTINGS_KEY = "mytr-settings-v1";
const LAST_CONFIG_KEY = "mytr-last-config-v1";
const timerState = {
  running: false,
  paused: false,
  phase: "ready",
  round: 0,
  remaining: 0,
  duration: 0,
  intervalId: null,
  lastTick: 0,
  audioCtx: null,
  wakeLock: null,
  beepsFired: new Set(),
};

const state = {
  work: Number(workInput.value) || 40,
  rest: Number(restInput.value) || 20,
  rounds: Number(roundsInput.value) || 6,
  name: "Custom interval",
};

const loadPresets = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Preset load failed", err);
    return [];
  }
};

const savePresets = (presets) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
};

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("History load failed", err);
    return [];
  }
};

const saveHistory = (entries) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
};

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Settings load failed", err);
    return null;
  }
};

const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const loadLastSession = () => {
  try {
    const raw = localStorage.getItem(LAST_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Last session load failed", err);
    return null;
  }
};

const saveLastSession = (payload) => {
  localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(payload));
};

const loadLastConfig = () => {
  try {
    const raw = localStorage.getItem(LAST_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Config load failed", err);
    return null;
  }
};

const saveLastConfig = (payload) => {
  localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(payload));
};
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatTimestamp = (stamp) => {
  const date = new Date(stamp);
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const getTotalRemaining = () => {
  if (timerState.phase === "ready") return (state.work + state.rest) * state.rounds;
  if (timerState.phase === "done") return 0;
  if (timerState.phase === "countdown") return timerState.remaining + (state.work + state.rest) * state.rounds;
  if (timerState.phase === "work") {
    const roundsLeftAfterThis = state.rounds - timerState.round;
    return timerState.remaining + state.rest + roundsLeftAfterThis * (state.work + state.rest);
  }
  if (timerState.phase === "rest") {
    const roundsLeftAfterThis = state.rounds - timerState.round;
    return timerState.remaining + roundsLeftAfterThis * (state.work + state.rest);
  }
  return 0;
};

const getTotalDuration = () => {
  return 3 + (state.work + state.rest) * state.rounds;
};

const renderHistory = () => {
  const history = loadHistory();
  historyList.innerHTML = "";
  const totalSeconds = history.reduce((sum, entry) => sum + (entry.totalSeconds || 0), 0);
  historyCountEl.textContent = history.length;
  historyTotalEl.textContent = formatDuration(totalSeconds);
  if (!history.length) {
    historyList.innerHTML =
      '<div class="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate">No sessions yet.</div>';
    return;
  }

  history.slice(0, 6).forEach((entry) => {
    const card = document.createElement("div");
    card.className =
      "rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left";
    card.innerHTML = `
      <div class="text-sm text-slate">${formatTimestamp(entry.completedAt)}</div>
      <div class="text-lg font-display">${entry.name || "Custom interval"}</div>
      <div class="text-sm text-slate">${entry.work}s / ${entry.rest}s · ${entry.rounds} rounds</div>
      <div class="text-xs text-slate">Total ${formatDuration(entry.totalSeconds)}</div>
    `;
    historyList.appendChild(card);
  });
};

const ensureAudio = () => {
  if (!soundToggle.checked) return null;
  if (!timerState.audioCtx) {
    timerState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (timerState.audioCtx.state === "suspended") {
    timerState.audioCtx.resume();
  }
  return timerState.audioCtx;
};

const playBeep = (frequency = 880, duration = 0.12) => {
  const ctx = ensureAudio();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gainNode.gain.value = 0.08;
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
};

const vibrate = (pattern) => {
  if (!vibrateToggle.checked) return;
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
};

const applyPhaseStyles = () => {
  const phase = timerState.phase;
  const isWork = phase === "work";
  phasePill.textContent =
    phase === "ready"
      ? "Ready"
      : phase === "done"
      ? "Complete"
      : phase === "countdown"
      ? "Get Ready"
      : phase.toUpperCase();
  phasePill.className =
    "rounded-full px-3 py-1 text-xs " +
    (phase === "ready"
      ? "bg-white/10 text-slate"
      : phase === "countdown"
      ? "bg-white/20 text-white"
      : phase === "done"
      ? "bg-white/20 text-white"
      : isWork
      ? "bg-mint text-ink"
      : "bg-neon text-ink");
  progressBar.className =
    "h-2 rounded-full transition-all " + (isWork ? "bg-mint" : "bg-neon");
  document.getElementById("run-panel").classList.toggle("phase-work", phase === "work");
  document.getElementById("run-panel").classList.toggle("phase-rest", phase === "rest");

  if (phase === "ready" || phase === "countdown") {
    nextPhaseEl.textContent = "Work";
  } else if (phase === "work") {
    nextPhaseEl.textContent = "Rest";
  } else if (phase === "rest") {
    nextPhaseEl.textContent = timerState.round >= state.rounds ? "Done" : "Work";
  } else {
    nextPhaseEl.textContent = "Done";
  }
};

const updateTimerDisplay = () => {
  const remaining = Math.max(0, timerState.remaining);
  timerDisplay.textContent = formatDuration(remaining);
  roundDisplay.textContent = `Round ${timerState.round} / ${state.rounds}`;
  const progress = timerState.duration ? ((timerState.duration - remaining) / timerState.duration) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  totalRemainingEl.textContent = formatDuration(getTotalRemaining());
  const elapsed = Math.max(0, getTotalDuration() - getTotalRemaining());
  elapsedTimeEl.textContent = formatDuration(elapsed);
};

const setControlsEnabled = (enabled) => {
  [workInput, restInput, roundsInput, saveBtn, resetBtn].forEach((el) => {
    el.disabled = !enabled;
    el.classList.toggle("opacity-60", !enabled);
    el.classList.toggle("pointer-events-none", !enabled);
  });
  startBtn.disabled = !enabled;
  startBtn.textContent = enabled ? "Start Session" : "Running";
};

const setWorkoutMode = async (enabled) => {
  document.body.classList.toggle("workout-mode", enabled);
  exitWorkoutBtn.classList.toggle("hidden", !enabled);
  workoutBtn.classList.toggle("hidden", enabled);

  if (enabled && document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.warn("Fullscreen request failed", err);
    }
  }

  if (enabled && "wakeLock" in navigator && keepAwakeToggle.checked) {
    try {
      timerState.wakeLock = await navigator.wakeLock.request("screen");
    } catch (err) {
      console.warn("Wake lock failed", err);
    }
  } else if (!enabled && timerState.wakeLock) {
    try {
      await timerState.wakeLock.release();
    } catch (err) {
      console.warn("Wake lock release failed", err);
    } finally {
      timerState.wakeLock = null;
    }
  }
};

const stopTimer = () => {
  timerState.running = false;
  timerState.paused = false;
  timerState.phase = "ready";
  timerState.round = 0;
  timerState.remaining = 0;
  timerState.duration = 0;
  timerState.beepsFired.clear();
  completeBanner.classList.add("hidden");
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  if (timerState.wakeLock) {
    timerState.wakeLock.release().catch(() => null);
    timerState.wakeLock = null;
  }
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch(() => null);
  }
  pauseBtn.textContent = "Pause";
  setControlsEnabled(true);
  applyPhaseStyles();
  updateTimerDisplay();
  document.title = "MyTR Timer";
};

const advancePhase = () => {
  if (timerState.phase === "ready") {
    timerState.phase = "work";
    timerState.round = 1;
    timerState.duration = state.work;
    timerState.remaining = state.work;
    playBeep(880, 0.18);
    vibrate([120]);
    return;
  }

  if (timerState.phase === "countdown") {
    timerState.phase = "work";
    timerState.round = 1;
    timerState.duration = state.work;
    timerState.remaining = state.work;
    playBeep(880, 0.18);
    vibrate([120]);
    return;
  }

  if (timerState.phase === "work") {
    timerState.phase = "rest";
    timerState.duration = state.rest;
    timerState.remaining = state.rest;
    playBeep(520, 0.18);
    vibrate([120, 80, 120]);
    return;
  }

  if (timerState.phase === "rest") {
    if (timerState.round >= state.rounds) {
      timerState.phase = "done";
      timerState.duration = 0;
      timerState.remaining = 0;
      playBeep(1200, 0.3);
      vibrate([200, 100, 200]);
      saveLastSession({ name: state.name, work: state.work, rest: state.rest, rounds: state.rounds });
      const history = loadHistory();
      history.unshift({
        name: state.name,
        work: state.work,
        rest: state.rest,
        rounds: state.rounds,
        totalSeconds: (state.work + state.rest) * state.rounds,
        completedAt: Date.now(),
      });
      saveHistory(history.slice(0, 20));
      renderHistory();
    } else {
      timerState.phase = "work";
      timerState.round += 1;
      timerState.duration = state.work;
      timerState.remaining = state.work;
      playBeep(880, 0.18);
    }
  }
};

const tick = () => {
  if (!timerState.running || timerState.paused) return;
  const now = Date.now();
  const delta = Math.floor((now - timerState.lastTick) / 1000);
  if (delta <= 0) return;
  timerState.lastTick = now;
  timerState.remaining = Math.max(0, timerState.remaining - delta);
  if (navigator.setAppBadge) {
    navigator.setAppBadge(timerState.remaining).catch(() => null);
  }
  const phaseLabel =
    timerState.phase === "work"
      ? "WORK"
      : timerState.phase === "rest"
      ? "REST"
      : timerState.phase === "countdown"
      ? "GET READY"
      : "READY";
  document.title = `${formatDuration(timerState.remaining)} · ${phaseLabel} · MyTR Timer`;
  if (timerState.remaining > 0 && timerState.remaining <= 3 && timerState.phase !== "ready") {
    if (!timerState.beepsFired.has(timerState.remaining)) {
      timerState.beepsFired.add(timerState.remaining);
      playBeep(1040, 0.08);
      vibrate([40]);
    }
  } else if (timerState.remaining > 3) {
    timerState.beepsFired.clear();
  }
  if (timerState.remaining === 0) {
    if (timerState.phase === "countdown") {
      advancePhase();
    } else {
      advancePhase();
    }
    if (timerState.phase === "done") {
      stopTimer();
      phasePill.textContent = "Complete";
      phasePill.className = "rounded-full bg-white/20 px-3 py-1 text-xs text-white";
      completeBanner.textContent = `Session complete · ${formatDuration(
        (state.work + state.rest) * state.rounds
      )}`;
      completeBanner.classList.remove("hidden");
      return;
    }
  }
  applyPhaseStyles();
  updateTimerDisplay();
};

const startTimer = () => {
  if (timerState.running && !timerState.paused) return;
  if (!timerState.running) {
    stopTimer();
    timerState.running = true;
    timerState.phase = "countdown";
    timerState.round = 0;
    timerState.duration = 3;
    timerState.remaining = 3;
    if (startSoundToggle.checked) {
      playBeep(660, 0.12);
    }
    if (autoWorkoutToggle.checked) {
      setWorkoutMode(true);
    }
    completeBanner.classList.add("hidden");
  }
  ensureAudio();
  timerState.paused = false;
  timerState.lastTick = Date.now();
  applyPhaseStyles();
  updateTimerDisplay();
  setControlsEnabled(false);
  document.title = `${formatDuration(timerState.remaining)} · Get Ready · MyTR Timer`;
  if (!timerState.intervalId) {
    timerState.intervalId = setInterval(tick, 250);
  }
};

const updatePreview = () => {
  preview.textContent = `${state.work}s Work · ${state.rest}s Rest · ${state.rounds} Rounds`;
  const totalSeconds = (state.work + state.rest) * state.rounds;
  sessionLength.textContent = formatDuration(totalSeconds);
  currentNameEl.textContent = state.name || "Custom interval";
};

const renderPresets = () => {
  const presets = loadPresets();
  presetList.innerHTML = "";

  if (!presets.length) {
    presetList.innerHTML =
      '<div class="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate">No presets saved yet.</div>';
    return;
  }

  const loadPreset = (preset, autoStart = false) => {
    nameInput.value = preset.name || "Custom interval";
    workInput.value = preset.work;
    restInput.value = preset.rest;
    roundsInput.value = preset.rounds;
    state.name = preset.name || "Custom interval";
    state.work = preset.work;
    state.rest = preset.rest;
    state.rounds = preset.rounds;
    updatePreview();
    if (autoStart) startTimer();
  };

  presets.forEach((preset, index) => {
    const card = document.createElement("button");
    card.className =
      "group rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left hover:border-white/40";
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm text-slate">${preset.name || `Preset ${index + 1}`}</div>
          <div class="text-lg font-display">${preset.work}s / ${preset.rest}s · ${preset.rounds} rounds</div>
        </div>
        <div class="flex gap-2">
          <button class="preset-start rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 hover:border-white/40" type="button">
            Start
          </button>
          <button class="preset-delete rounded-full border border-white/15 px-3 py-1 text-xs text-white/50 hover:border-white/40" type="button">
            Delete
          </button>
        </div>
      </div>
    `;
    card.addEventListener("click", () => loadPreset(preset, false));
    card.querySelector(".preset-start").addEventListener("click", (event) => {
      event.stopPropagation();
      loadPreset(preset, true);
    });
    card.querySelector(".preset-delete").addEventListener("click", (event) => {
      event.stopPropagation();
      const updated = loadPresets().filter((_, i) => i !== index);
      savePresets(updated);
      renderPresets();
    });
    presetList.appendChild(card);
  });
};

const handleInput = (key, value) => {
  state[key] = Number(value) || 0;
  updatePreview();
  if (!timerState.running) {
    updateTimerDisplay();
  }
  saveLastConfig({
    name: state.name,
    work: state.work,
    rest: state.rest,
    rounds: state.rounds,
  });
};

nameInput.addEventListener("input", (event) => {
  state.name = event.target.value.trim() || "Custom interval";
  updatePreview();
  saveLastConfig({
    name: state.name,
    work: state.work,
    rest: state.rest,
    rounds: state.rounds,
  });
});

templateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (timerState.running) return;
    const work = Number(button.dataset.work);
    const rest = Number(button.dataset.rest);
    const rounds = Number(button.dataset.rounds);
    const label = button.textContent.trim();
    nameInput.value = label;
    workInput.value = work;
    restInput.value = rest;
    roundsInput.value = rounds;
    state.name = label;
    state.work = work;
    state.rest = rest;
    state.rounds = rounds;
    updatePreview();
    updateTimerDisplay();
    saveLastConfig({
      name: state.name,
      work: state.work,
      rest: state.rest,
      rounds: state.rounds,
    });
  });
});

workInput.addEventListener("input", (event) => handleInput("work", event.target.value));
restInput.addEventListener("input", (event) => handleInput("rest", event.target.value));
roundsInput.addEventListener("input", (event) => handleInput("rounds", event.target.value));

saveBtn.addEventListener("click", () => {
  const defaultName = state.name || `${state.work}s / ${state.rest}s x${state.rounds}`;
  const name = window.prompt("Preset name:", defaultName);
  const presets = loadPresets();
  presets.unshift({
    name: name ? name.trim() : defaultName,
    work: state.work,
    rest: state.rest,
    rounds: state.rounds,
    savedAt: Date.now(),
  });
  savePresets(presets.slice(0, 12));
  renderPresets();
});

startBtn.addEventListener("click", startTimer);

quickRestartBtn.addEventListener("click", () => {
  const last = loadLastSession();
  if (!last) return;
  nameInput.value = last.name || "Custom interval";
  workInput.value = last.work;
  restInput.value = last.rest;
  roundsInput.value = last.rounds;
  state.name = last.name || "Custom interval";
  state.work = last.work;
  state.rest = last.rest;
  state.rounds = last.rounds;
  updatePreview();
  updateTimerDisplay();
  startTimer();
});

clearHistoryBtn.addEventListener("click", () => {
  if (!window.confirm("Clear all session history?")) return;
  saveHistory([]);
  renderHistory();
});

pauseBtn.addEventListener("click", () => {
  if (!timerState.running) return;
  timerState.paused = !timerState.paused;
  pauseBtn.textContent = timerState.paused ? "Resume" : "Pause";
  if (!timerState.paused) {
    timerState.lastTick = Date.now();
  }
});

stopBtn.addEventListener("click", stopTimer);
nextBtn.addEventListener("click", () => {
  if (!timerState.running) return;
  timerState.remaining = 0;
  advancePhase();
  applyPhaseStyles();
  updateTimerDisplay();
});
endBtn.addEventListener("click", () => {
  if (!timerState.running) return;
  stopTimer();
});

workoutBtn.addEventListener("click", () => setWorkoutMode(true));
exitWorkoutBtn.addEventListener("click", () => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => null);
  }
  setWorkoutMode(false);
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    document.body.classList.remove("workout-mode");
    exitWorkoutBtn.classList.add("hidden");
    workoutBtn.classList.remove("hidden");
  }
});

resetBtn.addEventListener("click", () => {
  nameInput.value = "Custom interval";
  workInput.value = 40;
  restInput.value = 20;
  roundsInput.value = 6;
  state.name = "Custom interval";
  state.work = 40;
  state.rest = 20;
  state.rounds = 6;
  updatePreview();
  saveLastConfig({
    name: state.name,
    work: state.work,
    rest: state.rest,
    rounds: state.rounds,
  });
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.classList.add("hidden");
});

const updateCacheStatus = async () => {
  if (!("caches" in window)) {
    cacheStatus.textContent = "unavailable";
    return;
  }

  const cacheNames = await caches.keys();
  cacheStatus.textContent = cacheNames.length ? "ready for offline use" : "preparing...";
};

const lastConfig = loadLastConfig();
if (lastConfig) {
  nameInput.value = lastConfig.name || "Custom interval";
  workInput.value = lastConfig.work ?? 40;
  restInput.value = lastConfig.rest ?? 20;
  roundsInput.value = lastConfig.rounds ?? 6;
  state.name = nameInput.value;
  state.work = Number(workInput.value) || 40;
  state.rest = Number(restInput.value) || 20;
  state.rounds = Number(roundsInput.value) || 6;
} else {
  nameInput.value = state.name;
}
updatePreview();
renderPresets();
updateCacheStatus();
stopTimer();
renderHistory();

const refreshCacheStatus = () => {
  updateCacheStatus().catch(() => null);
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", refreshCacheStatus);
  navigator.serviceWorker.addEventListener("message", refreshCacheStatus);
}

const settings = loadSettings();
if (settings) {
  soundToggle.checked = settings.sound ?? soundToggle.checked;
  vibrateToggle.checked = settings.vibrate ?? vibrateToggle.checked;
  startSoundToggle.checked = settings.startSound ?? startSoundToggle.checked;
  keepAwakeToggle.checked = settings.keepAwake ?? keepAwakeToggle.checked;
  autoWorkoutToggle.checked = settings.autoWorkout ?? autoWorkoutToggle.checked;
}

[soundToggle, vibrateToggle, startSoundToggle, keepAwakeToggle, autoWorkoutToggle].forEach((toggle) => {
  toggle.addEventListener("change", () => {
    saveSettings({
      sound: soundToggle.checked,
      vibrate: vibrateToggle.checked,
      startSound: startSoundToggle.checked,
      keepAwake: keepAwakeToggle.checked,
      autoWorkout: autoWorkoutToggle.checked,
    });
  });
});
