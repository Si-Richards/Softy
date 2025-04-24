
import type { JanusOptions } from './types';

export class JanusSessionManager {
  private janus: any = null;
  private sipPlugin: any = null;
  private opaqueId: string;
  private initialized: boolean = false;

  constructor() {
    this.opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
  }

  private async initJanus(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (typeof window.Janus === 'undefined') {
        reject(new Error('Janus library not loaded'));
        return;
      }

      window.Janus.init({
        debug: "all",
        callback: () => {
          console.log('Janus initialized successfully');
          this.initialized = true;
          resolve();
        }
      });
    });
  }

  async createSession(options: JanusOptions): Promise<void> {
    if (this.janus) {
      this.disconnect();
    }

    try {
      if (!this.initialized) {
        await this.initJanus();
      }

      return new Promise<void>((resolve, reject) => {
        this.janus = new window.Janus({
          server: options.server,
          apisecret: options.apiSecret,
          iceServers: options.iceServers || [
            { urls: 'stun:stun.l.google.com:19302' }
          ],
          success: () => {
            console.log('Janus session created successfully');
            resolve();
          },
          error: (error: any) => {
            const errorMsg = `Error creating Janus session: ${error}`;
            console.error(errorMsg);
            reject(new Error(errorMsg));
          },
          destroyed: () => {
            console.log('Janus session destroyed');
            if (options.destroyed) options.destroyed();
          }
        });
      });
    } catch (error: any) {
      this.disconnect(); // Clean up on failure
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

  disconnect(): void {
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
