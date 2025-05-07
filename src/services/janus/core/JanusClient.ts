import { EventEmitter } from './EventEmitter';

export interface JanusOptions {
  server: string;
  apiSecret?: string;
  iceServers?: RTCIceServer[];
  debug?: boolean | string;
  keepaliveInterval?: number;
}

export interface JanusCallbacks {
  success?: () => void;
  error?: (error: any) => void;
  destroyed?: () => void;
}

export interface JanusHandle {
  plugin: any;
  id: string;
  send: (options: any) => void;
  createOffer: (options: any) => void;
  createAnswer: (options: any) => void;
  handleRemoteJsep: (options: any) => void;
  detach: () => void;
}

/**
 * JanusClient - Core client for interacting with the Janus WebRTC server
 * Based on the Janus SIP demo implementation
 */
export class JanusClient extends EventEmitter {
  private janus: any = null;
  private connected: boolean = false;
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private keepaliveInterval: number | null = null;
  private debug: boolean | string;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private options: JanusOptions | null = null;
  private sessionId: string | null = null;

  constructor() {
    super();
    this.debug = false;
  }

  /**
   * Initialize the Janus library and prepare it for use
   */
  async init(debug: boolean | string = false): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.debug = debug;
      
      // Check if Janus library is loaded
      if (typeof window.Janus === 'undefined') {
        console.error('Janus library not found');
        reject(new Error('Janus library not loaded'));
        return;
      }

      try {
        window.Janus.init({
          debug: debug === true ? ["log", "error"] : 
                 debug === "all" ? ["debug", "log", "warn", "error"] : 
                 debug ? [debug] : false,
          callback: () => {
            this.log('Janus library initialized successfully');
            resolve();
          },
          error: (error: any) => {
            this.error('Janus initialization failed:', error);
            reject(error);
          }
        });
      } catch (error) {
        this.error('Error during Janus initialization:', error);
        reject(error);
      }
    });
  }

  /**
   * Connect to the Janus server and establish a session
   */
  async connect(options: JanusOptions & JanusCallbacks): Promise<void> {
    if (this.janus) {
      this.log('Janus instance already exists, destroying it first');
      await this.disconnect();
    }

    this.options = options;
    this.connectionState = 'connecting';
    
    return new Promise<void>((resolve, reject) => {
      // Ensure Janus is initialized
      if (typeof window.Janus === 'undefined') {
        this.init(options.debug).then(() => {
          this.createSession(options, resolve, reject);
        }).catch(reject);
        return;
      }
      
      this.createSession(options, resolve, reject);
    });
  }

  /**
   * Create a new Janus session
   */
  private createSession(
    options: JanusOptions & JanusCallbacks,
    resolve: () => void,
    reject: (error: any) => void
  ): void {
    const config = {
      server: options.server,
      ipv6: false,
      withCredentials: false,
      max_poll_events: 10,
      apisecret: options.apiSecret,
      keepAlivePeriod: options.keepaliveInterval || 30000,
      iceServers: options.iceServers || [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
      success: () => {
        this.connected = true;
        this.connectionState = 'connected';
        this.retryCount = 0;
        this.log('Janus session created successfully');

        // Start keepalive timer
        if (this.keepaliveInterval) {
          clearInterval(this.keepaliveInterval);
        }
        
        this.keepaliveInterval = window.setInterval(() => {
          this.sessionKeepAlive();
        }, options.keepaliveInterval || 30000);

        if (options.success) options.success();
        this.emit('connected');
        resolve();
      },
      error: (error: any) => {
        this.error('Janus session creation error:', error);
        this.connectionState = 'disconnected';
        
        // Retry logic
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          this.log(`Connection failed, retrying (${this.retryCount}/${this.maxRetries})...`);
          
          setTimeout(() => {
            this.createSession(options, resolve, reject);
          }, 2000 * this.retryCount); // Exponential backoff
          return;
        }
        
        if (options.error) options.error(error);
        this.emit('error', error);
        reject(error);
      },
      destroyed: () => {
        this.log('Janus session has been destroyed');
        this.connected = false;
        this.connectionState = 'disconnected';
        
        if (this.keepaliveInterval) {
          clearInterval(this.keepaliveInterval);
          this.keepaliveInterval = null;
        }
        
        if (options.destroyed) options.destroyed();
        this.emit('disconnected');
      }
    };
    
    this.log('Creating Janus session with config:', config);
    this.janus = new window.Janus(config);
    
    // Store session ID once available
    if (this.janus && this.janus.getSessionId) {
      this.sessionId = this.janus.getSessionId();
    }
  }

  /**
   * Attach to a Janus plugin
   */
  async attachPlugin(
    plugin: string, 
    opaqueId: string | null = null,
    callbacks: any = {}
  ): Promise<JanusHandle> {
    if (!this.isConnected()) {
      throw new Error("Cannot attach plugin: Janus not connected");
    }
    
    return new Promise<JanusHandle>((resolve, reject) => {
      const pluginCallbacks = {
        ...callbacks,
        success: (pluginHandle: any) => {
          this.log(`Successfully attached to plugin ${plugin} (handle ID: ${pluginHandle.getId()})`);
          
          const handle: JanusHandle = {
            plugin: pluginHandle,
            id: pluginHandle.getId(),
            send: (options: any) => pluginHandle.send(options),
            createOffer: (options: any) => pluginHandle.createOffer(options),
            createAnswer: (options: any) => pluginHandle.createAnswer(options),
            handleRemoteJsep: (options: any) => pluginHandle.handleRemoteJsep(options),
            detach: () => pluginHandle.detach()
          };
          
          if (callbacks.success) callbacks.success(pluginHandle);
          resolve(handle);
        },
        error: (error: any) => {
          this.error(`Error attaching to plugin ${plugin}:`, error);
          if (callbacks.error) callbacks.error(error);
          reject(error);
        }
      };
      
      const attachOptions = {
        plugin: plugin,
        opaqueId: opaqueId || `sip-${Math.floor(Math.random() * 10000)}`,
        ...pluginCallbacks
      };
      
      this.log('Attaching to plugin with options:', attachOptions);
      this.janus.attach(attachOptions);
    });
  }

  /**
   * Check if connected to Janus server
   */
  isConnected(): boolean {
    return this.connected && this.janus !== null;
  }

  /**
   * Get the connection state
   */
  getConnectionState(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionState;
  }

  /**
   * Get the Janus instance (for advanced usage)
   */
  getInstance(): any {
    return this.janus;
  }

  /**
   * Get the session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Send a keep-alive message to prevent session timeout
   */
  private sessionKeepAlive(): void {
    if (this.janus && this.isConnected()) {
      this.janus.sessionKeepAlive();
    }
  }

  /**
   * Disconnect from the Janus server
   */
  async disconnect(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.keepaliveInterval) {
        clearInterval(this.keepaliveInterval);
        this.keepaliveInterval = null;
      }

      if (this.janus) {
        // Give janus time to clean up
        this.janus.destroy({
          success: () => {
            this.log('Janus instance destroyed successfully');
            this.janus = null;
            this.connected = false;
            this.connectionState = 'disconnected';
            this.emit('disconnected');
            resolve();
          },
          async: true
        });
      } else {
        this.connected = false;
        this.connectionState = 'disconnected';
        resolve();
      }
    });
  }

  /**
   * Log message if debug is enabled
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[JanusClient]', ...args);
    }
  }

  /**
   * Log error message
   */
  private error(...args: any[]): void {
    console.error('[JanusClient]', ...args);
  }
}

// Type definition for the global Janus object
declare global {
  interface Window {
    Janus: any;
  }
}
