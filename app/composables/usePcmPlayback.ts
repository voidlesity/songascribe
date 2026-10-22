type PcmWorkletInputMessage =
  | { type: "reset"; streamId: number }
  | { type: "samples"; streamId: number; data: Float32Array }
  | { type: "eos"; streamId: number };

type PcmWorkletOutputMessage =
  | {
      type: "status";
      streamId: number;
      framesPlayed: number;
      bufferedSamples: number;
    }
  | { type: "ended"; streamId: number };

interface PcmPlaybackOptions {
  currentQueueItem: ComputedRef<PlayerQueueItem | null>;
  isPlaying: Ref<boolean>;
  currentTime: Ref<number>;
  duration: Ref<number>;
  volume: Ref<number>;
  isLoading: Ref<boolean>;
  onTrackEnd: () => void;
}

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const SAMPLE_RATE = 48_000;
const CHANNELS = 2;
const BACKPRESSURE_SAMPLES = SAMPLE_RATE * CHANNELS * 8;
const BACKPRESSURE_RESUME = SAMPLE_RATE * CHANNELS * 4;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown playback error";
}

function isWorkletOutputMessage(
  value: unknown,
): value is PcmWorkletOutputMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<PcmWorkletOutputMessage>;
  return (
    typeof message.streamId === "number" &&
    (message.type === "ended" ||
      (message.type === "status" &&
        typeof message.framesPlayed === "number" &&
        typeof message.bufferedSamples === "number"))
  );
}

export function usePcmPlayback(options: PcmPlaybackOptions) {
  const playbackError = ref<string | null>(null);

  let audioContext: AudioContext | null = null;
  let workletNode: AudioWorkletNode | null = null;
  let gainNode: GainNode | null = null;
  let workletReadyPromise: Promise<void> | null = null;
  let currentAbortController: AbortController | null = null;
  let currentReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let activeStreamId = 0;
  let loadedEntryId: string | null = null;
  let initialPositionSeconds = 0;
  let bufferedSamples = 0;
  let hasEnded = false;
  let disposed = false;

  function postToWorklet(
    message: PcmWorkletInputMessage,
    transfer?: Transferable[],
  ) {
    workletNode?.port.postMessage(message, transfer ?? []);
  }

  async function ensureAudioGraph() {
    if (audioContext && workletNode && gainNode) return;

    if (!audioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("Web Audio playback is not supported in this browser");
      }
      audioContext = new AudioContextClass({ sampleRate: SAMPLE_RATE });
    }

    if (!workletReadyPromise) {
      workletReadyPromise = audioContext.audioWorklet
        .addModule("/pcm-player-worklet.js")
        .catch((error: unknown) => {
          workletReadyPromise = null;
          throw error;
        });
    }
    await workletReadyPromise;

    if (!workletNode) {
      workletNode = new AudioWorkletNode(audioContext, "pcm-player-processor", {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [CHANNELS],
      });
      workletNode.port.onmessage = handleWorkletMessage;
    }

    if (!gainNode) {
      gainNode = audioContext.createGain();
      gainNode.gain.value = options.volume.value / 100;
      workletNode.connect(gainNode).connect(audioContext.destination);
    }
  }

  function handleWorkletMessage(event: MessageEvent<unknown>) {
    if (!isWorkletOutputMessage(event.data)) return;
    const message = event.data;
    if (message.streamId !== activeStreamId) return;

    if (message.type === "status") {
      bufferedSamples = message.bufferedSamples;
      options.currentTime.value =
        initialPositionSeconds + message.framesPlayed / SAMPLE_RATE;
      return;
    }

    hasEnded = true;
    options.isLoading.value = false;
    const endedEntryId = options.currentQueueItem.value?.id;
    activeStreamId++;
    options.onTrackEnd();

    const currentEntry = options.currentQueueItem.value;
    if (
      currentEntry &&
      currentEntry.id === endedEntryId &&
      options.isPlaying.value
    ) {
      void playEntry(currentEntry, 0);
    }
  }

  function cancelCurrentStream() {
    currentAbortController?.abort();
    currentAbortController = null;
    if (currentReader) {
      void currentReader.cancel().catch(() => undefined);
      currentReader = null;
    }
  }

  function resetWorklet(streamId: number) {
    bufferedSamples = 0;
    postToWorklet({ type: "reset", streamId });
  }

  function stopPlayback() {
    cancelCurrentStream();
    const streamId = ++activeStreamId;
    loadedEntryId = null;
    hasEnded = false;
    resetWorklet(streamId);
    options.isLoading.value = false;
  }

  function failPlayback(streamId: number, message: string) {
    if (streamId !== activeStreamId || disposed) return;
    cancelCurrentStream();
    options.isLoading.value = false;
    options.isPlaying.value = false;
    playbackError.value = message;
  }

  async function waitForBackpressure(signal: AbortSignal) {
    await new Promise<void>((resolve) => {
      const finish = () => {
        window.clearTimeout(timeout);
        signal.removeEventListener("abort", finish);
        resolve();
      };
      const timeout = window.setTimeout(finish, 50);
      signal.addEventListener("abort", finish, { once: true });
    });
  }

  async function streamPcm(
    encodedTrack: string,
    positionMs: number,
    streamId: number,
  ) {
    const controller = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    currentAbortController = controller;

    try {
      const response = await fetch(
        `/api/audio/stream?encoded=${encodeURIComponent(encodedTrack)}&position=${positionMs}`,
        { signal: controller.signal },
      );
      if (!response.ok) {
        throw new Error(`Audio stream request failed (${response.status})`);
      }
      if (!response.body) {
        throw new Error("Audio stream returned no data");
      }
      if (streamId !== activeStreamId) return;

      reader = response.body.getReader();
      currentReader = reader;
      let leftover: Uint8Array | null = null;

      while (!controller.signal.aborted && streamId === activeStreamId) {
        while (
          bufferedSamples > BACKPRESSURE_SAMPLES &&
          !controller.signal.aborted &&
          streamId === activeStreamId
        ) {
          await waitForBackpressure(controller.signal);
          if (bufferedSamples <= BACKPRESSURE_RESUME) break;
        }

        if (controller.signal.aborted || streamId !== activeStreamId) return;
        const { value, done } = await reader.read();
        if (done) break;
        if (!value?.length) continue;

        let bytes = value;
        if (leftover) {
          const merged = new Uint8Array(leftover.length + value.length);
          merged.set(leftover);
          merged.set(value, leftover.length);
          bytes = merged;
          leftover = null;
        }
        const remainder =
          bytes.length % (CHANNELS * Int16Array.BYTES_PER_ELEMENT);
        if (remainder !== 0) {
          leftover = bytes.slice(bytes.length - remainder);
          bytes = bytes.slice(0, bytes.length - remainder);
        }
        if (bytes.length === 0) continue;

        const sampleCount = bytes.length >>> 1;
        const view = new DataView(
          bytes.buffer,
          bytes.byteOffset,
          bytes.byteLength,
        );
        const samples = new Float32Array(sampleCount);
        for (let index = 0; index < sampleCount; index++) {
          samples[index] = view.getInt16(index * 2, true) / 32768;
        }

        if (streamId !== activeStreamId) return;
        bufferedSamples += samples.length;
        postToWorklet({ type: "samples", streamId, data: samples }, [
          samples.buffer,
        ]);
        options.isLoading.value = false;
      }

      if (!controller.signal.aborted && streamId === activeStreamId) {
        options.isLoading.value = false;
        postToWorklet({ type: "eos", streamId });
      }
    } catch (error: unknown) {
      if (!controller.signal.aborted) {
        console.error("[PCM] stream failed:", error);
        failPlayback(streamId, errorMessage(error));
      }
    } finally {
      if (currentAbortController === controller) {
        currentAbortController = null;
      }
      if (currentReader === reader) currentReader = null;
    }
  }

  async function playEntry(entry: PlayerQueueItem, positionSeconds = 0) {
    if (!entry.song.encoded || disposed) return;

    cancelCurrentStream();
    const streamId = ++activeStreamId;
    const trackDuration = Math.max(0, (entry.song.lengthMs || 0) / 1000);
    const safePosition = Math.max(
      0,
      trackDuration > 0
        ? Math.min(positionSeconds, trackDuration)
        : positionSeconds,
    );

    loadedEntryId = entry.id;
    initialPositionSeconds = safePosition;
    hasEnded = false;
    playbackError.value = null;
    options.isLoading.value = true;
    options.currentTime.value = safePosition;
    options.duration.value = trackDuration;

    try {
      await ensureAudioGraph();
      if (streamId !== activeStreamId || disposed) return;

      resetWorklet(streamId);
      if (options.isPlaying.value && audioContext?.state === "suspended") {
        await audioContext.resume();
      }
      if (streamId !== activeStreamId || disposed) return;

      void streamPcm(
        entry.song.encoded,
        Math.round(safePosition * 1000),
        streamId,
      );
    } catch (error: unknown) {
      console.error("[PCM] initialization failed:", error);
      failPlayback(streamId, errorMessage(error));
    }
  }

  function seek(positionSeconds: number) {
    const entry = options.currentQueueItem.value;
    if (!entry || !Number.isFinite(positionSeconds)) return;
    void playEntry(entry, positionSeconds);
  }

  function retry() {
    const entry = options.currentQueueItem.value;
    if (!entry) return;
    options.isPlaying.value = true;
    void playEntry(entry, options.currentTime.value);
  }

  watch(
    options.currentQueueItem,
    (entry) => {
      if (!entry) {
        stopPlayback();
        options.currentTime.value = 0;
        options.duration.value = 0;
        playbackError.value = null;
        return;
      }

      options.currentTime.value = 0;
      options.duration.value = Math.max(0, (entry.song.lengthMs || 0) / 1000);
      if (options.isPlaying.value) void playEntry(entry, 0);
    },
    { immediate: true },
  );

  watch(options.isPlaying, async (playing) => {
    const entry = options.currentQueueItem.value;
    if (
      playing &&
      entry &&
      (loadedEntryId !== entry.id || hasEnded || playbackError.value)
    ) {
      await playEntry(entry, hasEnded ? 0 : options.currentTime.value);
      return;
    }
    if (!audioContext || audioContext.state === "closed") return;

    try {
      if (playing && audioContext.state === "suspended") {
        await audioContext.resume();
      } else if (!playing && audioContext.state === "running") {
        await audioContext.suspend();
      }
    } catch (error: unknown) {
      console.warn("[PCM] context state change failed:", error);
    }
  });

  watch(
    options.volume,
    (newVolume) => {
      if (gainNode) {
        gainNode.gain.value = Math.max(0, Math.min(1, newVolume / 100));
      }
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    disposed = true;
    stopPlayback();
    if (workletNode) {
      workletNode.port.onmessage = null;
      workletNode.disconnect();
      workletNode = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
    if (audioContext) {
      void audioContext.close().catch(() => undefined);
      audioContext = null;
    }
  });

  return {
    playbackError: readonly(playbackError),
    seek,
    retry,
    stop: stopPlayback,
  };
}
