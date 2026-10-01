import { test, expect } from '@playwright/test'

import releaseNotes from '../../src/config/releaseNotes.json'
import {
    getReleaseNotes,
    groupReleaseNotesByMonth,
    isReleaseNoteUnseen,
} from '../../src/core/releaseNotes'

const notes = [
    { id: 'a', date: '2026-08-02', type: 'new', title: 'A', description: '' },
    { id: 'b', date: '2026-09-10', type: 'fixed', title: 'B', description: '' },
    { id: 'c', date: '2026-09-10', type: 'new', title: 'C', description: '', apps: ['atlas'] },
    { id: 'd', date: '2025-09-30', type: 'new', title: 'D', description: '' },
    { id: 'e', date: '2026-09-01', type: 'new', title: 'E', description: '', apps: ['raws'] },
]
const now = new Date('2026-09-15T12:00:00Z')

test.describe('release notes', () => {
    test('filters by app instance and month window, newest first', () => {
        const ids = getReleaseNotes(notes, { app: 'atlas', months: 12, now }).map((n) => n.id)
        expect(ids).toEqual(['b', 'c', 'a'])
        const rawsIds = getReleaseNotes(notes, { app: 'raws', months: 12, now }).map((n) => n.id)
        expect(rawsIds).toEqual(['b', 'e', 'a'])
    })

    test('month window counts whole calendar months', () => {
        const ids = getReleaseNotes(notes, { app: 'atlas', months: 13, now }).map((n) => n.id)
        expect(ids).toContain('d')
        expect(getReleaseNotes(notes, { app: 'atlas', months: 1, now }).map((n) => n.id)).toEqual([
            'b',
            'c',
        ])
    })

    test('groups consecutive notes under month labels', () => {
        const groups = groupReleaseNotesByMonth(
            getReleaseNotes(notes, { app: 'atlas', months: 12, now })
        )
        expect(groups.map((g) => [g.key, g.label, g.notes.length])).toEqual([
            ['2026-09', 'September 2026', 2],
            ['2026-08', 'August 2026', 1],
        ])
    })

    test('notes newer than the seen date are unseen', () => {
        expect(isReleaseNoteUnseen(notes[0], null)).toBe(true)
        expect(isReleaseNoteUnseen(notes[0], '2026-08-01')).toBe(true)
        expect(isReleaseNoteUnseen(notes[0], '2026-08-02')).toBe(false)
    })

    test('shipped release notes are well formed', () => {
        const ids = new Set()
        releaseNotes.forEach((note) => {
            expect(note.id).toBeTruthy()
            expect(ids.has(note.id)).toBe(false)
            ids.add(note.id)
            expect(note.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            expect(['new', 'improved', 'fixed']).toContain(note.type)
            expect(note.title).toBeTruthy()
            expect(note.description).toBeTruthy()
            if (note.apps != null) {
                note.apps.forEach((app) => expect(['atlas', 'raws']).toContain(app))
            }
        })
    })
})
