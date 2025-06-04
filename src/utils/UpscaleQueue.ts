import { EventEmitter } from './EventEmitter';

interface QueueItem {
  task: () => Promise<void>;
  priority: number;
}

interface QueueStatus {
  total: number;
  processing: number;
  completed: number;
}

export class UpscaleQueue extends EventEmitter {
  private queue: QueueItem[] = [];
  private processing = false;
  private status: QueueStatus = {
    total: 0,
    processing: 0,
    completed: 0
  };

  constructor() {
    super();
    this.processQueue = this.processQueue.bind(this);
  }

  public add(task: () => Promise<void>, priority = 0): void {
    this.queue.push({ task, priority });
    this.status.total++;
    this.emitStatus();
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  public remove(task: () => Promise<void>): void {
    const index = this.queue.findIndex(item => item.task === task);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.status.total--;
      this.emitStatus();
    }
  }

  public clear(): void {
    this.queue = [];
    this.status = {
      total: 0,
      processing: 0,
      completed: 0
    };
    this.emitStatus();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      this.queue.sort((a, b) => b.priority - a.priority);

      const item = this.queue.shift();
      if (item) {
        this.status.processing++;
        this.emitStatus();

        await item.task();

        this.status.processing--;
        this.status.completed++;
        this.emitStatus();
      }
    } catch (error) {
      console.error('Ошибка обработки элемента очереди:', error);
    } finally {
      this.processing = false;
      
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  private emitStatus(): void {
    this.emit('statusUpdate', { ...this.status });
  }

  public onStatusUpdate(callback: (status: QueueStatus) => void): void {
    this.on('statusUpdate', callback);
  }

  public offStatusUpdate(callback: (status: QueueStatus) => void): void {
    this.off('statusUpdate', callback);
  }
}