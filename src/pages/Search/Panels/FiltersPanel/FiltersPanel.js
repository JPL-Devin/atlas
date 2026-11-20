import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import {
    setModal,
    setFilterType,
    setWorkspace,
    copyToClipboardAction,
} from '../../../../core/redux/actions/actions.js'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CloseIcon from '@mui/icons-material/Close'

import FilterList from './subcomponents/FilterList/FilterList'
import AdvancedFilter from './subcomponents/AdvancedFilter/AdvancedFilter'
import { PresetIndicator, PresetReset, PresetUndo } from './PresetControls'

import MenuButton from '../../../../components/MenuButton/MenuButton'

import { getAppConfig } from '../../../../core/appConfig'
import { makeStyles } from '@mui/styles'

const useStyles = makeStyles((theme) => ({
    FiltersPanel: {
        height: '100%',
        minWidth: 0,
        transition: 'width 0.4s ease-out',
        overflow: 'hidden',
        position: 'relative',
        background: theme.palette.swatches.grey.grey150,
        boxSizing: 'border-box',
        borderRight: `1px solid ${theme.palette.swatches.grey.grey300}`,
    },
    contents: {
        width: '100%', //`calc(100% - ${theme.spacing(2)})`,
        height: '100%', //`calc(100% - ${theme.spacing(4)})`,
        margin: 0, //`${theme.spacing(2)} ${theme.spacing(1)}`,
        display: 'flex',
        flexFlow: 'column',
    },
    content: {
        overflowY: 'auto',
        flex: 1,
    },
    sheet: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100% !important',
        maxWidth: '100vw',
        // Stops above the mobile bottom bar so the view switcher stays usable
        height: 'calc(100% - 48px)',
        zIndex: theme.zIndex.drawer + 100,
    },
    heading: {
        background: theme.palette.swatches.grey.grey100,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    },
    headingRow: {
        width: '100%',
        height: theme.headHeights[1],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    titleGroup: {
        display: 'flex',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        paddingLeft: '12px',
        fontSize: '16px',
        fontWeight: 500,
        lineHeight: '34px',
        color: theme.palette.text.primary,
        whiteSpace: 'nowrap',
        [theme.breakpoints.down('md')]: {
            paddingLeft: 0,
        },
    },
    close: {
        width: 40,
        height: 40,
        margin: '0 4px',
        fontSize: '20px',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
    },
    addFilter: {
        'color': theme.palette.text.secondary,
        'fontSize': '11px',
        'lineHeight': '11px',
        'padding': '4px 0px',
        'margin': '7px',
        [theme.breakpoints.down('md')]: {
            '&::before': {
                content: '""',
                position: 'absolute',
                insetInline: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                height: 40,
            },
        },
        '& .MuiButton-endIcon': {
            marginTop: '-2px',
            marginLeft: '3px',
        },
    },
    buttonMore: {
        '& .MuiIconButton-root': {
            color: theme.palette.swatches.grey.grey600,
            fontSize: '21px',
        },
        'marginRight': '4px',
    },
}))

const FILTER_TYPES = {
    basic: 'Basic Filters',
    advanced: 'Advanced Filters',
}

const FiltersPanel = (props) => {
    const { mobile, ready } = props
    const c = useStyles()
    const dispatch = useDispatch()

    const w = useSelector((state) => {
        return state.getIn(['workspace', 'main'])
    }).toJS()

    // 'basic' || 'advanced
    const filterType = useSelector((state) => {
        return state.getIn(['filterType'])
    })

    const handleMenuChange = (option) => {
        switch (option) {
            case FILTER_TYPES.advanced:
                dispatch(setFilterType('advanced'))
                break
            case FILTER_TYPES.basic:
                // Users need to go through this warning modal to return to basic filters
                dispatch(setModal('advancedFilterReturn'))
                break
            case 'Copy Query':
                dispatch(copyToClipboardAction('DSL'))
                break
            case 'Copy Python Command':
                dispatch(copyToClipboardAction('Python'))
                break
            case 'Copy CURL Command':
                dispatch(copyToClipboardAction('CURL'))
                break
            case 'Copy Node Fetch Command':
                dispatch(copyToClipboardAction('Fetch'))
                break
            default:
                break
        }
    }

    // A sheet over the results on phones, a sidebar otherwise
    if (mobile && !w.mobileFilters) return null

    let width = 0
    if (mobile) width = '100%'
    else width = w.filters ? (filterType === 'basic' ? w.filtersSize : w.advancedFiltersSize) : 0

    const style = {
        width,
    }
    // A collapsed sidebar keeps its controls out of the tab and accessibility trees
    if (width == 0) {
        style.border = 'unset'
        style.visibility = 'hidden'
    }

    return (
        <div className={clsx(c.FiltersPanel, { [c.sheet]: mobile })} style={style}>
            <div className={c.contents}>
                <div className={c.heading} role="group" aria-label="Filter controls">
                    <div className={c.headingRow}>
                        <div className={c.titleGroup}>
                            {mobile && (
                                <IconButton
                                    className={c.close}
                                    aria-label="close filters"
                                    onClick={() => dispatch(setWorkspace({ ...w, mobileFilters: false }))}
                                >
                                    <CloseIcon fontSize="inherit" />
                                </IconButton>
                            )}
                            <h2 className={c.title}>{filterType === 'basic' ? 'Filters' : FILTER_TYPES[filterType]}</h2>
                        </div>
                        <div className={c.right}>
                            {ready && filterType === 'basic' && <PresetUndo />}
                            <PresetReset disabled={!ready} />
                            {filterType === 'basic' && getAppConfig().enableAddFilters && (
                                <Button
                                    className={c.addFilter}
                                    aria-label="add filter"
                                    size="small"
                                    onClick={() => dispatch(setModal('addFilter'))}
                                    variant="contained"
                                    endIcon={<AddIcon />}
                                >
                                    Add
                                </Button>
                            )}
                            <div className={c.buttonMore}>
                                <MenuButton
                                    options={[
                                        FILTER_TYPES.basic,
                                        FILTER_TYPES.advanced,
                                        '-',
                                        'Copy Query',
                                        'Copy Python Command',
                                        'Copy CURL Command',
                                        'Copy Node Fetch Command',
                                    ]}
                                    checkboxIndices={[0, 1]}
                                    active={FILTER_TYPES[filterType]}
                                    buttonComponent={<MoreVertIcon fontSize="inherit" />}
                                    onChange={handleMenuChange}
                                />
                            </div>
                        </div>
                    </div>
                    {ready && filterType === 'basic' && <PresetIndicator />}
                </div>
                <div
                    className={c.content}
                    onScroll={(e) => {
                        const scrollTop = e.target.scrollTop

                        const rect = e.target.getBoundingClientRect()
                        const topEdge = rect.top
                        const bottomEdge = rect.height + rect.top

                        const pRect = e.target.parentElement.getBoundingClientRect()
                        const pTopEdge = pRect.top

                        const allStickyHeaders = e.target.querySelectorAll('.stickyHeader')
                        allStickyHeaders.forEach((element) => {
                            const sPRect = element.parentElement.getBoundingClientRect()
                            const sPTopEdge = sPRect.top
                            const sPBottomEdge = sPRect.height + sPRect.top
                            // If the sticky header parent element overlaps the panels tops
                            if (
                                element.classList.contains('Mui-expanded') &&
                                sPBottomEdge > topEdge &&
                                sPTopEdge < topEdge
                            ) {
                                element.style.position = 'absolute'
                                element.style.top = `${topEdge - pTopEdge}px`
                                element.style.width = `${sPRect.width}px`
                            } else {
                                element.style.position = 'relative'
                                element.style.top = 'unset'
                                element.style.width = 'unset'
                            }
                        })
                    }}
                >
                    {ready && (filterType === 'advanced' ? <AdvancedFilter /> : <FilterList />)}
                </div>
            </div>
        </div>
    )
}

FiltersPanel.propTypes = {
    mobile: PropTypes.bool,
    ready: PropTypes.bool,
}

export default FiltersPanel
