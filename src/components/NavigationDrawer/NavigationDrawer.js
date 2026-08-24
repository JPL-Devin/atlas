import React from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'

import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Drawer from '@mui/material/Drawer'

import { makeStyles } from '@mui/styles'

import ImageSearchIcon from '@mui/icons-material/ImageSearch'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

import { getPublicUrl } from '../../core/runtimeConfig'
import { getAppInstanceKey, getAllInstances } from '../../core/appConfig'

const drawerWidth = 230

const useStyles = makeStyles((theme) => ({
    drawer: {
        background: theme.palette.swatches.grey.grey900,
        width: drawerWidth,
        borderRight: `1px solid ${theme.palette.swatches.grey.grey700}`,
    },
    list: {
        'minWidth': 150,
        'paddingTop': 0,
        '& a': {
            height: theme.headHeights[1],
        },
    },
    listItem: {
        'padding': 0,
        'height': theme.headHeights[1],
        'backgroundColor': 'rgba(0,0,0,0)',
        '&:hover': {
            backgroundColor: theme.palette.swatches.grey.grey700,
        },
    },
    listItemNoClick: {
        pointerEvents: 'none',
        paddingRight: '8px',
    },
    listItemHeader: {
        'pointerEvents': 'none',
        'height': 'auto',
        'minHeight': '32px',
        'borderBottom': `1px solid ${theme.palette.swatches.grey.grey700}`,
        'marginTop': '4px',
        '& a': {
            padding: '6px 0px 6px 16px',
            height: 'auto !important',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: theme.palette.swatches.grey.grey400,
            borderLeft: 'none',
            borderBottom: 'none',
        },
    },
    listIndent: {
        paddingLeft: '14px',
    },
    aLink: {
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
    },
    activePath: {
        'background': theme.palette.swatches.grey.grey800,
        'borderLeft': `2px solid ${theme.palette.swatches.blue.blue500}`,
        '& svg': {
            color: theme.palette.swatches.blue.blue500,
        },
        '& span': {
            color: theme.palette.swatches.blue.blue500,
            fontWeight: 'bold',
        },
    },
    cartLength: {
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
        marginRight: '12px',
        fontFamily: 'sans-serif',
    },
    navIcon: {
        marginRight: '8px',
        display: 'flex',
        width: '22px',
        height: '22px',
    },
}))

const buildDrawerItems = () => {
    const allInstances = getAllInstances()
    const currentInstanceKey = getAppInstanceKey()
    const items = [{ name: 'Home', path: 'https://pds-imaging.jpl.nasa.gov/' }]

    const sortedKeys = Object.keys(allInstances).sort(
        (a, b) => allInstances[a].drawerOrder - allInstances[b].drawerOrder
    )

    sortedKeys.forEach((instanceKey) => {
        const instance = allInstances[instanceKey]
        const isCurrent = instanceKey === currentInstanceKey

        items.push({ name: instance.drawerLabel, isHeader: true })

        if (isCurrent) items.push({ name: 'Search Images', path: '/search', isAtlas: true })
        else
            items.push({
                name: 'Search Images',
                path: `${instance.baseUrl}/search`,
                isAtlas: true,
                openInNewTab: true,
                isCrossInstance: true,
            })

        if (instance.enableArchiveExplorer)
            if (isCurrent)
                items.push({ name: 'Browse Archive', path: '/archive-explorer', isAtlas: true })
            else
                items.push({
                    name: 'Browse Archive',
                    path: `${instance.baseUrl}/archive-explorer`,
                    isAtlas: true,
                    openInNewTab: true,
                    isCrossInstance: true,
                })

        if (instance.enableCart)
            if (isCurrent)
                items.push({ name: 'Cart', path: '/cart', isAtlas: true, showLength: true })
            else
                items.push({
                    name: 'Cart',
                    path: `${instance.baseUrl}/cart`,
                    isAtlas: true,
                    openInNewTab: true,
                    isCrossInstance: true,
                })

        if (isCurrent)
            items.push({
                name: 'Documentation',
                path: '/documentation',
                isAtlas: true,
                openInNewTab: true,
            })
        else
            items.push({
                name: 'Documentation',
                path: `${instance.baseUrl}/documentation`,
                isAtlas: true,
                openInNewTab: true,
                isCrossInstance: true,
            })
    })

    items.push(
        { name: 'Data', isHeader: true },
        { name: 'Volumes', path: 'https://pds-imaging.jpl.nasa.gov/volumes/', isData: true },
        { name: 'Holdings', path: 'https://pds-imaging.jpl.nasa.gov/holdings/', isData: true },
        { name: 'Portal', path: 'https://pds-imaging.jpl.nasa.gov/portal/', isData: true },
        {
            name: 'Release Calendar',
            path: 'https://pds.nasa.gov/datasearch/subscription-service/data-release-calendar.shtml',
            isData: true,
            isExternal: true,
        },
        { name: 'Tools & Tutorials', path: 'https://pds-imaging.jpl.nasa.gov/software/' },
        { name: 'Help', path: 'https://pds-imaging.jpl.nasa.gov/help/help.html' }
    )

    return items
}

const drawerItems = buildDrawerItems()

const NavigationDrawer = ({ open, onClose }) => {
    const c = useStyles()

    const location = useLocation()
    const navigate = useNavigate()
    const publicUrl = getPublicUrl()

    const cart = useSelector((state) => {
        return state.get('cart').toJS() || []
    })
    const cartLength = cart.length

    const pathRoot = location.pathname.split('?')[0]

    return (
        <Drawer
            anchor={'left'}
            variant={'temporary'}
            open={open}
            onClose={onClose}
            PaperProps={{ className: c.drawer }}
        >
            <List className={c.list}>
                {drawerItems.map((item, idx) => (
                    <ListItem
                        className={clsx(c.listItem, {
                            [c.listItemNoClick]: item.isHeader,
                            [c.listItemHeader]: item.isHeader,
                            [c.listIndent]: item.isAtlas || item.isData || item.isPDS,
                        })}
                        key={idx}
                    >
                        <a
                            className={clsx(c.aLink, {
                                [c.activePath]:
                                    !item.openInNewTab &&
                                    (item.path === pathRoot ||
                                        (item.path &&
                                            item.name != 'Home' &&
                                            pathRoot.indexOf(item.path) === 0)),
                            })}
                            onClick={(e) => {
                                if (item.isAtlas && !item.openInNewTab) {
                                    e.preventDefault()
                                    onClose()
                                    navigate(`${item.path}`)
                                } else if (item.openInNewTab) 
                                    onClose()
                                
                            }}
                            target={item.openInNewTab ? '_blank' : '__blank'}
                            href={
                                item.isAtlas && item.openInNewTab && !item.isCrossInstance
                                    ? `${publicUrl}${item.path}`
                                    : item.path
                            }
                            rel="noopener noreferrer"
                        >
                            {item.name === 'Search Images' && (
                                <div className={c.navIcon}>
                                    <ImageSearchIcon />
                                </div>
                            )}
                            {item.name === 'Browse Archive' && (
                                <div className={c.navIcon}>
                                    <AccountTreeIcon />
                                </div>
                            )}
                            {item.name === 'Cart' && (
                                <div className={c.navIcon}>
                                    <ShoppingCartOutlinedIcon />
                                </div>
                            )}
                            {item.name === 'Documentation' && (
                                <div className={c.navIcon}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        style={{
                                            fill: 'currentColor',
                                        }}
                                    >
                                        <path d="M7 7H5A2 2 0 0 0 3 9V17H5V13H7V17H9V9A2 2 0 0 0 7 7M7 11H5V9H7M14 7H10V17H12V13H14A2 2 0 0 0 16 11V9A2 2 0 0 0 14 7M14 11H12V9H14M20 9V15H21V17H17V15H18V9H17V7H21V9Z" />
                                    </svg>
                                </div>
                            )}
                            {item.isExternal && (
                                <div className={c.navIcon}>
                                    <OpenInNewIcon />
                                </div>
                            )}
                            <ListItemText primary={item.name}> </ListItemText>
                            {item.showLength && cartLength > 0 ? (
                                <div className={c.cartLength}>
                                    {cartLength > 99 ? '99+' : cartLength}
                                </div>
                            ) : null}
                        </a>
                    </ListItem>
                ))}
            </List>
        </Drawer>
    )
}

NavigationDrawer.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
}

export default NavigationDrawer
