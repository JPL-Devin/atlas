import { useCallback, useEffect, useState } from 'react'

import releaseNotes from '../config/releaseNotes.json'
import { getAppInstanceKey } from './appConfig'
import { localStorageReleaseNotesSeen } from './constants'

export const RELEASE_NOTES_MONTHS = 12

const SEEN_EVENT = 'atlas-release-notes-seen'

const monthIndex = (year, month) => year * 12 + (month - 1)

const noteMonthIndex = (note) => {
    const [year, month] = note.date.split('-').map(Number)
    return monthIndex(year, month)
}

/**
 * Release notes for an app instance from the last `months` calendar months, newest first.
 * @param {Object[]} notes - entries shaped like src/config/releaseNotes.json
 * @param {Object} [options]
 * @param {string} [options.app] - app instance key; notes without `apps` apply to every instance
 * @param {number} [options.months]
 * @param {Date} [options.now]
 * @return {Object[]}
 */
export const getReleaseNotes = (
    notes = releaseNotes,
    { app = getAppInstanceKey(), months = RELEASE_NOTES_MONTHS, now = new Date() } = {}
) => {
    const oldest = monthIndex(now.getUTCFullYear(), now.getUTCMonth() + 1) - (months - 1)
    return notes
        .filter((note) => !Array.isArray(note.apps) || note.apps.includes(app))
        .filter((note) => noteMonthIndex(note) >= oldest)
        .map((note, index) => ({ note, index }))
        .sort((a, b) => b.note.date.localeCompare(a.note.date) || a.index - b.index)
        .map(({ note }) => note)
}

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
 * @param {string|null} seenDate - newest note date (YYYY-MM-DD) the user has seen
 * @return {boolean}
 */
export const isReleaseNoteUnseen = (note, seenDate) => seenDate == null || note.date > seenDate

export const getReleaseNotesSeenDate = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null
    }
    return window.localStorage.getItem(localStorageReleaseNotesSeen)
}

export const markReleaseNotesSeen = (notes) => {
    if (typeof window === 'undefined' || !window.localStorage || notes.length === 0) {
        return
    }
    const newest = notes.reduce((max, note) => (note.date > max ? note.date : max), '')
    const seenDate = getReleaseNotesSeenDate()
    if (seenDate != null && seenDate >= newest) {
        return
    }
    window.localStorage.setItem(localStorageReleaseNotesSeen, newest)
    window.dispatchEvent(new Event(SEEN_EVENT))
}

/**
 * Release notes for the current app instance plus the user's seen state, kept in sync across
 * components and tabs.
 * @return {{ notes: Object[], seenDate: string|null, unseenCount: number, markSeen: Function }}
 */
export const useReleaseNotes = () => {
    const [notes] = useState(() => getReleaseNotes())
    const [seenDate, setSeenDate] = useState(getReleaseNotesSeenDate)

    useEffect(() => {
        const sync = () => setSeenDate(getReleaseNotesSeenDate())
        window.addEventListener(SEEN_EVENT, sync)
        window.addEventListener('storage', sync)
        return () => {
            window.removeEventListener(SEEN_EVENT, sync)
            window.removeEventListener('storage', sync)
        }
    }, [])

    const markSeen = useCallback(() => markReleaseNotesSeen(notes), [notes])
    const unseenCount = notes.filter((note) => isReleaseNoteUnseen(note, seenDate)).length

    return { notes, seenDate, unseenCount, markSeen }
}
