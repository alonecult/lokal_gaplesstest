/**
 * Fully detach the previous resource before reusing a media element. Merely
 * changing `src` can leave a decoded tail from the old resource in Chromium's
 * media pipeline, so the next queue entry may begin with the previous song.
 */
export function replaceAudioSource(element, source) {
  if (!element) return
  element.pause()
  element.removeAttribute('src')
  try { element.currentTime = 0 } catch {}
  element.load()
  element.src = source
  try { element.currentTime = 0 } catch {}
  element.load()
}

/**
 * Ignore media events left over from an audio element's previous queue entry,
 * or from an audio element currently preloading an upcoming song for gapless playback.
 * The element is tagged when assigned so events cannot prematurely advance or interfere
 * with active queue playback.
 */
export function isAudioEventForTrack(target, currentTrackId) {
  if (target?.dataset?.lokalTrackPending) return false
  if (target?.dataset?.lokalGaplessPreload) return false
  const elementTrackId = target?.dataset?.lokalTrackId
  return !elementTrackId || (currentTrackId != null && elementTrackId === String(currentTrackId))
}

/**
 * Silently preload an audio source into an inactive audio element for true gapless playback.
 * Tags the element so media events are ignored until the track is activated.
 */
export function preloadAudioSource(element, source, trackId) {
  if (!element || !source) return
  element.dataset.lokalGaplessPreload = String(trackId || '')
  element.dataset.lokalTrackPending = String(trackId || '')
  element.dataset.fallbackFor = ''
  element.dataset.fallbackSrc = ''
  element.preload = 'auto'
  element.pause()
  element.src = source
  try { element.currentTime = 0 } catch {}
  element.load()
}

/**
 * Cancel and detach a pending gapless preload from an audio element.
 */
export function cancelGaplessPreload(element) {
  if (!element) return
  element.dataset.lokalGaplessPreload = ''
  element.dataset.lokalTrackPending = ''
  element.dataset.lokalTrackId = ''
  try {
    element.pause()
    element.removeAttribute('src')
    element.load()
  } catch {}
}

/**
 * Perform a micro-ramp gain swap between the finishing element and the preloaded element.
 * A 3ms linear ramp prevents DC offset clicks while ensuring imperceptible transition latency.
 */
export function swapGainsSeamlessly(ctx, outGain, inGain, targetVolume, rampDuration = 0.003) {
  if (!ctx || !outGain || !inGain) return
  const now = ctx.currentTime
  try {
    outGain.gain.cancelScheduledValues(now)
    inGain.gain.cancelScheduledValues(now)
    outGain.gain.setValueAtTime(outGain.gain.value, now)
    outGain.gain.linearRampToValueAtTime(0, now + rampDuration)
    inGain.gain.setValueAtTime(0, now)
    inGain.gain.linearRampToValueAtTime(targetVolume, now + rampDuration)
  } catch {}
}

