export const AUDIO_MIME_TYPES = { wav: 'audio/wav', m4a: 'audio/mp4' }
export const MEDIA_INITIAL_VOLUME = 0.4
// Stable ref so the volume is only applied on mount, not on every rerender
export const setInitialVolume = (el) => {
    if (el) {
        el.volume = MEDIA_INITIAL_VOLUME
    }
}
