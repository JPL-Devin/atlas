import { test, expect } from '@playwright/test'

import releaseNotes from '../../src/config/releaseNotes.json'
import releases from '../../src/config/releases.json'
import {
    getReleaseNotes,
    groupReleaseNotesByRelease,
    compareVersions,
    formatVersionDate,
    formatDate,
    isNewerVersion,
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

    test('compares app versions numerically', () => {
        expect(compareVersions('v1.10.0', 'v1.9.2')).toBeGreaterThan(0)
        expect(compareVersions('1.0', 'v1.0.0')).toBe(0)
        expect(compareVersions('v1.0.0', 'v1.0.1')).toBeLessThan(0)
        expect(compareVersions('1.0.2-20261005', '1.0.1-20261001')).toBeGreaterThan(0)
        expect(compareVersions('1.0.1-20261001', 'v1.0.0')).toBeGreaterThan(0)
    })

    test('groups notes under the release that shipped them', () => {
        const groups = groupReleaseNotesByRelease(getReleaseNotes(notes, { app: 'atlas' }), [
            { version: '4.2', date: '2026-09-05' },
            { version: '4.1', date: '2025-12-01' },
            { version: '4.0', date: '2025-01-01' },
        ])
        expect(
            groups.map((g) => [
                g.release?.version ?? null,
                g.previous?.version ?? null,
                g.notes.map((n) => n.id),
            ])
        ).toEqual([
            [null, '4.2', ['b', 'c']],
            ['4.2', '4.1', ['a']],
            ['4.1', '4.0', ['d']],
        ])
        expect(groupReleaseNotesByRelease([{ id: 'x', date: '2026-01-01' }], [])).toEqual([
            { release: null, previous: null, notes: [{ id: 'x', date: '2026-01-01' }] },
        ])
        expect(formatDate('2026-10-05')).toBe('October 5, 2026')
    })

    test('shipped releases are well formed', () => {
        releases.forEach((release) => {
            expect(release.version).toMatch(/^\d+\.\d+$/)
            expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        })
    })

    test('formats the date suffix of a version', () => {
        expect(formatVersionDate('4.2.0-20261005')).toBe('October 5, 2026')
        expect(formatVersionDate('4.2.0')).toBeNull()
        expect(formatVersionDate('4.2.0-20261345')).toBeNull()
        expect(formatVersionDate(undefined)).toBeNull()
    })

    test('a newer app version than the last viewed one is an update', () => {
        expect(isNewerVersion('v1.0.0', null)).toBe(true)
        expect(isNewerVersion('v1.1.0', 'v1.0.0')).toBe(true)
        expect(isNewerVersion('v1.0.0', 'v1.0.0')).toBe(false)
        expect(isNewerVersion('v1.0.0', 'v1.1.0')).toBe(false)
        expect(isNewerVersion(undefined, null)).toBe(false)
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
