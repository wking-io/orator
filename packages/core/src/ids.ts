import { ulid } from "ulid";

export function slideId(): string {
  return `slide-${ulid()}`;
}

export function deckId(): string {
  return `deck-${ulid()}`;
}
