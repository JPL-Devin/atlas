import { useEffect, useState } from 'react'

import releaseNotes from '../config/releaseNotes.json'
import { getAppInstanceKey } from './appConfig'
import { localStorageReleaseNotesSeen } from './constants'
import { buildEnv } from './runtimeConfig'

const seenStorageKey = () => `${localStorageReleaseNotesSeen}_${getAppInstanceKey()}`

const SEEN_EVENT = 'atlas-release-notes-seen'

/**
 * Release notes for an app instance, newest first.
 * @param {Object[]} notes - entries shaped like src/config/releaseNotes.json
 * @param {Object} [options]
 * @param {string} [options.app] - app instance key; notes without `apps` apply to every instance
 * @return {Object[]}
 */
export const getReleaseNotes = (notes = releaseNotes, { app = getAppInstanceKey() } = {}) =>
    notes
        .filter((note) => !Array.isArray(note.apps) || note.apps.includes(app))
        .map((note, index) => ({ note, index }))
        .sort((a, b) => b.note.date.localeCompare(a.note.date) || a.index - b.index)
        .map(({ note }) => note)

/**
 * Groups date-sorted notes into consecutive months.
 * @param {Object[]} notes
 * @return {{ key: string, label: string, notes: Object[] }[]}
 */
export const groupReleaseNotesByMonth = (notes) => {
    const groups = []
    notes.forEach((note) => {
        const key = note.date.slice(0, 7)
        let group = groups[groups.length - 1]
        if (group == null || group.key !== key) {
            const [year, month] = key.split('-').map(Number)
            const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
            })
            group = { key, label, notes: [] }
            groups.push(group)
        }
        group.notes.push(note)
    })
    return groups
}

const parseVersion = (version) => (String(version).match(/\d+/g) || []).map(Number)

/**
 * @param {string} a
 * @param {string} b
 * @return {number} positive if `a` is newer than `b`, negative if older, 0 if equal
 */
export const compareVersions = (a, b) => {
    const pa = parseVersion(a)
    const pb = parseVersion(b)
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0)
        if (diff !== 0) {
            return diff
        }
    }
    return 0
}

/**
 * @param {string|undefined} version - running app version
 * @param {string|null} seenVersion - app version the user last viewed release notes on
 * @return {boolean}
 */
export const isNewerVersion = (version, seenVersion) =>
    Boolean(version) && (seenVersion == null || compareVersions(version, seenVersion) > 0)

export const getAppVersion = () => buildEnv.REACT_APP_VERSION

export const getReleaseNotesSeenVersion = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null
    }
    return window.localStorage.getItem(seenStorageKey())
}

export const markReleaseNotesSeen = () => {
    const version = getAppVersion()
    if (typeof window === 'undefined' || !window.localStorage || !version) {
        return
    }
    if (!isNewerVersion(version, getReleaseNotesSeenVersion())) {
        return
    }
    window.localStorage.setItem(seenStorageKey(), version)
    window.dispatchEvent(new Event(SEEN_EVENT))
}

/**
 * Release notes for the current app instance, plus whether the running app version is newer
 * than the one the user last viewed release notes on. Kept in sync across components and tabs.
 * @return {{ notes: Object[], hasUpdate: boolean, markSeen: Function }}
 */
export const useReleaseNotes = () => {
    const [notes] = useState(() => getReleaseNotes())
    const [seenVersion, setSeenVersion] = useState(getReleaseNotesSeenVersion)

    useEffect(() => {
        const sync = () => setSeenVersion(getReleaseNotesSeenVersion())
        window.addEventListener(SEEN_EVENT, sync)
        window.addEventListener('storage', sync)
        return () => {
            window.removeEventListener(SEEN_EVENT, sync)
            window.removeEventListener('storage', sync)
        }
    }, [])

    const hasUpdate = isNewerVersion(getAppVersion(), seenVersion)

    return { notes, hasUpdate, markSeen: markReleaseNotesSeen }
}
