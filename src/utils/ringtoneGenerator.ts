
import * as fs from 'fs';
import * as path from 'path';

export function generateRingtone(outputPath: string = path.join(__dirname, '../assets/sounds/ringtone.mp3')) {
  // Create an offline audio context for rendering
  const audioContext = new OfflineAudioContext(2, 44100 * 3, 44100);

  // Create two oscillators for a classic phone ring sound
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();

  // Set frequencies typical of traditional phone rings
  oscillator1.frequency.setValueAtTime(440, 0); // A4 note
  oscillator2.frequency.setValueAtTime(480, 0); // Slightly higher frequency

  // Create gain node to control volume
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.5, 0);

  // Create a rhythmic pattern that sounds like a phone ring
  const ringPattern = (time: number) => {
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.5, time + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, time + 0.5);
  };

  // Apply the ring pattern multiple times
  for (let i = 0; i < 3; i++) {
    ringPattern(i * 1);
  }

  // Connect oscillators to gain node and destination
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Start and stop oscillators to create ring effect
  oscillator1.start(0);
  oscillator2.start(0);
  oscillator1.stop(3);
  oscillator2.stop(3);

  // Render the audio
  return audioContext.startRendering().then((renderedBuffer) => {
    // Convert to MP3 using Web Audio API 
    const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
    
    // Save the file
    const buffer = Buffer.from(await wavBlob.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    
    console.log('Ringtone generated successfully');
    return outputPath;
  });
}

// Utility function to convert AudioBuffer to Wave Blob
function bufferToWave(abuffer: AudioBuffer, len: number) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(len * numOfChan * 2);                // chunk length

  // write interleaved data
  for (let i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < len) {
    for (let i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  // create Blob
  return new Blob([buffer], { type: "audio/wav" });

  // helper function to write big-endian values
  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

// Example usage
if (require.main === module) {
  generateRingtone();
}
