import { test, expect } from '@playwright/test'

import { getVersionQuery, getVersionOptions } from '../../src/core/recordVersions'

const lid = 'urn:nasa:pds:mesh:data:product.obj'
const uri = 'atlas:pds4:mission:spacecraft:/mesh/data/product01.obj'
const lidvid = `${lid}::1.0`
const hit = (version, fileUri, productLid = lid) => ({
    _source: { uri: fileUri, pds4_label: { lidvid: `${productLid}::${version}` } },
})

test('queries the complete product LID and groups files by LIDVID', () => {
    const query = getVersionQuery(lidvid, uri)
    expect(query.query.bool.filter).toEqual([
        { prefix: { 'pds4_label.lidvid.keyword': `${lid}::` } },
    ])
    expect(query.collapse).toEqual({ field: 'pds4_label.lidvid.keyword' })
    expect(query.size).toBeGreaterThan(10)
    expect(query.query.bool.should).toContainEqual({
        term: { uri: { value: uri, boost: 2 } },
    })
    expect(query.query.bool.should).toContainEqual({
        wildcard: { uri: { value: '*.obj', case_insensitive: true } },
    })
    expect(query.sort).toEqual(['_score', { release_id_num: 'desc' }, { uri: 'asc' }])
})

test('file type preference accepts both uppercase and lowercase extensions', () => {
    for (const extension of ['IMG', 'img', 'Img']) {
        const query = getVersionQuery(lidvid, uri.replace('.obj', `.${extension}`))
        expect(query.query.bool.should).toContainEqual({
            wildcard: { uri: { value: `*.${extension}`, case_insensitive: true } },
        })
    }
})

test('one version with several files yields one choice pointing to the open file', () => {
    const versions = getVersionOptions(
        [
            hit('1.0', uri.replace('.obj', '.mtl')),
            hit('1.0', uri),
            hit('1.0', uri.replace('.obj', '.IMG')),
        ],
        lidvid,
        uri
    )
    expect(versions).toEqual([
        { uri, name: 'product01.obj', version: 'Version 1.0', versionRaw: '1.0' },
    ])
})

test('deduplicates versions and retains the ranked navigation target for other versions', () => {
    const newerUri = uri.replace('01.obj', '02.obj')
    const versions = getVersionOptions(
        [
            hit('2.0', newerUri),
            hit('2.0', newerUri.replace('.obj', '.mtl')),
            hit('1.0', uri.replace('.obj', '.IMG')),
            hit('1.0', uri),
        ],
        lidvid,
        uri
    )
    expect(versions.map((v) => [v.versionRaw, v.uri])).toEqual([
        ['2.0', newerUri],
        ['1.0', uri],
    ])
})

test('excludes sibling products and incomplete hits', () => {
    const versions = getVersionOptions(
        [
            hit('2.0', '/sibling.IMG', lid.replace('.obj', '.img')),
            hit('3.0', '/suffix.obj', `${lid}_other`),
            hit('', '/bad.obj'),
            hit('4.0', undefined),
            {},
        ],
        lidvid,
        uri
    )
    expect(versions.map((v) => v.versionRaw)).toEqual(['1.0'])
})

test('orders major and minor version components numerically', () => {
    const versions = getVersionOptions(
        ['1.9', '1.10', '2.0', '10.0'].map((v) => hit(v, `/product-${v}.obj`)),
        lidvid,
        uri
    )
    expect(versions.map((v) => v.versionRaw)).toEqual(['10.0', '2.0', '1.10', '1.9', '1.0'])
})

test('keeps the current version even when omitted from the search results', () => {
    expect(getVersionOptions([], lidvid, uri).map((v) => v.uri)).toEqual([uri])
    expect(getVersionOptions(undefined, lidvid, uri).map((v) => v.uri)).toEqual([uri])
})

test('does not query or build choices without a product version and URI', () => {
    for (const [value, fileUri] of [
        [undefined, uri],
        [lid, uri],
        [lidvid, undefined],
    ]) {
        expect(getVersionQuery(value, fileUri)).toBeNull()
        expect(getVersionOptions([], value, fileUri)).toEqual([])
    }
})
