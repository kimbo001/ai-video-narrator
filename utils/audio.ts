
// Utility to convert base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert raw PCM 16-bit (LE) data to a WAV file Blob
export const pcm16ToWav = (base64Pcm: string, sampleRate = 24000, numChannels = 1): Blob => {
  const binaryString = window.atob(base64Pcm);
  const len = binaryString.length;
  const buffer = new ArrayBuffer(len);
  const view = new DataView(buffer);
  for (let i = 0; i < len; i++) {
    view.setUint8(i, binaryString.charCodeAt(i));
  }
  
  // WAV Header construction
  const wavHeader = new ArrayBuffer(44);
  const viewHeader = new DataView(wavHeader);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      viewHeader.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  viewHeader.setUint32(4, 36 + len, true); // File size - 8
  writeString(8, 'WAVE');
  
  // fmt sub-chunk
  writeString(12, 'fmt ');
  viewHeader.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  viewHeader.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  viewHeader.setUint16(22, numChannels, true); // NumChannels
  viewHeader.setUint32(24, sampleRate, true); // SampleRate
  viewHeader.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  viewHeader.setUint16(32, numChannels * 2, true); // BlockAlign
  viewHeader.setUint16(34, 16, true); // BitsPerSample
  
  // data sub-chunk
  writeString(36, 'data');
  viewHeader.setUint32(40, len, true); // Subchunk2Size
  
  return new Blob([viewHeader, view], { type: 'audio/wav' });
};

// Helper to create a blob URL from base64 PCM data (converted to WAV)
export const createAudioUrlFromBase64 = (base64: string): string => {
  const wavBlob = pcm16ToWav(base64);
  return URL.createObjectURL(wavBlob);
};
