export interface AudioLoop {
  id: string;
  name: string;
  url: string;
  buffer: AudioBuffer | null;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  isPlaying: boolean;
}

export class AudioEngine {
  private context: AudioContext;
  private masterGain: GainNode;
  private compressor: DynamicsCompressorNode;
  private reverb: ConvolverNode;
  private reverbGain: GainNode;
  private loops: Map<string, AudioLoop>;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private voiceStream: MediaStream | null = null;
  private voiceGain: GainNode;
  private voiceDestination: MediaStreamAudioDestinationNode;
  private beatRecorder: MediaRecorder | null = null;
  private beatChunks: Blob[] = [];
  private beatDestination: MediaStreamAudioDestinationNode;

  constructor() {
    this.context = new AudioContext();
    this.loops = new Map();

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.8;

    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.reverb = this.context.createConvolver();
    this.reverbGain = this.context.createGain();
    this.reverbGain.gain.value = 0;

    this.voiceGain = this.context.createGain();
    this.voiceGain.gain.value = 1;

    this.voiceDestination = this.context.createMediaStreamDestination();
    this.beatDestination = this.context.createMediaStreamDestination();

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.reverb);
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.context.destination);
    this.compressor.connect(this.context.destination);
    this.compressor.connect(this.beatDestination);

    this.voiceGain.connect(this.compressor);
    this.voiceGain.connect(this.voiceDestination);

    this.createReverbImpulse();
  }

  private createReverbImpulse() {
    const rate = this.context.sampleRate;
    const length = rate * 2;
    const impulse = this.context.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (rate * 0.5));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.reverb.buffer = impulse;
  }

  async addLoop(id: string, name: string, url: string): Promise<void> {
    const loop: AudioLoop = {
      id,
      name,
      url,
      buffer: null,
      sourceNode: null,
      gainNode: null,
      isPlaying: false,
    };

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      loop.buffer = await this.context.decodeAudioData(arrayBuffer);
      this.loops.set(id, loop);
    } catch (error) {
      console.error(`Failed to load loop ${name}:`, error);
      throw error;
    }
  }

  toggleLoop(id: string): boolean {
    const loop = this.loops.get(id);
    if (!loop || !loop.buffer) return false;

    if (loop.isPlaying) {
      this.stopLoop(id);
      return false;
    } else {
      this.playLoop(id);
      return true;
    }
  }

  private playLoop(id: string) {
    const loop = this.loops.get(id);
    if (!loop || !loop.buffer || loop.isPlaying) return;

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();

    source.buffer = loop.buffer;
    source.loop = true;

    gain.gain.value = 0.7;

    source.connect(gain);
    gain.connect(this.masterGain);

    source.start(0);

    loop.sourceNode = source;
    loop.gainNode = gain;
    loop.isPlaying = true;
  }

  private stopLoop(id: string) {
    const loop = this.loops.get(id);
    if (!loop || !loop.isPlaying) return;

    if (loop.sourceNode) {
      loop.sourceNode.stop();
      loop.sourceNode.disconnect();
    }
    if (loop.gainNode) {
      loop.gainNode.disconnect();
    }

    loop.sourceNode = null;
    loop.gainNode = null;
    loop.isPlaying = false;
  }

  stopAllLoops() {
    this.loops.forEach((_, id) => {
      this.stopLoop(id);
    });
  }

  setLoopVolume(id: string, volume: number) {
    const loop = this.loops.get(id);
    if (loop && loop.gainNode) {
      loop.gainNode.gain.value = volume;
    }
  }

  setMasterVolume(volume: number) {
    this.masterGain.gain.value = volume;
  }

  setCompression(enabled: boolean) {
    if (enabled) {
      this.compressor.threshold.value = -24;
      this.compressor.ratio.value = 12;
    } else {
      this.compressor.threshold.value = 0;
      this.compressor.ratio.value = 1;
    }
  }

  setReverb(amount: number) {
    this.reverbGain.gain.value = amount;
  }

  async startRecording(): Promise<void> {
    try {
      this.voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const source = this.context.createMediaStreamSource(this.voiceStream);
      source.connect(this.voiceGain);

      const mixedStream = this.voiceDestination.stream;

      this.mediaRecorder = new MediaRecorder(mixedStream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder) return Promise.resolve(null);

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedChunks = [];

        if (this.voiceStream) {
          this.voiceStream.getTracks().forEach(track => track.stop());
          this.voiceStream = null;
        }

        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  startBeatRecording(): void {
    if (this.beatRecorder) return;

    this.beatChunks = [];
    this.beatRecorder = new MediaRecorder(this.beatDestination.stream);

    this.beatRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.beatChunks.push(event.data);
      }
    };

    this.beatRecorder.start();
  }

  stopBeatRecording(): Promise<Blob | null> {
    if (!this.beatRecorder) return Promise.resolve(null);

    return new Promise((resolve) => {
      if (!this.beatRecorder) {
        resolve(null);
        return;
      }

      this.beatRecorder.onstop = () => {
        const blob = new Blob(this.beatChunks, { type: 'audio/webm' });
        this.beatChunks = [];
        this.beatRecorder = null;
        resolve(blob);
      };

      this.beatRecorder.stop();
    });
  }

  async exportBeat(): Promise<Blob> {
    const destination = this.context.createMediaStreamDestination();
    this.masterGain.connect(destination);

    const mediaRecorder = new MediaRecorder(destination.stream);
    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        this.masterGain.disconnect(destination);
        resolve(blob);
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, 100);
    });
  }

  getLoops(): AudioLoop[] {
    return Array.from(this.loops.values());
  }

  resume() {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  destroy() {
    this.stopAllLoops();
    if (this.voiceStream) {
      this.voiceStream.getTracks().forEach(track => track.stop());
    }
    this.context.close();
  }
}
