import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import clsx from 'clsx'

import { makeStyles } from '@mui/styles'

import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
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
        display: 'flex',
        alignItems: 'center',
        alignSelf: 'stretch',
        flexShrink: 0,
        padding: '0 12px',
        marginRight: '4px',
        borderRight: `1px solid ${theme.palette.swatches.grey.grey200}`,
    },
    group: {
        'borderRadius': '2px',
        '& .MuiButton-root': {
            fontSize: '12px',
            lineHeight: '16px',
            minWidth: 0,
            padding: '4px 8px',
            borderRadius: '2px',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            color: theme.palette.swatches.grey.grey700,
            background: theme.palette.swatches.grey.grey0,
            borderColor: theme.palette.swatches.grey.grey300,
            transition: 'background 0.15s ease-out, border-color 0.15s ease-out',
        },
        '& .MuiButton-root:hover': {
            borderColor: theme.palette.swatches.grey.grey500,
            background: theme.palette.swatches.grey.grey150,
        },
        '& .MuiButton-startIcon': {
            marginRight: '4px',
        },
        '& .MuiSvgIcon-root': {
            fontSize: '16px',
        },
    },
    arrow: {
        padding: '4px 2px !important',
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
    menuliIcon: {
        fontSize: '15px',
        opacity: 0.6,
        flexShrink: 0,
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
    // Per-asset open and download, kept clear of the copy click.
    menuliActions: {
        display: 'flex',
        flexShrink: 0,
        marginRight: '-8px',
    },
    menuliAction: {
        'color': theme.palette.text.secondary,
        'opacity': 0.6,
        'padding': '4px',
        'transition': 'opacity 0.2s ease-out, background 0.2s ease-out',
        '&:hover': {
            opacity: 1,
            background: theme.palette.swatches.grey.grey600,
        },
        '& .MuiSvgIcon-root': {
            fontSize: '16px',
        },
    },
    groupDivider: {
        margin: '6px 0px 0px',
        borderTop: `1px solid ${theme.palette.swatches.grey.grey600}`,
        listStyle: 'none',
    },
    groupLabel: {
        padding: '6px 16px 2px 16px',
        color: theme.palette.text.secondary,
        opacity: 0.6,
        fontSize: '10px',
        letterSpacing: '0.08em',
        lineHeight: '14px',
        textTransform: 'uppercase',
        listStyle: 'none',
        pointerEvents: 'none',
    },
}))

/**
 * The page's copy menu. Clicking the button copies the page link; the caret
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

    const copyItem = (item) => {
        if (typeof item.onCopy === 'function') {
            item.onCopy()
            return
        }
        const value = typeof item.value === 'function' ? item.value() : item.value
        copyToClipboard(value)
        dispatch(setSnackBarText(item.message || `Copied ${item.label} to clipboard!`, 'success'))
    }

    const copyPageLink = () => {
        copyToClipboard(window.location.href)
        dispatch(setSnackBarText('Copied URL to clipboard!', 'success'))
    }

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
        if (event.key === 'Escape' || event.key === 'Tab') {
            event.preventDefault()
            setOpen(false)
            anchorEl?.focus()
        }
    }

    return (
        <div className={clsx(c.CopyLinks, className)} onKeyDown={handleKeyDown}>
            <ButtonGroup
                className={c.group}
                variant="outlined"
                color="secondary"
                size="small"
                aria-label={ariaLabel || 'copy links'}
            >
                <Tooltip title="Copy link to this page" arrow>
                    <Button
                        aria-label="copy page link"
                        startIcon={<LinkIcon fontSize="small" />}
                        onClick={copyPageLink}
                    >
                        Copy
                    </Button>
                </Tooltip>
                {items.length > 0 && (
                    <Button
                        className={c.arrow}
                        aria-controls={open ? 'copy-links-menu' : undefined}
                        aria-expanded={open ? 'true' : undefined}
                        aria-label="copy links options"
                        aria-haspopup="menu"
                        onClick={() => setOpen((prev) => !prev)}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown' && !open) {
                                e.preventDefault()
                                setOpen(true)
                            }
                        }}
                        ref={setAnchorEl}
                    >
                        <ArrowDropDownIcon />
                    </Button>
                )}
            </ButtonGroup>
            <Popper
                className={c.popper}
                open={open}
                anchorEl={anchorEl}
                placement="bottom-start"
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom-start' ? 'left top' : 'left bottom',
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList
                                    id="copy-links-menu"
                                    className={c.menu}
                                    autoFocusItem={open}
                                    dense
                                >
                                    {items.map((item, index) => (
                                        <React.Fragment key={item.key || index}>
                                            {item.groupLabel != null && (
                                                <>
                                                    {index > 0 && (
                                                        <li
                                                            className={c.groupDivider}
                                                            role="separator"
                                                        />
                                                    )}
                                                    <li className={c.groupLabel}>
                                                        {item.groupLabel}
                                                    </li>
                                                </>
                                            )}
                                            <MenuItem
                                                className={c.menuli}
                                                aria-label={`copy ${item.label}`}
                                                onClick={() => {
                                                    copyItem(item)
                                                    setOpen(false)
                                                }}
                                            >
                                                <div className={c.menuliLeft}>
                                                    <ContentCopyIcon className={c.menuliIcon} />
                                                    <div className={c.menuName}>{item.label}</div>
                                                    {item.subname != null && (
                                                        <div className={c.menuSubname}>
                                                            {item.subname}
                                                        </div>
                                                    )}
                                                </div>
                                                {item.url != null && (
                                                    <div className={c.menuliActions}>
                                                        <Tooltip title="Open in new tab" arrow>
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
                                                        <Tooltip title="Download" arrow>
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
                                                    </div>
                                                )}
                                            </MenuItem>
                                        </React.Fragment>
                                    ))}
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
