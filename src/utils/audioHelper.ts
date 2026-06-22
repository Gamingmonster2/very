/**
 * Safe client-side utility to process and resample audio into single channel 16kHz float array requested by Whisper models.
 */

export async function getAudioChannelData(audioFile: Blob): Promise<Float32Array> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 16000,
  });

  const fileReader = new FileReader();
  
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
    fileReader.onerror = () => reject(new Error('خطأ أثناء قراءة البيانات الصوتية - Audio data reading failed.'));
    fileReader.readAsArrayBuffer(audioFile);
  });

  let decodedData: AudioBuffer;
  try {
    decodedData = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    throw new Error('فشل فك ترميز ملف الصوت. يرجى استخدام صيغة ملف متوافقة مثل MP3 أو WAV.');
  }

  // Convert to Mono 16kHz
  const channelData = decodedData.getChannelData(0);
  await audioContext.close();
  return channelData;
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const formattedM = m.toString().padStart(2, '0');
  const formattedS = s.toString().padStart(2, '0');
  
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${formattedM}:${formattedS}`;
  }
  return `${formattedM}:${formattedS}`;
}

export function generateSRT(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments
    .map((segment, index) => {
      const startFormatted = formatSRTTime(segment.start);
      const endFormatted = formatSRTTime(segment.end || (segment.start + 2.5));
      return `${index + 1}\n${startFormatted} --> ${endFormatted}\n${segment.text.trim()}\n\n`;
    })
    .join('');
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
  return `${h}:${m}:${s},${ms}`;
}
