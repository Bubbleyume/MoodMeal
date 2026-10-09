let audio: AudioContext | null = null;
export async function enableReminderSound() {
  audio ??= new AudioContext();
  await audio.resume();
  playReminderSound();
}
export function playReminderSound() {
  if (!audio || audio.state !== "running") return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.connect(gain); gain.connect(audio.destination);
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.15, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 1);
  oscillator.start(); oscillator.stop(audio.currentTime + 1);
}
