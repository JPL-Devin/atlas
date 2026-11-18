import { test, expect } from '@playwright/test'
import { getAppConfig } from '../../src/core/appConfig'

for (const instance of ['atlas', 'raws']) {
    test(`${instance} filter capabilities`, () => {
        const previousWindow = global.window
        global.window = { APP_CONFIG: { APP_INSTANCE: instance } }
        try {
            expect(getAppConfig().enableAddFilters).toBe(true)
            expect(getAppConfig().enableAdvancedFilters).toBe(instance === 'atlas')
            expect(getAppConfig().addFilterButtonVariant).toBe(
                instance === 'atlas' ? 'contained' : 'text'
            )
        } finally {
            if (previousWindow === undefined) {
                delete global.window
            } else {
                global.window = previousWindow
            }
        }
    })
}
