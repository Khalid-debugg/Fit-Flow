// Web Audio API - Generate beep sounds without audio files

const audioContext =
  typeof window !== 'undefined'
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window.AudioContext || (window as any).webkitAudioContext)()
    : null

function playBeep(frequency: number, duration: number, type: OscillatorType = 'sine') {
  if (!audioContext) return

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.value = frequency
  oscillator.type = type

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + duration)
}

// Success sound - Active member checked in
export function playSuccess() {
  playBeep(800, 0.15, 'sine') // High-pitched, short beep
}

// Warning sound - Expired/No membership checked in
export function playWarning() {
  playBeep(400, 0.25, 'square') // Medium-pitched, longer beep
}

// Error sound - Member not found / Already checked in
export function playError() {
  playBeep(200, 0.4, 'sawtooth') // Low-pitched, longest beep
}
