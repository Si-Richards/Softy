
export class ConnectionRetry {
  private retryCount: number = 0;
  private maxRetries: number = 10; // 10 seconds, 1 attempt per second
  private retryTimer?: NodeJS.Timeout;

  constructor(private onSuccess: () => void, private onFailure: () => void) {}

  async attemptConnection(connectFn: () => Promise<void>) {
    try {
      await connectFn();
      this.onSuccess();
      this.reset();
    } catch (error) {
      console.error('Connection attempt failed:', error);
      this.handleRetry(connectFn);
    }
  }

  private handleRetry(connectFn: () => Promise<void>) {
    if (this.retryCount >= this.maxRetries) {
      this.onFailure();
      this.reset();
      return;
    }

    this.retryCount++;
    console.log(`Retrying connection (attempt ${this.retryCount}/${this.maxRetries})...`);
    
    this.retryTimer = setTimeout(() => {
      this.attemptConnection(connectFn);
    }, 1000);
  }

  reset() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.retryCount = 0;
  }
}
