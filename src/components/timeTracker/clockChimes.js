let sharedAudioCtx = null

function getAudioContext() {
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!Ctx) return null
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new Ctx()
  }
  return sharedAudioCtx
}

/** Three bell strikes while the timer runs (auto every 30s). ~3s total. */
export async function playClockTowerChimes() {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') await ctx.resume()
  } catch {
    return
  }

  const now = ctx.currentTime
  const freqs = [392, 523.25, 659.25]

  freqs.forEach((freq, i) => {
    const start = now + i * 1.0
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, start)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, start + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.95)
    osc.start(start)
    osc.stop(start + 1.05)
  })
}
