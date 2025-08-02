/**
 * Improved Session Manager based on official Janus SIP demo patterns
 * Handles proper session lifecycle, validation, and cleanup
 */

import type { JanusOptions } from './types';
import { ConnectionRetry } from './utils/connectionRetry';

export class ImprovedSessionManager {
  private janus: any = null;
  private sipPlugin: any = null;
  private opaqueId: string;
  private initialized: boolean = false;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'failed' = 'disconnected';
  private connectionRetry: ConnectionRetry;
  private sessionHealthCheckInterval: number | null = null;

  constructor() {
    this.opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
    this.connectionRetry = new ConnectionRetry(
      () => {
        console.log('✅ Successfully connected to Janus server');
        this.connectionState = 'connected';
        this.startHealthCheck();
      },
      () => {
        console.error('❌ Failed to connect to Janus server after retries');
        this.connectionState = 'failed';
        this.cleanup();
      }
    );
  }

  private async checkDependencies(): Promise<void> {
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('WebRTC not supported in this browser');
    }
    
    if (typeof window.Janus === 'undefined') {
      console.error('Janus library not found - waiting for load');
      
      // Wait for library to load
      let attempts = 0;
      while (typeof window.Janus === 'undefined' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (typeof window.Janus === 'undefined') {
        throw new Error('Janus library failed to load');
      }
    }
  }

  private async initJanus(debug: string = "all"): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        window.Janus.init({
          debug: debug,
          callback: () => {
            console.log('✅ Janus library initialized');
            this.initialized = true;
            resolve();
          },
          error: (error: any) => {
            console.error('❌ Janus initialization error:', error);
            reject(new Error(`Janus initialization failed: ${error}`));
          }
        });
      } catch (error) {
        console.error('❌ Exception during Janus initialization:', error);
        reject(error);
      }
    });
  }

  async createSession(options: JanusOptions): Promise<void> {
    // Validate current session state
    if (this.isSessionActive()) {
      console.log('⚠️ Active session detected, cleaning up first');
      await this.safeDisconnect();
    }

    this.connectionState = 'connecting';
    console.log('🔄 Creating new Janus session with options:', options);

    try {
      await this.checkDependencies();
      
      if (!this.initialized) {
        await this.initJanus(options.debug || "all");
      }

      return new Promise<void>((resolve, reject) => {
        const connect = async () => {
          return new Promise<void>((innerResolve, innerReject) => {
            const serverUrl = options.server || 'wss://devrtc.voicehost.io:443/janus';
            console.log(`🔗 Connecting to Janus server: ${serverUrl}`);
            
            const janusOptions = {
              server: serverUrl,
              apisecret: options.apiSecret,
              keepAlivePeriod: 30000,
              iceServers: options.iceServers || [
                { urls: 'stun:stun.l.google.com:19302' }
              ],
              ipv6: false,
              withCredentials: false,
              max_poll_events: 10,
              token: null,
              success: () => {
                console.log('✅ Janus session created successfully');
                this.connectionState = 'connected';
                resolve();
                innerResolve();
              },
              error: (error: any) => {
                console.error('❌ Janus session creation failed:', error);
                this.connectionState = 'failed';
                innerReject(error);
              },
              destroyed: () => {
                console.log('🧹 Janus session destroyed');
                this.handleSessionDestroyed();
                if (options.destroyed) options.destroyed();
              }
            };
            
            this.janus = new window.Janus(janusOptions);
          });
        };

        this.connectionRetry.attemptConnection(connect).catch(reject);
      });
    } catch (error: any) {
      this.connectionState = 'failed';
      this.cleanup();
      console.error('❌ Failed to create Janus session:', error);
      throw new Error(`Failed to create Janus session: ${error.message || error}`);
    }
  }

  async attachSipPlugin(): Promise<any> {
    if (!this.janus) {
      throw new Error('Janus session not created');
    }

    if (this.sipPlugin) {
      console.log('⚠️ SIP plugin already attached, detaching first');
      await this.detachSipPlugin();
    }

    return new Promise<any>((resolve, reject) => {
      this.janus.attach({
        plugin: "janus.plugin.sip",
        opaqueId: this.opaqueId,
        success: (pluginHandle: any) => {
          this.sipPlugin = pluginHandle;
          console.log('✅ SIP plugin attached:', pluginHandle.id);
          resolve(pluginHandle);
        },
        error: (error: any) => {
          const errorMsg = `Failed to attach SIP plugin: ${error}`;
          console.error('❌', errorMsg);
          reject(new Error(errorMsg));
        },
        // Plugin will be configured by the caller with appropriate handlers
      });
    });
  }

  async detachSipPlugin(): Promise<void> {
    if (!this.sipPlugin) {
      return;
    }

    return new Promise<void>((resolve) => {
      console.log('🔌 Detaching SIP plugin');
      
      try {
        this.sipPlugin.detach({
          success: () => {
            console.log('✅ SIP plugin detached successfully');
            this.sipPlugin = null;
            resolve();
          },
          error: (error: any) => {
            console.warn('⚠️ Error detaching SIP plugin:', error);
            this.sipPlugin = null;
            resolve(); // Continue anyway
          }
        });
      } catch (error) {
        console.warn('⚠️ Exception detaching SIP plugin:', error);
        this.sipPlugin = null;
        resolve();
      }
    });
  }

  private startHealthCheck(): void {
    if (this.sessionHealthCheckInterval) {
      clearInterval(this.sessionHealthCheckInterval);
    }

    this.sessionHealthCheckInterval = window.setInterval(() => {
      if (!this.isSessionHealthy()) {
        console.warn('⚠️ Session health check failed, marking as disconnected');
        this.connectionState = 'disconnected';
        this.cleanup();
      }
    }, 30000); // Check every 30 seconds
  }

  private stopHealthCheck(): void {
    if (this.sessionHealthCheckInterval) {
      clearInterval(this.sessionHealthCheckInterval);
      this.sessionHealthCheckInterval = null;
    }
  }

  private isSessionHealthy(): boolean {
    if (!this.janus) return false;
    
    // Check if Janus object has required methods/properties
    try {
      return typeof this.janus.isConnected === 'function' ? 
        this.janus.isConnected() : 
        this.janus.connected === true;
    } catch (error) {
      console.warn('⚠️ Error checking session health:', error);
      return false;
    }
  }

  private isSessionActive(): boolean {
    return this.janus !== null && this.connectionState === 'connected';
  }

  private handleSessionDestroyed(): void {
    console.log('🧹 Handling session destruction');
    this.connectionState = 'disconnected';
    this.sipPlugin = null;
    this.janus = null;
    this.stopHealthCheck();
  }

  async safeDisconnect(): Promise<void> {
    console.log('🔒 Performing safe disconnect');
    this.stopHealthCheck();
    
    try {
      // First detach plugin
      if (this.sipPlugin) {
        await this.detachSipPlugin();
      }
      
      // Then destroy session
      if (this.janus) {
        await new Promise<void>((resolve) => {
          try {
            this.janus.destroy({
              success: () => {
                console.log('✅ Janus session destroyed successfully');
                resolve();
              },
              error: (error: any) => {
                console.warn('⚠️ Error destroying session:', error);
                resolve(); // Continue anyway
              }
            });
          } catch (error) {
            console.warn('⚠️ Exception destroying session:', error);
            resolve();
          }
        });
      }
    } finally {
      this.cleanup();
    }
  }

  private cleanup(): void {
    this.connectionState = 'disconnected';
    this.sipPlugin = null;
    this.janus = null;
    this.stopHealthCheck();
  }

  // Public getters
  getJanus() {
    return this.janus;
  }

  getSipPlugin() {
    return this.sipPlugin;
  }

  setSipPlugin(plugin: any) {
    this.sipPlugin = plugin;
  }

  getOpaqueId() {
    return this.opaqueId;
  }

  getConnectionState() {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected' && this.isSessionHealthy();
  }

  // Legacy disconnect for compatibility
  disconnect(): void {
    this.safeDisconnect().catch(error => {
      console.error('Error during disconnect:', error);
    });
  }
}