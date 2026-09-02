import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import PropTypes from 'prop-types'


import Checkbox from '@mui/material/Checkbox'
import { List as VirtualizedList, AutoSizer } from 'react-virtualized'

import { setFieldState } from '../../../../core/redux/actions/actions.js'
import { DISPLAY_NAME_MAPPINGS } from '../../../../core/constants.js'
import { getIn } from '../../../../core/utils.js'

const useStyles = makeStyles((theme) => ({
    ListFilter: {
        flex: '1',
    },
    list: {
        padding: 0, //Since the parent is already padded
        margin: 0,
        listStyleType: 'none',
    },
    listItem: {
        'padding': `0px ${theme.spacing(2)}`,
        'display': 'flex',
        'height': '24px',
        'lineHeight': '24px',
        'cursor': 'pointer',
        'transition': 'background 0.2s ease-out, opacity 0.4s ease-out',
        'textOverflow': 'ellipsis',
        'whiteSpace': 'nowrap',
        'overflow': 'hidden',
        '&:hover': {
            background: theme.palette.swatches.grey.grey150,
        },
    },
    listItemZero: {
        opacity: 0.4,
    },
    checkbox: {
        borderRadius: 0,
    },
    label: {
        display: 'flex',
        lineHeight: '26px',
        marginLeft: '8px',
    },
    name: {
        padding: '0px 2px',
    },
    count: {
        padding: '0px 2px',
        fontSize: 12,
        color: theme.palette.swatches.grey.grey400,
    },
    noData: {
        width: '100%',
        color: theme.palette.swatches.grey.grey600,
        textAlign: 'center',
    },
    moreResults: {
        textAlign: 'center',
        background: theme.palette.swatches.red.red500,
        color: theme.palette.swatches.grey.grey100,
        padding: '4px 0px',
    },
}))

const ROW_HEIGHT = 24
// Long facet lists render through a virtualized window instead of all at once.
const VIRTUALIZE_THRESHOLD = 100
const MAX_LIST_HEIGHT = ROW_HEIGHT * 16

const ListFilter = (props) => {
    const { filterKey, facetId } = props
    const c = useStyles()

    const dispatch = useDispatch()
    const facetImm = useSelector((state) => {
        return state.getIn(['activeFilters', filterKey, 'facets', facetId])
    })
    const facet = useMemo(() => (facetImm ? facetImm.toJS() : {}), [facetImm])

    const fields = useMemo(
        () => (facet.fields ? facet.fields.filter((field) => field.doc_count > 0) : null),
        [facet]
    )

    const renderRow = (field, idx, style) => (
        <li
            className={c.listItem}
            key={idx}
            style={style}
            onClick={() => {
                dispatch(
                    setFieldState(filterKey, facetId, {
                        [field.key]: !getIn(facet, ['state', field.key], false),
                    })
                )
            }}
        >
            <Checkbox
                className={c.checkbox}
                color="default"
                checked={getIn(facet, ['state', field.key], false)}
                size="small"
                title="Select"
                aria-label="select"
            />
            <span className={c.label}>
                <div className={c.name}>
                    {DISPLAY_NAME_MAPPINGS[field.key]
                        ? DISPLAY_NAME_MAPPINGS[field.key]
                        : field.key}
                </div>
                <div className={c.count}>({field.doc_count})</div>
            </span>
        </li>
    )

    return (
        <div className={c.ListFilter}>
            <ul className={c.list}>
                {fields == null ? (
                    <div className={c.noData}>No aggregation data</div>
                ) : fields.length > VIRTUALIZE_THRESHOLD ? (
                    <AutoSizer disableHeight>
                        {({ width }) => (
                            <VirtualizedList
                                width={width}
                                height={Math.min(fields.length * ROW_HEIGHT, MAX_LIST_HEIGHT)}
                                rowCount={fields.length}
                                rowHeight={ROW_HEIGHT}
                                rowRenderer={({ index, style }) =>
                                    renderRow(fields[index], index, style)
                                }
                            />
                        )}
                    </AutoSizer>
                ) : (
                    fields.map((field, idx) => renderRow(field, idx))
                )}
                {facet?.fields?.length >= 500 && (
                    <li className={c.moreResults}>Only showing the first 500 results.</li>
                )}
            </ul>
        </div>
    )
}

ListFilter.propTypes = {
    filterKey: PropTypes.string.isRequired,
    facetId: PropTypes.number.isRequired,
}

export default ListFilter
