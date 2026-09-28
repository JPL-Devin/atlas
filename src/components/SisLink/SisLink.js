import React from 'react'
import PropTypes from 'prop-types'

import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { makeStyles } from '@mui/styles'

import { formatSisSize, formatSisTitle } from '../../core/sis'

const useStyles = makeStyles((theme) => ({
    link: {
        'display': 'inline-flex',
        'alignItems': 'center',
        'gap': '4px',
        'color': 'inherit',
        'textDecoration': 'none',
        '&:hover, &:focus-visible': {
            color: theme.palette.swatches.grey.grey700,
            textDecoration: 'underline',
        },
    },
    icon: {
        fontSize: '1em',
        flexShrink: 0,
    },
    size: {
        color: theme.palette.swatches.grey.grey500,
    },
}))

/**
 * Links a SIS document's PDF, showing its download size since these run from a
 * few hundred KB to tens of MB. `label` overrides the generated title. A
 * document with no `url` is cited as plain text.
 */
export const SisLink = (props) => {
    const { document, label } = props

    const c = useStyles()

    const size = formatSisSize(document.size)

    if (document.url == null) {
        return <span title={document.note || undefined}>{label || formatSisTitle(document)}</span>
    }

    return (
        <a
            className={c.link}
            href={document.url}
            target="_blank"
            rel="noopener noreferrer"
            title={document.note || undefined}
        >
            <span>{label || formatSisTitle(document)}</span>
            <OpenInNewIcon className={c.icon} />
            {size != null && <span className={c.size}>{size}</span>}
        </a>
    )
}

SisLink.propTypes = {
    document: PropTypes.object.isRequired,
    label: PropTypes.string,
}

export default SisLink
