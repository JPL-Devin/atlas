import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { styled } from '@mui/material/styles'
import PropTypes from 'prop-types'

import Input from '@mui/material/Input'

import { setFieldState } from '../../../../core/redux/actions/actions.js'
import { getIn } from '../../../../core/utils.js'
import { ClearButton, SubmitButton, BottomDiv } from '../../../shared/FilterComponents'

const InputFilterRoot = styled('div')(({ theme }) => ({
    display: 'flex',
    flexFlow: 'column',
    padding: `0px ${theme.spacing(2)}`,
}))

const StyledInput = styled(Input)({
    flex: 1,
})

const InputFilter = (props) => {
    const { filterKey, facetId, type } = props

    const [filterInput, setFilterInput] = useState(null)

    const dispatch = useDispatch()
    let facet = useSelector((state) => {
        return state.getIn(['activeFilters', filterKey, 'facets', facetId])
    })
    facet = facet ? facet.toJS() : {}

    useEffect(() => {
        setFilterInput(facet.state?.input || null)
    }, [JSON.stringify(facet.state)])

    const facetName = facet.field_name || filterKey

    const handleClear = () => {
        const current = facet.state?.input
        if (current !== false)
            dispatch(
                setFieldState(filterKey, facetId, {
                    input: false,
                })
            )
        setFilterInput('')
    }

    const handleSubmit = () => {
        const current = facet.state?.input
        if (current !== filterInput)
            dispatch(
                setFieldState(filterKey, facetId, {
                    input: filterInput,
                })
            )
    }

    return (
        <InputFilterRoot>
            <StyledInput
                placeholder={facetName}
                value={filterInput || ''}
                type={type}
                onInput={(e) => {
                    setFilterInput(e.target.value == '' ? null : e.target.value)
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit()
                }}
            />
            <BottomDiv>
                <ClearButton
                    size="small"
                    variant="contained"
                    onClick={handleClear}
                    disabled={filterInput == null}
                >
                    Clear
                </ClearButton>
                <SubmitButton
                    size="small"
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={filterInput == null}
                >
                    Search
                </SubmitButton>
            </BottomDiv>
        </InputFilterRoot>
    )
}

InputFilter.propTypes = {
    filterKey: PropTypes.string.isRequired,
    facetId: PropTypes.number.isRequired,
    type: PropTypes.string,
}

export default InputFilter
