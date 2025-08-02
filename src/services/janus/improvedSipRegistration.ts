/**
 * Improved SIP Registration Manager based on official Janus SIP demo patterns
 * Handles proper registration lifecycle, conflict resolution, and error recovery
 */

import type { SipCredentials } from './sip/types';

interface RegistrationRequest {
  request: string;
  username: string;
  display_name?: string;
  secret: string;
  proxy: string;
  authuser: string;
  refresh?: boolean;
  register?: boolean;
  contact_params?: any;
  headers?: { [key: string]: string };
  master_id?: string;
}

export class ImprovedSipRegistration {
  private registeredCredentials: SipCredentials | null = null;
  private registrationInProgress: boolean = false;
  private registrationPromise: Promise<void> | null = null;
  private unregistrationPromise: Promise<void> | null = null;
  private registrationTimer: number | null = null;
  private retryAttempts: number = 0;
  private maxRetries: number = 3;
  
  constructor(private sipPlugin: any) {}

  async register(username: string, password: string, sipHost: string): Promise<void> {
    const newCredentials = { username, password, sipHost };
    
    // Check if already registered with same credentials
    if (this.isRegisteredWith(newCredentials)) {
      console.log('✅ Already registered with same credentials');
      return Promise.resolve();
    }

    // If registration is in progress, wait for it
    if (this.registrationInProgress && this.registrationPromise) {
      console.log('⏳ Registration in progress, waiting...');
      try {
        await this.registrationPromise;
        // Check if we got the credentials we wanted
        if (this.isRegisteredWith(newCredentials)) {
          return;
        }
      } catch (error) {
        console.warn('⚠️ Previous registration failed:', error);
      }
    }

    // Handle "Already registered" error by unregistering first
    if (this.isRegistered() && !this.isRegisteredWith(newCredentials)) {
      console.log('🔄 Unregistering current session before new registration');
      await this.unregister();
    }

    // Start new registration
    this.registrationPromise = this.performRegistration(username, password, sipHost);
    return this.registrationPromise;
  }

  private async performRegistration(username: string, password: string, sipHost: string): Promise<void> {
    if (this.registrationInProgress) {
      throw new Error('Registration already in progress');
    }

    this.registrationInProgress = true;
    this.retryAttempts = 0;

    try {
      await this.attemptRegistration(username, password, sipHost);
      
      // Store successful credentials
      this.registeredCredentials = { username, password, sipHost };
      console.log('✅ Registration successful');
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    } finally {
      this.registrationInProgress = false;
      this.clearRegistrationTimer();
    }
  }

  private async attemptRegistration(username: string, password: string, sipHost: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Validate SIP plugin and session handle before attempting registration
      if (!this.sipPlugin) {
        reject(new Error('SIP plugin not available'));
        return;
      }

      // Check if plugin handle is still valid (not destroyed)
      if (!this.sipPlugin.getPlugin || !this.sipPlugin.getId) {
        reject(new Error('SIP plugin handle is invalid - session may have been destroyed'));
        return;
      }

      // Additional validation for Janus session state
      try {
        const pluginId = this.sipPlugin.getId();
        if (!pluginId) {
          reject(new Error('SIP plugin ID is invalid - session not properly established'));
          return;
        }
        console.log(`🔗 Using SIP plugin handle ID: ${pluginId}`);
      } catch (error) {
        reject(new Error('Failed to validate SIP plugin handle - session may be destroyed'));
        return;
      }

      const request = this.createRegistrationRequest(username, password, sipHost);
      console.log('📤 Sending registration request:', {
        username: request.username,
        proxy: request.proxy,
        authuser: request.authuser
      });

      // Set timeout for registration
      this.registrationTimer = window.setTimeout(() => {
        const errorMsg = 'Registration timed out - server not responding';
        console.error('⏰', errorMsg);
        
        if (this.retryAttempts < this.maxRetries) {
          this.retryAttempts++;
          console.log(`🔄 Retrying registration (${this.retryAttempts}/${this.maxRetries})`);
          
          setTimeout(() => {
            // Re-validate plugin handle before retry
            if (!this.sipPlugin || !this.sipPlugin.getId) {
              reject(new Error('Cannot retry - SIP plugin handle is invalid'));
              return;
            }
            
            this.attemptRegistration(username, password, sipHost)
              .then(resolve)
              .catch(reject);
          }, 2000 * this.retryAttempts);
        } else {
          reject(new Error(errorMsg));
        }
      }, 30000);

      // Send registration request with additional error handling
      try {
        this.sipPlugin.send({
          message: request,
          success: () => {
            console.log('📤 Registration request sent successfully');
            // Don't resolve here - wait for actual registration event
          },
          error: (error: any) => {
            this.clearRegistrationTimer();
            
            const errorString = error?.toString() || String(error);
            console.error('❌ Registration request error:', errorString);
            
            // Handle "Missing session or Sofia stack" specifically
            if (errorString.includes('Missing session') || errorString.includes('Sofia stack')) {
              console.error('🚨 Session destroyed during registration - handle is invalid');
              reject(new Error('Session destroyed - SIP plugin handle is no longer valid'));
              return;
            }
            
            // Handle "Already registered" specifically
            if (errorString.includes('already registered') || 
                errorString.includes('Already registered')) {
              console.log('🔄 Already registered error - will unregister first');
              this.handleAlreadyRegisteredError(username, password, sipHost, resolve, reject);
            } else {
              reject(new Error(`Registration request failed: ${errorString}`));
            }
          }
        });
      } catch (sendError) {
        this.clearRegistrationTimer();
        const errorMsg = `Failed to send registration request: ${sendError}`;
        console.error('❌', errorMsg);
        reject(new Error(errorMsg));
      }
    });
  }

  private async handleAlreadyRegisteredError(
    username: string, 
    password: string, 
    sipHost: string,
    resolve: () => void,
    reject: (error: Error) => void
  ): Promise<void> {
    try {
      console.log('🧹 Attempting to unregister before retry...');
      await this.forceUnregister();
      
      // Wait a bit then retry
      setTimeout(() => {
        this.attemptRegistration(username, password, sipHost)
          .then(resolve)
          .catch(reject);
      }, 1000);
    } catch (unregError) {
      console.warn('⚠️ Failed to unregister, retrying registration anyway:', unregError);
      
      // Retry anyway after a delay
      setTimeout(() => {
        this.attemptRegistration(username, password, sipHost)
          .then(resolve)
          .catch(reject);
      }, 2000);
    }
  }

  unregister(): Promise<void> {
    if (!this.isRegistered()) {
      console.log('ℹ️ Not registered, nothing to unregister');
      return Promise.resolve();
    }

    if (this.unregistrationPromise) {
      console.log('⏳ Unregistration in progress, waiting...');
      return this.unregistrationPromise;
    }

    this.unregistrationPromise = this.performUnregistration();
    return this.unregistrationPromise;
  }

  private async performUnregistration(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.sipPlugin) {
        this.registeredCredentials = null;
        resolve();
        return;
      }

      console.log('📤 Sending unregister request');
      
      const unregisterRequest = {
        request: "unregister"
      };

      const timeout = setTimeout(() => {
        console.warn('⏰ Unregister timed out - considering it successful');
        this.registeredCredentials = null;
        this.unregistrationPromise = null;
        resolve();
      }, 5000);

      this.sipPlugin.send({
        message: unregisterRequest,
        success: () => {
          console.log('✅ Unregister request sent');
        },
        error: (error: any) => {
          console.warn('⚠️ Unregister request error:', error);
          clearTimeout(timeout);
          this.registeredCredentials = null;
          this.unregistrationPromise = null;
          resolve(); // Resolve anyway
        }
      });
    });
  }

  private async forceUnregister(): Promise<void> {
    console.log('🧹 Force unregistering...');
    this.registeredCredentials = null;
    return this.performUnregistration();
  }

  private createRegistrationRequest(username: string, password: string, sipHost: string): RegistrationRequest {
    // Parse username and host following Janus SIP demo format
    let user = username;
    let domain = sipHost;
    
    if (user.startsWith("sip:")) {
      user = user.substring(4);
    }

    if (user.includes("@")) {
      const parts = user.split("@");
      user = parts[0];
      domain = parts[1].split(":")[0];
    }

    const hostParts = sipHost.split(":");
    const host = hostParts[0];
    const port = hostParts.length > 1 ? hostParts[1] : "5060";
    
    const identity = `sip:${user}@${host}`;
    const proxy = `sip:${host}:${port}`;
    
    return {
      request: "register",
      username: identity,
      display_name: user,
      secret: password,
      proxy: proxy,
      authuser: user,
      refresh: true,
      register: true,
      headers: {
        "User-Agent": "Janus SIP Plugin",
        "X-Janus-SIP-Client": "Lovable WebRTC"
      }
    };
  }

  private clearRegistrationTimer(): void {
    if (this.registrationTimer) {
      clearTimeout(this.registrationTimer);
      this.registrationTimer = null;
    }
  }

  // Event handlers called by SIP message handler
  handleRegistrationSuccess(): void {
    this.clearRegistrationTimer();
    console.log('✅ Registration confirmed by server');
    
    if (this.registrationPromise) {
      // Registration will be resolved by the registration process
    }
  }

  handleRegistrationFailed(error: string): void {
    this.clearRegistrationTimer();
    this.registeredCredentials = null;
    console.error('❌ Registration failed:', error);
  }

  handleUnregistrationSuccess(): void {
    this.registeredCredentials = null;
    this.unregistrationPromise = null;
    console.log('✅ Unregistration confirmed by server');
  }

  // State checkers
  isRegistered(): boolean {
    return this.registeredCredentials !== null;
  }

  isRegistrationInProgress(): boolean {
    return this.registrationInProgress;
  }

  getCurrentCredentials(): SipCredentials | null {
    return this.registeredCredentials;
  }

  private isRegisteredWith(credentials: SipCredentials): boolean {
    if (!this.registeredCredentials) return false;
    
    return this.registeredCredentials.username === credentials.username &&
           this.registeredCredentials.password === credentials.password &&
           this.registeredCredentials.sipHost === credentials.sipHost;
  }

  // Session lifecycle methods
  onSessionDestroyed(): void {
    console.log('🧹 Session destroyed - resetting SIP registration state');
    this.clearRegistrationTimer();
    this.registeredCredentials = null;
    this.registrationInProgress = false;
    this.registrationPromise = null;
    this.unregistrationPromise = null;
    this.retryAttempts = 0;
    // Don't reset sipPlugin reference here - let the session manager handle it
  }

  updateSipPlugin(newSipPlugin: any): void {
    console.log('🔄 Updating SIP plugin reference');
    this.sipPlugin = newSipPlugin;
  }

  // Reset state
  reset(): void {
    this.clearRegistrationTimer();
    this.registeredCredentials = null;
    this.registrationInProgress = false;
    this.registrationPromise = null;
    this.unregistrationPromise = null;
    this.retryAttempts = 0;
  }
}