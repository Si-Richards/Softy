
import type { JanusOptions } from './types';
import { ConnectionRetry } from './utils/connectionRetry';

export class JanusSessionManager {
  private janus: any = null;
  private sipPlugin: any = null;
  private opaqueId: string;
  private initialized: boolean = false;
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private connectionRetry: ConnectionRetry;

  constructor() {
    this.opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
    this.connectionRetry = new ConnectionRetry(
      () => {
        console.log('Successfully connected to Janus server');
        this.connectionState = 'connected';
      },
      () => {
        console.error('Failed to connect to Janus server after 10 attempts');
        this.connectionState = 'disconnected';
        if (this.janus) {
          this.janus.destroy();
          this.janus = null;
        }
      }
    );
  }

  private async checkDependencies(): Promise<void> {
    // Check if adapter is available
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('WebRTC adapter not loaded or WebRTC not supported');
    }
    
    // Check if Janus library is loaded
    if (typeof window.Janus === 'undefined') {
      throw new Error('Janus library not loaded');
    }
  }

  private async initJanus(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        window.Janus.init({
          debug: "all",
          callback: () => {
            console.log('Janus initialized successfully');
            this.initialized = true;
            resolve();
          },
          error: (error: any) => {
            console.error('Janus initialization error:', error);
            reject(new Error(`Janus initialization failed: ${error}`));
          }
        });
      } catch (error) {
        console.error('Error during Janus initialization:', error);
        reject(error);
      }
    });
  }

  async createSession(options: JanusOptions): Promise<void> {
    if (this.janus) {
      this.disconnect();
    }

    this.connectionState = 'connecting';
    console.log('Creating Janus session...');

    try {
      await this.checkDependencies();
      
      if (!this.initialized) {
        await this.initJanus();
      }

      return new Promise<void>((resolve, reject) => {
        const connect = async () => {
          return new Promise<void>((innerResolve, innerReject) => {
            // Default Google STUN servers that work well for most connections
            const defaultIceServers = [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' }
            ];
            
            this.janus = new window.Janus({
              server: options.server,
              apisecret: options.apiSecret,
              keepAlivePeriod: 30000,
              iceServers: options.iceServers || defaultIceServers,
              success: () => {
                console.log('Janus session created successfully');
                this.connectionState = 'connected';
                resolve();
                innerResolve();
              },
              error: (error: any) => {
                console.error('Error creating Janus session:', error);
                innerReject(error);
              },
              destroyed: () => {
                console.log('Janus session destroyed');
                this.connectionState = 'disconnected';
                if (options.destroyed) options.destroyed();
              }
            });
          });
        };

        this.connectionRetry.attemptConnection(connect).catch(reject);
      });
    } catch (error: any) {
      this.connectionState = 'disconnected';
      this.disconnect();
      console.error('Failed to create Janus instance:', error);
      throw new Error(`Failed to create Janus instance: ${error.message || error}`);
    }
  }

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

  disconnect(): void {
    this.connectionState = 'disconnected';
    
    if (this.sipPlugin) {
      this.sipPlugin.detach();
      this.sipPlugin = null;
    }
    
    if (this.janus) {
      this.janus.destroy();
      this.janus = null;
    }
  }
}
