
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
      this.janus = new JanusJS.Janus({
        server: options.server,
        apisecret: options.apiSecret,
        iceServers: options.iceServers || [
          { urls: 'stun:stun.l.google.com:19302' }
        ],
        success: () => {
          if (options.success) options.success();
          resolve();
        },
        error: (error) => {
          const errorMsg = `Error creating Janus session: ${error}`;
          if (options.error) options.error(errorMsg);
          reject(new Error(errorMsg));
        },
        destroyed: () => {
          if (options.destroyed) options.destroyed();
        }
      });
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

