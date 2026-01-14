class MicProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input[0]) {
      const samples = input[0];
      // Send raw PCM to main thread
      this.port.postMessage(samples);
    }
    return true;
  }
}

registerProcessor('mic-processor', MicProcessor);
