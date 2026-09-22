import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'

import CopyLinks from './CopyLinks'

import { HASH_PATHS } from '../../core/constants'
import { copyToClipboardAction } from '../../core/redux/actions/actions'
import {
    getRecordCopyItems,
    getFileExplorerCopyItems,
    getSearchCopyItems,
} from '../../core/copyLinks'

// Picks the copy items for whatever page is currently routed.
const TopbarCopyLinks = () => {
    const location = useLocation()
    const dispatch = useDispatch()

    const recordData = useSelector((state) => state.get('recordData'))
    const filexPreview = useSelector((state) => state.get('filexPreview'))
    const columns = useSelector((state) => state.get('columns'))

    let items = []
    switch (location.pathname) {
        case HASH_PATHS.record:
            items = getRecordCopyItems(recordData.toJS ? recordData.toJS() : recordData)
            break
        case HASH_PATHS.fileExplorer:
            items = getFileExplorerCopyItems(
                typeof filexPreview?.toJS === 'function' ? {} : filexPreview,
                typeof columns?.toJS === 'function' ? [] : columns
            )
            break
        case HASH_PATHS.search:
            items = getSearchCopyItems((type) => dispatch(copyToClipboardAction(type)))
            break
        default:
    }

    return <CopyLinks ariaLabel="copy links" items={items} />
}

export default TopbarCopyLinks
