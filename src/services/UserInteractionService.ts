
/**
 * Service to detect and track user interaction status for audio autoplay purposes
 */
class UserInteractionService {
  private static instance: UserInteractionService;
  private hasInteracted: boolean = false;
  private interactionCallbacks: Array<() => void> = [];
  private initialized: boolean = false;
  private debugMode: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): UserInteractionService {
    if (!UserInteractionService.instance) {
      UserInteractionService.instance = new UserInteractionService();
    }
    return UserInteractionService.instance;
  }

  /**
   * Initialize user interaction tracking
   * Must be called early in app lifecycle
   */
  public initialize(): void {
    if (this.initialized) return;
    
    console.log("UserInteractionService: Initializing user interaction detection");
    
    // Listen for any user interaction event that could qualify as user gesture
    const interactionEvents = [
      'click', 'touchstart', 'keydown', 'pointerdown', 'mousedown'
    ];
    
    const handleUserInteraction = this.handleUserInteraction.bind(this);
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, handleUserInteraction, { 
        once: false, // Keep listening
        passive: true, // Performance optimization
        capture: true // Capture in all phases including bubbling
      });
    });
    
    this.initialized = true;
    console.log("UserInteractionService: User interaction listeners registered");
    
    // Check if user has already interacted (e.g. if this loads after a click)
    if (document.hasFocus()) {
      // If the document is in focus, there's a good chance user has already interacted
      setTimeout(() => {
        if (!this.hasInteracted) {
          console.log("UserInteractionService: Document has focus, assuming user has interacted");
          this.handleUserInteraction();
        }
      }, 1000);
    }
    
    // Monitor for visibility changes (tab focus/blur)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.hasInteracted) {
        console.log("UserInteractionService: Page visibility changed, checking audio state");
        // Notify listeners about visibility change
        const visibilityEvent = new CustomEvent('lovable:visibilitychange', {
          detail: { hasInteracted: this.hasInteracted }
        });
        document.dispatchEvent(visibilityEvent);
      }
    });
    
    // Enable debug mode based on local storage setting or URL param
    this.debugMode = localStorage.getItem('audioDebug') === 'true' || 
                     window.location.search.includes('audioDebug=true');
  }
  
  /**
   * Handle any user interaction event
   */
  private handleUserInteraction(): void {
    if (this.hasInteracted) return;
    
    console.log("UserInteractionService: First user interaction detected!");
    this.hasInteracted = true;
    
    // Notify all registered callbacks
    this.interactionCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error("Error in user interaction callback:", error);
      }
    });
    
    // Dispatch a custom event that other components can listen for
    const interactionEvent = new CustomEvent('lovable:userinteraction', {
      detail: { timestamp: Date.now() }
    });
    document.dispatchEvent(interactionEvent);
    
    // Clear callbacks after first interaction as they're no longer needed
    this.interactionCallbacks = [];
  }
  
  /**
   * Check if user has interacted with the page
   */
  public userHasInteracted(): boolean {
    return this.hasInteracted;
  }
  
  /**
   * Register a callback to be called once user interaction happens
   * If user has already interacted, callback will be called immediately
   */
  public onUserInteraction(callback: () => void): void {
    if (this.hasInteracted) {
      // If user has already interacted, call callback immediately
      setTimeout(callback, 0);
    } else {
      // Otherwise, store callback to be called on first interaction
      this.interactionCallbacks.push(callback);
    }
  }
  
  /**
   * Force the userInteraction state to be set to true
   * Useful for scenarios where we need to bypass the check
   */
  public forceInteractionState(state: boolean = true): void {
    if (state && !this.hasInteracted) {
      // Only trigger callbacks if changing from false to true
      this.hasInteracted = true;
      this.interactionCallbacks.forEach(callback => callback());
      this.interactionCallbacks = [];
      
      // Also dispatch the custom event
      const interactionEvent = new CustomEvent('lovable:userinteraction', {
        detail: { timestamp: Date.now(), forced: true }
      });
      document.dispatchEvent(interactionEvent);
    } else {
      this.hasInteracted = state;
    }
  }
  
  /**
   * Enable or disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    localStorage.setItem('audioDebug', enabled.toString());
  }
  
  /**
   * Check if debug mode is enabled
   */
  public isDebugMode(): boolean {
    return this.debugMode;
  }
}

// Export singleton instance
const userInteractionService = UserInteractionService.getInstance();
export default userInteractionService;
