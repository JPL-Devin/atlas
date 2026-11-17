import { test, expect } from '@playwright/test'
import { fromJS } from 'immutable'
import { getAppConfig } from '../../src/core/appConfig'

let reducers

test.beforeAll(() => {
    global.window = { APP_CONFIG: { APP_INSTANCE: 'atlas' } }
    reducers = require('../../src/core/redux/reducers/reducers').default
})

test.afterAll(() => {
    delete global.window
})

for (const instance of ['atlas', 'raws']) {
    test.describe(instance, () => {
        test.beforeEach(() => {
            window.APP_CONFIG.APP_INSTANCE = instance
        })

        test('allows adding filters and configures advanced filters per instance', () => {
            expect(getAppConfig().enableAddFilters).toBe(true)
            expect(getAppConfig().enableAdvancedFilters).toBe(instance === 'atlas')
        })

        for (const type of ['basic', 'advanced', '', 'invalid']) {
            test(`normalizes filter type ${JSON.stringify(type)}`, () => {
                const state = fromJS({ filterType: 'advanced' })
                const next = reducers(state, { type: 'SET_FILTER_TYPE', payload: { type } })
                expect(next.get('filterType')).toBe(
                    instance === 'atlas' && type === 'advanced' ? 'advanced' : 'basic'
                )
            })
        }

        for (const modal of ['advancedFilter', 'advancedFilterReturn', 'addFilter', null]) {
            test(`guards modal ${modal}`, () => {
                const state = fromJS({ modals: {
                    advancedFilter: true, advancedFilterReturn: true, addFilter: false,
                } })
                const next = reducers(state, { type: 'SET_MODAL', payload: { modal } })
                for (const key of ['advancedFilter', 'advancedFilterReturn', 'addFilter']) {
                    expect(next.getIn(['modals', key])).toBe(
                        key === modal && (instance === 'atlas' || key === 'addFilter')
                    )
                }
            })
        }
    })
}
