interface Events {
  statusUpdate: { total: number; processing: number; completed: number };
}

type EventCallback<T> = (data: T) => void;

export class EventEmitter {
  private listeners: { [K in keyof Events]?: Set<EventCallback<Events[K]>> } = {};

  protected emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const callbacks = this.listeners[event];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  protected on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]?.add(callback);
  }

  protected off<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void {
    this.listeners[event]?.delete(callback);
  }

  protected clear(): void {
    this.listeners = {};
  }
}