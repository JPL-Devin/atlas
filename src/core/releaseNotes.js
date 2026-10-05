import { useEffect, useState } from 'react'

import releaseNotes from '../config/releaseNotes.json'
import releases from '../config/releases.json'
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
 * Minor-version releases, newest first.
 * @return {{ version: string, date: string }[]}
 */
export const getReleases = (list = releases) =>
    [...list].sort((a, b) => b.date.localeCompare(a.date))

/**
 * Groups notes by the minor release that shipped them: each note belongs to the oldest release
 * dated on or after it. Notes newer than every release come first, with a null `release`.
 * @param {Object[]} notes - newest first
 * @param {{ version: string, date: string }[]} releaseList - newest first
 * @return {{ release: Object|null, previous: Object|null, notes: Object[] }[]} empty groups omitted
 */
export const groupReleaseNotesByRelease = (notes, releaseList = getReleases()) => {
    const groups = [null, ...releaseList].map((release, i) => ({
        release,
        previous: releaseList[i] ?? null,
        notes: [],
    }))
    notes.forEach((note) => {
        const index = releaseList.filter((release) => release.date >= note.date).length
        groups[index].notes.push(note)
    })
    return groups.filter((group) => group.notes.length > 0)
}

const formatUtcDate = (year, month, day) => {
    const date = new Date(Date.UTC(year, month - 1, day))
    if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        return null
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    })
}

/**
 * @param {string} date - `YYYY-MM-DD`
 * @return {string|null} e.g. `October 5, 2026`
 */
export const formatDate = (date) => {
    const match = String(date ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
    return match ? formatUtcDate(...match.slice(1).map(Number)) : null
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

export const getAppVersion = () => buildEnv.APP_VERSION

/**
 * Formats the `-YYYYMMDD` suffix of a version (e.g. `4.2.0-20261005` -> `October 5, 2026`).
 * @return {string|null} null when the version has no valid date suffix
 */
export const formatVersionDate = (version) => {
    const match = String(version ?? '').match(/-(\d{4})(\d{2})(\d{2})$/)
    if (!match) {
        return null
    }
    return formatUtcDate(...match.slice(1).map(Number))
}

export const getAppVersionDate = () => formatVersionDate(getAppVersion())

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
