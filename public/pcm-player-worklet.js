/**
 * PCM player AudioWorklet for Songascribe.
 *
 * Receives interleaved stereo Float32 chunks (converted from NodeLink's
 * 16-bit little-endian PCM @ 48 kHz, stereo) on its message port and plays
 * them back through the AudioContext destination.
 *
 * Messages from main thread:
 *   { type: "samples", data: Float32Array }   // interleaved L,R,L,R,...
 *   { type: "eos" }                           // upstream stream ended
 *   { type: "flush" }                         // discard buffered audio (seek)
 *
 * Messages to main thread (every ~50 ms while playing):
 *   { type: "status", samplesPlayed, bufferedSamples }
 *   { type: "ended" }                         // eos seen AND buffer drained
 */
class PcmPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    /** Queue of interleaved Float32 chunks not yet consumed. */
    this.queue = [];
    /** Read offset (in frames, NOT samples) into queue[0]. */
    this.readOffsetFrames = 0;
    /** Total interleaved samples currently buffered across the queue. */
    this.bufferedSamples = 0;
    /** Frames written to the output (one frame = one L+R pair). */
    this.framesPlayed = 0;
    /** Whether the producer has signaled end-of-stream. */
    this.eos = false;
    /** Whether we've already notified the main thread that playback ended. */
    this.endedNotified = false;
    /** Throttle status messages. */
    this.lastStatusFrame = 0;

    this.port.onmessage = (event) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      switch (msg.type) {
        case "samples": {
          const data = msg.data;
          if (data && data.length) {
            this.queue.push(data);
            this.bufferedSamples += data.length;
          }
          break;
        }
        case "eos":
          this.eos = true;
          break;
        case "flush":
          this.queue = [];
          this.readOffsetFrames = 0;
          this.bufferedSamples = 0;
          this.eos = false;
          this.endedNotified = false;
          break;
        case "resetPosition":
          this.framesPlayed = 0;
          break;
      }
    };
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const left = output[0];
    const right = output.length > 1 ? output[1] : output[0];
    const frameCount = left.length;

    let outIdx = 0;
    while (outIdx < frameCount) {
      const chunk = this.queue[0];
      if (!chunk) {
        // Underrun: emit silence for the rest of the block.
        for (; outIdx < frameCount; outIdx++) {
          left[outIdx] = 0;
          if (right !== left) right[outIdx] = 0;
        }
        break;
      }
      const chunkFrames = chunk.length >>> 1;
      const framesAvailable = chunkFrames - this.readOffsetFrames;
      const framesToCopy = Math.min(frameCount - outIdx, framesAvailable);
      const base = this.readOffsetFrames * 2;
      for (let i = 0; i < framesToCopy; i++) {
        const j = base + i * 2;
        left[outIdx + i] = chunk[j];
        if (right !== left) right[outIdx + i] = chunk[j + 1];
      }
      outIdx += framesToCopy;
      this.readOffsetFrames += framesToCopy;
      this.bufferedSamples -= framesToCopy * 2;
      if (this.readOffsetFrames >= chunkFrames) {
        this.queue.shift();
        this.readOffsetFrames = 0;
      }
    }

    this.framesPlayed += frameCount;

    // Notify ended once after eos + drained.
    if (
      this.eos &&
      !this.endedNotified &&
      this.queue.length === 0 &&
      this.bufferedSamples <= 0
    ) {
      this.endedNotified = true;
      this.port.postMessage({ type: "ended" });
    }

    // Throttle status messages to ~every 50 ms (sampleRate / 20 frames).
    if (this.framesPlayed - this.lastStatusFrame >= sampleRate / 20) {
      this.lastStatusFrame = this.framesPlayed;
      this.port.postMessage({
        type: "status",
        framesPlayed: this.framesPlayed,
        bufferedSamples: this.bufferedSamples,
      });
    }

    return true;
  }
}

registerProcessor("pcm-player-processor", PcmPlayerProcessor);
