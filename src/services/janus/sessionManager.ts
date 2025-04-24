
import { JanusJS } from 'janus-gateway-js';
import type { JanusOptions } from './types';

export class JanusSessionManager {
  private janus: any = null;
  private sipPlugin: any = null;
  private opaqueId: string;

  constructor() {
    this.opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
  }

  async createSession(options: JanusOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.janus) {
        this.disconnect();
      }

      try {
        this.janus = new JanusJS({
          server: options.server,
          apisecret: options.apiSecret,
          iceServers: options.iceServers || [
            { urls: 'stun:stun.l.google.com:19302' }
          ],
          success: () => {
            resolve();
          },
          error: (error: any) => {
            const errorMsg = `Error creating Janus session: ${error}`;
            reject(new Error(errorMsg));
          },
          destroyed: () => {
            if (options.destroyed) options.destroyed();
          }
        });
      } catch (error: any) {
        reject(new Error(`Failed to create Janus instance: ${error.message || error}`));
      }
    });
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
