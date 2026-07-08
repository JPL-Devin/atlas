import React, { useEffect } from 'react'
import { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import Heading from './Heading/Heading'
import Columns from './Columns/Columns'
import Preview from './Preview/Preview'

import RegexModal from './Modals/RegexModal/RegexModal'

import MenuButton from '../../components/MenuButton/MenuButton'

import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'

import SortIcon from '@mui/icons-material/Sort'
import Box from '@mui/material/Box'

import Draggable from 'react-draggable'

const initialPreviewWidth = 512

const FileExplorerRoot = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    color: theme.palette.text.primary,
}))

const ContentArea = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isTall',
})(({ theme, isTall }) => ({
    width: '100%',
    height: `calc(100% - ${theme.headHeights[2] + 1}px)`,
    display: 'flex',
    justifyContent: 'space-between',
    overflow: 'hidden',
    background: theme.palette.swatches.grey.grey150,
    boxShadow: 'inset 0px 1px 2px 0px rgba(0,0,0,0.07)',
    ...(isTall && {
        height: `calc(100% - 1px)`,
    }),
}))

const ContentMobile = styled('div')({
    height: 'calc(100% - 41px)',
    width: '100%',
    position: 'absolute',
    top: '41px',
    left: 0,
})

const LeftPanel = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isUnderLarge',
})(({ theme, isUnderLarge }) => ({
    'overflowX': 'auto',
    'overflowY': 'hidden',
    'flex': 1,
    'boxShadow': '1px 0px 2px 0px rgba(0,0,0,0.02)',
    'position': 'relative',
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.swatches.grey.grey300,
        boxShadow: `inset 0px 0px 0px 1px ${theme.palette.swatches.grey.grey50}`,
    },
    ...(isUnderLarge && {
        overflow: 'hidden',
        flex: 1,
    }),
}))

const RightPanel = styled('div')({
    width: `${initialPreviewWidth}px`,
    boxShadow: '-1px 0px 2px 0px rgba(0,0,0,0.07)',
})

const ResizeDivider = styled('div')({
    width: '8px',
    height: '100%',
    cursor: 'col-resize',
    position: 'absolute',
    zIndex: 1000,
})

let slidingRight = false

const FileExplorer = (props) => {
    useEffect(() => {
        document.title = 'Atlas - Archive Explorer | PDS-IMG'
    }, [])

    const dispatch = useDispatch()

    const slideRef = useRef(null)
    const rightRef = useRef(null)
    const dragRef = useRef(null)

    const mobileWorkspace = useSelector((state) => {
        return state.getIn(['workspace', 'mobile'])
    })

    let [sort, setSort] = useState('Folders')

    let [showMobilePreview, setShowMobilePreview] = useState(false)
    let [forcedPreview, setForcedPreview] = useState(null)

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const isLarge = useMediaQuery(theme.breakpoints.down('lg'))

    const slideToRight = () => {
        if (slidingRight || slideRef == null || slideRef.current == null) return
        else slidingRight = true

        // cancel if already on top
        if (!(slideRef && slideRef.current.scrollWidth > slideRef.current.offsetWidth)) {
            slidingRight = false
            return
        }

        const cosParameter = (slideRef.current.scrollWidth - slideRef.current.offsetWidth) / 2
        let scrollCount = 0,
            oldTimestamp = null,
            duration = Math.max(
                Math.min(3 * (slideRef.current.scrollWidth - slideRef.current.offsetWidth), 1000),
                400
            ) // n ms per pixel to scroll

        function step(newTimestamp) {
            if (oldTimestamp !== null) {
                // if duration is 0 scrollCount will be Infinity
                scrollCount += (Math.PI * (newTimestamp - oldTimestamp)) / duration
                if (scrollCount >= Math.PI) {
                    slideRef.current.scrollLeft =
                        slideRef.current.scrollWidth - slideRef.current.offsetWidth
                    slidingRight = false
                    return
                }
                slideRef.current.scrollLeft = Math.max(
                    slideRef.current.scrollLeft,
                    slideRef.current.scrollWidth -
                        slideRef.current.offsetWidth -
                        (cosParameter + cosParameter * Math.cos(scrollCount))
                )
            }
            oldTimestamp = newTimestamp
            window.requestAnimationFrame(step)
        }
        window.requestAnimationFrame(step)
    }

    const setShowMobilePreviewWrapper = (show, forcedPreview) => {
        setShowMobilePreview(show)
        if (show && forcedPreview != null) {
            setForcedPreview(forcedPreview)
        } else setForcedPreview(null)
    }

    let modal = useSelector((state) => {
        return state.getIn(['modals', 'regex'])
    })

    if (typeof modal.toJS === 'function') modal = modal.toJS()

    // If mobile
    if (isMobile) {
        return (
            <FileExplorerRoot>
                <ContentMobile>
                    <Columns
                        isMobile={true}
                        sort={sort}
                        setSort={setSort}
                        setShowMobilePreview={setShowMobilePreviewWrapper}
                    />
                    <RegexModal modal={modal} />
                    <Preview
                        isMobile={true}
                        showMobilePreview={showMobilePreview}
                        setShowMobilePreview={setShowMobilePreviewWrapper}
                        forcedPreview={forcedPreview}
                    />
                </ContentMobile>
            </FileExplorerRoot>
        )
    }
    return (
        <FileExplorerRoot>
            <Heading
                hide={modal !== false}
                menuItems={[
                    <MenuButton
                        key={'mI2'}
                        options={['Folders', 'Files', 'A-Z', 'Z-A']}
                        active={sort}
                        buttonComponent={<SortIcon fontSize="inherit" />}
                        title={'Sort'}
                        onChange={(option) => {
                            setSort(option)
                        }}
                    />,
                ]}
            />
            <ContentArea isTall={modal !== false}>
                <LeftPanel
                    isUnderLarge={isLarge && !isMobile}
                    ref={slideRef}
                >
                    <Columns
                        sort={sort}
                        slideToRight={slideToRight}
                        forceNColumns={isLarge ? 2 : false}
                        hasModalOver={modal != false}
                    />
                    <RegexModal modal={modal} />
                </LeftPanel>
                <Box sx={{ display: 'flex', position: 'relative' }}>
                    <Draggable
                        axis="x"
                        defaultPosition={{ x: 0, y: 0 }}
                        position={null}
                        scale={1}
                        onStart={(e) => {}}
                        onDrag={(e, ui) => {
                            if (rightRef && rightRef.current) {
                                const currentWidth = parseInt(
                                    (
                                        rightRef.current.style.width ||
                                        initialPreviewWidth.toString()
                                    ).replace('px', '')
                                )
                                const newWidth =
                                    Math.max(
                                        500,
                                        Math.min(window.innerWidth / 2, currentWidth - ui.deltaX)
                                    ) + 'px'
                                rightRef.current.style.width = newWidth
                            }
                        }}
                        onStop={(e) => {
                            if (dragRef && dragRef.current) {
                                dragRef.current.style.transform = 'translate(0px, 0px)'
                            }
                        }}
                    >
                        <ResizeDivider ref={dragRef} />
                    </Draggable>
                    <RightPanel ref={rightRef}>
                        <Preview />
                    </RightPanel>
                </Box>
            </ContentArea>
        </FileExplorerRoot>
    )
}

FileExplorer.propTypes = {}

export default FileExplorer
