import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import clsx from 'clsx'

import { makeStyles } from '@mui/styles'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'

import LinkIcon from '@mui/icons-material/Link'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import GetAppIcon from '@mui/icons-material/GetApp'

import { copyToClipboard, getFilename } from '../../core/utils'
import { streamDownloadFile } from '../../core/downloaders/ZipStream.js'
import { setSnackBarText } from '../../core/redux/actions/actions'

const useStyles = makeStyles((theme) => ({
    // Leads the Topbar's right cluster; the faint rule separates it from nav.
    CopyLinks: {
        'display': 'flex',
        'alignItems': 'center',
        'flexShrink': 0,
        'padding': '0 0 0 12px',
        'marginRight': '4px',
        '&::after': {
            content: '""',
            width: '1px',
            height: '20px',
            marginLeft: '12px',
            background: theme.palette.swatches.grey.grey300,
        },
    },
    button: {
        'fontSize': '12px',
        'lineHeight': '16px',
        'minWidth': 0,
        'padding': '4px 4px 4px 8px',
        'borderRadius': '2px',
        'textTransform': 'none',
        'whiteSpace': 'nowrap',
        'color': theme.palette.swatches.grey.grey700,
        'background': theme.palette.swatches.grey.grey0,
        'borderColor': theme.palette.swatches.grey.grey300,
        'transition': 'background 0.15s ease-out, border-color 0.15s ease-out',
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey500,
            background: theme.palette.swatches.grey.grey150,
        },
        '& .MuiButton-startIcon': {
            marginRight: '4px',
        },
        '& .MuiButton-endIcon': {
            marginLeft: '2px',
        },
        '& .MuiSvgIcon-root': {
            fontSize: '16px',
        },
    },
    popper: {
        zIndex: 3000,
        marginTop: '5px',
    },
    menu: {
        background: theme.palette.swatches.grey.grey800,
        color: theme.palette.text.secondary,
        borderRadius: '3px',
        minWidth: '260px',
    },
    menuli: {
        'display': 'flex',
        'justifyContent': 'space-between',
        'alignItems': 'center',
        'gap': '16px',
        'fontSize': '14px',
        'minHeight': '36px',
        'padding': '0 6px 0 12px',
        'borderLeft': '4px solid rgba(0,0,0,0)',
        'transition': 'background 0.2s ease-out',
        '&:hover': {
            background: theme.palette.swatches.grey.grey700,
        },
    },
    menuliLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0,
    },
    menuName: {
        lineHeight: '27px',
        whiteSpace: 'nowrap',
    },
    menuSubname: {
        opacity: 0.7,
        fontSize: '12px',
        whiteSpace: 'nowrap',
    },
    menuliActions: {
        display: 'flex',
        flexShrink: 0,
        gap: '2px',
    },
    menuliAction: {
        'color': theme.palette.text.secondary,
        'opacity': 0.7,
        'padding': '5px',
        'transition': 'opacity 0.2s ease-out, background 0.2s ease-out',
        '&:hover': {
            opacity: 1,
            background: theme.palette.swatches.grey.grey600,
        },
        '& .MuiSvgIcon-root': {
            fontSize: '18px',
        },
    },
    // Theme tooltips are grey800, the same as the menu, so invert them here.
    tooltipPopper: {
        zIndex: 3100,
    },
    tooltip: {
        background: theme.palette.swatches.grey.grey100,
        color: theme.palette.swatches.grey.grey900,
        fontSize: '12px',
    },
    tooltipArrow: {
        color: theme.palette.swatches.grey.grey100,
    },
    groupDivider: {
        margin: '6px 0px 0px',
        borderTop: `1px solid ${theme.palette.swatches.grey.grey600}`,
        listStyle: 'none',
    },
    groupLabel: {
        padding: '6px 16px 2px 16px',
        color: theme.palette.swatches.yellow.yellow700,
        fontSize: '10px',
        letterSpacing: '0.08em',
        lineHeight: '14px',
        textTransform: 'uppercase',
        listStyle: 'none',
        pointerEvents: 'none',
    },
}))

/**
 * The page's copy menu. The page link is always the first item; `items`
 * lists everything else copyable here.
 *
 * items: [{
 *   label: 'PDS Label URL',
 *   subname: '.LBL (2 KB)',          // optional
 *   value: 'https://...',            // string, or () => string
 *   message: 'Copied PDS Label URL', // optional snackbar text
 *   groupLabel: 'Product URLs',      // optional header rendered above this item
 *   url: 'https://...',              // optional; enables Open and Download
 *   filename: 'file.lbl',            // optional download name, else from url
 *   onCopy: () => {},                // optional; replaces the default copy
 * }]
 */
const CopyLinks = (props) => {
    const { items, ariaLabel, className } = props

    const c = useStyles()
    const dispatch = useDispatch()

    const [open, setOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null)

    const tooltipClasses = { popper: c.tooltipPopper, tooltip: c.tooltip, arrow: c.tooltipArrow }

    const copyItem = (item) => {
        if (typeof item.onCopy === 'function') {
            item.onCopy()
            return
        }
        const value = typeof item.value === 'function' ? item.value() : item.value
        copyToClipboard(value)
        dispatch(setSnackBarText(item.message || `Copied ${item.label} to clipboard!`, 'success'))
    }

    const menuItems = [
        {
            key: 'page',
            groupLabel: 'Main',
            label: 'Page Link',
            value: () => window.location.href,
            message: 'Copied URL to clipboard!',
        },
        ...items,
    ]

    const handleClose = (event) => {
        if (anchorEl && anchorEl.contains(event.target)) {
            return
        }
        setOpen(false)
    }

    const handleKeyDown = (event) => {
        if (!open) {
            return
        }
        if (event.key === 'Escape') {
            event.preventDefault()
            setOpen(false)
            anchorEl?.focus()
        }
    }

    // Tab moves natively (into an item's Open/Download); close once focus leaves the menu.
    const handleMenuBlur = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setOpen(false)
        }
    }

    return (
        <div className={clsx(c.CopyLinks, className)}>
            <Button
                className={c.button}
                variant="outlined"
                color="secondary"
                size="small"
                aria-controls={open ? 'quick-links-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-label={ariaLabel || 'quick links'}
                aria-haspopup="menu"
                startIcon={<LinkIcon fontSize="small" />}
                endIcon={<ArrowDropDownIcon />}
                onClick={() => setOpen((prev) => !prev)}
                onKeyDown={(e) => {
                    handleKeyDown(e)
                    if (e.key === 'ArrowDown' && !open) {
                        e.preventDefault()
                        setOpen(true)
                    }
                }}
                ref={setAnchorEl}
            >
                Quick Links
            </Button>
            <Popper
                className={c.popper}
                open={open}
                anchorEl={anchorEl}
                placement="bottom-end"
                transition
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom-end' ? 'right top' : 'right bottom',
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList
                                    id="quick-links-menu"
                                    className={c.menu}
                                    autoFocusItem={open}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleMenuBlur}
                                    dense
                                >
                                    {menuItems.flatMap((item, index) => [
                                        // MenuList's autofocus/arrow-key logic only sees direct
                                        // children, so headers are flat, non-focusable siblings.
                                        item.groupLabel != null && index > 0 && (
                                            <li
                                                key={`${item.key || index}_divider`}
                                                className={c.groupDivider}
                                                role="separator"
                                                disabled
                                            />
                                        ),
                                        item.groupLabel != null && (
                                            <li
                                                key={`${item.key || index}_group`}
                                                className={c.groupLabel}
                                                role="presentation"
                                                disabled
                                            >
                                                {item.groupLabel}
                                            </li>
                                        ),
                                        <MenuItem
                                            key={item.key || index}
                                            className={c.menuli}
                                            aria-label={`copy ${item.label}`}
                                            onClick={() => {
                                                copyItem(item)
                                                setOpen(false)
                                            }}
                                        >
                                            <div className={c.menuliLeft}>
                                                <div className={c.menuName}>{item.label}</div>
                                                {item.subname != null && (
                                                    <div className={c.menuSubname}>
                                                        {item.subname}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={c.menuliActions}>
                                                <Tooltip
                                                    title="Copy"
                                                    arrow
                                                    classes={tooltipClasses}
                                                >
                                                    <IconButton
                                                        className={c.menuliAction}
                                                        aria-label={`copy ${item.label} button`}
                                                        size="small"
                                                        tabIndex={-1}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            copyItem(item)
                                                            setOpen(false)
                                                        }}
                                                    >
                                                        <ContentCopyIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                {item.url != null && (
                                                    <Tooltip
                                                        title="Open in new tab"
                                                        arrow
                                                        classes={tooltipClasses}
                                                    >
                                                        <IconButton
                                                            className={c.menuliAction}
                                                            aria-label={`open ${item.label}`}
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                window.open(item.url, '_blank')
                                                                setOpen(false)
                                                            }}
                                                        >
                                                            <OpenInNewIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {item.url != null && (
                                                    <Tooltip
                                                        title="Download"
                                                        arrow
                                                        classes={tooltipClasses}
                                                    >
                                                        <IconButton
                                                            className={c.menuliAction}
                                                            aria-label={`download ${item.label}`}
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                streamDownloadFile(
                                                                    item.url,
                                                                    item.filename ||
                                                                        getFilename(item.url)
                                                                )
                                                                setOpen(false)
                                                            }}
                                                        >
                                                            <GetAppIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </MenuItem>,
                                    ])}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </div>
    )
}

CopyLinks.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string,
            label: PropTypes.string.isRequired,
            subname: PropTypes.string,
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
            message: PropTypes.string,
            groupLabel: PropTypes.string,
            url: PropTypes.string,
            filename: PropTypes.string,
            onCopy: PropTypes.func,
        })
    ).isRequired,
    ariaLabel: PropTypes.string,
    className: PropTypes.string,
}

export default CopyLinks
