import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

import { HASH_PATHS } from '../../../../core/constants'
import {
    RESULT_NAV_VARIANTS,
    RESULT_NAV_STATES,
    RESULT_NAV_FIXTURE,
    getFixtureResult,
} from './resultNavFixtures'

// Simulated latency for fetching the next page of results.
const MOCK_PAGE_LOAD_MS = 1500

const ResultNavMockupContext = createContext(null)

// `?resultNav=a|b|c` turns the mockup on; `&resultNavState=<preset>` picks its starting state.
export const readResultNavParams = (search) => {
    const params = new URLSearchParams(search)
    const variant = (params.get('resultNav') || '').toLowerCase()
    if (!RESULT_NAV_VARIANTS.includes(variant)) {
        return null
    }
    const state = params.get('resultNavState')
    return { variant, state: RESULT_NAV_STATES[state] ? state : 'middle' }
}

export const ResultNavMockupProvider = (props) => {
    const { initial, children } = props

    const navigate = useNavigate()

    const initialPreset = RESULT_NAV_STATES[initial?.state || 'middle']
    const [variant, setVariant] = useState(initial?.variant || null)
    const [preset, setPreset] = useState(initial?.state || 'middle')
    const [index, setIndex] = useState(initialPreset.index)
    const [loaded, setLoaded] = useState(initialPreset.loaded)
    const [loadingNext, setLoadingNext] = useState(initialPreset.loadingNext === true)
    const loadTimer = useRef(null)

    const applyPreset = (key) => {
        const p = RESULT_NAV_STATES[key]
        clearTimeout(loadTimer.current)
        setPreset(key)
        setIndex(p.index)
        setLoaded(p.loaded)
        setLoadingNext(p.loadingNext === true)
    }

    useEffect(() => () => clearTimeout(loadTimer.current), [])

    const value = useMemo(() => {
        if (variant == null) {
            return { enabled: false }
        }

        const controls = { variant, setVariant, preset, applyPreset }
        if (index == null) {
            return { enabled: true, controls, nav: null }
        }

        const { total, pageSize } = RESULT_NAV_FIXTURE
        const hasMore = loaded < total
        const isLastLoaded = index === loaded - 1
        const nav = {
            variant,
            index,
            total,
            loaded,
            hasMore,
            loadingNext,
            current: getFixtureResult(index),
            prev: index > 0 ? getFixtureResult(index - 1) : null,
            // Beyond the loaded page there is no neighbor to preview yet.
            next: index < loaded - 1 ? getFixtureResult(index + 1) : null,
            canPrev: index > 0,
            canNext: (index < loaded - 1 || hasMore) && !loadingNext,
            goPrev: () => {
                if (index > 0) {
                    clearTimeout(loadTimer.current)
                    setLoadingNext(false)
                    setIndex(index - 1)
                }
            },
            goNext: () => {
                if (loadingNext) {
                    return
                }
                if (!isLastLoaded) {
                    setIndex(index + 1)
                } else if (hasMore) {
                    setLoadingNext(true)
                    loadTimer.current = setTimeout(() => {
                        setLoaded(Math.min(loaded + pageSize, total))
                        setIndex(index + 1)
                        setLoadingNext(false)
                    }, MOCK_PAGE_LOAD_MS)
                }
            },
            backToResults: () => navigate(HASH_PATHS.search),
        }
        return { enabled: true, controls, nav }
    }, [variant, preset, index, loaded, loadingNext, navigate])

    return (
        <ResultNavMockupContext.Provider value={value}>{children}</ResultNavMockupContext.Provider>
    )
}

ResultNavMockupProvider.propTypes = {
    initial: PropTypes.shape({
        variant: PropTypes.string,
        state: PropTypes.string,
    }),
    children: PropTypes.node,
}

// The active result context, or null when there is none to navigate (buttons hidden).
export const useResultNav = () => useContext(ResultNavMockupContext)?.nav || null

export const useResultNavControls = () => useContext(ResultNavMockupContext)?.controls || null
