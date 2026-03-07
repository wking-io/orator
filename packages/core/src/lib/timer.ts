export interface TimerState {
  readonly startedAt: number | null;
  readonly elapsed: number;
  readonly running: boolean;
}

export function initialTimer(): TimerState {
  return { startedAt: null, elapsed: 0, running: false };
}

export function start(state: TimerState, now: number): TimerState {
  if (state.running) return state;
  return { ...state, startedAt: now, running: true };
}

export function stop(state: TimerState, now: number): TimerState {
  if (!state.running || state.startedAt === null) return state;
  const additional = now - state.startedAt;
  return { startedAt: null, elapsed: state.elapsed + additional, running: false };
}

export function reset(): TimerState {
  return initialTimer();
}

export function elapsed(state: TimerState, now: number): number {
  if (!state.running || state.startedAt === null) return state.elapsed;
  return state.elapsed + (now - state.startedAt);
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
