/**
 * Tiny semantic WebAudio cues. They are presentation only: no file, fetch, timer or random
 * source, and a browser without WebAudio gets the exact same simulation in silence.
 */
export type Cue = 'rotate' | 'sun' | 'death' | 'win'

export function makeAudio(enabled: boolean): { cue: (name: Cue) => void; toggle: () => boolean } {
  var muted = false
  var audio: AudioContext | null = null

  function context(): AudioContext | null {
    if (!enabled || muted || typeof AudioContext === 'undefined') return null
    if (audio === null) audio = new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
    return audio
  }

  function tone(a: AudioContext, at: number, from: number, to: number, duration: number, kind: OscillatorType, volume: number): void {
    var o = a.createOscillator(), g = a.createGain()
    o.type = kind
    o.frequency.setValueAtTime(from, at)
    o.frequency.exponentialRampToValueAtTime(to, at + duration)
    g.gain.setValueAtTime(volume, at)
    g.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    o.connect(g); g.connect(a.destination); o.start(at); o.stop(at + duration)
  }

  function cue(name: Cue): void {
    var a = context(); if (a === null) return
    var t = a.currentTime
    if (name === 'rotate') tone(a, t, 92, 184, 0.32, 'triangle', 0.045)
    if (name === 'sun') {
      tone(a, t, 330, 660, 0.2, 'sine', 0.045)
      tone(a, t + 0.12, 495, 990, 0.26, 'sine', 0.035)
    }
    if (name === 'death') tone(a, t, 130, 42, 0.45, 'sawtooth', 0.04)
    if (name === 'win') {
      tone(a, t, 330, 660, 0.42, 'triangle', 0.04)
      tone(a, t + 0.1, 415, 830, 0.46, 'triangle', 0.035)
      tone(a, t + 0.2, 495, 990, 0.52, 'sine', 0.03)
    }
  }

  return {
    cue,
    toggle: function () {
      muted = !muted
      if (muted && audio !== null) void audio.suspend()
      return muted
    },
  }
}
