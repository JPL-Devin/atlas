import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { styled } from '@mui/material/styles'
import PropTypes from 'prop-types'

import {
    setModal,
    removeActiveFilters,
    clearResults,
    search,
    setFieldState,
} from '../../core/redux/actions/actions.js'

import MuiAccordion from '@mui/material/Accordion'
import MuiAccordionSummary from '@mui/material/AccordionSummary'
import MuiAccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Badge from '@mui/material/Badge'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SettingsIcon from '@mui/icons-material/Settings'
import SearchIcon from '@mui/icons-material/Search'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CloseIcon from '@mui/icons-material/Close'
import ClearAllIcon from '@mui/icons-material/ClearAll'

import InputFilter from './subcomponents/InputFilter/InputFilter'
import ListFilter from './subcomponents/ListFilter/ListFilter'
import SliderRangeFilter from './subcomponents/SliderRangeFilter/SliderRangeFilter'
import InputRangeFilter from './subcomponents/InputRangeFilter/InputRangeFilter'
import DateRangeFilter from './subcomponents/DateRangeFilter/DateRangeFilter'

const Accordion = styled(MuiAccordion)({
    'boxShadow': 'none',
    '&:not(:last-child)': {
        borderBottom: 0,
    },
    '&:before': {
        display: 'none',
    },
    '&.Mui-expanded': {
        margin: 'auto',
    },
    'position': 'inherit',
    'overflow': 'hidden',
    'borderRadius': '0 !important',
})

const AccordionSummary = styled(MuiAccordionSummary)(({ theme }) => ({
    'borderBottom': `1px solid ${theme.palette.swatches.grey.grey200}`,
    'height': theme.headHeights[2],
    'minHeight': theme.headHeights[2],
    'flexDirection': 'row-reverse',
    'background': theme.palette.swatches.grey.grey100,
    'color': theme.palette.text.primary,
    'boxSizing': 'border-box',
    'zIndex': 2,
    'borderLeft': '2px solid rgba(0,0,0,0)',
    'borderRight': `1px solid ${theme.palette.swatches.grey.grey200}`,
    'transition': 'unset',
    'alignItems': 'flex-start',
    '&:hover': {
        background: theme.palette.swatches.grey.grey150,
    },
    '&.Mui-expanded': {
        minHeight: theme.headHeights[2],
        background: theme.palette.swatches.grey.grey150,
        borderLeft: `4px solid ${theme.palette.swatches.yellow.yellow600}`,
    },
    '& .MuiAccordionSummary-content': {
        'margin': '4px 0',
        '&.Mui-expanded': {
            height: '100%',
            margin: '4px 0',
        },
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
        margin: '0px 0px 0px -12px',
        color: theme.palette.swatches.grey.grey700,
        overflow: 'hidden',
        padding: '9px 12px',
        alignItems: 'center',
        height: '100%',
        color: theme.palette.swatches.grey.grey900,
    },
}))

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: `${theme.spacing(2)} 0px`,
    background: theme.palette.swatches.grey.grey0,
    boxShadow: `inset 2px 2px 3px 0px rgba(0,0,0,0.12)`,
    flexFlow: 'column',
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    borderRight: `1px solid ${theme.palette.swatches.grey.grey200}`,
    borderLeft: `4px solid ${theme.palette.swatches.yellow.yellow600}`,
}))

const FilterTitle = styled(Typography)({
    fontWeight: 400,
    lineHeight: '30px',
    textTransform: 'capitalize',
    maxWidth: '190px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    letterSpacing: '0.00938em',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
})

const HeaderDiv = styled('div')({
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    marginLeft: '8px',
})

const SettingsButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    'fontSize': 16,
    'padding': '7px',
    'color': theme.palette.swatches.grey.grey400,
    'borderRadius': '3px',
    'transition': 'color 0.2s ease-out, background 0.2s ease-out',
    '&:hover': {
        background: theme.palette.accent.main,
        color: theme.palette.text.secondary,
    },
    ...(isActive && {
        background: theme.palette.accent.main,
        color: theme.palette.text.secondary,
    }),
}))

const InfoButton = styled(IconButton)(({ theme }) => ({
    'fontSize': 16,
    'padding': '7px',
    'color': theme.palette.swatches.grey.grey400,
    'borderRadius': '3px',
    'transition': 'color 0.2s ease-out, background 0.2s ease-out',
    '&:hover': {
        background: theme.palette.accent.main,
        color: theme.palette.text.secondary,
    },
}))

const RemoveButton = styled(IconButton)(({ theme }) => ({
    'fontSize': 16,
    'padding': '7px',
    'color': theme.palette.swatches.grey.grey400,
    'borderRadius': '3px',
    'transition': 'color 0.2s ease-out, background 0.2s ease-out',
    '&:hover': {
        background: theme.palette.swatches.red.red500,
        color: theme.palette.text.secondary,
    },
}))

const ClearButton = styled(IconButton)(({ theme }) => ({
    'fontSize': 16,
    'padding': '7px',
    'color': theme.palette.swatches.grey.grey400,
    'borderRadius': '3px',
    'transition': 'color 0.2s ease-out, background 0.2s ease-out',
    '&:hover': {
        background: theme.palette.swatches.orange.orange500,
        color: theme.palette.text.secondary,
    },
}))

const CountBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        background: theme.palette.swatches.red.red500,
        color: theme.palette.text.secondary,
        right: -12,
        top: 15,
        border: `2px solid ${theme.palette.swatches.grey.grey100}`,
        padding: '0px 4px 0px 3px',
    },
}))

const FilterDownWrapper = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    left: '-41px',
    width: 'calc(100% + 50px)',
})

const FilterDownField = styled(TextField)(({ theme }) => ({
    'flex': 1,
    'height': '40px',
    '& > div': {
        height: '40px',
    },
    '& .MuiFilledInput-input': {
        paddingTop: '9px',
    },
    '& .MuiInputAdornment-positionStart': {
        marginTop: '3px !important',
    },
    '& .MuiFilledInput-underline:after': {
        borderBottom: `2px solid ${theme.palette.accent.main}`,
    },
}))

const FilterDownSubmit = styled(IconButton)(({ theme }) => ({
    'height': '40px',
    'width': '32px',
    'background': theme.palette.accent.main,
    'color': theme.palette.text.secondary,
    'fontSize': '16px',
    'position': 'absolute',
    'right': '0px',
    '&:hover': {
        background: theme.palette.swatches.blue.blue600,
    },
}))

const FilterDownClear = styled(IconButton)({
    position: 'absolute',
    height: '40px',
    width: '38px',
    right: '32px',
})

const FilterDownCount = styled('div')(({ theme }) => ({
    position: 'absolute',
    right: '75px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: theme.palette.swatches.grey.grey600,
    padding: '2px 0px',
    fontSize: '11px',
    minWidth: '40px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
}))

const AccordionHead = styled(AccordionSummary, {
    shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ isOpen }) => ({
    '& > div:first-of-type': {
        display: 'flex',
        flexFlow: 'column',
        transition: 'unset',
    },
    '& > div:first-of-type > div:first-of-type': {
        transition: 'unset',
    },
    ...(isOpen && {
        'height': '80px',
        '& > div:first-of-type': {
            height: '80px',
            margin: '0px !important',
        },
        '& > div:first-of-type > div:first-of-type': {
            paddingTop: '4px',
        },
    }),
}))

const getSubFilters = (filter, filterKey, settingsActive) => {
    let subFilters = []

    filter.facets.forEach((facet, i) => {
        switch (facet.component) {
            case 'text':
                subFilters.push(
                    <InputFilter
                        key={i}
                        facetId={i}
                        filterKey={filterKey}
                        alone={false}
                        settingsActive={settingsActive}
                    />
                )
                break
            case 'number':
                subFilters.push(
                    <InputFilter
                        key={i}
                        facetId={i}
                        filterKey={filterKey}
                        alone={false}
                        type="number"
                        settingsActive={settingsActive}
                    />
                )
                break
            case 'list':
                subFilters.push(
                    <ListFilter
                        key={i}
                        facetId={i}
                        filterKey={filterKey}
                        alone={filter.facets.length === 1}
                        settingsActive={settingsActive}
                    />
                )
                break
            case 'slider_range':
                subFilters.push(
                    <SliderRangeFilter
                        key={i}
                        facetId={i}
                        filterKey={filterKey}
                        alone={filter.facets.length === 1}
                        settingsActive={settingsActive}
                    />
                )
                break
            case 'input_range':
                subFilters.push(
                    <InputRangeFilter
                        key={i}
                        facetId={i}
                        filterKey={filterKey}
                        alone={filter.facets.length === 1}
                        settingsActive={settingsActive}
                    />
                )
                break
            case 'date_range':
                subFilters.push(
                    <DateRangeFilter
                        key={i}
                        facetId={i}
                        filterKey={filterKey}
                        alone={filter.facets.length === 1}
                        settingsActive={settingsActive}
                    />
                )
                break
            default:
                console.warn(`Unknown facet type ${facet.component}.`)
                break
        }
    })
    return subFilters
}

const Filter = (props) => {
    const { filterKey, filter, onExpand, expanded } = props

    const dispatch = useDispatch()

    const [settingsActive, setSettingsActive] = useState(false)
    const [isFilterDownOpen, setIsFilterDownOpen] = useState(false)
    const [filterDownValue, setFilterDownValue] = useState('')
    const [maxFieldsCount, setMaxFieldsCount] = useState(0)

    const subFilters = getSubFilters(filter, filterKey, settingsActive)

    // Track the maximum number of fields seen for this facet
    useEffect(() => {
        const currentFieldsCount = filter.facets?.[0]?.fields?.length || 0
        if (currentFieldsCount > maxFieldsCount) {
            setMaxFieldsCount(currentFieldsCount)
        }
    }, [filter.facets?.[0]?.fields?.length, maxFieldsCount])

    // Hide delete button?
    let permanent = filterKey[0] === '_' ? true : false

    const handleSettings = (e) => {
        // stop expand/collapse
        e.stopPropagation()
        if (expanded) setSettingsActive(!settingsActive)
    }
    const handleFilterDown = (e) => {
        // stop expand/collapse
        e.stopPropagation()
        if (expanded) setIsFilterDownOpen(!isFilterDownOpen)
    }
    const handleFilterDownSubmit = (e, clearFilterDownValue) => {
        filter.facets.forEach((facet, i) => {
            dispatch(
                setFieldState(filterKey, i, {
                    __filter: clearFilterDownValue ? null : filterDownValue,
                })
            )
        })
    }
    const handleInfo = (e) => {
        // stop expand/collapse
        e.stopPropagation()

        dispatch(
            setModal('filterHelp', {
                filter,
                filterKey,
            })
        )
    }
    const handleRemove = (e) => {
        // stop expand/collapse
        e.stopPropagation()

        dispatch(removeActiveFilters(filterKey))
        dispatch(clearResults())
        dispatch(search(0, true))
    }

    const handleClearSelections = (e) => {
        // stop expand/collapse
        e.stopPropagation()

        // Clear the search filter input
        setFilterDownValue('')

        // Clear all selections in this facet by setting all state values to false/null
        filter.facets.forEach((facet, i) => {
            if (facet.state) {
                const clearedState = {}
                Object.keys(facet.state).forEach((key) => {
                    if (key === '__filter') {
                        clearedState[key] = null
                    } else {
                        clearedState[key] = false
                    }
                })
                dispatch(setFieldState(filterKey, i, clearedState))
            }
        })
    }

    const filterName = filter.display_name || filterKey

    // Turns a:b:c into ::c
    let friendlyFilterName = filterName.replaceAll('_', ' ')
    if (friendlyFilterName.includes(':'))
        friendlyFilterName = `${friendlyFilterName.replace(/[^:]/g, '')}${friendlyFilterName
            .split(':')
            .slice(-1)}`

    let count = 0
    if (filter.facets)
        filter.facets.forEach((f) => {
            if (f.state)
                Object.keys(f.state).forEach((key) => {
                    if (f.state[key] != false && f.state[key] != '' && f.state[key] != null) count++
                })
        })

    const isListFilter = filter?.facets?.[0]?.component === 'list'

    // Calculate filtered results count for filter down
    const getFilteredResultsInfo = () => {
        const currentFields = filter.facets?.[0]?.fields?.length || 0
        const totalFields = Math.max(maxFieldsCount, currentFields) // Use the max seen

        if (!filterDownValue || !isListFilter || currentFields === 0) {
            const totalDisplay = totalFields === 500 ? '500+' : totalFields.toString()
            return `${currentFields}/${totalDisplay}`
        }

        const searchTerm = filterDownValue.toLowerCase()
        const filteredCount = filter.facets[0].fields.filter((field) =>
            field.key.toLowerCase().includes(searchTerm)
        ).length

        const totalDisplay = totalFields === 500 ? '500+' : totalFields.toString()
        return `${filteredCount}/${totalDisplay}`
    }

    const filteredResultsDisplay = getFilteredResultsInfo()

    return (
        <div>
            <Accordion expanded={expanded}>
                <AccordionHead
                    isOpen={expanded && isFilterDownOpen}
                    expandIcon={<ExpandMoreIcon />}
                    onClick={onExpand}
                    role=""
                >
                    <HeaderDiv>
                        <CountBadge badgeContent={count}>
                            <Tooltip title={filterKey} arrow placement="right">
                                <FilterTitle>{friendlyFilterName}</FilterTitle>
                            </Tooltip>
                        </CountBadge>
                        <div>
                            {/*
                            {expanded && (
                                <Tooltip title="Settings" arrow>
                                    <IconButton
                                        className={clsx(c.settingsButton, {
                                            [c.settingsButtonActive]: settingsActive,
                                        })}
                                        aria-label={`show settings for ${filterName} filter`}
                                        size="small"
                                        onClick={handleSettings}
                                    >
                                        <SettingsIcon fontSize="inherit" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            */}
                            {expanded && isListFilter && (
                                <Tooltip title="Search" arrow>
                                    <SettingsButton
                                        isActive={isFilterDownOpen}
                                        aria-label={`search ${filterName} options`}
                                        size="small"
                                        onClick={handleFilterDown}
                                    >
                                        <SearchIcon fontSize="inherit" />
                                    </SettingsButton>
                                </Tooltip>
                            )}
                            <Tooltip title="Info" arrow>
                                <InfoButton
                                    aria-label={`information about ${filterName} filter`}
                                    size="small"
                                    onClick={handleInfo}
                                >
                                    <InfoOutlinedIcon fontSize="inherit" />
                                </InfoButton>
                            </Tooltip>
                            {count > 0 && (
                                <Tooltip title="Clear All Selections" arrow>
                                    <ClearButton
                                        aria-label={`clear all selections in ${filterName} filter`}
                                        size="small"
                                        onClick={handleClearSelections}
                                    >
                                        <ClearAllIcon fontSize="inherit" />
                                    </ClearButton>
                                </Tooltip>
                            )}
                            {!permanent ? (
                                <Tooltip title="Remove" arrow>
                                    <RemoveButton
                                        aria-label={`remove ${filterName} filter`}
                                        size="small"
                                        onClick={handleRemove}
                                    >
                                        <DeleteOutlinedIcon fontSize="inherit" />
                                    </RemoveButton>
                                </Tooltip>
                            ) : null}
                        </div>
                    </HeaderDiv>
                    {expanded && isFilterDownOpen && (
                        <FilterDownWrapper
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                        >
                            <FilterDownField
                                placeholder="Search (regex supported)"
                                value={filterDownValue}
                                variant="filled"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                                onChange={(e) => {
                                    setFilterDownValue(e.target.value)
                                }}
                                onKeyDown={(e) => {
                                    // Search when enter pressed
                                    if (e.keyCode == 13) handleFilterDownSubmit()
                                }}
                            />
                            {isListFilter && (
                                <FilterDownCount>{filteredResultsDisplay}</FilterDownCount>
                            )}
                            <FilterDownClear
                                aria-label="clear filter down"
                                onClick={() => {
                                    setFilterDownValue('')
                                    handleFilterDownSubmit(null, true)
                                }}
                                size="large"
                            >
                                <CloseIcon fontSize="inherit" />
                            </FilterDownClear>
                            <FilterDownSubmit
                                aria-label="submit filter down"
                                onClick={handleFilterDownSubmit}
                                size="large"
                            >
                                <ArrowForwardIcon fontSize="inherit" />
                            </FilterDownSubmit>
                        </FilterDownWrapper>
                    )}
                </AccordionHead>
                <AccordionDetails>{subFilters}</AccordionDetails>
            </Accordion>
        </div>
    )
}

Filter.propTypes = {
    filter: PropTypes.object.isRequired,
    filterKey: PropTypes.string.isRequired,
    onExpand: PropTypes.func.isRequired,
    expanded: PropTypes.bool,
}

export default Filter
