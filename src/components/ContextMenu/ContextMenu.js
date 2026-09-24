import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'

import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Divider from '@mui/material/Divider'

import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import GetAppIcon from '@mui/icons-material/GetApp'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'

import { HASH_PATHS } from '../../core/constants'
import { getPDSUrl, getFilename, copyToClipboard } from '../../core/utils'
import { getPublicUrl } from '../../core/runtimeConfig'
import { streamDownloadFile } from '../../core/downloaders/ZipStream.js'
import { setSnackBarText } from '../../core/redux/actions/actions'

const useStyles = makeStyles((theme) => ({
    paper: {
        background: theme.palette.swatches.grey.grey800,
        color: theme.palette.text.secondary,
        minWidth: '170px',
        maxWidth: '370px',
    },
    title: {
        'fontSize': '13px',
        'fontWeight': 'bold',
        'color': theme.palette.swatches.yellow.yellow700,
        'whiteSpace': 'normal',
        'overflowWrap': 'anywhere',
        'display': 'block',
        'opacity': '1 !important',
        'cursor': 'default',
        '&.Mui-disabled': {
            opacity: 1,
        },
    },
    item: {
        'fontSize': '14px',
        'borderLeft': '4px solid rgba(0,0,0,0)',
        'transition': 'background 0.2s ease-out',
        '&:hover': {
            background: theme.palette.swatches.grey.grey700,
        },
    },
    icon: {
        'minWidth': '32px !important',
        'color': theme.palette.swatches.grey.grey400,
        '& svg': {
            fontSize: '18px',
        },
    },
    divider: {
        'borderColor': `${theme.palette.swatches.grey.grey600} !important`,
        'margin': '4px 0px !important',
    },
}))

const ICONS = {
    copy: ContentCopyIcon,
    open: OpenInNewIcon,
    download: GetAppIcon,
    cart: AddShoppingCartIcon,
}

export const recordPageUrl = (uri) => `${getPublicUrl()}${HASH_PATHS.record}?uri=${uri}`

export const openRecordInNewTab = (uri) => {
    if (uri) {window.open(recordPageUrl(uri), '_blank')}
}

// True when a mouse event should open the target in a new tab instead of
// navigating in-app (ctrl/cmd+click or middle-click)
export const isNewTabClick = (e) => e != null && (e.ctrlKey || e.metaKey || e.button === 1)

// Shared click handling for elements that navigate to a record page
export const recordClickHandlers = (uri, navigate, extraParams) => {
    const params = extraParams ? `&${extraParams}` : ''
    return {
        onClick: (e) => {
            if (!uri) {return}
            if (isNewTabClick(e)) {
                e.preventDefault()
                window.open(`${recordPageUrl(uri)}${params}`, '_blank')
            } else {
                navigate(`${HASH_PATHS.record}?uri=${uri}${params}`)
            }
        },
        onAuxClick: (e) => {
            if (!uri) {return}
            if (e.button === 1) {
                e.preventDefault()
                window.open(`${recordPageUrl(uri)}${params}`, '_blank')
            }
        },
    }
}

/**
 * Builds the standard set of context menu items for a product record.
 * Items whose underlying uri is missing are omitted.
 * @param {Object} opts
 * @param {string} opts.sourceUri  product source uri (also used for "Open in new tab")
 * @param {string} opts.labelUri
 * @param {string} opts.browseUri
 * @param {string|number} opts.releaseId
 * @param {Function} opts.dispatch redux dispatch
 * @param {boolean} opts.openInNewTab include "Open in new tab" (default true)
 */
export const buildRecordMenuItems = ({
    filename,
    sourceUri,
    labelUri,
    browseUri,
    releaseId,
    dispatch,
    openInNewTab = true,
    recordUri = sourceUri,
    sourceReleaseId = releaseId,
}) => {
    const name = filename || getFilename(sourceUri)
    const copy = (text, what) => () => {
        copyToClipboard(text)
        dispatch(setSnackBarText(`Copied ${what} to clipboard!`, 'success'))
    }
    const download = (uri, rid = releaseId) => () => {
        streamDownloadFile(getPDSUrl(uri, rid), getFilename(uri))
    }

    const copyItems = []
    if (name) {copyItems.push({ label: 'Copy filename', icon: 'copy', onClick: copy(name, 'filename') })}
    if (labelUri)
        {copyItems.push({
            label: 'Copy label URL',
            icon: 'copy',
            onClick: copy(getPDSUrl(labelUri, releaseId), 'label URL'),
        })}
    if (browseUri)
        {copyItems.push({
            label: 'Copy browse URL',
            icon: 'copy',
            onClick: copy(getPDSUrl(browseUri, releaseId), 'browse URL'),
        })}
    if (sourceUri)
        {copyItems.push({
            label: 'Copy source URL',
            icon: 'copy',
            onClick: copy(getPDSUrl(sourceUri, sourceReleaseId), 'source URL'),
        })}

    const openItems = []
    if (openInNewTab && recordUri)
        {openItems.push({
            label: 'Open in new tab',
            icon: 'open',
            onClick: () => openRecordInNewTab(recordUri),
        })}

    const downloadItems = []
    if (labelUri)
        {downloadItems.push({ label: 'Download label', icon: 'download', onClick: download(labelUri) })}
    if (browseUri)
        {downloadItems.push({
            label: 'Download browse',
            icon: 'download',
            onClick: download(browseUri),
        })}
    if (sourceUri)
        {downloadItems.push({
            label: 'Download source',
            icon: 'download',
            onClick: download(sourceUri, sourceReleaseId),
        })}

    const items = []
    ;[copyItems, openItems, downloadItems].forEach((group) => {
        if (group.length === 0) {return}
        if (items.length > 0) {items.push('-')}
        items.push(...group)
    })
    return items
}

/**
 * Hook managing the open state/position of a ContextMenu.
 * `openContextMenu(e, data)` should be passed to an element's onContextMenu.
 */
export const useContextMenu = () => {
    const [contextMenu, setContextMenu] = useState(null)

    const openContextMenu = useCallback((e, data) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, data })
    }, [])

    const closeContextMenu = useCallback(() => {
        setContextMenu(null)
    }, [])

    return { contextMenu, openContextMenu, closeContextMenu }
}

const ContextMenu = (props) => {
    const { contextMenu, onClose, title, items } = props
    const c = useStyles()

    const open = contextMenu != null

    return (
        <Menu
            open={open}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={
                open ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
            }
            classes={{ paper: c.paper }}
            MenuListProps={{ dense: true }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
        >
            {title != null ? (
                <MenuItem className={c.title} disabled title={title}>
                    {title}
                </MenuItem>
            ) : null}
            {title != null && items.length > 0 ? <Divider className={c.divider} /> : null}
            {items.map((item, idx) => {
                if (item === '-') {return <Divider key={idx} className={c.divider} />}
                const Icon = item.icon ? ICONS[item.icon] : null
                return (
                    <MenuItem
                        key={idx}
                        className={c.item}
                        disabled={item.disabled === true}
                        onClick={(e) => {
                            e.stopPropagation()
                            if (typeof item.onClick === 'function') {item.onClick(contextMenu.data)}
                            onClose()
                        }}
                    >
                        {Icon ? (
                            <ListItemIcon className={c.icon}>
                                <Icon />
                            </ListItemIcon>
                        ) : null}
                        {item.label}
                    </MenuItem>
                )
            })}
        </Menu>
    )
}

ContextMenu.propTypes = {
    contextMenu: PropTypes.shape({
        mouseX: PropTypes.number,
        mouseY: PropTypes.number,
        data: PropTypes.any,
    }),
    onClose: PropTypes.func.isRequired,
    title: PropTypes.string,
    items: PropTypes.array.isRequired,
}

export default ContextMenu
