import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { setModal } from '../../../../core/redux/actions/actions.js'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import CloseSharpIcon from '@mui/icons-material/CloseSharp'

import { styled, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'

import NASALogoPath from '../../../../media/images/nasa-logo.svg'
import { getPublicUrl } from '../../../../core/runtimeConfig'

import { publicUrl } from '../../../../core/constants'
import { ContentsMobile } from '../../../../components/shared/ModalComponents'

// Construct runtime-aware logo URL
const getNASALogoUrl = () => {
    const publicUrl = getPublicUrl()
    const relativePath = NASALogoPath.match(/\/(static\/.+)$/)?.[1] || NASALogoPath
    return `${publicUrl}/${relativePath}`
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
    margin: theme.headHeights[1],
    [theme.breakpoints.down('sm')]: {
        margin: '6px',
    },
}))

const Contents = styled('div')(({ theme }) => ({
    background: theme.palette.primary.main,
    width: '960px',
    maxWidth: '960px',
}))

const Content = styled(DialogContent)(({ theme }) => ({
    padding: '20px 40px 8px 40px',
    height: `calc(100% - ${theme.headHeights[2]}px)`,
    textAlign: 'center',
}))

const Head = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
        flexFlow: 'column',
    },
}))

const CloseIconButton = styled(IconButton)(({ theme }) => ({
    padding: theme.spacing(1.5),
    margin: '4px',
    position: 'absolute',
    top: '0px',
    right: '0px',
}))

const Logo = styled('div')({
    '& > img': {
        width: '100px',
        height: '100px',
        marginLeft: '12px',
    },
})

const PdsAndNode = styled('div')(({ theme }) => ({
    textAlign: 'left',
    padding: '26px 0px',
    [theme.breakpoints.down('sm')]: {
        paddingTop: '4px',
    },
}))

const Pds = styled(Typography)(({ theme }) => ({
    fontSize: '18px',
    textTransform: 'uppercase',
    [theme.breakpoints.down('sm')]: {
        textAlign: 'center',
    },
}))

const Node = styled(Typography)(({ theme }) => ({
    fontSize: '24px',
    [theme.breakpoints.down('sm')]: {
        textAlign: 'center',
    },
}))

const Title = styled(Typography)(({ theme }) => ({
    margin: `0px 0px ${theme.spacing(6)} 0px`,
    padding: '0px 2px',
    fontSize: '30px',
    fontWeight: 'bold',
    lineHeight: '28px',
    textTransform: 'uppercase',
}))

const Message = styled('div')(({ theme }) => ({
    margin: `${theme.spacing(4)} 0px`,
}))

const ALink = styled('a')({
    color: 'link',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: 'bold',
})

const Metadata = styled('div')({
    '& > p': {
        fontFamily: 'monospace',
    },
})

const Footer = styled(DialogActions)(({ theme }) => ({
    'backgroundColor': 'rgba(0,0,0,0)',
    'display': 'flex',
    'justifyContent': 'space-between',
    '& .MuiButton-text': {
        color: theme.palette.primary.light,
    },
}))

const InformationModal = (props) => {
    const {} = props

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    const dispatch = useDispatch()
    const modal = useSelector((state) => {
        const m = state.getIn(['modals', 'information'])
        if (typeof m.toJS === 'function') return m.toJS()
        return m
    })
    const open = modal !== false
    const handleClose = () => {
        // close modal
        dispatch(setModal(false))
    }

    const openFeedback = () => {
        dispatch(setModal('feedback'))
    }

    const newsPath = `https://pds-imaging.jpl.nasa.gov/`

    return (
        <StyledDialog
            fullScreen={isMobile}
            open={open}
            onClose={handleClose}
            aria-labelledby="responsive-dialog-title"
            PaperProps={{
                component: isMobile ? ContentsMobile : Contents,
            }}
        >
            <Content>
                <div>
                    <Head>
                        <Logo>
                            <img src={getNASALogoUrl()} alt={'NASA Logo'} />
                        </Logo>
                        <PdsAndNode>
                            <Pds variant="h3">
                                Planetary Data System
                            </Pds>
                            <Node variant="h3">
                                Cartography and Imaging Sciences
                            </Node>
                        </PdsAndNode>
                    </Head>
                    <Title variant="h2">
                        Atlas
                    </Title>
                    <CloseIconButton
                        title="Close"
                        aria-label="close"
                        onClick={handleClose}
                        size="large">
                        <CloseSharpIcon fontSize="inherit" />
                    </CloseIconButton>
                </div>
                <div>
                    <Box sx={{ textAlign: 'justify' }}>
                        <Typography>
                            The Cartography and Imaging Sciences Node of the Planetary Data System
                            provides a set of applications under the name, "Atlas". These
                            applications allow users to explore, search, and download imaging and
                            data products that have been collected from a variety NASA's planetary
                            space missions. Through the use of these tools, users have access to
                            petabytes of imaging data in one central location. This collection of
                            data is updated periodically and is reported within the{' '}
                            <ALink href={newsPath} rel="noopener">
                                Latest News
                            </ALink>{' '}
                            section of our home page.
                        </Typography>
                    </Box>
                    <Message>
                        <Typography>
                            If you have questions, want to share feedback, or need support,{' '}
                            <ALink
                                as="a"
                                aria-label="give feedback"
                                onClick={openFeedback}
                            >
                                please send us a message
                            </ALink>
                            .
                        </Typography>
                    </Message>
                    <Metadata>
                        <Typography>Version Number: {process.env.REACT_APP_VERSION}</Typography>
                        <Typography>
                            Clearance Number: {process.env.REACT_APP_CLEARANCE_NUMBER}
                        </Typography>
                        <Typography>Last Updated: {process.env.REACT_APP_LAST_UPDATED}</Typography>
                    </Metadata>
                </div>
            </Content>
            <Footer>
                <div>
                    <Button href="https://www.jpl.nasa.gov/jpl-image-use-policy">
                        Image Use Policy
                    </Button>
                    <Button href="https://www.jpl.nasa.gov/caltechjpl-privacy-policies-and-important-notices">
                        Privacy Policy
                    </Button>
                </div>
                <div>
                    <Button title="Close" aria-label="close" onClick={handleClose}>
                        Close
                    </Button>
                </div>
            </Footer>
        </StyledDialog>
    );
}

InformationModal.propTypes = {}

export default InformationModal
