/**
 * Tiny shared event bus for the data layer.
 *
 * `useApiQuery` subscribes here; whichever backend is active (mock or convex)
 * notifies after mutations so subscribers refetch. Keeping this in its own
 * module lets both backend implementations share ONE listener set without
 * importing each other (which would pull both into the entry bundle).
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to store changes (used by useApiQuery). */
export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify subscribers that backend data changed (call after mutations). */
export function notifyStoreChange(): void {
  listeners.forEach((l) => l());
}
