import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { styled } from '@mui/material/styles'
import PropTypes from 'prop-types'

import clsx from 'clsx'

import Checkbox from '@mui/material/Checkbox'

import { setFieldState } from '../../../../core/redux/actions/actions.js'
import { DISPLAY_NAME_MAPPINGS } from '../../../../core/constants.js'
import { getIn } from '../../../../core/utils.js'

const ListFilterRoot = styled('div')({
    flex: '1',
})

const StyledList = styled('ul')({
    padding: 0,
    margin: 0,
    listStyleType: 'none',
})

const ListItem = styled('li', {
    shouldForwardProp: (prop) => prop !== 'isZero',
})(({ theme, isZero }) => ({
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
    ...(isZero && {
        opacity: 0.4,
    }),
}))

const StyledCheckbox = styled(Checkbox)({
    borderRadius: 0,
})

const LabelSpan = styled('span')({
    display: 'flex',
    lineHeight: '26px',
    marginLeft: '8px',
})

const NameDiv = styled('div')({
    padding: '0px 2px',
})

const CountDiv = styled('div')(({ theme }) => ({
    padding: '0px 2px',
    fontSize: 12,
    color: theme.palette.swatches.grey.grey400,
}))

const NoDataDiv = styled('div')(({ theme }) => ({
    width: '100%',
    color: theme.palette.swatches.grey.grey600,
    textAlign: 'center',
}))

const MoreResultsLi = styled('li')(({ theme }) => ({
    textAlign: 'center',
    background: theme.palette.swatches.red.red500,
    color: theme.palette.swatches.grey.grey100,
    padding: '4px 0px',
}))

const ListFilter = (props) => {
    const { filterKey, facetId } = props

    const dispatch = useDispatch()
    let facet = useSelector((state) => {
        return state.getIn(['activeFilters', filterKey, 'facets', facetId])
    })
    facet = facet ? facet.toJS() : {}

    return (
        <ListFilterRoot>
            <StyledList>
                {facet.fields ? (
                    facet.fields.map((field, idx) => (
                        <ListItem
                            isZero={field.doc_count === 0}
                            key={idx}
                            onClick={() => {
                                dispatch(
                                    setFieldState(filterKey, facetId, {
                                        [field.key]: !getIn(facet, ['state', field.key], false),
                                    })
                                )
                            }}
                        >
                            <StyledCheckbox
                                color="default"
                                checked={getIn(facet, ['state', field.key], false)}
                                size="small"
                                title="Select"
                                aria-label="select"
                            />
                            <LabelSpan>
                                <NameDiv>
                                    {DISPLAY_NAME_MAPPINGS[field.key]
                                        ? DISPLAY_NAME_MAPPINGS[field.key]
                                        : field.key}
                                </NameDiv>
                                <CountDiv>({field.doc_count})</CountDiv>
                            </LabelSpan>
                        </ListItem>
                    ))
                ) : (
                    <NoDataDiv>No aggregation data</NoDataDiv>
                )}
                {facet?.fields?.length >= 500 && (
                    <MoreResultsLi>Only showing the first 500 results.</MoreResultsLi>
                )}
            </StyledList>
        </ListFilterRoot>
    )
}

ListFilter.propTypes = {
    filterKey: PropTypes.string.isRequired,
    facetId: PropTypes.number.isRequired,
}

export default ListFilter
