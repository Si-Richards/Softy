
import audioService from '@/services/AudioService';

/**
 * AudioVolumeManager ensures that audio volume settings are properly applied across
 * the application and synchronized with the AudioService
 */
class AudioVolumeManager {
  private static instance: AudioVolumeManager;
  private masterVolume: number = 100;
  private ringtoneVolume: number = 100;
  private initialized: boolean = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): AudioVolumeManager {
    if (!AudioVolumeManager.instance) {
      AudioVolumeManager.instance = new AudioVolumeManager();
    }
    return AudioVolumeManager.instance;
  }

  /**
   * Initialize the volume manager by loading settings from localStorage
   */
  public initialize(): void {
    if (this.initialized) return;

    // Load settings from localStorage
    this.loadSettings();

    // Apply initial volume settings to AudioService
    this.applyMasterVolume();

    // Listen for storage changes to sync settings between tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'audioSettings') {
        this.loadSettings();
        this.applyMasterVolume();
      }
    });

    this.initialized = true;
    console.log('AudioVolumeManager: Initialized with volumes:', {
      master: this.masterVolume,
      ringtone: this.ringtoneVolume
    });
  }

  /**
   * Load audio settings from localStorage
   */
  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('audioSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.masterVolume = settings.masterVolume ?? 100;
        this.ringtoneVolume = settings.ringtoneVolume ?? 100;
      }
    } catch (error) {
      console.error('Error loading audio settings:', error);
    }
  }

  /**
   * Apply the master volume to the AudioService
   */
  private applyMasterVolume(): void {
    // Convert percentage to 0-1 range for the audio element
    const normalizedVolume = this.masterVolume / 100;
    audioService.setMasterVolume(normalizedVolume);
  }

  /**
   * Set the master volume
   * @param volume Volume level (0-100)
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.min(100, Math.max(0, volume));
    this.applyMasterVolume();
    this.saveSettings();
  }

  /**
   * Set the ringtone volume
   * @param volume Volume level (0-100)
   */
  public setRingtoneVolume(volume: number): void {
    this.ringtoneVolume = Math.min(100, Math.max(0, volume));
    this.saveSettings();
  }

  /**
   * Save current settings to localStorage
   */
  private saveSettings(): void {
    try {
      const settings = {
        masterVolume: this.masterVolume,
        ringtoneVolume: this.ringtoneVolume
      };
      localStorage.setItem('audioSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving audio settings:', error);
    }
  }

  /**
   * Get the current master volume
   * @returns Master volume (0-100)
   */
  public getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Get the current ringtone volume
   * @returns Ringtone volume (0-100)
   */
  public getRingtoneVolume(): number {
    return this.ringtoneVolume;
  }
}

// Export singleton instance
const audioVolumeManager = AudioVolumeManager.getInstance();
export default audioVolumeManager;
