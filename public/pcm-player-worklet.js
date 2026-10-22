/**
 * PCM player AudioWorklet for Songascribe.
 *
 * @typedef {{ type: "reset", streamId: number }
 *   | { type: "samples", streamId: number, data: Float32Array }
 *   | { type: "eos", streamId: number }} PcmWorkletInputMessage
 * @typedef {{ type: "status", streamId: number, framesPlayed: number,
 *   bufferedSamples: number }
 *   | { type: "ended", streamId: number }} PcmWorkletOutputMessage
 */
class PcmPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    /** @type {Float32Array[]} */
    this.queue = [];
    this.readOffsetFrames = 0;
    this.bufferedSamples = 0;
    this.framesPlayed = 0;
    this.eos = false;
    this.endedNotified = false;
    this.statusFrames = 0;
    this.streamId = 0;

    this.port.onmessage = (event) => {
      /** @type {PcmWorkletInputMessage | undefined} */
      const message = event.data;
      if (!message || typeof message !== "object") return;

      switch (message.type) {
        case "reset":
          if (!Number.isFinite(message.streamId)) return;
          this.streamId = message.streamId;
          this.queue = [];
          this.readOffsetFrames = 0;
          this.bufferedSamples = 0;
          this.framesPlayed = 0;
          this.eos = false;
          this.endedNotified = false;
          this.statusFrames = 0;
          break;
        case "samples":
          if (
            message.streamId === this.streamId &&
            message.data instanceof Float32Array &&
            message.data.length > 0
          ) {
            this.queue.push(message.data);
            this.bufferedSamples += message.data.length;
          }
          break;
        case "eos":
          if (message.streamId === this.streamId) this.eos = true;
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
    let outputIndex = 0;
    let framesConsumed = 0;

    while (outputIndex < frameCount) {
      const chunk = this.queue[0];
      if (!chunk) {
        for (; outputIndex < frameCount; outputIndex++) {
          left[outputIndex] = 0;
          if (right !== left) right[outputIndex] = 0;
        }
        break;
      }

      const chunkFrames = chunk.length >>> 1;
      const framesAvailable = chunkFrames - this.readOffsetFrames;
      const framesToCopy = Math.min(frameCount - outputIndex, framesAvailable);
      const readBase = this.readOffsetFrames * 2;

      for (let index = 0; index < framesToCopy; index++) {
        const sourceIndex = readBase + index * 2;
        left[outputIndex + index] = chunk[sourceIndex];
        if (right !== left) right[outputIndex + index] = chunk[sourceIndex + 1];
      }

      outputIndex += framesToCopy;
      framesConsumed += framesToCopy;
      this.readOffsetFrames += framesToCopy;
      this.bufferedSamples -= framesToCopy * 2;

      if (this.readOffsetFrames >= chunkFrames) {
        this.queue.shift();
        this.readOffsetFrames = 0;
      }
    }

    this.framesPlayed += framesConsumed;
    this.statusFrames += frameCount;

    if (
      this.eos &&
      !this.endedNotified &&
      this.queue.length === 0 &&
      this.bufferedSamples <= 0
    ) {
      this.endedNotified = true;
      /** @type {PcmWorkletOutputMessage} */
      const endedMessage = { type: "ended", streamId: this.streamId };
      this.port.postMessage(endedMessage);
    }

    if (this.statusFrames >= sampleRate / 20) {
      this.statusFrames = 0;
      /** @type {PcmWorkletOutputMessage} */
      const statusMessage = {
        type: "status",
        streamId: this.streamId,
        framesPlayed: this.framesPlayed,
        bufferedSamples: this.bufferedSamples,
      };
      this.port.postMessage(statusMessage);
    }

    return true;
  }
}

registerProcessor("pcm-player-processor", PcmPlayerProcessor);
