import sisConfig from '../config/recordDetail/sis.json'

const documents = sisConfig.documents || {}
const gaps = sisConfig.gaps || []

const asList = (value) => (value == null ? [] : Array.isArray(value) ? value : [value])

const upper = (values) => asList(values).map((value) => String(value).toUpperCase())

/**
 * The documents named by one or more SIS ids, in the order given, skipping ids
 * with no entry so a stale reference degrades to plain text.
 */
export const getSisDocuments = (ids) =>
    asList(ids)
        .map((id) => (documents[id] != null ? { id, ...documents[id] } : null))
        .filter((document) => document != null)

/**
 * The documents that apply to a mission, narrowed to an instrument when one is
 * given. An entry with no `instruments` covers every instrument of its mission.
 */
export const getSisForInstrument = (mission, instruments) => {
    if (!mission) return []
    const wanted = upper(instruments)
    return Object.keys(documents)
        .filter((id) => documents[id].mission === mission)
        .filter((id) => {
            const covered = upper(documents[id].instruments)
            if (covered.length === 0 || wanted.length === 0) return true
            return wanted.some((instrument) => covered.indexOf(instrument) !== -1)
        })
        .map((id) => ({ id, ...documents[id] }))
}

/**
 * The recorded reason a mission or instrument has no SIS, so an absence can be
 * explained rather than left blank.
 */
export const getSisGap = (mission, instruments) => {
    if (!mission) return null
    const wanted = upper(instruments)
    const missionGaps = gaps.filter((gap) => gap.mission === mission)
    const specific = missionGaps.find((gap) => {
        const covered = upper(gap.instruments)
        return covered.length > 0 && wanted.some((instrument) => covered.indexOf(instrument) !== -1)
    })
    if (specific != null) return specific
    return missionGaps.find((gap) => asList(gap.instruments).length === 0) || null
}

// Download size of a document, rounded the way file listings elsewhere are.
export const formatSisSize = (bytes) => {
    if (typeof bytes !== 'number' || !(bytes > 0)) return null
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return `${Math.round(bytes / 1024)} KB`
    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}

// Title plus revision, e.g. "MRO HiRISE RDR Products SIS (v1.3)".
export const formatSisTitle = (document) =>
    document == null
        ? null
        : document.revision
            ? `${document.title} (${document.revision})`
            : document.title
