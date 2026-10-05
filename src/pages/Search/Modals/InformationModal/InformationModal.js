import React, { Fragment, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'

import { setModal } from '../../../../core/redux/actions/actions.js'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import CloseSharpIcon from '@mui/icons-material/CloseSharp'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import NASALogoPath from '../../../../media/images/nasa-logo.svg'
import { getPublicUrl } from '../../../../core/runtimeConfig'
import { getAppConfig } from '../../../../core/appConfig'
import {
    formatReleaseDate,
    getAppVersion,
    getReleases,
    getAppVersionDate,
    groupReleaseNotesByMonth,
    placeReleaseMarkers,
    useReleaseNotes,
} from '../../../../core/releaseNotes'

// Construct runtime-aware logo URL
const getNASALogoUrl = () => {
    const publicUrl = getPublicUrl()
    const relativePath =
        NASALogoPath.match(/\/(static\/.+)$/)?.[1] || NASALogoPath.replace(/^\//, '')
    return `${publicUrl}/${relativePath}`
}

const useStyles = makeStyles((theme) => ({
    InformationModal: {
        margin: theme.headHeights[1],
        [theme.breakpoints.down('sm')]: {
            margin: '6px',
        },
    },
    contents: {
        background: theme.palette.primary.main,
        width: '960px',
        maxWidth: '960px',
    },
    contentsMobile: {
        background: theme.palette.primary.main,
        height: '100%',
    },
    content: {
        padding: '20px 40px 8px 40px',
        height: `calc(100% - ${theme.headHeights[2]}px)`,
        textAlign: 'center',
    },
    flexBetween: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    head: {
        display: 'flex',
        justifyContent: 'center',
        [theme.breakpoints.down('sm')]: {
            flexFlow: 'column',
        },
    },
    closeIcon: {
        padding: theme.spacing(1.5),
        margin: '4px',
        position: 'absolute',
        top: '0px',
        right: '0px',
    },
    logo: {
        '& > img': {
            width: '100px',
            height: '100px',
            marginLeft: '12px',
        },
    },
    pdsAndNode: {
        textAlign: 'left',
        padding: '26px 0px',
        [theme.breakpoints.down('sm')]: {
            paddingTop: '4px',
        },
    },
    pds: {
        fontSize: '18px',
        textTransform: 'uppercase',
        [theme.breakpoints.down('sm')]: {
            textAlign: 'center',
        },
    },
    node: {
        fontSize: '24px',
        [theme.breakpoints.down('sm')]: {
            textAlign: 'center',
        },
    },
    title: {
        margin: `0px 0px ${theme.spacing(6)} 0px`,
        padding: '0px 2px',
        fontSize: '30px',
        fontWeight: 'bold',
        lineHeight: '28px',
        textTransform: 'uppercase',
    },
    description: {
        textAlign: 'justify',
    },
    message: {
        margin: `${theme.spacing(4)} 0px`,
    },
    aLink: {
        color: 'link',
        cursor: 'pointer',
        textDecoration: 'underline',
        fontWeight: 'bold',
    },
    metadata: {
        '& > p': {
            fontFamily: 'monospace',
        },
    },
    releaseNotesStrip: {
        'display': 'flex',
        'alignItems': 'center',
        'gap': theme.spacing(1.5),
        'width': '100%',
        'margin': `${theme.spacing(3)} 0px 0px 0px`,
        'padding': '12px 16px',
        'border': `1px solid ${theme.palette.swatches.grey.grey200}`,
        'borderRadius': '4px',
        'background': theme.palette.swatches.grey.grey100,
        'color': theme.palette.swatches.grey.grey800,
        'font': 'inherit',
        'textAlign': 'left',
        'cursor': 'pointer',
        '&:hover': {
            background: theme.palette.swatches.grey.grey150,
        },
    },
    releaseNotesStripText: {
        flex: 1,
    },
    releaseNotesStripTitle: {
        fontSize: '15px',
        fontWeight: 'bold',
    },
    releaseNotesStripSubtitle: {
        fontSize: '13px',
        color: theme.palette.swatches.grey.grey500,
    },
    notesContent: {
        padding: '0px',
        height: `calc(100% - ${theme.headHeights[2]}px)`,
        display: 'flex',
        flexFlow: 'column',
        textAlign: 'left',
    },
    notesHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 56px 12px 12px',
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey150}`,
    },
    notesBack: {
        marginRight: theme.spacing(1),
    },
    notesTitle: {
        fontSize: '22px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    notesSubtitle: {
        fontSize: '13px',
        color: theme.palette.swatches.grey.grey500,
    },
    notesBody: {
        flex: 1,
        overflowY: 'auto',
        padding: '8px 40px 24px 40px',
        background: theme.palette.swatches.grey.grey100,
        [theme.breakpoints.down('sm')]: {
            padding: '8px 12px 24px 12px',
        },
    },
    monthHeader: {
        margin: `${theme.spacing(3)} 0px ${theme.spacing(1.5)} 0px`,
        fontSize: '14px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: theme.palette.swatches.yellow.yellow800,
    },
    notesColumn: {
        maxWidth: '720px',
        margin: '0px auto',
    },
    monthCards: {
        display: 'flex',
        flexFlow: 'column',
        gap: theme.spacing(1.5),
    },
    releaseMarker: {
        'display': 'flex',
        'alignItems': 'center',
        'gap': theme.spacing(1.5),
        'margin': `${theme.spacing(0.5)} 0px`,
        '&::after': {
            content: '""',
            flex: 1,
            alignSelf: 'center',
            height: '1px',
            marginLeft: theme.spacing(0.5),
            background: theme.palette.swatches.grey.grey200,
        },
    },
    releaseMarkerBeforeMonth: {
        margin: `${theme.spacing(3)} 0px 0px 0px`,
    },
    releaseVersion: {
        padding: '2px 12px',
        fontSize: '16px',
        fontWeight: 'bold',
        letterSpacing: '0.5px',
        color: theme.palette.swatches.grey.grey700,
        background: theme.palette.swatches.grey.grey0,
        border: `1px solid ${theme.palette.swatches.grey.grey200}`,
        borderRadius: '14px',
    },
    releaseDate: {
        fontSize: '11px',
        letterSpacing: '0.5px',
        color: theme.palette.swatches.grey.grey400,
    },
    noteCard: {
        padding: '16px 20px',
        background: theme.palette.swatches.grey.grey0,
        border: `1px solid ${theme.palette.swatches.grey.grey150}`,
        borderRadius: '4px',
    },
    noteType: {
        marginBottom: theme.spacing(0.5),
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: theme.palette.swatches.grey.grey400,
    },
    noteTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        lineHeight: '20px',
        marginBottom: theme.spacing(0.5),
    },
    noteDescription: {
        fontSize: '14px',
        color: theme.palette.swatches.grey.grey600,
    },
    notesEmpty: {
        padding: theme.spacing(4),
        textAlign: 'center',
        color: theme.palette.swatches.grey.grey500,
    },
    footer: {
        'backgroundColor': 'rgba(0,0,0,0)',
        'display': 'flex',
        'justifyContent': 'space-between',
        '& .MuiButton-text': {
            color: theme.palette.primary.light,
        },
    },
}))

const NOTE_TYPE_LABELS = {
    new: 'New',
    improved: 'Improved',
    fixed: 'Fixed',
}

const ReleaseMarker = ({ release, previousVersion, beforeMonth }) => {
    const c = useStyles()
    const date = formatReleaseDate(release.date)
    return (
        <div
            className={[c.releaseMarker, beforeMonth && c.releaseMarkerBeforeMonth]
                .filter(Boolean)
                .join(' ')}
            role="separator"
            aria-label={`version ${release.version}`}
        >
            <span className={c.releaseVersion}>v{release.version}</span>
            <span className={c.releaseDate}>
                {[date, previousVersion && `Changes since v${previousVersion}`]
                    .filter(Boolean)
                    .join(' \u00b7 ')}
            </span>
        </div>
    )
}

ReleaseMarker.propTypes = {
    release: PropTypes.shape({
        version: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
    }).isRequired,
    previousVersion: PropTypes.string,
    beforeMonth: PropTypes.bool,
}

const ReleaseNotes = ({ notes }) => {
    const c = useStyles()
    const releases = getReleases()
    const groups = placeReleaseMarkers(groupReleaseNotesByMonth(notes), releases)
    const previousVersion = (release) => releases[releases.indexOf(release) + 1]?.version

    if (groups.length === 0) {
        return <Typography className={c.notesEmpty}>No release notes yet.</Typography>
    }

    return groups.map((group) => (
        <Fragment key={group.key}>
            {group.releasesBefore.map((release) => (
                <ReleaseMarker
                    key={release.version}
                    release={release}
                    previousVersion={previousVersion(release)}
                    beforeMonth
                />
            ))}
            <section aria-label={group.label}>
                <Typography className={c.monthHeader} variant="h3">
                    {group.label}
                </Typography>
                <div className={c.monthCards}>
                    {group.items.map(({ note, release }) =>
                        release ? (
                            <ReleaseMarker
                                key={release.version}
                                release={release}
                                previousVersion={previousVersion(release)}
                            />
                        ) : (
                            <article key={note.id} className={c.noteCard}>
                                <Typography className={c.noteType}>
                                    {NOTE_TYPE_LABELS[note.type] || NOTE_TYPE_LABELS.new}
                                </Typography>
                                <Typography className={c.noteTitle} variant="h4">
                                    {note.title}
                                </Typography>
                                <Typography className={c.noteDescription}>
                                    {note.description}
                                </Typography>
                            </article>
                        )
                    )}
                </div>
            </section>
        </Fragment>
    ))
}

ReleaseNotes.propTypes = {
    notes: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const InformationModal = () => {
    const c = useStyles()

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    const dispatch = useDispatch()
    const modal = useSelector((state) => {
        const m = state.getIn(['modals', 'information'])
        if (typeof m.toJS === 'function') return m.toJS()
        return m
    })
    const open = modal !== false

    const { notes, markSeen } = useReleaseNotes()
    const [view, setView] = useState('about')

    const openReleaseNotes = () => {
        setView('releaseNotes')
        markSeen()
    }

    const handleClose = () => {
        // close modal
        dispatch(setModal(false))
    }

    return (
        <Dialog
            className={c.InformationModal}
            fullScreen={isMobile}
            open={open}
            onClose={handleClose}
            aria-labelledby="responsive-dialog-title"
            PaperProps={{
                className: isMobile ? c.contentsMobile : c.contents,
            }}
            TransitionProps={{ onExited: () => setView('about') }}
        >
            {view === 'releaseNotes' ? (
                <DialogContent className={c.notesContent}>
                    <div className={c.notesHeader}>
                        <IconButton
                            className={c.notesBack}
                            title="Back to About"
                            aria-label="back to about"
                            onClick={() => setView('about')}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <div>
                            <Typography
                                className={c.notesTitle}
                                variant="h2"
                                id="responsive-dialog-title"
                            >
                                Release Notes
                            </Typography>
                            <Typography className={c.notesSubtitle}>
                                What&apos;s changed in {getAppConfig().appTitle}
                            </Typography>
                        </div>
                        <IconButton
                            className={c.closeIcon}
                            title="Close"
                            aria-label="close"
                            onClick={handleClose}
                            size="large"
                        >
                            <CloseSharpIcon fontSize="inherit" />
                        </IconButton>
                    </div>
                    <div className={c.notesBody}>
                        <div className={c.notesColumn}>
                            <ReleaseNotes notes={notes} />
                        </div>
                    </div>
                </DialogContent>
            ) : (
                <DialogContent className={c.content}>
                    <div className={c.top}>
                        <div className={c.head}>
                            <div className={c.logo}>
                                <img src={getNASALogoUrl()} alt={'NASA Logo'} />
                            </div>
                            <div className={c.pdsAndNode}>
                                <Typography className={c.pds} variant="h3">
                                    Planetary Data System
                                </Typography>
                                <Typography className={c.node} variant="h3">
                                    Cartography and Imaging Sciences
                                </Typography>
                            </div>
                        </div>
                        <Typography className={c.title} variant="h2">
                            {getAppConfig().aboutTitle}
                        </Typography>
                        <IconButton
                            className={c.closeIcon}
                            title="Close"
                            aria-label="close"
                            onClick={handleClose}
                            size="large"
                        >
                            <CloseSharpIcon fontSize="inherit" />
                        </IconButton>
                    </div>
                    <div className={c.bottom}>
                        <div className={c.description}>
                            <Typography>{getAppConfig().aboutDescription}</Typography>
                        </div>
                        {notes.length > 0 && (
                            <button
                                type="button"
                                className={c.releaseNotesStrip}
                                aria-label="view release notes"
                                onClick={openReleaseNotes}
                            >
                                <CardGiftcardOutlinedIcon />
                                <span className={c.releaseNotesStripText}>
                                    <span className={c.releaseNotesStripTitle}>
                                        What&apos;s new in {getAppConfig().appTitle}
                                    </span>
                                    <br />
                                    <span className={c.releaseNotesStripSubtitle}>
                                        Recent features, improvements and fixes, month by month
                                    </span>
                                </span>
                                <ChevronRightIcon />
                            </button>
                        )}
                        <div className={c.message}>
                            <Typography>
                                If you have questions, want to share feedback, or need support,{' '}
                                <a
                                    className={c.aLink}
                                    aria-label="give feedback"
                                    href={`mailto:${getAppConfig().feedbackEmail}?subject=${encodeURIComponent(
                                        `PDS Imaging Node \u2014 ${getAppConfig().appTitle} Feedback`
                                    )}`}
                                >
                                    please send us a message
                                </a>
                                .
                            </Typography>
                        </div>
                        <div className={c.metadata}>
                            <Typography>Version Number: {getAppVersion()}</Typography>
                            <Typography>
                                Clearance Number: {import.meta.env.REACT_APP_CLEARANCE_NUMBER}
                            </Typography>
                            {getAppVersionDate() && (
                                <Typography>Last Updated: {getAppVersionDate()}</Typography>
                            )}
                        </div>
                    </div>
                </DialogContent>
            )}
            <DialogActions className={c.footer}>
                <div className={c.footerLeft}>
                    {view === 'releaseNotes' && (
                        <Button aria-label="back to about" onClick={() => setView('about')}>
                            Back
                        </Button>
                    )}
                    <Button href="https://www.jpl.nasa.gov/jpl-image-use-policy">
                        Image Use Policy
                    </Button>
                    <Button href="https://www.jpl.nasa.gov/caltechjpl-privacy-policies-and-important-notices">
                        Privacy Policy
                    </Button>
                </div>
                <div className={c.footerRight}>
                    <Button title="Close" aria-label="close" onClick={handleClose}>
                        Close
                    </Button>
                </div>
            </DialogActions>
        </Dialog>
    )
}

InformationModal.propTypes = {}

export default InformationModal
