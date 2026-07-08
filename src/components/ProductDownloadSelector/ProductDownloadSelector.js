import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { styled } from '@mui/material/styles'

import {
    domain,
    endpoints,
    ES_PATHS,
    MAX_BULK_DOWNLOAD_COUNT,
    EMAIL_CONTACT,
} from '../../core/constants'
import { getIn, getHeader, getFilename, humanFileSize, setIn } from '../../core/utils'

import { Typography } from '@mui/material'
import Checkbox from '@mui/material/Checkbox'

import WarningIcon from '@mui/icons-material/Warning'
import Box from '@mui/material/Box'

const RootDiv = styled('div', {
    shouldForwardProp: (prop) => prop !== 'hidden',
})(({ theme, hidden }) => ({
    padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
    background: theme.palette.swatches.grey.grey100,
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    ...(hidden && {
        display: 'none',
    }),
}))

const Title = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: theme.spacing(3),
}))

const Header = styled(Typography)({
    fontWeight: 'bold',
})

const ItemDiv = styled('div')({
    'display': 'flex',
    'justifyContent': 'space-between',
    '& > div': {
        display: 'flex',
    },
    'lineHeight': '27px',
    'cursor': 'pointer',
})

const SummaryDiv = styled('div')({
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '21px',
})

const SizeWarning = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    background: theme.palette.swatches.yellow.yellow700,
    padding: '16px 16px 16px 0px',
    boxSizing: 'border-box',
    marginTop: '16px',
    marginBottom: '8px',
    borderRadius: '3px',
    boxShadow: '0px 2px 2px 0px rgba(0, 0, 0, 0.1)',
}))

const SizeWarningIcon = styled('div')({
    'width': '80px',
    'margin': 'auto',
    'textAlign': 'center',
    '& svg': {
        fontSize: '42px',
    },
})

const SizeWarningMessage = styled('div')({
    'flex': 1,
    'fontSize': '15px',
    'letterSpacing': '0.25px',
    '& a': {
        fontWeight: 'bold',
    },
})

const ProductDownloadSelector = forwardRef((props, ref) => {
    const { hidden, forceAllSelected, onSummaryReady, onSelection } = props

    const dispatch = useDispatch()

    const cart = useSelector((state) => {
        return state.get('cart').toJS() || []
    })
    const checkedCart = cart.filter((v) => v.checked === true)

    const startChecked = forceAllSelected ? true : false
    const [listState, setListState] = useState({
        'Source Products': {
            src: {
                name: 'Primary Product / File',
                size: 0,
                sizeComplete: false,
                total: 0,
                checked: startChecked,
            },
        },
        'Metadata Products': {
            label: {
                name: 'PDS Label',
                size: 0,
                sizeComplete: false,
                total: 0,
                checked: startChecked,
            },
        },
        'Browse Products': {
            browse: {
                name: 'Browse Image',
                size: 0,
                sizeComplete: false,
                total: 0,
                checked: startChecked,
            },
            full: {
                name: 'Full-sized Image',
                size: 0,
                sizeComplete: false,
                total: 0,
                checked: startChecked,
            },
            lg: { name: 'Large Image', size: 0, sizeComplete: false, total: 0, checked: false },
            md: { name: 'Medium Image', size: 0, sizeComplete: false, total: 0, checked: false },
            sm: { name: 'Small Image', size: 0, sizeComplete: false, total: 0, checked: false },
            xs: { name: 'Tiny Image', size: 0, sizeComplete: false, total: 0, checked: false },
            tile: { name: 'DZI Tileset', size: 0, sizeComplete: false, total: 0, checked: false },
        },
    })

    useImperativeHandle(ref, () => ({
        getSelected: () => {
            return getSelected(listState)
        },
        getSummary: () => {
            return getSummary(listState)
        },
    }))

    useEffect(() => {
        const nextListState = JSON.parse(JSON.stringify(listState))

        Object.keys(nextListState).forEach((groupName) => {
            Object.keys(nextListState[groupName]).forEach((productType) => {
                let size = 0
                let sizeComplete = true
                let total = 0
                checkedCart.forEach((c) => {
                    const related = c.item.related
                    if (related[productType]) {
                        if (related[productType].value != null) {
                            size += related[productType].value
                        } else if (related[productType].size != null) {
                            size += related[productType].size
                        } else {
                            sizeComplete = false
                        }

                        if (c.type === 'image' || c.type === 'file') {
                            total++
                        } else if (related[productType].count != null) {
                            total += related[productType].count
                        }
                    }
                })
                nextListState[groupName][productType].size = size
                nextListState[groupName][productType].sizeComplete = sizeComplete
                nextListState[groupName][productType].total = total
            })
        })
        setListState(nextListState)

        if (typeof onSummaryReady === 'function') onSummaryReady(getSummary(nextListState))
    }, [checkedCart.length])

    const onCheck = (group, name) => {
        const nextListState = JSON.parse(JSON.stringify(listState))
        setIn(
            nextListState,
            [group, name, 'checked'],
            !getIn(nextListState, [group, name, 'checked'], false)
        )
        setListState(nextListState)
        if (typeof onSelection === 'function')
            onSelection((getSelected(nextListState) || []).length)
    }

    const summary = getSummary(listState)

    return (
        <RootDiv hidden={hidden}>
            <Title>
                1. Select the products to include in your download:
            </Title>
            <div>{makeSelectors(listState, onCheck)}</div>
            <SummaryDiv>
                <Box sx={{ fontWeight: 'bold' }}>Total:&nbsp;</Box>
                <Box sx={{ fontStyle: 'italic' }}>{summary.total} items</Box>
                <div>&nbsp;|&nbsp;</div>
                <Box sx={{ fontWeight: 'bold' }}>{humanFileSize(summary.size)}</Box>
            </SummaryDiv>
            {summary.total > MAX_BULK_DOWNLOAD_COUNT && (
                <SizeWarning>
                    <SizeWarningIcon>
                        <WarningIcon />
                    </SizeWarningIcon>
                    <SizeWarningMessage>
                        Your download exceeds {MAX_BULK_DOWNLOAD_COUNT} items and may be throttled.
                        If you need to perform a large download within a reasonable time, please
                        reach out to the PDS-IMG node at{' '}
                        <a href={`mailto:${EMAIL_CONTACT}?subject=Bulk%20Download%20Request`}>
                            {EMAIL_CONTACT}
                        </a>
                    </SizeWarningMessage>
                </SizeWarning>
            )}
        </RootDiv>
    )
})

function makeSelectors(state, onCheck) {
    let list = []
    Object.keys(state).forEach((groupName, idx) => {
        const sublist = []
        Object.keys(state[groupName]).forEach((productType, idx2) => {
            const p = state[groupName][productType]
            if (p.total > 0)
                sublist.push(
                    <ItemDiv
                        onClick={() => {
                            onCheck(groupName, productType)
                        }}
                        key={`${idx}.${idx2}`}
                    >
                        <div>
                            <Checkbox
                                color="default"
                                checked={p.checked}
                                size="medium"
                            />
                            <Box sx={{ lineHeight: '27px' }}>{p.name}</Box>
                        </div>
                        <div>
                            <Box sx={{ fontStyle: 'italic' }}>{p.total} items</Box>
                            <div>&nbsp;|&nbsp;</div>
                            <Box sx={{ fontWeight: 'bold' }}>{humanFileSize(p.size)}</Box>
                        </div>
                    </ItemDiv>
                )
        })
        if (sublist.length > 0) {
            sublist.unshift(
                <Header key={idx}>
                    {groupName}
                </Header>
            )
            list = list.concat(sublist)
        }
    })

    return list
}

function getSelected(listState) {
    const selected = []
    Object.keys(listState).forEach((groupName) => {
        Object.keys(listState[groupName]).forEach((productType) => {
            const p = listState[groupName][productType]
            if (p.checked) {
                selected.push(productType)
            }
        })
    })
    return selected
}

function getSummary(state) {
    const summary = { total: 0, size: 0 }
    Object.keys(state).forEach((groupName) => {
        Object.keys(state[groupName]).forEach((productType) => {
            const p = state[groupName][productType]
            if (p.checked) {
                summary.total += p.total
                summary.size += p.size
            }
        })
    })
    return summary
}

ProductDownloadSelector.propTypes = {}

export default ProductDownloadSelector
