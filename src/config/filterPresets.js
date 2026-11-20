import { getAppInstanceKey } from '../core/appConfig'

export const PRESET_PARAM = '_preset'
export const FLIGHT_DAY = 'gather.flyby_missions.flight_day_number'
const ML_CLASS = 'gather.machine_learning.classification.classifications.class'
const ML_CONFIDENCE = 'gather.machine_learning.classification.classifications.confidence'
const SPACECRAFT = 'gather.common.spacecraft'
const KIND = 'gather.common.kind'
const BUNDLE = 'archive.bundle_id'

const presets = {
    atlas: [
        {
            id: 'all',
            label: 'Standard Atlas',
            description: 'Use the standard Atlas filters.',
            add: [],
            remove: [],
            recommended: [],
        },
        {
            id: 'artemis-ii',
            label: 'Artemis II',
            description: 'Explore Artemis II by flight day.',
            add: [FLIGHT_DAY],
            remove: [SPACECRAFT, KIND, BUNDLE, ML_CLASS, ML_CONFIDENCE],
            recommended: [SPACECRAFT, BUNDLE],
        },
        {
            id: 'ml',
            label: 'ML-classified datasets',
            description: 'Focus on ML Class and Confidence Score.',
            add: [ML_CLASS, ML_CONFIDENCE],
            remove: [SPACECRAFT, KIND, FLIGHT_DAY, BUNDLE],
            recommended: [BUNDLE],
        },
        {
            id: 'mars-2020',
            label: 'Mars 2020',
            description: 'Focus on rover instruments and products.',
            add: [],
            remove: [SPACECRAFT, FLIGHT_DAY, ML_CLASS, ML_CONFIDENCE],
            recommended: [SPACECRAFT, 'gather.landed_missions.planet_day_number'],
        },
        {
            id: 'planetary-imaging',
            label: 'Planetary imaging',
            description: 'Show imaging filters without Flight Day or ML.',
            add: [],
            remove: [FLIGHT_DAY, ML_CLASS, ML_CONFIDENCE],
            recommended: [],
        },
    ],
    raws: [
        {
            id: 'all',
            label: 'Standard Planetary Raws',
            description: 'Use the standard Planetary Raws filters.',
            add: [],
            remove: [],
            recommended: [],
        },
        {
            id: 'mars-2020',
            label: 'Mars 2020',
            description: 'Explore Mars 2020 images by Martian day.',
            add: ['gather.landed_missions.planet_day_number'],
            remove: [],
            recommended: [],
        },
    ],
}

export const getFilterPresets = (instance = getAppInstanceKey()) => presets[instance] || []
export const getFilterPreset = (id) => getFilterPresets().find((preset) => preset.id === id)
