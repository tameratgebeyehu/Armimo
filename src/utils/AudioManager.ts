// ─────────────────────────────────────────────
// Armimo / አርምሞ — Focus Ambient Audio Manager
// ─────────────────────────────────────────────

import { Audio } from 'expo-av';

const TRACKS: Record<string, string> = {
  rain:       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Ambient/chill stream representation
  wind:       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', // Wind stream representation
  whitenoise: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', // White noise stream representation
  night:      'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', // Night ambience stream representation
};

let soundInstance: Audio.Sound | null = null;
let currentTrackKey: string | null = null;
let isAudioConfigured = false;

async function configureAudioMode() {
  if (isAudioConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
    isAudioConfigured = true;
  } catch (e) {
    console.warn('[Audio] Failed to configure audio mode:', e);
  }
}

export const AudioManager = {
  /**
   * Play an ambient sound loop. If already playing, switches track or keeps playing.
   */
  play: async (trackKey: string): Promise<void> => {
    try {
      if (trackKey === 'none') {
        await AudioManager.stop();
        return;
      }

      const url = TRACKS[trackKey];
      if (!url) {
        console.warn(`[Audio] No URL mapped for track key: ${trackKey}`);
        return;
      }

      await configureAudioMode();

      // If the track is already playing, do nothing
      if (soundInstance && currentTrackKey === trackKey) {
        const status = await soundInstance.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await soundInstance.playAsync();
        }
        return;
      }

      // Stop and unload any previous sound
      await AudioManager.stop();

      // Load new sound
      currentTrackKey = trackKey;
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        {
          shouldPlay: true,
          isLooping: true,
          volume: 0.8, // standard volume, can be faded in
        }
      );
      soundInstance = sound;
    } catch (e) {
      console.warn('[Audio] Error playing track:', e);
    }
  },

  /**
   * Pause the current playing ambient sound.
   */
  pause: async (): Promise<void> => {
    try {
      if (soundInstance) {
        const status = await soundInstance.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundInstance.pauseAsync();
        }
      }
    } catch (e) {
      console.warn('[Audio] Error pausing track:', e);
    }
  },

  /**
   * Resume the current paused ambient sound.
   */
  resume: async (): Promise<void> => {
    try {
      if (soundInstance && currentTrackKey) {
        const status = await soundInstance.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await soundInstance.playAsync();
        }
      }
    } catch (e) {
      console.warn('[Audio] Error resuming track:', e);
    }
  },

  /**
   * Stop, unload, and release audio resources.
   */
  stop: async (): Promise<void> => {
    try {
      if (soundInstance) {
        await soundInstance.stopAsync();
        await soundInstance.unloadAsync();
        soundInstance = null;
      }
      currentTrackKey = null;
    } catch (e) {
      console.warn('[Audio] Error stopping track:', e);
    }
  },

  /**
   * Set volume dynamically (value between 0.0 and 1.0).
   */
  setVolume: async (volume: number): Promise<void> => {
    try {
      if (soundInstance) {
        const clampedVol = Math.max(0, Math.min(1, volume));
        await soundInstance.setVolumeAsync(clampedVol);
      }
    } catch (e) {
      console.warn('[Audio] Error setting volume:', e);
    }
  },
};
