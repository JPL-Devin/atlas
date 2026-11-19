import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

import Filter from '../../../../../../components/Filter/Filter'
import { HASH_PATHS } from '../../../../../../core/constants'
import { setExpandedFilter } from '../../../../../../core/redux/actions/actions'
import { PRESET_PARAM } from '../../../../../../config/filterPresets'
import { hasFilterValue } from '../../../../../../core/searchPresetState'
import { getFilterDisplayGroups } from '../../../../../../facets/filterDisplayOrder'
import { usePresetFilterKeys } from '../../PresetControls'
import { makeStyles } from '@mui/styles'

const useStyles = makeStyles((theme) => ({
    FilterList: {
        height: '100%',
        transition: 'width 0.4s ease-out',
    },
    groupHeader: {
        padding: '5px 16px 5px',
        fontSize: '11px',
        fontWeight: 700,
        lineHeight: '13px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey300}`,
        color: theme.palette.swatches.blue.blue900,
        background: theme.palette.swatches.grey.grey150,
    },
}))

const GROUP_DISPLAY_NAMES = {
    common: 'Common',
    archive: 'Archive',
    machine_learning: 'Machine Learning',
    ancillary: 'Ancillary',
    time: 'Time',
    flyby_missions: 'Flyby Missions',
    pds_archive: 'PDS Archive',
    pds4_label: 'PDS4 Label',
    pds3_label: 'PDS3 Label',
}

const getSearchURL = (activeFilters, presetId) => {
    const params = presetId ? [`${PRESET_PARAM}=${encodeURIComponent(presetId)}`] : []
    Object.keys(activeFilters).forEach((filter) => {
        let values = []
        if (activeFilters[filter].facets) {
            activeFilters[filter].facets.forEach((f, idx) => {
                switch (f.type) {
                    case 'query_string':
                        if (f.state && f.state.input) values.push(encodeURIComponent(f.state.input))
                        break
                    case 'text':
                        if (f.state && (f.state.input || f.state.text))
                            values.push(encodeURIComponent(f.state.input || f.state.text))
                        break
                    case 'keyword':
                        if (f.state)
                            Object.keys(f.state).forEach((s) => {
                                if (f.state[s] === true) values.push(encodeURIComponent(s))
                            })
                        break
                    case 'input_range':
                    case 'slider_range':
                        if (
                            f.state &&
                            f.state.range &&
                            Array.isArray(f.state.range) &&
                            (f.state.range[0] != null || f.state.range[1] != null)
                        ) {
                            const min = f.state.range[0] != null ? f.state.range[0] : ''
                            const max = f.state.range[1] != null ? f.state.range[1] : ''
                            values.push(`${encodeURIComponent(min)}_to_${encodeURIComponent(max)}`)
                        }
                        break
                    case 'date_range':
                        if (
                            f.state &&
                            f.state.daterange &&
                            (f.state.daterange.start || f.state.daterange.end)
                        ) {
                            const start = f.state.daterange.start || ''
                            const end = f.state.daterange.end || ''
                            values.push(`${encodeURIComponent(start)}_to_${encodeURIComponent(end)}`)
                        }
                        break
                    default:
                        break
                }
            })
        }
        if (values.length > 0) params.push(`${filter}=${values.join(',')}`)
    })
    let paramString = ''
    if (params.length > 0) {
        paramString = `?${params.join('&')}`
    }
    return HASH_PATHS.search + paramString
}

const FilterList = (props) => {
    const c = useStyles()

    const navigate = useNavigate()
    const location = useLocation()

    const dispatch = useDispatch()
    const presetId = useSelector((state) => state.get('searchPresetId'))
    const { preset, keys: presetKeys } = usePresetFilterKeys()
    const expandedFilter = useSelector((state) => state.get('expandedFilter'))
    const activeFilters = useSelector((state) => {
        return state.getIn(['activeFilters'])
    }).toJS()
    const desiredSearchUrl = getSearchURL(activeFilters, presetId)
    useEffect(() => {
        if (location.pathname + location.search !== desiredSearchUrl || location.state?.fromHome) {
            navigate(desiredSearchUrl, { replace: true })
        }
    }, [desiredSearchUrl, location.pathname, location.search, location.state, navigate])

    const groups = getFilterDisplayGroups(Object.keys(activeFilters), (key) => activeFilters[key].order)

    const renderFilter = (filterKey, idx) => (
        <Filter
            key={filterKey}
            filterKey={filterKey}
            filter={activeFilters[filterKey]}
            presetTag={preset?.add.includes(filterKey) ? 'In layout' :
                preset && !presetKeys.includes(filterKey) && hasFilterValue(activeFilters[filterKey]) ? 'Kept · has value' : undefined}
            expanded={expandedFilter === filterKey}
            onExpand={() => {
                dispatch(setExpandedFilter(expandedFilter === filterKey ? null : filterKey))
            }}
        />
    )

    return (
        <div className={c.FilterList}>
            {groups.map(([group, keys]) => group === null ? renderFilter('_text') : (
                <div key={group}>
                    <div className={c.groupHeader}>
                        {GROUP_DISPLAY_NAMES[group] ?? group.replace(/_/g, ' ')}
                    </div>
                    {keys.map(renderFilter)}
                </div>
            ))}
        </div>
    )
}

FilterList.propTypes = {}

export default FilterList
