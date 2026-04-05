export function generateKickLoop(context: AudioContext, bpm: number = 120): AudioBuffer {
  const beatsPerSecond = bpm / 60;
  const beatDuration = 1 / beatsPerSecond;
  const loopDuration = beatDuration * 4;
  const sampleRate = context.sampleRate;
  const bufferSize = Math.floor(sampleRate * loopDuration);

  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  const kickPositions = [0, 2];

  kickPositions.forEach(beat => {
    const startSample = Math.floor(beat * beatDuration * sampleRate);
    const kickDuration = 0.15;
    const kickSamples = Math.floor(kickDuration * sampleRate);

    for (let i = 0; i < kickSamples && startSample + i < bufferSize; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 15);
      const frequency = 60 * Math.exp(-t * 30);
      const phase = 2 * Math.PI * frequency * t;
      data[startSample + i] = Math.sin(phase) * envelope * 0.8;
    }
  });

  return buffer;
}

export function generateSnareLoop(context: AudioContext, bpm: number = 120): AudioBuffer {
  const beatsPerSecond = bpm / 60;
  const beatDuration = 1 / beatsPerSecond;
  const loopDuration = beatDuration * 4;
  const sampleRate = context.sampleRate;
  const bufferSize = Math.floor(sampleRate * loopDuration);

  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  const snarePositions = [1, 3];

  snarePositions.forEach(beat => {
    const startSample = Math.floor(beat * beatDuration * sampleRate);
    const snareDuration = 0.1;
    const snareSamples = Math.floor(snareDuration * sampleRate);

    for (let i = 0; i < snareSamples && startSample + i < bufferSize; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 25);
      const noise = (Math.random() * 2 - 1) * 0.3;
      const tone = Math.sin(2 * Math.PI * 200 * t) * 0.2;
      data[startSample + i] = (noise + tone) * envelope * 0.6;
    }
  });

  return buffer;
}

export function generateHiHatLoop(context: AudioContext, bpm: number = 120): AudioBuffer {
  const beatsPerSecond = bpm / 60;
  const beatDuration = 1 / beatsPerSecond;
  const loopDuration = beatDuration * 4;
  const sampleRate = context.sampleRate;
  const bufferSize = Math.floor(sampleRate * loopDuration);

  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  const hihatPositions = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];

  hihatPositions.forEach(beat => {
    const startSample = Math.floor(beat * beatDuration * sampleRate);
    const hihatDuration = 0.05;
    const hihatSamples = Math.floor(hihatDuration * sampleRate);

    for (let i = 0; i < hihatSamples && startSample + i < bufferSize; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 50);
      const noise = (Math.random() * 2 - 1);
      data[startSample + i] = noise * envelope * 0.3;
    }
  });

  return buffer;
}

export function generateBassLoop(context: AudioContext, bpm: number = 120): AudioBuffer {
  const beatsPerSecond = bpm / 60;
  const beatDuration = 1 / beatsPerSecond;
  const loopDuration = beatDuration * 4;
  const sampleRate = context.sampleRate;
  const bufferSize = Math.floor(sampleRate * loopDuration);

  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  const notes = [
    { beat: 0, duration: 0.4, freq: 110 },
    { beat: 1, duration: 0.4, freq: 110 },
    { beat: 2, duration: 0.4, freq: 130.81 },
    { beat: 3, duration: 0.4, freq: 98 },
  ];

  notes.forEach(note => {
    const startSample = Math.floor(note.beat * beatDuration * sampleRate);
    const noteSamples = Math.floor(note.duration * sampleRate);

    for (let i = 0; i < noteSamples && startSample + i < bufferSize; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3);
      const phase = 2 * Math.PI * note.freq * t;
      data[startSample + i] = Math.sin(phase) * envelope * 0.4;
    }
  });

  return buffer;
}

export function generateClapLoop(context: AudioContext, bpm: number = 120): AudioBuffer {
  const beatsPerSecond = bpm / 60;
  const beatDuration = 1 / beatsPerSecond;
  const loopDuration = beatDuration * 4;
  const sampleRate = context.sampleRate;
  const bufferSize = Math.floor(sampleRate * loopDuration);

  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  const clapPositions = [1, 3];

  clapPositions.forEach(beat => {
    const startSample = Math.floor(beat * beatDuration * sampleRate);
    const clapDuration = 0.08;
    const clapSamples = Math.floor(clapDuration * sampleRate);

    for (let i = 0; i < clapSamples && startSample + i < bufferSize; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 30);
      const noise = (Math.random() * 2 - 1) * 0.5;
      const tone = Math.sin(2 * Math.PI * 1200 * t) * 0.1;
      data[startSample + i] = (noise + tone) * envelope * 0.5;
    }
  });

  return buffer;
}

export function generateRimLoop(context: AudioContext, bpm: number = 120): AudioBuffer {
  const beatsPerSecond = bpm / 60;
  const beatDuration = 1 / beatsPerSecond;
  const loopDuration = beatDuration * 4;
  const sampleRate = context.sampleRate;
  const bufferSize = Math.floor(sampleRate * loopDuration);

  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  const rimPositions = [0.75, 1.75, 2.75, 3.75];

  rimPositions.forEach(beat => {
    const startSample = Math.floor(beat * beatDuration * sampleRate);
    const rimDuration = 0.03;
    const rimSamples = Math.floor(rimDuration * sampleRate);

    for (let i = 0; i < rimSamples && startSample + i < bufferSize; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 100);
      const noise = (Math.random() * 2 - 1) * 0.3;
      const tone = Math.sin(2 * Math.PI * 3000 * t) * 0.2;
      data[startSample + i] = (noise + tone) * envelope * 0.4;
    }
  });

  return buffer;
}

export function generatePercLoop(context: AudioContext, bpm: number = 120): AudioBuffer {
  const beatsPerSecond = bpm / 60;
  const beatDuration = 1 / beatsPerSecond;
  const loopDuration = beatDuration * 4;
  const sampleRate = context.sampleRate;
  const bufferSize = Math.floor(sampleRate * loopDuration);

  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  const percPositions = [0.25, 1.25, 2.25, 3.25];

  percPositions.forEach(beat => {
    const startSample = Math.floor(beat * beatDuration * sampleRate);
    const percDuration = 0.06;
    const percSamples = Math.floor(percDuration * sampleRate);

    for (let i = 0; i < percSamples && startSample + i < bufferSize; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 40);
      const freq = 800 + Math.sin(t * 200) * 200;
      const phase = 2 * Math.PI * freq * t;
      data[startSample + i] = Math.sin(phase) * envelope * 0.35;
    }
  });

  return buffer;
}

export function generateSynthLoop(context: AudioContext, bpm: number = 120): AudioBuffer {
  const beatsPerSecond = bpm / 60;
  const beatDuration = 1 / beatsPerSecond;
  const loopDuration = beatDuration * 4;
  const sampleRate = context.sampleRate;
  const bufferSize = Math.floor(sampleRate * loopDuration);

  const buffer = context.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  const notes = [
    { beat: 0, duration: 0.5, freq: 220 },
    { beat: 1, duration: 0.5, freq: 220 },
    { beat: 2, duration: 0.5, freq: 261.63 },
    { beat: 3, duration: 0.5, freq: 196 },
  ];

  notes.forEach(note => {
    const startSample = Math.floor(note.beat * beatDuration * sampleRate);
    const noteSamples = Math.floor(note.duration * sampleRate);

    for (let i = 0; i < noteSamples && startSample + i < bufferSize; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);
      const phase = 2 * Math.PI * note.freq * t;
      const saw = (2 * ((note.freq * t) % 1)) - 1;
      data[startSample + i] = (Math.sin(phase) * 0.5 + saw * 0.3) * envelope * 0.25;
    }
  });

  return buffer;
}

export async function createSampleLoops(context: AudioContext, bpm: number = 120): Promise<Map<string, AudioBuffer>> {
  const loops = new Map<string, AudioBuffer>();

  loops.set('kick', generateKickLoop(context, bpm));
  loops.set('snare', generateSnareLoop(context, bpm));
  loops.set('hihat', generateHiHatLoop(context, bpm));
  loops.set('bass', generateBassLoop(context, bpm));
  loops.set('clap', generateClapLoop(context, bpm));
  loops.set('rim', generateRimLoop(context, bpm));
  loops.set('perc', generatePercLoop(context, bpm));
  loops.set('synth', generateSynthLoop(context, bpm));

  return loops;
}
