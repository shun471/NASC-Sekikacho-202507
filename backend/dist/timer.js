"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timer = void 0;
const events_1 = require("events");
class Timer extends events_1.EventEmitter {
    constructor(durationSec = 300) {
        super();
        this.remaining = durationSec;
    }
    start() {
        if (this.intervalId)
            return;
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
        if (!this.intervalId)
            return;
        clearInterval(this.intervalId);
        this.intervalId = undefined;
    }
    reset(durationSec) {
        this.stop();
        this.remaining = durationSec;
    }
    getRemaining() {
        return this.remaining;
    }
}
exports.Timer = Timer;
