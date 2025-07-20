import { EventEmitter } from 'events';

export class Timer extends EventEmitter {
  private remaining: number;
  private intervalId?: NodeJS.Timeout;

  constructor(durationSec = 300) {
    super();
    this.remaining = durationSec;
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.remaining--;
      this.emit('tick', this.remaining);
      if (this.remaining <= 0) {
        this.stop();
        this.emit('end');
      }
    }, 1000);
  }

  stop() {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }

  reset(durationSec: number) {
    this.stop();
    this.remaining = durationSec;
  }

  getRemaining(): number {
    return this.remaining;
  }
}
