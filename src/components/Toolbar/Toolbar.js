import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import Url from 'url-parse'

import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'

import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'

import MenuIcon from '@mui/icons-material/Menu'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import SettingsIcon from '@mui/icons-material/Settings'
import CloseIcon from '@mui/icons-material/Close'
import FilterListIcon from '@mui/icons-material/FilterList'
import MapIcon from '@mui/icons-material/Map'
import ViewComfyIcon from '@mui/icons-material/ViewComfy'
import RefreshIcon from '@mui/icons-material/Refresh'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ImageSearchIcon from '@mui/icons-material/ImageSearch'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

import {
    setModal,
    setWorkspace,
    resetFilters,
    setFilexPreview,
    removeFilexColumn,
} from '../../core/redux/actions/actions.js'

import { HASH_PATHS } from '../../core/constants'
import { getPublicUrl } from '../../core/runtimeConfig'

const drawerWidth = 230

const ToolbarRoot = styled('div')(({ theme }) => ({
    height: '100%',
    background: theme.palette.swatches.grey.grey100,
    color: theme.palette.text.secondary,
    boxSizing: 'border-box',
    borderRight: `1px solid ${theme.palette.swatches.grey.grey700}`,
}))

const MainDiv = styled('div', {
    shouldForwardProp: (prop) => prop !== 'shift',
})(({ theme, shift }) => ({
    width: theme.headHeights[1],
    height: '100%',
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'space-between',
    background: theme.palette.swatches.grey.grey850,
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(shift === 1 && {
        marginLeft: drawerWidth - theme.headHeights[1],
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
    ...(shift === 2 && {
        width: drawerWidth,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}))


const drawerPaperStyle = (theme) => ({
    background: theme.palette.swatches.grey.grey900,
    width: drawerWidth - theme.headHeights[1],
    borderRight: `1px solid ${theme.palette.swatches.grey.grey700}`,
})

const StyledList = styled(List)(({ theme }) => ({
    'minWidth': 150,
    'paddingTop': 0,
    '& a': {
        height: theme.headHeights[1],
    },
}))

const StyledListItem = styled(ListItem, {
    shouldForwardProp: (prop) => prop !== 'isNoClick' && prop !== 'isIndented',
})(({ theme, isNoClick, isIndented }) => ({
    'padding': 0,
    'height': theme.headHeights[1],
    'backgroundColor': 'rgba(0,0,0,0)',
    '&:hover': {
        backgroundColor: theme.palette.swatches.grey.grey700,
    },
    ...(isNoClick && {
        pointerEvents: 'none',
        paddingRight: '8px',
    }),
    ...(isIndented && {
        paddingLeft: '14px',
    }),
}))

const NavLink = styled('a', {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    'width': '100%',
    'height': '100% !important',
    'padding': `9px 0px 9px ${theme.spacing(3)}`,
    'color': theme.palette.text.secondary,
    'textDecoration': 'none',
    'boxSizing': 'border-box',
    'lineHeight': `${theme.headHeights[1]}px`,
    'display': 'flex',
    'justifyContent': 'space-between',
    'borderLeft': `2px solid rgba(0,0,0,0)`,
    'borderBottom': `1px solid ${theme.palette.swatches.grey.grey800}`,
    '& span': {
        lineHeight: 1,
    },
    ...(isActive && {
        'background': theme.palette.swatches.grey.grey800,
        'borderLeft': `2px solid ${theme.palette.swatches.blue.blue500}`,
        '& svg': {
            color: theme.palette.swatches.blue.blue500,
        },
        '& span': {
            color: theme.palette.swatches.blue.blue500,
            fontWeight: 'bold',
        },
    }),
}))

const StyledDivider = styled(Divider)(({ theme }) => ({
    background: theme.palette.swatches.grey.grey700,
}))

const ToolbarButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isNav',
})(({ theme, isActive, isNav }) => ({
    'width': theme.headHeights[1],
    'height': theme.headHeights[1],
    'borderRadius': 0,
    'fontSize': 18,
    'color': theme.palette.swatches.grey.grey400,
    'border': `2px solid transparent`,
    'transition': 'all 0.2s ease-in-out',
    '&:hover': {
        color: theme.palette.swatches.grey.grey300,
    },
    ...(isActive && {
        color: theme.palette.active.main,
        borderLeft: `2px solid ${theme.palette.active.main}`,
        [theme.breakpoints.down('md')]: {
            background: `${theme.palette.active.main} !important`,
            color: theme.palette.swatches.grey.grey800,
        },
    }),
    ...(isNav && {
        height: theme.headHeights[1],
        fontSize: 24,
        paddingTop: '4px',
    }),
}))


const OptionsItem = styled('div')(({ theme }) => ({
    'display': 'flex',
    'lineHeight': `${theme.headHeights[1]}px`,
    '& > span': {
        'display': 'flex',
        'justifyContent': 'space-between',
        'flex': '1',
        '& > span': {
            margin: 12,
        },
    },
    '& .MuiSwitch-track': {
        background: theme.palette.swatches.grey.grey100,
    },
}))

const CartLength = styled('div')(({ theme }) => ({
    color: theme.palette.text.secondary,
    background: '#F64137',
    border: `2px solid ${theme.palette.secondary.main}`,
    padding: '0px 4px 0px 3px',
    height: '16px',
    minWidth: '8px',
    borderRadius: '12px',
    textAlign: 'center',
    lineHeight: '16px',
    fontSize: '12px',
    position: 'absolute',
    margin: '2px',
    left: '88px',
    fontFamily: 'sans-serif',
}))

const NavIcon = styled('div')({
    marginRight: '8px',
    display: 'flex',
    width: '22px',
    height: '22px',
})

const drawerItems = [
    {
        name: 'Home',
        path: 'https://pds-imaging.jpl.nasa.gov/',
    },
    {
        name: 'Atlas',
        isHeader: true,
    },
    {
        name: 'Search Images',
        path: '/search',
        isAtlas: true,
    },
    {
        name: 'Browse Archive',
        path: '/archive-explorer',
        isAtlas: true,
    },
    {
        name: 'Cart',
        path: '/cart',
        isAtlas: true,
        showLength: true,
    },
    {
        name: 'Documentation',
        path: '/documentation',
        isAtlas: true,
        openInNewTab: true,
    },
    {
        name: 'Data',
        isHeader: true,
    },
    {
        name: 'Volumes',
        path: 'https://pds-imaging.jpl.nasa.gov/volumes/',
        isData: true,
    },
    {
        name: 'Holdings',
        path: 'https://pds-imaging.jpl.nasa.gov/holdings/',
        isData: true,
    },
    {
        name: 'Portal',
        path: 'https://pds-imaging.jpl.nasa.gov/portal/',
        isData: true,
    },
    {
        name: 'Release Calendar',
        path: 'https://pds.nasa.gov/datasearch/subscription-service/data-release-calendar.shtml',
        isData: true,
        isExternal: true,
    },
    {
        name: 'Tools & Tutorials',
        path: 'https://pds-imaging.jpl.nasa.gov/software/',
    },
    {
        name: 'Help',
        path: 'https://pds-imaging.jpl.nasa.gov/help/help.html',
    },
]

// No need to prepend publicUrl - BrowserRouter's basename handles path prefixing

const Toolbar = (props) => {

    // the current page we're on
    const location = useLocation()
    const navigate = useNavigate()

    const theme = useTheme()
    const mobile = useMediaQuery(theme.breakpoints.down('md'))

    const dispatch = useDispatch()
    const publicUrl = getPublicUrl()
    const w = useSelector((state) => {
        return state.getIn(['workspace', 'main'])
    }).toJS()
    const mW = useSelector((state) => {
        return state.getIn(['workspace', 'mobile'])
    })

    const cart = useSelector((state) => {
        return state.get('cart').toJS() || []
    })
    const cartLength = cart.length

    // 0 all closed, 1 nav is open, 2 options is open
    const [drawer, setDrawer] = useState(0)

    const toggleDrawer = (state) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return
        }
        setDrawer(state)
    }

    let pathRoot = location.pathname
    pathRoot = pathRoot.split('?')[0]

    if (false && mobile) {
        return <div />
    }

    return (
        <ToolbarRoot>
            <Drawer
                anchor={'left'}
                variant={'persistent'}
                open={drawer === 1}
                onClose={toggleDrawer(0)}
                PaperProps={{ sx: (theme) => drawerPaperStyle(theme) }}
            >
                <StyledList>
                    {drawerItems.map((item, idx) => (
                        <StyledListItem
                            isNoClick={item.isHeader}
                            isIndented={item.isAtlas || item.isData || item.isPDS}
                            key={idx}
                        >
                            <NavLink
                                isActive={
                                    item.path === pathRoot ||
                                    (item.path &&
                                        item.name != 'Home' &&
                                        pathRoot.indexOf(item.path) === 0)
                                }
                                onClick={(e) => {
                                    if (item.isAtlas && !item.openInNewTab) {
                                        e.preventDefault()
                                        setDrawer(0)
                                        navigate(`${item.path}`)
                                    } else if (item.openInNewTab) {
                                        setDrawer(0)
                                    }
                                }}
                                target={item.openInNewTab ? "_blank" : "__blank"}
                                href={item.isAtlas && item.openInNewTab ? `${publicUrl}${item.path}` : item.path}
                                rel="noopener"
                            >
                                {item.name === 'Search Images' && (
                                    <NavIcon>
                                        <ImageSearchIcon />
                                    </NavIcon>
                                )}
                                {item.name === 'Browse Archive' && (
                                    <NavIcon>
                                        <AccountTreeIcon />
                                    </NavIcon>
                                )}
                                {item.name === 'Cart' && (
                                    <NavIcon>
                                        <ShoppingCartOutlinedIcon />
                                    </NavIcon>
                                )}
                                {item.name === 'Documentation' && (
                                    <NavIcon>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            style={{
                                                fill: 'currentColor',
                                            }}
                                        >
                                            <path d="M7 7H5A2 2 0 0 0 3 9V17H5V13H7V17H9V9A2 2 0 0 0 7 7M7 11H5V9H7M14 7H10V17H12V13H14A2 2 0 0 0 16 11V9A2 2 0 0 0 14 7M14 11H12V9H14M20 9V15H21V17H17V15H18V9H17V7H21V9Z" />
                                        </svg>
                                    </NavIcon>
                                )}
                                {item.isExternal && (
                                    <NavIcon>
                                        <OpenInNewIcon />
                                    </NavIcon>
                                )}
                                <ListItemText primary={item.name}> </ListItemText>
                                {item.showLength && cartLength > 0 ? (
                                    <CartLength>
                                        {cartLength > 99 ? '99+' : cartLength}
                                    </CartLength>
                                ) : null}
                            </NavLink>
                        </StyledListItem>
                    ))}
                </StyledList>
            </Drawer>
            <MainDiv shift={drawer}>
                <Box sx={{ display: 'flex', flexFlow: 'column' }}>
                    <Tooltip title="Navigation" arrow placement="right">
                        <ToolbarButton
                            isNav
                            aria-label="navigation"
                            size="small"
                            onClick={toggleDrawer(drawer === 1 ? 0 : 1)}
                        >
                            {drawer === 1 ? (
                                <MenuOpenIcon fontSize="inherit" />
                            ) : (
                                <MenuIcon fontSize="inherit" />
                            )}
                        </ToolbarButton>
                    </Tooltip>
                    <StyledDivider />

                    {pathRoot === `/archive-explorer` ? (
                        <React.Fragment>
                            <OptionsItem>
                                <Tooltip title="Reset Path" arrow placement="right">
                                    <ToolbarButton
                                        aria-label="Reset path"
                                        size="small"
                                        onClick={() => {
                                            const newPath = HASH_PATHS.fileExplorer
                                            const currentURL = new Url(window.location, true)

                                            dispatch(setFilexPreview({}))
                                            if (Object.keys(currentURL.query).length > 0)
                                                navigate(newPath, { replace: true })
                                            dispatch(removeFilexColumn(0))
                                        }}
                                    >
                                        <RefreshIcon
                                            fontSize="inherit"
                                            style={{ transform: 'rotateY(180deg)' }}
                                        />
                                    </ToolbarButton>
                                </Tooltip>
                            </OptionsItem>
                        </React.Fragment>
                    ) : null}
                    {pathRoot === `/search` ? (
                        <React.Fragment>
                            <Box sx={{ display: 'flex', flexFlow: 'column' }}>
                                <OptionsItem>
                                    <Tooltip title="Options" arrow placement="right">
                                        <ToolbarButton
                                            aria-label="options"
                                            size="small"
                                            onClick={toggleDrawer(drawer === 2 ? 0 : 2)}
                                        >
                                            {drawer === 2 ? (
                                                <CloseIcon fontSize="inherit" />
                                            ) : (
                                                <SettingsIcon fontSize="inherit" />
                                            )}
                                        </ToolbarButton>
                                    </Tooltip>
                                    {drawer === 2 ? (
                                        <Box sx={{ whiteSpace: 'nowrap' }}>Close Settings Menu</Box>
                                    ) : null}
                                </OptionsItem>
                                <OptionsItem>
                                    <Tooltip title="Filters Panel" arrow placement="right">
                                        <ToolbarButton
                                            isActive={mobile
                                                ? mW === 'filters'
                                                : w.filters
                                            }
                                            aria-label="filters panel"
                                            size="small"
                                            onClick={() => {
                                                if (mobile)
                                                    dispatch(setWorkspace('filters', 'mobile'))
                                                else
                                                    dispatch(
                                                        setWorkspace({ ...w, filters: !w.filters })
                                                    )
                                            }}
                                        >
                                            <FilterListIcon fontSize="inherit" />
                                        </ToolbarButton>
                                    </Tooltip>
                                    {drawer === 2 ? (
                                        <span>
                                            <Box sx={{ whiteSpace: 'nowrap' }}>Show Filters</Box>
                                            <Switch
                                                size="small"
                                                checked={w.filters}
                                                onChange={() => {
                                                    if (mobile)
                                                        dispatch(setWorkspace('filters', 'mobile'))
                                                    else
                                                        dispatch(
                                                            setWorkspace({
                                                                ...w,
                                                                filters: !w.filters,
                                                            })
                                                        )
                                                }}
                                            />
                                        </span>
                                    ) : null}
                                </OptionsItem>
                                <OptionsItem>
                                    <Tooltip title="Map Panel" arrow placement="right">
                                        <ToolbarButton
                                            isActive={mobile
                                                ? mW === 'secondary'
                                                : w.secondary
                                            }
                                            aria-label="Map Panel"
                                            size="small"
                                            onClick={() => {
                                                if (mobile)
                                                    dispatch(setWorkspace('secondary', 'mobile'))
                                                else
                                                    dispatch(
                                                        setWorkspace({
                                                            ...w,
                                                            secondary: !w.secondary,
                                                            results:
                                                                !w.secondary === false
                                                                    ? true
                                                                    : w.results,
                                                        })
                                                    )
                                            }}
                                        >
                                            <MapIcon fontSize="inherit" />
                                        </ToolbarButton>
                                    </Tooltip>
                                    {drawer === 2 ? (
                                        <span>
                                            <Box sx={{ whiteSpace: 'nowrap' }}>Show Map</Box>
                                            <Switch
                                                size="small"
                                                checked={w.secondary}
                                                onChange={() => {
                                                    if (mobile)
                                                        dispatch(
                                                            setWorkspace('secondary', 'mobile')
                                                        )
                                                    else
                                                        dispatch(
                                                            setWorkspace({
                                                                ...w,
                                                                secondary: !w.secondary,
                                                                results:
                                                                    !w.secondary === false
                                                                        ? true
                                                                        : w.results,
                                                            })
                                                        )
                                                }}
                                            />
                                        </span>
                                    ) : null}
                                </OptionsItem>
                                <OptionsItem>
                                    <Tooltip title="Results Panel" arrow placement="right">
                                        <ToolbarButton
                                            isActive={mobile
                                                ? mW === 'results'
                                                : w.results
                                            }
                                            aria-label="Results Panel"
                                            size="small"
                                            onClick={() => {
                                                if (mobile)
                                                    dispatch(setWorkspace('results', 'mobile'))
                                                else
                                                    dispatch(
                                                        setWorkspace({
                                                            ...w,
                                                            results: !w.results,
                                                            secondary:
                                                                !w.results === false
                                                                    ? true
                                                                    : w.secondary,
                                                        })
                                                    )
                                            }}
                                        >
                                            <ViewComfyIcon fontSize="inherit" />
                                        </ToolbarButton>
                                    </Tooltip>
                                    {drawer === 2 ? (
                                        <span>
                                            <Box sx={{ whiteSpace: 'nowrap' }}>Show Results</Box>
                                            <Switch
                                                size="small"
                                                checked={w.results}
                                                onChange={() => {
                                                    if (mobile)
                                                        dispatch(setWorkspace('results', 'mobile'))
                                                    else
                                                        dispatch(
                                                            setWorkspace({
                                                                ...w,
                                                                results: !w.results,
                                                                secondary:
                                                                    !w.results === false
                                                                        ? true
                                                                        : w.secondary,
                                                            })
                                                        )
                                                }}
                                            />
                                        </span>
                                    ) : null}
                                </OptionsItem>
                            </Box>
                            <StyledDivider />
                            <OptionsItem>
                                <Tooltip title="Restart Search" arrow placement="right">
                                    <ToolbarButton
                                        aria-label="Restart search"
                                        size="small"
                                        onClick={() => {
                                            dispatch(resetFilters())
                                        }}
                                    >
                                        <RefreshIcon
                                            fontSize="inherit"
                                            style={{ transform: 'rotateY(180deg)' }}
                                        />
                                    </ToolbarButton>
                                </Tooltip>
                                {drawer === 2 ? (
                                    <Box sx={{ whiteSpace: 'nowrap' }}>Reset All Search Settings</Box>
                                ) : null}
                            </OptionsItem>
                            <StyledDivider />
                        </React.Fragment>
                    ) : null}
                </Box>
                <Box sx={{ display: 'flex', flexFlow: 'column' }}>
                    <StyledDivider />
                    <OptionsItem>
                        <Tooltip title="Help" arrow placement="right">
                            <ToolbarButton aria-label="help button" size="small">
                                <HelpOutlineIcon fontSize="inherit" />
                            </ToolbarButton>
                        </Tooltip>
                        {drawer === 2 ? <Box sx={{ whiteSpace: 'nowrap' }}>Help</Box> : null}
                    </OptionsItem>
                    <OptionsItem>
                        <Tooltip title="Info" arrow placement="right">
                            <ToolbarButton
                                aria-label="info button"
                                size="small"
                                onClick={() => dispatch(setModal('information'))}
                            >
                                <InfoOutlinedIcon fontSize="inherit" />
                            </ToolbarButton>
                        </Tooltip>
                        {drawer === 2 ? <Box sx={{ whiteSpace: 'nowrap' }}>About Atlas</Box> : null}
                    </OptionsItem>
                </Box>
            </MainDiv>
        </ToolbarRoot>
    )
}

export default Toolbar
