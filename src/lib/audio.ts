let context: AudioContext | null = null;
let ambient: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

const audioContext = (): AudioContext => {
  context ??= new AudioContext();
  return context;
};

export const playInteraction = (volume: number): void => {
  const ctx = audioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(410, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.07);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.045), ctx.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.1);
};

export const setAmbient = (enabled: boolean, volume: number): void => {
  if (!enabled) {
    ambient?.stop();
    ambient = null;
    ambientGain = null;
    return;
  }
  const ctx = audioContext();
  if (!ambient) {
    ambient = ctx.createOscillator();
    ambientGain = ctx.createGain();
    ambient.type = "sine";
    ambient.frequency.value = 73;
    ambient.connect(ambientGain).connect(ctx.destination);
    ambient.start();
  }
  ambientGain?.gain.setTargetAtTime(volume * 0.012, ctx.currentTime, 0.25);
};
