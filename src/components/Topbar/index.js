import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'

import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import Badge from '@mui/material/Badge'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import ImageSearchIcon from '@mui/icons-material/ImageSearch'
import AccountTreeIcon from '@mui/icons-material/AccountTree'

import { HASH_PATHS, publicUrl } from '../../core/constants'
import { getPublicUrl } from '../../core/runtimeConfig'

import NASALogoPath from '../../media/images/nasa-logo.svg'

// Construct runtime-aware logo URL
const getNASALogoUrl = () => {
    const publicUrl = getPublicUrl()
    const relativePath = NASALogoPath.match(/\/(static\/.+)$/)?.[1] || NASALogoPath
    return `${publicUrl}/${relativePath}`
}

const TopbarRoot = styled('div')(({ theme }) => ({
    height: theme.headHeights[1],
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    background: theme.palette.swatches.grey.grey100,
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
}))

const LeftSection = styled('div')(({ theme }) => ({
    display: 'flex',
    marginLeft: theme.spacing(1.5),
}))


const LogoDiv = styled('div')(({ theme }) => ({
    width: theme.headHeights[1],
    height: theme.headHeights[1],
    padding: 4,
    boxSizing: 'border-box',
}))

const Logo = styled('img')({
    width: 32,
    height: 32,
})

const AppTitle = styled('div')({
    'display': 'flex',
    'flexFlow': 'column',
    '& > div:last-child': {
        display: 'flex',
        marginTop: '-5px',
    },
})

const NodeH3 = styled('h3')(({ theme }) => ({
    'color': `${theme.palette.swatches.grey.grey500} !important`,
    'fontWeight': 400,
    'fontSize': 11,
    'margin': 0,
    'padding': `0px ${theme.spacing(1)}`,
    'lineHeight': '22px',
    'textTransform': 'uppercase',
    'textDecoration': 'none !important',
    '& > div': {
        display: 'flex',
    },
    '& > div > a:first-child': {
        textDecoration: 'none !important',
        fontWeight: 'bold',
        marginRight: '3px',
        color: 'darkgoldenrod !important',
    },
    '& > div > a:last-child': {
        textDecoration: 'none !important',
        color: `${theme.palette.swatches.grey.grey500} !important`,
    },
    '& > div > a:hover': {
        textDecoration: 'underline !important',
    },
}))

const AppName = styled('h1')(({ theme }) => ({
    color: theme.palette.text.primary,
    fontWeight: 700,
    fontSize: 14,
    margin: 0,
    padding: `0px ${theme.spacing(0.5)}`,
    lineHeight: '22px',
}))

const TitleDivider = styled('div')(({ theme }) => ({
    color: theme.palette.swatches.grey.grey500,
    fontWeight: 500,
    fontSize: 14,
    margin: 0,
    padding: `0px 3px 0px 2px`,
    lineHeight: '22px',
}))

const AppPage = styled('h2')(({ theme }) => ({
    color: 'darkgoldenrod',
    fontSize: 14,
    letterSpacing: '1px',
    margin: 0,
    padding: `0px ${theme.spacing(0.5)}`,
    lineHeight: '22px',
    textTransform: 'uppercase',
}))

const NavButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    'width': theme.headHeights[1],
    'height': theme.headHeights[1],
    'borderRadius': 0,
    'fontSize': 20,
    'color': theme.palette.text.muted,
    'transition': 'color 0.2s ease-out',
    'borderTop': `2px solid transparent`,
    'borderBottom': `2px solid transparent`,
    '&:hover': {
        color: theme.palette.text.primary,
    },
    ...(isActive && {
        color: theme.palette.swatches.blue.blue500,
        background: 'rgba(0,0,0,0.05)',
        borderBottom: `2px solid ${theme.palette.swatches.blue.blue500}`,
    }),
}))

const CartBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        background: theme.palette.swatches.red.red500,
        color: theme.palette.text.secondary,
        right: 4,
        top: 1,
        border: `1px solid ${theme.palette.swatches.grey.grey100}`,
        padding: '0px 3px 0px 3px',
        height: '16px',
        minWidth: '16px;',
    },
}))

const Topbar = () => {

    const location = useLocation()
    const navigate = useNavigate()

    const theme = useTheme()
    const isMobileSm = useMediaQuery(theme.breakpoints.down('md'))
    const isMobileXs = useMediaQuery(theme.breakpoints.down('sm'))

    const cart = useSelector((state) => {
        return state.get('cart').toJS() || []
    })
    const cartLength = cart.length

    let pageName = null
    switch (location.pathname) {
        case HASH_PATHS.cart:
            pageName = 'Cart'
            break
        case HASH_PATHS.fileExplorer:
            pageName = 'Archive Explorer'
            break
        case HASH_PATHS.record:
            pageName = 'Record'
        case HASH_PATHS.search:
            pageName = 'Image Search'
            break
        default:
    }

    return (
        <TopbarRoot>
            <LeftSection>
                <LogoDiv>
                    <Logo src={getNASALogoUrl()} alt="NASA logo" />
                </LogoDiv>
                <AppTitle>
                    <div>
                        <NodeH3>
                            {isMobileXs ? (
                                'PDSIMG'
                            ) : (
                                <div>
                                    <a href="http://pds.nasa.gov/">PDS</a>
                                    <a href="https://pds-imaging.jpl.nasa.gov/">
                                        Cartography and Imaging Sciences
                                    </a>
                                </div>
                            )}
                        </NodeH3>
                    </div>
                    <div>
                        <Box sx={{ display: 'flex' }}>
                            <AppName>ATLAS</AppName>
                        </Box>
                        {pageName && (
                            <>
                                <TitleDivider>/</TitleDivider>
                                <div>
                                    <AppPage>{pageName}</AppPage>
                                </div>
                            </>
                        )}
                    </div>
                </AppTitle>
            </LeftSection>
            <Box sx={{ display: 'flex' }}>
                <Tooltip title="API Documentation" arrow placement="bottom">
                    <NavButton
                        aria-label="go to api documentation"
                        onClick={() => {
                            window.open(`${publicUrl}${HASH_PATHS.apiDocumentation}`, '_blank').focus()
                        }}
                        size="large"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            style={{ transform: 'scale(1.5)', fill: 'currentColor' }}
                        >
                            <path d="M7 7H5A2 2 0 0 0 3 9V17H5V13H7V17H9V9A2 2 0 0 0 7 7M7 11H5V9H7M14 7H10V17H12V13H14A2 2 0 0 0 16 11V9A2 2 0 0 0 14 7M14 11H12V9H14M20 9V15H21V17H17V15H18V9H17V7H21V9Z" />
                        </svg>
                    </NavButton>
                </Tooltip>
                <Tooltip title="Image Search" arrow placement="bottom">
                    <NavButton
                        isActive={pageName === 'Image Search'}
                        aria-label="go to image search"
                        onClick={() => {
                            navigate(HASH_PATHS.search)
                        }}
                        size="large"
                    >
                        <ImageSearchIcon fontSize="inherit" />
                    </NavButton>
                </Tooltip>

                <Tooltip title="Archive Explorer" arrow placement="bottom">
                    <NavButton
                        isActive={pageName === 'Archive Explorer'}
                        aria-label="go to archive explorer"
                        onClick={() => {
                            navigate(HASH_PATHS.fileExplorer)
                        }}
                        size="large"
                    >
                        <AccountTreeIcon fontSize="inherit" />
                    </NavButton>
                </Tooltip>

                <Tooltip title="Cart" arrow placement="bottom">
                    <NavButton
                        isActive={pageName === 'Cart'}
                        aria-label="go to cart"
                        onClick={() => {
                            navigate(HASH_PATHS.cart)
                        }}
                        size="large"
                    >
                        <CartBadge badgeContent={cartLength}>
                            <ShoppingCartOutlinedIcon fontSize="inherit" />
                        </CartBadge>
                    </NavButton>
                </Tooltip>
            </Box>
        </TopbarRoot>
    )
}

export default Topbar
