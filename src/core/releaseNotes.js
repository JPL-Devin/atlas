import { useCallback, useEffect, useState } from 'react'

import releaseNotes from '../config/releaseNotes.json'
import { getAppInstanceKey } from './appConfig'
import { localStorageReleaseNotesSeen } from './constants'

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

/**
 * @param {Object} note
 * @param {Set<string>} seenIds - ids of notes the user has seen
 * @return {boolean}
 */
export const isReleaseNoteUnseen = (note, seenIds) => !seenIds.has(note.id)

export const getReleaseNotesSeenIds = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return new Set()
    }
    try {
        const ids = JSON.parse(window.localStorage.getItem(localStorageReleaseNotesSeen))
        return new Set(Array.isArray(ids) ? ids : [])
    } catch {
        return new Set()
    }
}

export const markReleaseNotesSeen = (notes) => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return
    }
    const seenIds = getReleaseNotesSeenIds()
    const unseen = notes.filter((note) => isReleaseNoteUnseen(note, seenIds))
    if (unseen.length === 0) {
        return
    }
    unseen.forEach((note) => seenIds.add(note.id))
    window.localStorage.setItem(localStorageReleaseNotesSeen, JSON.stringify([...seenIds]))
    window.dispatchEvent(new Event(SEEN_EVENT))
}

/**
 * Release notes for the current app instance plus the user's seen state, kept in sync across
 * components and tabs.
 * @return {{ notes: Object[], unseenCount: number, markSeen: Function }}
 */
export const useReleaseNotes = () => {
    const [notes] = useState(() => getReleaseNotes())
    const [seenIds, setSeenIds] = useState(getReleaseNotesSeenIds)

    useEffect(() => {
        const sync = () => setSeenIds(getReleaseNotesSeenIds())
        window.addEventListener(SEEN_EVENT, sync)
        window.addEventListener('storage', sync)
        return () => {
            window.removeEventListener(SEEN_EVENT, sync)
            window.removeEventListener('storage', sync)
        }
    }, [])

    const markSeen = useCallback(() => markReleaseNotesSeen(notes), [notes])
    const unseenCount = notes.filter((note) => isReleaseNoteUnseen(note, seenIds)).length

    return { notes, unseenCount, markSeen }
}
