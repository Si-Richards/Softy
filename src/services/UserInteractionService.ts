
/**
 * Service to track user interaction with the page
 * This is important for audio autoplay policies in browsers
 */
class UserInteractionService {
  private userHasInteractedState: boolean = false;
  private interactionListeners: Function[] = [];
  private interactionEvents = [
    'mousedown', 'keydown', 'touchstart', 'click'
  ];
  private boundHandleInteraction: () => void;
  private debugMode: boolean = false;
  
  constructor() {
    // Bind once to keep reference for later removal
    this.boundHandleInteraction = this.handleInteraction.bind(this);
    
    // Check if we've already been initialized
    this.userHasInteractedState = localStorage.getItem('userHasInteracted') === 'true';
    
    // If we're in a testing environment or headless browser, force interaction state
    if (navigator.userAgent.includes('HeadlessChrome') || 
        document.visibilityState === 'hidden' ||
        /PhantomJS|Puppeteer/.test(navigator.userAgent)) {
      this.userHasInteractedState = true;
    }
  }
  
  /**
   * Initialize the interaction tracking 
   */
  initialize(): void {
    // Don't add listeners more than once
    this.cleanup();
    
    // Listen for user interactions
    this.interactionEvents.forEach(event => {
      document.addEventListener(event, this.boundHandleInteraction, { once: false });
    });
    
    // Also listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.userHasInteractedState) {
        // Dispatch custom event to notify listeners
        const event = new CustomEvent('lovable:visibilitychange', { 
          detail: { hasInteracted: this.userHasInteractedState }
        });
        document.dispatchEvent(event);
      }
    });
    
    console.log("UserInteractionService initialized, current state:", this.userHasInteractedState);
  }
  
  /**
   * Handle user interaction events
   */
  private handleInteraction(): void {
    // Only trigger once for the first interaction
    if (!this.userHasInteractedState) {
      console.log("First user interaction detected");
      this.userHasInteractedState = true;
      localStorage.setItem('userHasInteracted', 'true');
      
      // Notify all listeners
      this.interactionListeners.forEach(listener => {
        try {
          listener();
        } catch (error) {
          console.error("Error in interaction listener:", error);
        }
      });
    }
  }
  
  /**
   * Register a callback for first user interaction
   */
  onUserInteraction(callback: Function): void {
    // If user has already interacted, call immediately
    if (this.userHasInteractedState) {
      setTimeout(() => callback(), 0);
      return;
    }
    
    // Otherwise add to listeners
    this.interactionListeners.push(callback);
  }
  
  /**
   * Check if the user has interacted with the page
   */
  userHasInteracted(): boolean {
    return this.userHasInteractedState;
  }
  
  /**
   * Force the interaction state - useful for programmatic triggering
   */
  forceInteractionState(interacted: boolean): void {
    this.userHasInteractedState = interacted;
    localStorage.setItem('userHasInteracted', interacted ? 'true' : 'false');
    
    if (interacted) {
      // Notify listeners
      this.interactionListeners.forEach(listener => {
        try {
          listener();
        } catch (error) {
          console.error("Error in interaction listener:", error);
        }
      });
      
      // Clear listeners since they've all been called
      this.interactionListeners = [];
    }
  }
  
  /**
   * Set debug mode for additional logging
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`UserInteractionService debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Check if debug mode is enabled
   */
  isDebugModeEnabled(): boolean {
    return this.debugMode;
  }
  
  /**
   * Clean up event listeners
   */
  cleanup(): void {
    this.interactionEvents.forEach(event => {
      document.removeEventListener(event, this.boundHandleInteraction);
    });
  }
}

const userInteractionService = new UserInteractionService();
export default userInteractionService;
