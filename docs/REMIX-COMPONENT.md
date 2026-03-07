# Remix Component Guide

Remix components use a **setup/render pattern** that differs from React. This application does NOT use React, Preact, or any other UI framework.

## Getting Started

To start using Remix Component, create a root and render your top-level component:

```tsx
import { createRoot } from '@remix-run/component'
import type { Handle } from '@remix-run/component'

function App(handle: Handle) {
  return () => (
    <div>
      <h1>Hello, World!</h1>
    </div>
  )
}

let container = document.getElementById('app')!
let root = createRoot(container)
root.render(<App />)
```

### Root Methods

- **`render(node)`** - Renders a component tree into the root container
- **`flush()`** - Synchronously flushes all pending updates and tasks
- **`remove()`** - Removes the component tree and cleans up

## Component Structure

All components follow a two-phase structure:

1. **Setup Phase** - Runs once when the component is first created
2. **Render Phase** - Runs on initial render and every update afterward

```tsx
function MyComponent(handle: Handle, setup: SetupType) {
  // Setup phase: runs once
  let state = initializeState(setup)

  // Return render function: runs on every update
  return (props: Props) => {
    return <div>{/* render content */}</div>
  }
}
```

### Runtime Behavior

1. **First Render**: Component function called with `handle` and `setup` prop, render function stored and called with props
2. **Subsequent Updates**: Only the render function is called, setup phase skipped
3. **Component Removal**: `handle.signal` is aborted, all listeners cleaned up

## Handle API

### `handle.update(task?)`

Schedules a component update. Optionally accepts a task to run after the update completes.

```tsx
function Counter(handle: Handle) {
  let count = 0

  return () => (
    <button
      on={{
        click() {
          count++
          handle.update()
        },
      }}
    >
      Count: {count}
    </button>
  )
}
```

### `handle.signal`

An `AbortSignal` that's aborted when the component is disconnected.

### `handle.on(target, listeners)`

Listen to an `EventTarget` with automatic cleanup when the component disconnects.

### `handle.id`

Stable identifier per component instance for HTML APIs like `htmlFor`, `aria-owns`, etc.

### `handle.context`

Context API for ancestor/descendant communication.

## CSS Prop

Use Tailwind v4. The `css` prop produces static styles as CSS rules.

## Connect Prop

Use the `connect` prop to get a reference to the DOM node.

## File Naming

Always name files using kebab-case with lowercase.

## Testing Components

```tsx
import { describe, expect, it } from "bun:test";
import { createRoot } from "@remix-run/component";
import { MyComponent } from "../my-component";

describe("MyComponent", () => {
  it("renders correctly", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    root.render(<MyComponent setup={{}} />);
    root.flush();

    expect(container.querySelector(".my-element")).not.toBeNull();
  });
});
```
