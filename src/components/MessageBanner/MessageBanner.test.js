import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import MessageBanner from './MessageBanner'
import * as runtimeConfig from '../../core/runtimeConfig'

describe('MessageBanner', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('renders nothing when banner message is empty', () => {
        jest.spyOn(runtimeConfig, 'getBannerMessage').mockReturnValue('')
        const { container } = render(<MessageBanner />)
        expect(container.firstChild).toBeNull()
    })

    it('renders the banner message when set', () => {
        jest.spyOn(runtimeConfig, 'getBannerMessage').mockReturnValue(
            'Scheduled maintenance tonight.'
        )
        render(<MessageBanner />)
        expect(screen.getByText('Scheduled maintenance tonight.')).toBeInTheDocument()
    })

    it('renders nothing when message is undefined', () => {
        jest.spyOn(runtimeConfig, 'getBannerMessage').mockReturnValue(undefined)
        const { container } = render(<MessageBanner />)
        expect(container.firstChild).toBeNull()
    })

    it('has correct background gradient style', () => {
        jest.spyOn(runtimeConfig, 'getBannerMessage').mockReturnValue('Test message')
        render(<MessageBanner />)
        const banner = screen.getByText('Test message')
        expect(banner).toHaveStyle('color: #700000')
    })
})
