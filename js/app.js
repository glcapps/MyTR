const workInput = document.getElementById("work-input");
const restInput = document.getElementById("rest-input");
const roundsInput = document.getElementById("rounds-input");
const block2Toggle = document.getElementById("block2-toggle");
const block2Panel = document.getElementById("block2-panel");
const block2WorkInput = document.getElementById("block2-work");
const block2RestInput = document.getElementById("block2-rest");
const block2RoundsInput = document.getElementById("block2-rounds");
const warmupInput = document.getElementById("warmup-input");
const cooldownInput = document.getElementById("cooldown-input");
const preview = document.getElementById("preview");
const sessionLength = document.getElementById("session-length");
const sequencePreview = document.getElementById("sequence-preview");
const presetList = document.getElementById("preset-list");
const cacheStatus = document.getElementById("cache-status");
const saveBtn = document.getElementById("save-btn");
const resetBtn = document.getElementById("reset-btn");
const installBtn = document.getElementById("install-btn");
const historyList = document.getElementById("history-list");
const historyCountEl = document.getElementById("history-count");
const historyTotalEl = document.getElementById("history-total");
const historyPanel = document.getElementById("history-panel");
const toggleHistoryBtn = document.getElementById("toggle-history");
const startBtn = document.getElementById("start-btn");
const quickRestartBtn = document.getElementById("quick-restart");
const clearHistoryBtn = document.getElementById("clear-history");
const nameInput = document.getElementById("name-input");
const shareBtn = document.getElementById("share-session");
const exportPresetsBtn = document.getElementById("export-presets");
const importPresetsBtn = document.getElementById("import-presets");
const importFileInput = document.getElementById("import-file");
const resetAllBtn = document.getElementById("reset-all");
const timerDisplay = document.getElementById("timer-display");
const roundDisplay = document.getElementById("round-display");
const totalRemainingEl = document.getElementById("total-remaining");
const currentNameEl = document.getElementById("current-name");
const nextPhaseEl = document.getElementById("next-phase");
const elapsedTimeEl = document.getElementById("elapsed-time");
const completeBanner = document.getElementById("complete-banner");
const targetDurationEl = document.getElementById("target-duration");
const phasePill = document.getElementById("phase-pill");
const progressBar = document.getElementById("progress-bar");
const pauseBtn = document.getElementById("pause-btn");
const stopBtn = document.getElementById("stop-btn");
const nextBtn = document.getElementById("next-btn");
const endBtn = document.getElementById("end-btn");
const settingsPanel = document.getElementById("settings-panel");
const settingsToggle = document.getElementById("settings-toggle");
const soundToggle = document.getElementById("sound-toggle");
const workoutBtn = document.getElementById("workout-btn");
const exitWorkoutBtn = document.getElementById("exit-workout-btn");
const vibrateToggle = document.getElementById("vibrate-toggle");
const templateUseButtons = document.querySelectorAll(".template-use");
const templateSaveButtons = document.querySelectorAll(".template-save");
const startSoundToggle = document.getElementById("start-sound");
const keepAwakeToggle = document.getElementById("keep-awake");
const autoWorkoutToggle = document.getElementById("auto-workout");
const countdownToggle = document.getElementById("countdown-toggle");
const voiceToggle = document.getElementById("voice-toggle");
const cueVolumeInput = document.getElementById("cue-volume");
const cueVolumeValue = document.getElementById("cue-volume-value");
const testCueBtn = document.getElementById("test-cue");

let deferredInstallPrompt = null;

const STORAGE_KEY = "mytr-presets-v1";
const HISTORY_KEY = "mytr-history-v1";
const LAST_SESSION_KEY = "mytr-last-session-v1";
const SETTINGS_KEY = "mytr-settings-v1";
const LAST_CONFIG_KEY = "mytr-last-config-v1";
const UI_KEY = "mytr-ui-v1";
const timerState = {
  running: false,
  paused: false,
  phase: "ready",
  round: 0,
  blockIndex: 0,
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
  warmup: Number(warmupInput.value) || 0,
  cooldown: Number(cooldownInput.value) || 0,
  block2Enabled: block2Toggle.checked,
  block2Work: Number(block2WorkInput.value) || 30,
  block2Rest: Number(block2RestInput.value) || 15,
  block2Rounds: Number(block2RoundsInput.value) || 4,
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

const loadUI = () => {
  try {
    const raw = localStorage.getItem(UI_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("UI load failed", err);
    return null;
  }
};

const saveUI = (ui) => {
  localStorage.setItem(UI_KEY, JSON.stringify(ui));
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

const getBlocks = () => {
  const blocks = [
    { work: state.work, rest: state.rest, rounds: state.rounds, label: "Block 1" },
  ];
  if (state.block2Enabled) {
    blocks.push({
      work: state.block2Work,
      rest: state.block2Rest,
      rounds: state.block2Rounds,
      label: "Block 2",
    });
  }
  return blocks;
};

const getTotalRemaining = () => {
  const blocks = getBlocks();
  const blockTotals = blocks.reduce(
    (sum, block) => sum + (block.work + block.rest) * block.rounds,
    0
  );
  if (timerState.phase === "ready") return state.warmup + state.cooldown + blockTotals;
  if (timerState.phase === "done") return 0;
  if (timerState.phase === "countdown") return timerState.remaining + state.warmup + state.cooldown + blockTotals;
  if (timerState.phase === "warmup") {
    return timerState.remaining + state.cooldown + blockTotals;
  }
  if (timerState.phase === "cooldown") return timerState.remaining;

  const currentBlock = blocks[timerState.blockIndex] || blocks[0];
  const remainingBlocks = blocks
    .slice(timerState.blockIndex + 1)
    .reduce((sum, block) => sum + (block.work + block.rest) * block.rounds, 0);

  if (timerState.phase === "work") {
    const roundsLeftAfterThis = currentBlock.rounds - timerState.round;
    return (
      timerState.remaining +
      currentBlock.rest +
      roundsLeftAfterThis * (currentBlock.work + currentBlock.rest) +
      remainingBlocks +
      state.cooldown
    );
  }
  if (timerState.phase === "rest") {
    const roundsLeftAfterThis = currentBlock.rounds - timerState.round;
    return (
      timerState.remaining +
      roundsLeftAfterThis * (currentBlock.work + currentBlock.rest) +
      remainingBlocks +
      state.cooldown
    );
  }
  return 0;
};

const getTotalDuration = () => {
  const blocks = getBlocks();
  const blockTotals = blocks.reduce(
    (sum, block) => sum + (block.work + block.rest) * block.rounds,
    0
  );
  return (countdownToggle.checked ? 3 : 0) + state.warmup + state.cooldown + blockTotals;
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
      ${entry.block2Enabled ? `<div class="text-xs text-slate">Block 2: ${entry.block2Work}s / ${entry.block2Rest}s · ${entry.block2Rounds} rounds</div>` : ""}
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
  const vol = Math.max(0, Math.min(1, Number(cueVolumeInput.value) / 100 || 0));
  gainNode.gain.value = 0.2 * vol;
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
};

const speak = (text) => {
  if (!voiceToggle.checked) return;
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1;
  utterance.volume = Math.max(0, Math.min(1, Number(cueVolumeInput.value) / 100 || 0.7));
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
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
      : phase === "warmup"
      ? "Warm-up"
      : phase === "cooldown"
      ? "Cool-down"
      : phase.toUpperCase();
  phasePill.className =
    "rounded-full px-3 py-1 text-xs " +
    (phase === "ready"
      ? "bg-white/10 text-slate"
      : phase === "countdown"
      ? "bg-white/20 text-white"
      : phase === "warmup" || phase === "cooldown"
      ? "bg-white/15 text-white"
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
    nextPhaseEl.textContent = state.warmup > 0 ? "Warm-up" : "Block 1";
  } else if (phase === "warmup") {
    nextPhaseEl.textContent = "Block 1";
  } else if (phase === "work") {
    nextPhaseEl.textContent = "Rest";
  } else if (phase === "rest") {
    const blocks = getBlocks();
    const currentBlock = blocks[timerState.blockIndex] || blocks[0];
    if (timerState.round >= currentBlock.rounds) {
      nextPhaseEl.textContent =
        timerState.blockIndex < blocks.length - 1
          ? `Block ${timerState.blockIndex + 2}`
          : state.cooldown > 0
          ? "Cool-down"
          : "Done";
    } else {
      nextPhaseEl.textContent = "Work";
    }
  } else if (phase === "cooldown") {
    nextPhaseEl.textContent = "Done";
  } else {
    nextPhaseEl.textContent = "Done";
  }
};

const setPausedUI = (paused) => {
  if (paused) {
    phasePill.textContent = "Paused";
    phasePill.className = "rounded-full bg-white/20 px-3 py-1 text-xs text-white";
    timerDisplay.classList.add("opacity-70");
  } else {
    timerDisplay.classList.remove("opacity-70");
    applyPhaseStyles();
  }
};

const updateTimerDisplay = () => {
  const remaining = Math.max(0, timerState.remaining);
  timerDisplay.textContent = formatDuration(remaining);
  const blocks = getBlocks();
  const currentBlock = blocks[timerState.blockIndex] || blocks[0];
  roundDisplay.textContent = `Block ${timerState.blockIndex + 1} · Round ${timerState.round} / ${currentBlock.rounds}`;
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
  setPausedUI(false);
  setControlsEnabled(true);
  applyPhaseStyles();
  updateTimerDisplay();
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  stopBtn.classList.add("hidden");
  nextBtn.classList.add("hidden");
  endBtn.classList.add("hidden");
  document.title = "MyTR Timer";
};

const advancePhase = () => {
  const blocks = getBlocks();
  const currentBlock = blocks[timerState.blockIndex] || blocks[0];

  if (timerState.phase === "ready") {
    timerState.blockIndex = 0;
    const firstBlock = blocks[0];
    if (state.warmup > 0) {
      timerState.phase = "warmup";
      timerState.round = 0;
      timerState.duration = state.warmup;
      timerState.remaining = state.warmup;
      playBeep(700, 0.18);
      speak("Warm up");
      vibrate([80]);
    } else {
      timerState.phase = "work";
      timerState.round = 1;
      timerState.duration = firstBlock.work;
      timerState.remaining = firstBlock.work;
      playBeep(880, 0.18);
      speak("Work");
      vibrate([120]);
    }
    return;
  }

  if (timerState.phase === "countdown") {
    timerState.blockIndex = 0;
    const firstBlock = blocks[0];
    if (state.warmup > 0) {
      timerState.phase = "warmup";
      timerState.round = 0;
      timerState.duration = state.warmup;
      timerState.remaining = state.warmup;
      playBeep(700, 0.18);
      speak("Warm up");
      vibrate([80]);
    } else {
      timerState.phase = "work";
      timerState.round = 1;
      timerState.duration = firstBlock.work;
      timerState.remaining = firstBlock.work;
      playBeep(880, 0.18);
      speak("Work");
      vibrate([120]);
    }
    return;
  }

  if (timerState.phase === "warmup") {
    timerState.phase = "work";
    timerState.blockIndex = 0;
    timerState.round = 1;
    timerState.duration = currentBlock.work;
    timerState.remaining = currentBlock.work;
    playBeep(880, 0.18);
    speak("Work");
    vibrate([120]);
    return;
  }

  if (timerState.phase === "work") {
    timerState.phase = "rest";
    timerState.duration = currentBlock.rest;
    timerState.remaining = currentBlock.rest;
    playBeep(520, 0.18);
    speak("Rest");
    vibrate([120, 80, 120]);
    return;
  }

  if (timerState.phase === "rest") {
    if (timerState.round >= currentBlock.rounds) {
      if (timerState.blockIndex < blocks.length - 1) {
        timerState.blockIndex += 1;
        const nextBlock = blocks[timerState.blockIndex];
        timerState.phase = "work";
        timerState.round = 1;
        timerState.duration = nextBlock.work;
        timerState.remaining = nextBlock.work;
        playBeep(880, 0.18);
        speak("Work");
        vibrate([120]);
        return;
      }
      if (state.cooldown > 0) {
        timerState.phase = "cooldown";
        timerState.duration = state.cooldown;
        timerState.remaining = state.cooldown;
        playBeep(700, 0.18);
        speak("Cool down");
        vibrate([80]);
      } else {
        timerState.phase = "done";
        timerState.duration = 0;
        timerState.remaining = 0;
        playBeep(1200, 0.3);
        speak("Session complete");
        vibrate([200, 100, 200]);
        saveLastSession({
          name: state.name,
          work: state.work,
          rest: state.rest,
          rounds: state.rounds,
          warmup: state.warmup,
          cooldown: state.cooldown,
          block2Enabled: state.block2Enabled,
          block2Work: state.block2Work,
          block2Rest: state.block2Rest,
          block2Rounds: state.block2Rounds,
        });
        const history = loadHistory();
        history.unshift({
          name: state.name,
          work: state.work,
          rest: state.rest,
          rounds: state.rounds,
          warmup: state.warmup,
          cooldown: state.cooldown,
          block2Enabled: state.block2Enabled,
          block2Work: state.block2Work,
          block2Rest: state.block2Rest,
          block2Rounds: state.block2Rounds,
          totalSeconds: getTotalDuration() - (countdownToggle.checked ? 3 : 0),
          completedAt: Date.now(),
        });
        saveHistory(history.slice(0, 20));
        renderHistory();
      }
    } else {
      timerState.phase = "work";
      timerState.round += 1;
      timerState.duration = currentBlock.work;
      timerState.remaining = currentBlock.work;
      playBeep(880, 0.18);
    }
  }

  if (timerState.phase === "cooldown") {
    timerState.phase = "done";
    timerState.duration = 0;
    timerState.remaining = 0;
    playBeep(1200, 0.3);
    speak("Session complete");
    vibrate([200, 100, 200]);
    saveLastSession({
      name: state.name,
      work: state.work,
      rest: state.rest,
      rounds: state.rounds,
      warmup: state.warmup,
      cooldown: state.cooldown,
      block2Enabled: state.block2Enabled,
      block2Work: state.block2Work,
      block2Rest: state.block2Rest,
      block2Rounds: state.block2Rounds,
    });
    const history = loadHistory();
    history.unshift({
      name: state.name,
      work: state.work,
      rest: state.rest,
      rounds: state.rounds,
      warmup: state.warmup,
      cooldown: state.cooldown,
      block2Enabled: state.block2Enabled,
      block2Work: state.block2Work,
      block2Rest: state.block2Rest,
      block2Rounds: state.block2Rounds,
      totalSeconds: getTotalDuration() - (countdownToggle.checked ? 3 : 0),
      completedAt: Date.now(),
    });
    saveHistory(history.slice(0, 20));
    renderHistory();
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
      : timerState.phase === "warmup"
      ? "WARM UP"
      : timerState.phase === "cooldown"
      ? "COOL DOWN"
      : "READY";
  document.title = `${formatDuration(timerState.remaining)} · ${phaseLabel} · MyTR Timer`;
  if (timerState.remaining > 0 && timerState.remaining <= 3 && timerState.phase !== "ready") {
    if (!timerState.beepsFired.has(timerState.remaining)) {
      timerState.beepsFired.add(timerState.remaining);
      if (voiceToggle.checked) {
        speak(String(timerState.remaining));
      } else {
        playBeep(1040, 0.08);
      }
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
        getTotalDuration() - (countdownToggle.checked ? 3 : 0)
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
    clampConfig();
    stopTimer();
    timerState.running = true;
    timerState.round = 0;
    timerState.blockIndex = 0;
    if (countdownToggle.checked) {
      timerState.phase = "countdown";
      timerState.duration = 3;
      timerState.remaining = 3;
    } else {
      if (state.warmup > 0) {
        timerState.phase = "warmup";
        timerState.round = 0;
        timerState.duration = state.warmup;
        timerState.remaining = state.warmup;
      } else {
        const firstBlock = getBlocks()[0];
        timerState.phase = "work";
        timerState.round = 1;
        timerState.duration = firstBlock.work;
        timerState.remaining = firstBlock.work;
      }
    }
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
  startBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");
  stopBtn.classList.remove("hidden");
  nextBtn.classList.remove("hidden");
  endBtn.classList.remove("hidden");
  document.title = `${formatDuration(timerState.remaining)} · Get Ready · MyTR Timer`;
  if (!timerState.intervalId) {
    timerState.intervalId = setInterval(tick, 250);
  }
};

const updatePreview = () => {
  const parts = [];
  if (state.warmup > 0) parts.push(`${state.warmup}s Warm-up`);
  parts.push(`${state.work}s Work · ${state.rest}s Rest · ${state.rounds} Rounds`);
  if (state.cooldown > 0) parts.push(`${state.cooldown}s Cool-down`);
  const blocks = getBlocks();
  const blockSummary = blocks
    .map((block, idx) => `Block ${idx + 1}: ${block.work}s / ${block.rest}s x${block.rounds}`)
    .join(" · ");
  parts.push(blockSummary);
  preview.textContent = parts.join(" · ");
  const totalSeconds = blocks.reduce(
    (sum, block) => sum + (block.work + block.rest) * block.rounds,
    0
  );
  sessionLength.textContent = formatDuration(state.warmup + state.cooldown + totalSeconds);
  currentNameEl.textContent = state.name || "Custom interval";
  targetDurationEl.textContent = formatDuration(getTotalDuration());
  const sequenceParts = [];
  if (state.warmup > 0) sequenceParts.push("Warm-up");
  sequenceParts.push(blocks.map((_, idx) => `Block ${idx + 1}`).join(" → "));
  if (state.cooldown > 0) sequenceParts.push("Cool-down");
  sequencePreview.textContent = sequenceParts.join(" → ");
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
    warmupInput.value = preset.warmup ?? 0;
    cooldownInput.value = preset.cooldown ?? 0;
    block2Toggle.checked = preset.block2Enabled ?? false;
    block2Panel.classList.toggle("hidden", !block2Toggle.checked);
    block2WorkInput.value = preset.block2Work ?? 30;
    block2RestInput.value = preset.block2Rest ?? 15;
    block2RoundsInput.value = preset.block2Rounds ?? 4;
    state.name = preset.name || "Custom interval";
    state.work = preset.work;
    state.rest = preset.rest;
    state.rounds = preset.rounds;
    state.warmup = preset.warmup ?? 0;
    state.cooldown = preset.cooldown ?? 0;
    state.block2Enabled = preset.block2Enabled ?? false;
    state.block2Work = preset.block2Work ?? 30;
    state.block2Rest = preset.block2Rest ?? 15;
    state.block2Rounds = preset.block2Rounds ?? 4;
    updatePreview();
    if (autoStart) startTimer();
  };

  presets.forEach((preset, index) => {
    const card = document.createElement("button");
    card.className =
      "group rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left hover:border-white/40";
    const block2Line = preset.block2Enabled
      ? `<div class="text-xs text-slate">Block 2: ${preset.block2Work}s / ${preset.block2Rest}s · ${preset.block2Rounds} rounds</div>`
      : "";
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm text-slate">${preset.name || `Preset ${index + 1}`}</div>
          <div class="text-lg font-display">${preset.work}s / ${preset.rest}s · ${preset.rounds} rounds</div>
          ${block2Line}
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
    warmup: state.warmup,
    cooldown: state.cooldown,
    block2Enabled: state.block2Enabled,
    block2Work: state.block2Work,
    block2Rest: state.block2Rest,
    block2Rounds: state.block2Rounds,
  });
};

const clampConfig = () => {
  const work = Math.max(5, Number(workInput.value) || 5);
  const rest = Math.max(5, Number(restInput.value) || 5);
  const rounds = Math.max(1, Number(roundsInput.value) || 1);
  const warmup = Math.max(0, Number(warmupInput.value) || 0);
  const cooldown = Math.max(0, Number(cooldownInput.value) || 0);
  const block2Work = Math.max(5, Number(block2WorkInput.value) || 5);
  const block2Rest = Math.max(5, Number(block2RestInput.value) || 5);
  const block2Rounds = Math.max(1, Number(block2RoundsInput.value) || 1);
  workInput.value = work;
  restInput.value = rest;
  roundsInput.value = rounds;
  warmupInput.value = warmup;
  cooldownInput.value = cooldown;
  block2WorkInput.value = block2Work;
  block2RestInput.value = block2Rest;
  block2RoundsInput.value = block2Rounds;
  state.work = work;
  state.rest = rest;
  state.rounds = rounds;
  state.warmup = warmup;
  state.cooldown = cooldown;
  state.block2Work = block2Work;
  state.block2Rest = block2Rest;
  state.block2Rounds = block2Rounds;
  updatePreview();
  updateTimerDisplay();
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

const applyTemplate = (button) => {
  if (timerState.running) return;
  const work = Number(button.dataset.work);
  const rest = Number(button.dataset.rest);
  const rounds = Number(button.dataset.rounds);
  const label = button.dataset.name || "Template";
  nameInput.value = label;
  workInput.value = work;
  restInput.value = rest;
  roundsInput.value = rounds;
  warmupInput.value = 0;
  cooldownInput.value = 0;
  block2Toggle.checked = false;
  block2Panel.classList.add("hidden");
  block2WorkInput.value = 30;
  block2RestInput.value = 15;
  block2RoundsInput.value = 4;
  state.name = label;
  state.work = work;
  state.rest = rest;
  state.rounds = rounds;
  state.warmup = 0;
  state.cooldown = 0;
  state.block2Enabled = false;
  state.block2Work = 30;
  state.block2Rest = 15;
  state.block2Rounds = 4;
  updatePreview();
  updateTimerDisplay();
  saveLastConfig({
    name: state.name,
    work: state.work,
    rest: state.rest,
    rounds: state.rounds,
    warmup: state.warmup,
    cooldown: state.cooldown,
    block2Enabled: state.block2Enabled,
    block2Work: state.block2Work,
    block2Rest: state.block2Rest,
    block2Rounds: state.block2Rounds,
  });
};

templateUseButtons.forEach((button) => {
  button.addEventListener("click", () => applyTemplate(button));
});

templateSaveButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyTemplate(button);
    const presets = loadPresets();
    presets.unshift({
      name: state.name,
      work: state.work,
      rest: state.rest,
      rounds: state.rounds,
      warmup: state.warmup,
      cooldown: state.cooldown,
      block2Enabled: state.block2Enabled,
      block2Work: state.block2Work,
      block2Rest: state.block2Rest,
      block2Rounds: state.block2Rounds,
      savedAt: Date.now(),
    });
    savePresets(presets.slice(0, 12));
    renderPresets();
  });
});

workInput.addEventListener("input", (event) => handleInput("work", event.target.value));
restInput.addEventListener("input", (event) => handleInput("rest", event.target.value));
roundsInput.addEventListener("input", (event) => handleInput("rounds", event.target.value));
warmupInput.addEventListener("input", (event) => handleInput("warmup", event.target.value));
cooldownInput.addEventListener("input", (event) => handleInput("cooldown", event.target.value));
block2WorkInput.addEventListener("input", (event) => handleInput("block2Work", event.target.value));
block2RestInput.addEventListener("input", (event) => handleInput("block2Rest", event.target.value));
block2RoundsInput.addEventListener("input", (event) => handleInput("block2Rounds", event.target.value));

block2Toggle.addEventListener("change", (event) => {
  const enabled = event.target.checked;
  state.block2Enabled = enabled;
  block2Panel.classList.toggle("hidden", !enabled);
  updatePreview();
  updateTimerDisplay();
  saveLastConfig({
    name: state.name,
    work: state.work,
    rest: state.rest,
    rounds: state.rounds,
    warmup: state.warmup,
    cooldown: state.cooldown,
    block2Enabled: state.block2Enabled,
    block2Work: state.block2Work,
    block2Rest: state.block2Rest,
    block2Rounds: state.block2Rounds,
  });
});

saveBtn.addEventListener("click", () => {
  const defaultName = state.name || `${state.work}s / ${state.rest}s x${state.rounds}`;
  const name = window.prompt("Preset name:", defaultName);
  const presets = loadPresets();
  presets.unshift({
    name: name ? name.trim() : defaultName,
    work: state.work,
    rest: state.rest,
    rounds: state.rounds,
    warmup: state.warmup,
    cooldown: state.cooldown,
    block2Enabled: state.block2Enabled,
    block2Work: state.block2Work,
    block2Rest: state.block2Rest,
    block2Rounds: state.block2Rounds,
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
  warmupInput.value = last.warmup ?? 0;
  cooldownInput.value = last.cooldown ?? 0;
  block2Toggle.checked = last.block2Enabled ?? false;
  block2Panel.classList.toggle("hidden", !block2Toggle.checked);
  block2WorkInput.value = last.block2Work ?? 30;
  block2RestInput.value = last.block2Rest ?? 15;
  block2RoundsInput.value = last.block2Rounds ?? 4;
  state.name = last.name || "Custom interval";
  state.work = last.work;
  state.rest = last.rest;
  state.rounds = last.rounds;
  state.warmup = last.warmup ?? 0;
  state.cooldown = last.cooldown ?? 0;
  state.block2Enabled = last.block2Enabled ?? false;
  state.block2Work = last.block2Work ?? 30;
  state.block2Rest = last.block2Rest ?? 15;
  state.block2Rounds = last.block2Rounds ?? 4;
  updatePreview();
  updateTimerDisplay();
  startTimer();
});

shareBtn.addEventListener("click", async () => {
  const blocks = getBlocks();
  const blockText = blocks
    .map((block, idx) => `Block ${idx + 1}: ${block.work}s/${block.rest}s x${block.rounds}`)
    .join(" · ");
  const message = `${state.name} · ${blockText}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "MyTR Timer", text: message });
      return;
    } catch (err) {
      console.warn("Share cancelled", err);
    }
  }
  navigator.clipboard?.writeText(message).catch(() => null);
  shareBtn.textContent = "Copied";
  setTimeout(() => {
    shareBtn.textContent = "Share";
  }, 1200);
});

exportPresetsBtn.addEventListener("click", () => {
  const presets = loadPresets();
  const payload = JSON.stringify({ exportedAt: Date.now(), presets }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mytr-presets.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

importPresetsBtn.addEventListener("click", () => {
  importFileInput.click();
});

importFileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const presets = Array.isArray(data.presets) ? data.presets : [];
    if (!presets.length) return;
    savePresets(presets.slice(0, 12));
    renderPresets();
  } catch (err) {
    console.warn("Preset import failed", err);
  } finally {
    importFileInput.value = "";
  }
});

clearHistoryBtn.addEventListener("click", () => {
  if (!window.confirm("Clear all session history?")) return;
  saveHistory([]);
  renderHistory();
});

resetAllBtn.addEventListener("click", () => {
  if (!window.confirm("Reset all data and settings?")) return;
  localStorage.clear();
  location.reload();
});

toggleHistoryBtn.addEventListener("click", () => {
  historyPanel.classList.toggle("opacity-60");
  historyList.classList.toggle("hidden");
  toggleHistoryBtn.textContent = historyList.classList.contains("hidden")
    ? "Show history"
    : "Hide history";
  saveUI({
    historyHidden: historyList.classList.contains("hidden"),
  });
});

pauseBtn.addEventListener("click", () => {
  if (!timerState.running) return;
  timerState.paused = !timerState.paused;
  pauseBtn.textContent = timerState.paused ? "Resume" : "Pause";
  setPausedUI(timerState.paused);
  if (!timerState.paused) {
    timerState.lastTick = Date.now();
  }
});

timerDisplay.addEventListener("click", () => {
  if (!timerState.running) return;
  timerState.paused = !timerState.paused;
  pauseBtn.textContent = timerState.paused ? "Resume" : "Pause";
  setPausedUI(timerState.paused);
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
  if (!window.confirm("End the session early?")) return;
  stopTimer();
});

settingsToggle.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
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
  warmupInput.value = 0;
  cooldownInput.value = 0;
  block2Toggle.checked = false;
  block2Panel.classList.add("hidden");
  block2WorkInput.value = 30;
  block2RestInput.value = 15;
  block2RoundsInput.value = 4;
  state.name = "Custom interval";
  state.work = 40;
  state.rest = 20;
  state.rounds = 6;
  state.warmup = 0;
  state.cooldown = 0;
  state.block2Enabled = false;
  state.block2Work = 30;
  state.block2Rest = 15;
  state.block2Rounds = 4;
  updatePreview();
  saveLastConfig({
    name: state.name,
    work: state.work,
    rest: state.rest,
    rounds: state.rounds,
    warmup: state.warmup,
    cooldown: state.cooldown,
    block2Enabled: state.block2Enabled,
    block2Work: state.block2Work,
    block2Rest: state.block2Rest,
    block2Rounds: state.block2Rounds,
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
  warmupInput.value = lastConfig.warmup ?? 0;
  cooldownInput.value = lastConfig.cooldown ?? 0;
  block2Toggle.checked = lastConfig.block2Enabled ?? false;
  block2Panel.classList.toggle("hidden", !block2Toggle.checked);
  block2WorkInput.value = lastConfig.block2Work ?? 30;
  block2RestInput.value = lastConfig.block2Rest ?? 15;
  block2RoundsInput.value = lastConfig.block2Rounds ?? 4;
  state.name = nameInput.value;
  state.work = Number(workInput.value) || 40;
  state.rest = Number(restInput.value) || 20;
  state.rounds = Number(roundsInput.value) || 6;
  state.warmup = Number(warmupInput.value) || 0;
  state.cooldown = Number(cooldownInput.value) || 0;
  state.block2Enabled = block2Toggle.checked;
  state.block2Work = Number(block2WorkInput.value) || 30;
  state.block2Rest = Number(block2RestInput.value) || 15;
  state.block2Rounds = Number(block2RoundsInput.value) || 4;
} else {
  nameInput.value = state.name;
}
updatePreview();
renderPresets();
updateCacheStatus();
stopTimer();
renderHistory();

const uiState = loadUI();
if (uiState?.historyHidden) {
  historyPanel.classList.add("opacity-60");
  historyList.classList.add("hidden");
  toggleHistoryBtn.textContent = "Show history";
}

const updateCueVolumeLabel = () => {
  cueVolumeValue.textContent = `${cueVolumeInput.value}%`;
};
updateCueVolumeLabel();
cueVolumeInput.addEventListener("input", updateCueVolumeLabel);

testCueBtn.addEventListener("click", () => {
  if (voiceToggle.checked) {
    speak("Test cue");
  } else {
    playBeep(900, 0.2);
  }
});

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
  countdownToggle.checked = settings.countdown ?? countdownToggle.checked;
  voiceToggle.checked = settings.voice ?? voiceToggle.checked;
  cueVolumeInput.value = settings.cueVolume ?? cueVolumeInput.value;
}

[soundToggle, vibrateToggle, startSoundToggle, keepAwakeToggle, autoWorkoutToggle, countdownToggle, voiceToggle, cueVolumeInput].forEach((toggle) => {
  toggle.addEventListener("change", () => {
    saveSettings({
      sound: soundToggle.checked,
      vibrate: vibrateToggle.checked,
      startSound: startSoundToggle.checked,
      keepAwake: keepAwakeToggle.checked,
      autoWorkout: autoWorkoutToggle.checked,
      countdown: countdownToggle.checked,
      voice: voiceToggle.checked,
      cueVolume: Number(cueVolumeInput.value),
    });
  });
});
