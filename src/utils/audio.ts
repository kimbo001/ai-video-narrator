// src/utils/audio.ts

/**
 * Converts raw PCM 16-bit (Int16Array or Uint8Array interpreted as int16) to WAV Blob
 */
export const pcm16ToWav = (pcmData: Uint8Array | null): Blob => {
  if (!pcmData || pcmData.length === 0) {
    return new Blob([], { type: 'audio/wav' });
  }

  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;

  const wavBuffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(wavBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length - 8
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  // block align (channelCount * bytesPerSample)
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  // bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, pcmData.length, true);

  // Write the PCM samples
  const pcm16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.length / 2);
  let offset = 44;
  for (let i = 0; i < pcm16.length; i++, offset += 2) {
    view.setInt16(offset, pcm16[i], true);
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
};

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
