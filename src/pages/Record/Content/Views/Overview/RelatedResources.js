import React from 'react'
import PropTypes from 'prop-types'

import Tooltip from '@mui/material/Tooltip'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { makeStyles } from '@mui/styles'

import { ES_PATHS } from '../../../../../core/constants.js'
import { getIn, getPDSUrl, getFilename } from '../../../../../core/utils.js'
import {
    formatSisSize,
    formatSisTitle,
    getSisForInstrument,
    getSisGap,
} from '../../../../../core/sis.js'

const useStyles = makeStyles((theme) => ({
    cards: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: '8px',
        marginBottom: '20px',
    },
    card: {
        'boxSizing': 'border-box',
        'display': 'grid',
        'gridTemplateColumns': 'auto minmax(0, 1fr) auto',
        'alignItems': 'center',
        'columnGap': '10px',
        'padding': '10px',
        'borderRadius': '3px',
        'border': `1px solid ${theme.palette.swatches.grey.grey200}`,
        'background': theme.palette.swatches.grey.grey0,
        'color': 'inherit',
        'textDecoration': 'none',
        'transition': 'border-color 0.15s ease-out, box-shadow 0.15s ease-out',
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey300,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        },
    },
    badge: {
        'display': 'flex',
        'alignItems': 'center',
        'justifyContent': 'center',
        'width': '32px',
        'height': '32px',
        'borderRadius': '3px',
        'background': theme.palette.swatches.grey.grey150,
        'color': theme.palette.swatches.grey.grey600,
        '& .MuiSvgIcon-root': {
            fontSize: '18px',
        },
    },
    title: {
        overflow: 'hidden',
        color: theme.palette.swatches.grey.grey700,
        fontSize: '14px',
        fontWeight: 'bold',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    note: {
        color: theme.palette.swatches.grey.grey500,
        fontSize: '12px',
        lineHeight: 1.4,
    },
    // Mirrors and archive-resident copies, kept small under the canonical link.
    alternates: {
        'display': 'flex',
        'flexWrap': 'wrap',
        'gap': '2px 8px',
        'marginTop': '2px',
        'color': theme.palette.swatches.grey.grey500,
        'fontSize': '12px',
        '& > a': {
            'color': 'inherit',
            '&:hover, &:focus-visible': {
                color: theme.palette.swatches.grey.grey700,
            },
        },
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: theme.palette.swatches.grey.grey500,
        fontSize: '12px',
    },
    actionIcon: {
        fontSize: '16px',
    },
    // A recorded absence reads as a resource too, so it keeps the card rhythm.
    gapCard: {
        boxSizing: 'border-box',
        padding: '10px 12px',
        marginBottom: '20px',
        borderRadius: '3px',
        border: `1px dashed ${theme.palette.swatches.grey.grey200}`,
        color: theme.palette.swatches.grey.grey600,
        fontSize: '13px',
        fontStyle: 'italic',
        lineHeight: 1.5,
    },
}))

const hostOf = (url) => {
    try {
        return new URL(url).hostname.replace(/^www\./, '')
    } catch {
        return url
    }
}

const first = (value) => (Array.isArray(value) ? value[0] : value)

/**
 * Off-page documentation for the product: the SIS documents defining its data
 * products (or the recorded reason none exists) and its label as archived.
 */
export const RelatedResources = (props) => {
    const { recordData, headingClassName } = props

    const c = useStyles()

    const mission = first(getIn(recordData, ES_PATHS.mission))
    const instruments = getIn(recordData, ES_PATHS.instrument)
    const documents = getSisForInstrument(mission, instruments)
    const gap = documents.length === 0 ? getSisGap(mission, instruments) : null

    const labelFile = getIn(recordData, ES_PATHS.label)
    const labelUrl = labelFile
        ? getPDSUrl(labelFile, getIn(recordData, ES_PATHS.release_id))
        : null

    if (documents.length === 0 && gap == null && labelUrl == null) return null

    const renderCard = (key, { href, title, note, alternates, size, tooltip }) => (
        <Tooltip title={tooltip} arrow key={key}>
            <a className={c.card} href={href} target="_blank" rel="noopener noreferrer">
                <div className={c.badge}>
                    <DescriptionOutlinedIcon />
                </div>
                <div>
                    <div className={c.title}>{title}</div>
                    {note != null && <div className={c.note}>{note}</div>}
                    {alternates != null && alternates.length > 0 && (
                        <div className={c.alternates}>
                            <span>Also at</span>
                            {alternates.map((url) => (
                                <a
                                    href={url}
                                    key={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    {hostOf(url)}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
                <div className={c.actions}>
                    {size != null && <span>{size}</span>}
                    <OpenInNewIcon className={c.actionIcon} />
                </div>
            </a>
        </Tooltip>
    )

    return (
        <>
            <div className={headingClassName}>Related Resources</div>
            {gap != null && <div className={c.gapCard}>{gap.note}</div>}
            {(documents.length > 0 || labelUrl != null) && (
                <div className={c.cards} aria-label="related resources">
                    {documents.map((document) =>
                        renderCard(document.id, {
                            href: document.url,
                            title: formatSisTitle(document),
                            note: document.note,
                            alternates: document.alternates,
                            size: formatSisSize(document.size),
                            tooltip:
                                'Software Interface Specification — defines this product’s data',
                        })
                    )}
                    {labelUrl != null &&
                        renderCard('label', {
                            href: labelUrl,
                            title: 'Raw PDS label',
                            note: getFilename(labelFile),
                            tooltip: 'Open the label file as archived',
                        })}
                </div>
            )}
        </>
    )
}

RelatedResources.propTypes = {
    recordData: PropTypes.object,
    headingClassName: PropTypes.string,
}

export default RelatedResources
