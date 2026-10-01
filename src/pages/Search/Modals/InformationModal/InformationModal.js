import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'

import { setModal } from '../../../../core/redux/actions/actions.js'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import CloseSharpIcon from '@mui/icons-material/CloseSharp'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined'

import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import NASALogoPath from '../../../../media/images/nasa-logo.svg'
import { getPublicUrl } from '../../../../core/runtimeConfig'
import { getAppConfig } from '../../../../core/appConfig'
import { groupReleaseNotesByMonth, useReleaseNotes } from '../../../../core/releaseNotes'

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
    releaseNotesButtonWrap: {
        margin: `0px 0px ${theme.spacing(4)} 0px`,
    },
    releaseNotesBadge: {
        '& .MuiBadge-badge': {
            background: theme.palette.swatches.green.green500,
            border: `2px solid ${theme.palette.primary.main}`,
            width: 14,
            height: 14,
            borderRadius: 7,
        },
    },
    releaseNotesButton: {
        'color': theme.palette.swatches.grey.grey800,
        'borderColor': theme.palette.swatches.grey.grey300,
        'textTransform': 'none',
        'fontWeight': 600,
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey500,
            background: theme.palette.swatches.grey.grey100,
        },
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

const ReleaseNotes = ({ notes }) => {
    const c = useStyles()
    const groups = groupReleaseNotesByMonth(notes)

    if (groups.length === 0) {
        return <Typography className={c.notesEmpty}>No release notes yet.</Typography>
    }

    return groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
            <Typography className={c.monthHeader} variant="h3">
                {group.label}
            </Typography>
            <div className={c.monthCards}>
                {group.notes.map((note) => (
                    <article key={note.id} className={c.noteCard}>
                        <Typography className={c.noteType}>
                            {NOTE_TYPE_LABELS[note.type] || NOTE_TYPE_LABELS.new}
                        </Typography>
                        <Typography className={c.noteTitle} variant="h4">
                            {note.title}
                        </Typography>
                        <Typography className={c.noteDescription}>{note.description}</Typography>
                    </article>
                ))}
            </div>
        </section>
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

    const { notes, unseenCount, markSeen } = useReleaseNotes()
    const [view, setView] = useState('about')

    const openReleaseNotes = () => {
        setView('releaseNotes')
        markSeen()
    }

    const handleClose = () => {
        // close modal
        dispatch(setModal(false))
    }

    const openFeedback = () => {
        dispatch(setModal('feedback'))
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
                        {notes.length > 0 && (
                            <div className={c.releaseNotesButtonWrap}>
                                <Badge
                                    className={c.releaseNotesBadge}
                                    variant="dot"
                                    invisible={unseenCount === 0}
                                    data-testid="release-notes-badge"
                                >
                                    <Button
                                        className={c.releaseNotesButton}
                                        variant="outlined"
                                        startIcon={<NewReleasesOutlinedIcon />}
                                        aria-label="view release notes"
                                        onClick={openReleaseNotes}
                                    >
                                        View Release Notes
                                    </Button>
                                </Badge>
                            </div>
                        )}
                        <div className={c.description}>
                            <Typography>{getAppConfig().aboutDescription}</Typography>
                        </div>
                        <div className={c.message}>
                            <Typography>
                                If you have questions, want to share feedback, or need support,{' '}
                                {getAppConfig().aboutContactUrl ? (
                                    <a
                                        className={c.aLink}
                                        aria-label="contact us"
                                        href={getAppConfig().aboutContactUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        please contact us
                                    </a>
                                ) : (
                                    <a
                                        className={c.aLink}
                                        aria-label="give feedback"
                                        onClick={openFeedback}
                                    >
                                        please send us a message
                                    </a>
                                )}
                                .
                            </Typography>
                        </div>
                        <div className={c.metadata}>
                            <Typography>
                                Version Number: {import.meta.env.REACT_APP_VERSION}
                            </Typography>
                            <Typography>
                                Clearance Number: {import.meta.env.REACT_APP_CLEARANCE_NUMBER}
                            </Typography>
                            <Typography>
                                Last Updated: {import.meta.env.REACT_APP_LAST_UPDATED}
                            </Typography>
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
