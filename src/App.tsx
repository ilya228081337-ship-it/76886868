import { useEffect, useState, useRef } from "react";
import AppLayout from "@cloudscape-design/components/app-layout";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Toggle from "@cloudscape-design/components/toggle";
import Slider from "@cloudscape-design/components/slider";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import { AudioEngine } from "./audio/AudioEngine";
import { createSampleLoops } from "./audio/generateLoops";

export default function App() {
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loops, setLoops] = useState<Array<{ id: string; name: string; isPlaying: boolean }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [reverbAmount, setReverbAmount] = useState(0.2);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [isBeatRecording, setIsBeatRecording] = useState(false);
  const [beatRecordingTime, setBeatRecordingTime] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(30);
  const [recordedBeat, setRecordedBeat] = useState<Blob | null>(null);
  const beatRecordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeAudio = async () => {
    if (audioEngineRef.current) return;

    try {
      const engine = new AudioEngine();
      await engine.resume();

      const sampleLoops = await createSampleLoops(engine['context'], 120);

      const loopData = [
        { id: 'kick', name: 'Kick Drum' },
        { id: 'snare', name: 'Snare' },
        { id: 'hihat', name: 'Hi-Hat' },
        { id: 'bass', name: 'Bass Line' },
      ];

      for (const loop of loopData) {
        const buffer = sampleLoops.get(loop.id);
        if (buffer) {
          const blob = audioBufferToBlob(buffer, engine['context'].sampleRate);
          const url = URL.createObjectURL(blob);
          await engine.addLoop(loop.id, loop.name, url);
        }
      }

      audioEngineRef.current = engine;
      setLoops(loopData.map(l => ({ ...l, isPlaying: false })));
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const audioBufferToBlob = (buffer: AudioBuffer, sampleRate: number): Blob => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(buffer.numberOfChannels);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * buffer.numberOfChannels);
    setUint16(buffer.numberOfChannels * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const toggleLoop = (id: string) => {
    if (!audioEngineRef.current) return;

    const newState = audioEngineRef.current.toggleLoop(id);
    setLoops(prev =>
      prev.map(loop => (loop.id === id ? { ...loop, isPlaying: newState } : loop))
    );
  };

  const stopAllLoops = () => {
    if (!audioEngineRef.current) return;

    audioEngineRef.current.stopAllLoops();
    setLoops(prev => prev.map(loop => ({ ...loop, isPlaying: false })));
  };

  const startRecording = async () => {
    if (!audioEngineRef.current) return;

    try {
      await audioEngineRef.current.startRecording();
      setIsRecording(true);
      setRecordedBlob(null);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    if (!audioEngineRef.current) return;

    const blob = await audioEngineRef.current.stopRecording();
    setIsRecording(false);
    if (blob) {
      setRecordedBlob(blob);
    }
  };

  const startBeatRecording = () => {
    if (!audioEngineRef.current) return;

    const anyPlaying = loops.some(l => l.isPlaying);
    if (!anyPlaying) {
      alert('Please play at least one loop before recording');
      return;
    }

    setIsBeatRecording(true);
    setBeatRecordingTime(0);
    setRecordedBeat(null);
    audioEngineRef.current.startBeatRecording();

    beatRecordingIntervalRef.current = setInterval(() => {
      setBeatRecordingTime(prev => {
        const newTime = prev + 1;
        if (newTime >= recordingDuration) {
          stopBeatRecording();
        }
        return newTime;
      });
    }, 1000);
  };

  const stopBeatRecording = async () => {
    if (!audioEngineRef.current) return;

    if (beatRecordingIntervalRef.current) {
      clearInterval(beatRecordingIntervalRef.current);
      beatRecordingIntervalRef.current = null;
    }

    setIsBeatRecording(false);
    const blob = await audioEngineRef.current.stopBeatRecording();
    if (blob) {
      setRecordedBeat(blob);
    }
  };

  const downloadBeat = () => {
    if (!recordedBeat) {
      alert('Please record the beat first');
      return;
    }

    const url = URL.createObjectURL(recordedBeat);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beat.webm';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadVoiceWithBeat = () => {
    if (!recordedBlob) {
      alert('Please record your voice first');
      return;
    }

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voice-with-beat.webm';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setCompression(compressionEnabled);
    }
  }, [compressionEnabled]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setReverb(reverbAmount);
    }
  }, [reverbAmount]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setMasterVolume(masterVolume);
    }
  }, [masterVolume]);

  useEffect(() => {
    return () => {
      if (beatRecordingIntervalRef.current) {
        clearInterval(beatRecordingIntervalRef.current);
      }
      if (audioEngineRef.current) {
        audioEngineRef.current.destroy();
      }
    };
  }, []);

  return (
    <AppLayout
      navigationHide
      toolsHide
      content={
        <SpaceBetween size="l">
          <Header variant="h1">Beat Maker</Header>

          {!isInitialized ? (
            <Container>
              <SpaceBetween size="m">
                <Box variant="p">Click the button below to initialize the audio engine</Box>
                <Button variant="primary" onClick={initializeAudio}>
                  Initialize Audio
                </Button>
              </SpaceBetween>
            </Container>
          ) : (
            <>
              <Container header={<Header variant="h2">Audio Loops</Header>}>
                <SpaceBetween size="l">
                  <ColumnLayout columns={2}>
                    {loops.map(loop => (
                      <SpaceBetween key={loop.id} size="xs">
                        <Box variant="strong">{loop.name}</Box>
                        <Button
                          onClick={() => toggleLoop(loop.id)}
                          variant={loop.isPlaying ? "primary" : "normal"}
                        >
                          {loop.isPlaying ? "Stop" : "Play"}
                        </Button>
                        {loop.isPlaying && (
                          <StatusIndicator type="success">Playing</StatusIndicator>
                        )}
                      </SpaceBetween>
                    ))}
                  </ColumnLayout>
                  <Button onClick={stopAllLoops}>Stop All</Button>
                </SpaceBetween>
              </Container>

              <Container header={<Header variant="h2">Voice Recording</Header>}>
                <SpaceBetween size="m">
                  <Box variant="p">
                    Record your voice while the beat is playing. Your voice will be mixed with the beat.
                  </Box>
                  {!isRecording ? (
                    <Button variant="primary" onClick={startRecording}>
                      Start Recording
                    </Button>
                  ) : (
                    <>
                      <StatusIndicator type="in-progress">Recording...</StatusIndicator>
                      <Button onClick={stopRecording}>Stop Recording</Button>
                    </>
                  )}
                  {recordedBlob && (
                    <StatusIndicator type="success">Recording saved</StatusIndicator>
                  )}
                </SpaceBetween>
              </Container>

              <Container header={<Header variant="h2">Effects</Header>}>
                <SpaceBetween size="m">
                  <Toggle
                    checked={compressionEnabled}
                    onChange={({ detail }) => setCompressionEnabled(detail.checked)}
                  >
                    Compression
                  </Toggle>

                  <SpaceBetween size="xs">
                    <Box variant="strong">Reverb Amount</Box>
                    <Slider
                      value={reverbAmount}
                      onChange={({ detail }) => setReverbAmount(detail.value)}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                  </SpaceBetween>

                  <SpaceBetween size="xs">
                    <Box variant="strong">Master Volume</Box>
                    <Slider
                      value={masterVolume}
                      onChange={({ detail }) => setMasterVolume(detail.value)}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                  </SpaceBetween>
                </SpaceBetween>
              </Container>

              <Container header={<Header variant="h2">Export</Header>}>
                <SpaceBetween size="m">
                  <Button onClick={downloadBeat}>Download Beat</Button>
                  {recordedBlob && (
                    <Button onClick={downloadVoiceWithBeat}>
                      Download Voice with Beat
                    </Button>
                  )}
                </SpaceBetween>
              </Container>
            </>
          )}
        </SpaceBetween>
      }
    />
  );
}
