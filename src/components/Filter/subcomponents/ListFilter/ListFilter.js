import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import PropTypes from 'prop-types'

import clsx from 'clsx'

import Checkbox from '@mui/material/Checkbox'
import Skeleton from '@mui/material/Skeleton'

import { setFieldState } from '../../../../core/redux/actions/actions.js'
import { getDisplayName, getShortDisplayName, facetsStatuses } from '../../../../core/constants.js'
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
    listStale: {
        opacity: 0.5,
        transition: 'opacity 0.2s ease-out',
    },
    placeholderItem: {
        padding: `0px ${theme.spacing(2)}`,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        height: '24px',
    },
    placeholderText: {
        flex: 1,
    },
    listItemZero: {
        opacity: 0.4,
    },
    checkbox: {
        borderRadius: 0,
    },
    label: {
        display: 'flex',
        flex: 1,
        minWidth: 0,
        lineHeight: '26px',
        marginLeft: '8px',
    },
    name: {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        padding: '0px 2px',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    count: {
        flexShrink: 0,
        padding: '0px 2px',
        fontSize: 12,
        color: theme.palette.swatches.grey.grey400,
    },
    noData: {
        width: '100%',
        padding: '4px 0px',
        fontSize: '13px',
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

// Shown while a filter's first values load
const PLACEHOLDER_WIDTHS = ['60%', '45%', '70%', '50%', '40%']

const ListFilter = (props) => {
    const { filterKey, facetId } = props
    const c = useStyles()

    const dispatch = useDispatch()
    let facet = useSelector((state) => {
        return state.getIn(['activeFilters', filterKey, 'facets', facetId])
    })
    facet = facet ? facet.toJS() : {}
    const facetsStatus = useSelector((state) => state.getIn(['facetsStatus', filterKey]))

    const visibleFields = (facet.fields || []).filter((field) => field.doc_count > 0)
    // Values from a previous search are shown dimmed until this search's counts arrive
    const isStale = facetsStatus == null || facetsStatus === facetsStatuses.LOADING

    let emptyMessage = null
    if (facetsStatus === facetsStatuses.LOADED || facetsStatus === facetsStatuses.TIMED_OUT) {
        emptyMessage = facet.fields?.length
            ? 'No values match the current search.'
            : 'No values available for this filter.'
    }

    return (
        <div className={c.ListFilter}>
            <ul className={clsx(c.list, { [c.listStale]: isStale && visibleFields.length > 0 })}>
                {visibleFields.length > 0
                    ? visibleFields.map((field, idx) => {
                          const long = getDisplayName(field.key)
                          return (
                              <li
                                  className={c.listItem}
                                  key={idx}
                                  onClick={() => {
                                      dispatch(
                                          setFieldState(filterKey, facetId, {
                                              [field.key]: !getIn(
                                                  facet,
                                                  ['state', field.key],
                                                  false
                                              ),
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
                                      <div className={c.name} title={long}>
                                          {getShortDisplayName(field.key)}
                                      </div>
                                      <div className={c.count}>({field.doc_count})</div>
                                  </span>
                              </li>
                          )
                      })
                    : facetsStatus === facetsStatuses.LOADING
                      ? PLACEHOLDER_WIDTHS.map((width, idx) => (
                            <li className={c.placeholderItem} key={idx} aria-hidden="true">
                                <Skeleton variant="rectangular" width={18} height={18} />
                                <Skeleton className={c.placeholderText} sx={{ maxWidth: width }} />
                                <Skeleton width={24} />
                            </li>
                        ))
                      : emptyMessage && <li className={c.noData}>{emptyMessage}</li>}
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
