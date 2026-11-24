import { PRESET_PARAM } from '../../config/filterPresets'

const paths = { search: '/search', archive: '/archive-explorer' }

export const getHomeDestination = (destination, card) => {
    const target = card?.destinations?.[destination]
    if (card && !target) {
        return null
    }
    const query = target?.query || (destination === 'search' ? card?.query : null)
    const parts = []
    if (destination === 'search' && card?.preset) {
        parts.push(`${PRESET_PARAM}=${encodeURIComponent(card.preset)}`)
    }
    Object.entries(query || {}).forEach(([field, values]) => {
        if (values.length) {
            parts.push(`${encodeURIComponent(field)}=${values.map(encodeURIComponent).join(',')}`)
        }
    })
    return paths[destination] + (parts.length ? `?${parts.join('&')}` : '')
}
