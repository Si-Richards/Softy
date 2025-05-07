
/**
 * Simple Event Emitter implementation for the Janus client
 */
export class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  /**
   * Register an event handler
   */
  on(event: string, callback: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Register a one-time event handler
   */
  once(event: string, callback: Function): void {
    const onceCallback = (...args: any[]) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    this.on(event, onceCallback);
  }

  /**
   * Remove an event handler
   */
  off(event: string, callback?: Function): void {
    if (!this.events[event]) return;
    
    if (callback) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    } else {
      delete this.events[event];
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }
}
