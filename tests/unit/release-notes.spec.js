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

test.describe('release notes', () => {
    test('filters by app instance, newest first', () => {
        const ids = getReleaseNotes(notes, { app: 'atlas' }).map((n) => n.id)
        expect(ids).toEqual(['b', 'c', 'a', 'd'])
        const rawsIds = getReleaseNotes(notes, { app: 'raws' }).map((n) => n.id)
        expect(rawsIds).toEqual(['b', 'e', 'a', 'd'])
    })

    test('groups consecutive notes under month labels', () => {
        const groups = groupReleaseNotesByMonth(getReleaseNotes(notes, { app: 'atlas' }))
        expect(groups.map((g) => [g.key, g.label, g.notes.length])).toEqual([
            ['2026-09', 'September 2026', 2],
            ['2026-08', 'August 2026', 1],
            ['2025-09', 'September 2025', 1],
        ])
    })

    test('notes not in the seen set are unseen', () => {
        expect(isReleaseNoteUnseen(notes[0], new Set())).toBe(true)
        expect(isReleaseNoteUnseen(notes[0], new Set(['b']))).toBe(true)
        expect(isReleaseNoteUnseen(notes[0], new Set(['a']))).toBe(false)
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
