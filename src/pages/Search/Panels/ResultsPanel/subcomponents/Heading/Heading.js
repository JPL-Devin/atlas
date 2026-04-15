import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import MoreVertIcon from '@mui/icons-material/MoreVert'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual'
import PhotoSizeSelectLargeIcon from '@mui/icons-material/PhotoSizeSelectLarge'
import PhotoSizeSelectSmallIcon from '@mui/icons-material/PhotoSizeSelectSmall'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'

import ResultsSorter from '../../../../../../components/ResultsSorter/ResultsSorter'
import MenuButton from '../../../../../../components/MenuButton/MenuButton'

import ChippedFilters from '../ChippedFilters/ChippedFilters'

import {
    addToCart,
    checkItemInResults,
    setGridSize,
    setModal,
    setSnackBarText,
} from '../../../../../../core/redux/actions/actions.js'

const HeadingRoot = styled('div')(({ theme }) => ({
    width: '100%',
    height: theme.headHeights[1],
    display: 'flex',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    background: theme.palette.swatches.grey.grey100,
}))

const Title = styled('div')(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '34px',
    whiteSpace: 'nowrap',
    padding: '4px 0px 4px 12px',
    color: theme.palette.text.primary,
}))


const RotateButton = styled(IconButton)(({ theme }) => ({
    'width': theme.headHeights[1],
    'height': theme.headHeights[1],
    '& svg': {
        borderRadius: '50%',
        transform: `rotateZ(${window.atlasGlobal.imageRotation}deg)`,
        background:
            window.atlasGlobal.imageRotation === 0
                ? 'inherit'
                : theme.palette.swatches.grey.grey150,
        color: window.atlasGlobal.imageRotation === 0 ? 'rgba(0,0,0,0.54)' : 'black',
    },
}))

const GridSizeGroup = styled('div')(({ theme }) => ({
    'height': '26px',
    'background': theme.palette.swatches.grey.grey100,
    'margin': '6px 4px',
    'borderRadius': '4px',
    'border': `1px solid ${theme.palette.swatches.grey.grey200}`,
    '& > button:not(:last-child)': {
        borderRight: `1px solid ${theme.palette.swatches.grey.grey200}`,
    },
}))

const GridSizeButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    'color': theme.palette.swatches.grey.grey300,
    'padding': '3px 6px 2px 6px',
    'transition': 'color 0.2s ease-out, background 0.2s ease-out',
    '&:hover': {
        color: theme.palette.text.primary,
        background: theme.palette.swatches.grey.grey150,
    },
    ...(isActive && {
        background: theme.palette.swatches.grey.grey150,
        color: theme.palette.text.primary,
    }),
}))

const ActionButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: '11px',
    lineHeight: '11px',
    margin: '7px 3px',
    background: theme.palette.accent.main,
}))

const ActionButtonDanger = styled(Button)(({ theme }) => ({
    'color': theme.palette.text.secondary,
    'fontSize': '11px',
    'lineHeight': '11px',
    'margin': '7px 3px',
    'background': theme.palette.swatches.red.red500,
    '&:hover': {
        color: theme.palette.text.secondary,
        background: theme.palette.swatches.red.red400,
    },
}))

const MenuButtonIcon = styled(MoreVertIcon)({
    fontSize: '21px',
})

const Heading = (props) => {
    const { activeView } = props

    const dispatch = useDispatch()

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    const filterType = useSelector((state) => state.getIn(['filterType']))
    const gridSize = useSelector((state) => state.getIn(['gridSize']))

    const resultKeysChecked = useSelector((state) => state.getIn(['resultKeysChecked'])).toJS()

    const gridSizes = isMobile ? [92, 128, 256] : [128, 192, 256]

    const rotate90 = () => {
        window.atlasGlobal.imageRotation = (window.atlasGlobal.imageRotation + 90) % 360

        const rotateButton = document.querySelector('#ResultsPanelRotateButton svg')
        if (rotateButton) {
            rotateButton.style.transform = `rotateZ(${window.atlasGlobal.imageRotation}deg)`
            rotateButton.style.background =
                window.atlasGlobal.imageRotation === 0 ? 'inherit' : '#e7e7e7'
            rotateButton.style.color =
                window.atlasGlobal.imageRotation === 0 ? 'rgba(0,0,0,0.54)' : 'black'
        }

        const imgs = document.getElementsByClassName('ResultsPanelImage')
        for (let i = 0; i < imgs.length; i++) {
            imgs[i].style.transform = `rotateZ(${window.atlasGlobal.imageRotation}deg)`
        }
    }

    return (
        <HeadingRoot>
            <Box sx={{ display: 'flex' }}>
                <Title>Results</Title>
            </Box>
            <Box sx={{ flex: 1, padding: '4px 12px' }}>{filterType === 'basic' && <ChippedFilters />}</Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <ResultsSorter />
                {activeView === 'grid' && !isMobile && (
                    <GridSizeGroup>
                        <Tooltip title="Small Grid Images" arrow>
                            <GridSizeButton
                                isActive={gridSize === gridSizes[0]}
                                aria-label="small image size"
                                size="small"
                                onClick={() => {
                                    dispatch(setGridSize(gridSizes[0]))
                                }}
                            >
                                <PhotoSizeSelectSmallIcon />
                            </GridSizeButton>
                        </Tooltip>
                        <Tooltip title="Medium Grid Images" arrow>
                            <GridSizeButton
                                isActive={gridSize === gridSizes[1]}
                                aria-label="medium image size"
                                size="small"
                                onClick={() => {
                                    dispatch(setGridSize(gridSizes[1]))
                                }}
                            >
                                <PhotoSizeSelectLargeIcon />
                            </GridSizeButton>
                        </Tooltip>
                        <Tooltip title="Large Grid Images" arrow>
                            <GridSizeButton
                                isActive={gridSize === gridSizes[2]}
                                aria-label="large image size"
                                size="small"
                                onClick={() => {
                                    dispatch(setGridSize(gridSizes[2]))
                                }}
                            >
                                <PhotoSizeSelectActualIcon />
                            </GridSizeButton>
                        </Tooltip>
                    </GridSizeGroup>
                )}
                {activeView === 'grid' && !isMobile && (
                    <Tooltip title="Rotate Images 90°" arrow>
                        <RotateButton
                            id="ResultsPanelRotateButton"
                            aria-label="rotate images"
                            size="small"
                            onClick={rotate90}
                        >
                            <RotateRightIcon />
                        </RotateButton>
                    </Tooltip>
                )}
                {activeView === 'table' && !isMobile && (
                    <ActionButton
                        variant="contained"
                        aria-label="edits columns"
                        size="small"
                        onClick={() => dispatch(setModal('editColumns'))}
                    >
                        Edit Columns
                    </ActionButton>
                )}
                <Tooltip
                    title={
                        resultKeysChecked.length > 0
                            ? 'Add Selected Results to Cart'
                            : 'Add All Query Results to Cart'
                    }
                    arrow
                >
                    {resultKeysChecked.length > 0 ? (
                        <ActionButtonDanger
                            variant="contained"
                            aria-label="add selected results to cart"
                            size="small"
                            onClick={() => {
                                dispatch(addToCart('image', 'checkedResults'))
                                dispatch(
                                    setSnackBarText('Added Selected Items to Cart!', 'success')
                                )
                            }}
                            endIcon={<AddShoppingCartIcon size="small" />}
                        >
                            {isMobile ? 'Add Selected' : 'Add Selected to Cart'}
                        </ActionButtonDanger>
                    ) : (
                        <ActionButton
                            variant="contained"
                            aria-label="add all query results to cart"
                            size="small"
                            onClick={() => {
                                dispatch(addToCart('query', 'lastQuery'))
                                dispatch(setSnackBarText('Added Query to Cart!', 'success'))
                            }}
                            endIcon={<AddShoppingCartIcon size="small" />}
                        >
                            {isMobile ? 'Add All' : 'Add All to Cart'}
                        </ActionButton>
                    )}
                </Tooltip>
                <MenuButton
                    options={
                        !isMobile
                            ? [
                                  'Add All Query Results to Cart',
                                  'Add Selected Results to Cart',
                                  '-',
                                  'Deselect All',
                              ]
                            : activeView === 'table'
                            ? [
                                  'Add All Query Results to Cart',
                                  'Add Selected Results to Cart',
                                  '-',
                                  'Deselect All',
                                  '-',
                                  'Edit Columns',
                              ]
                            : [
                                  'Add All Query Results to Cart',
                                  'Add Selected Results to Cart',
                                  '-',
                                  'Deselect All',
                                  '-',
                                  'Small Grid Images',
                                  'Medium Grid Images',
                                  'Large Grid Images',
                                  '-',
                                  'Rotate Images 90°',
                              ]
                    }
                    buttonComponent={<MenuButtonIcon />}
                    onChange={(option, idx) => {
                        switch (option) {
                            case 'Add Selected Results to Cart':
                                dispatch(addToCart('image', 'checkedResults'))
                                dispatch(setSnackBarText('Added to Cart!', 'success'))
                                break
                            case 'Add All Query Results to Cart':
                                dispatch(addToCart('query', 'lastQuery'))
                                dispatch(setSnackBarText('Added Query to Cart!', 'success'))
                                break
                            case 'Deselect All':
                                dispatch(checkItemInResults('clear'))
                                break

                            case 'Small Grid Images':
                                dispatch(setGridSize(gridSizes[0]))
                                break
                            case 'Medium Grid Images':
                                dispatch(setGridSize(gridSizes[1]))
                                break
                            case 'Large Grid Images':
                                dispatch(setGridSize(gridSizes[2]))
                                break

                            case 'Rotate Images 90°':
                                rotate90()
                                break

                            case 'Edit Columns':
                                dispatch(setModal('editColumns'))
                                break
                            default:
                                break
                        }
                    }}
                />
            </Box>
        </HeadingRoot>
    )
}

Heading.propTypes = {}

export default Heading
