export interface NavigationState {
  readonly current: number;
  readonly total: number;
}

export function initialNavigation(total: number): NavigationState {
  return { current: 0, total };
}

export function next(state: NavigationState): NavigationState {
  if (state.current >= state.total - 1) return state;
  return { ...state, current: state.current + 1 };
}

export function prev(state: NavigationState): NavigationState {
  if (state.current <= 0) return state;
  return { ...state, current: state.current - 1 };
}

export function goTo(state: NavigationState, index: number): NavigationState {
  if (index < 0 || index >= state.total) return state;
  return { ...state, current: index };
}

export function isFirst(state: NavigationState): boolean {
  return state.current === 0;
}

export function isLast(state: NavigationState): boolean {
  return state.current === state.total - 1;
}
