import React, { useState, useEffect } from 'react'

import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormGroup from '@mui/material/FormGroup'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'

import useMediaQuery from '@mui/material/useMediaQuery'

import CloseSharpIcon from '@mui/icons-material/CloseSharp'
import SendSharpIcon from '@mui/icons-material/SendSharp'

const Contents = styled('div')({
    borderRadius: '4px',
    width: 760,
    overflow: 'hidden',
})

const ContentsMobile = styled('div')({})

const Content = styled(DialogContent)({
    padding: 0,
    paddingTop: '0 !important',
    overflow: 'hidden',
    display: 'flex',
    flexFlow: 'column',
})

const Top = styled('div')({
    'display': 'flex',
    'justifyContent': 'space-between',
    'height': '49px',
    'borderBottom': '1px solid #E7E7E7',
    '& > div:first-child': {
        display: 'flex',
    },
})

const Title = styled(Typography)({
    fontSize: '20px',
    padding: '12px 16px 12px 0px',
    color: 'black',
    fontWeight: 'bold',
})

const TitleLogo = styled('img')({
    height: '33px',
    padding: '8px',
})

const CloseButton = styled(IconButton)({
    width: '49px',
    height: '49px',
})

const Form = styled('div')({
    color: 'black !important',
    padding: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #E7E7E7',
    overflow: 'auto',
})

const Introduction = styled(Typography)({
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid #E7E7E7',
})

const Row = styled('div')({
    'display': 'flex',
    'justifyContent': 'space-between',
    'height': 32,
    'marginBottom': 8,
    '& > div:last-child': {
        flex: 1,
        background: '#F6F6F6',
    },
    '& .MuiInput-input': {
        paddingLeft: '6px',
    },
    '& .MuiSelect-select': {
        paddingLeft: '6px',
    },
})

const Label = styled(Typography)({
    lineHeight: '32px',
    textAlign: 'left',
    width: '80px',
    fontSize: '15px',
    fontWeight: 'bold',
})

const LabelReq = styled('div')({
    'lineHeight': '32px',
    'textAlign': 'left',
    'fontSize': '15px',
    'fontWeight': 'bold',
    'display': 'flex',
    '& > span:last-child': {
        color: 'crimson',
        fontSize: '13px',
        fontWeight: 500,
        marginLeft: '4px',
    },
})

const StyledTextarea = styled('textarea')({
    width: 'calc(100% - 14px) !important',
    minHeight: '120px',
    height: '120px',
    background: '#F6F6F6',
    fontSize: '16px',
    padding: 6,
    fontFamily: 'sans-serif',
})

const Bottom = styled('div')({
    padding: '8px 0px',
})

const Footer = styled(DialogActions)({
    padding: '8px 16px',
    background: '#E7E7E7',
})

const FooterLeft = styled('div')({
    fontSize: '12px',
    paddingRight: '6px',
})

const SendButton = styled(Button)({
    'fontSize': '12px',
    'whiteSpace': 'nowrap',
    'background': '#1c67e3',
    'color': '#F6F6F6',
    '&:hover': {
        background: '#288BFF',
    },
})

const Submitted = styled('div')({
    color: 'black !important',
    padding: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #E7E7E7',
})

const SubmittedMessage = styled(Typography)({
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid #E7E7E7',
})

const StyledUl = styled('ul')({
    margin: '8px 0px',
})

const Link = styled('li')({
    '& > a': {
        textDecoration: 'none',
    },
    'margin': '4px 0px',
})

const SentCont = styled('div')({
    textAlign: 'center',
    marginBottom: '14px',
})

const SentIcon = styled(SendSharpIcon)({
    fontSize: '48px',
    color: '#1c67e3',
})

const SentMessage = styled(Typography)({
    fontSize: '18px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
})

const Feedback = ({ open, verify, handleClose, links, site_key, logoUrl }) => {

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [type, setType] = useState('Comment')
    const [message, setMessage] = useState('')
    const [messageInvalid, setMessageInvalid] = useState(false)

    const [submitted, setSubmitted] = useState(false)

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    const handleChange = () => {}

    useEffect(() => {
        // opening resets the submitted state to false
        if (open) {
            setMessageInvalid(false)
            setSubmitted(false)
            setName('')
            setEmail('')
            setType('Comment')
            setMessage('')
        }
    }, [open])

    const verifyAndSubmit = (token) => {
        if (typeof verify !== 'function')
            verify = (t, cb) => {
                cb()
            }
        verify(token, () =>
            submitFeedback(
                {
                    name: name,
                    email: email,
                    type: type,
                    comment: message,
                },
                () => {
                    setSubmitted(true)
                },
                () => {
                    setFailed(true)
                    setSubmitted(true)
                }
            )
        )
    }

    const submit = () => {
        if (message.length > 3) {
            setMessageInvalid(false)
            try {
                window.grecaptcha.ready((a, b, c, d) => {
                    try {
                        window.grecaptcha.execute(site_key, { action: 'submit' }).then((token) => {
                            verifyAndSubmit(token)
                        })
                    } catch (err) {
                        console.warn('Captcha failed but ignoring it for now.')
                        verifyAndSubmit()
                    }
                })
            } catch (err) {
                console.warn('Captcha failed but ignoring it for now.')
                verifyAndSubmit()
            }
        } else {
            setMessageInvalid(true)
        }
    }

    return (
        <Dialog
            fullScreen={isMobile}
            open={open}
            onClose={handleClose}
            aria-labelledby="responsive-dialog-title"
            PaperProps={{
                component: isMobile ? ContentsMobile : Contents,
            }}
        >
            <Content>
                <Top>
                    <div>
                        {logoUrl && <TitleLogo src={logoUrl} />}
                        <Title variant="h2">
                            Help Desk
                        </Title>
                    </div>
                    <CloseButton
                        aria-label={'close feedback'}
                        onClick={handleClose}
                        size="large">
                        <CloseSharpIcon fontSize="inherit" />
                    </CloseButton>
                </Top>
                {!submitted ? (
                    <Form>
                        <Introduction>
                            How can we help you? Send us your question or feedback and we'll get
                            back to you within one business day.
                        </Introduction>
                        <Row>
                            <Label>Name</Label>
                            <TextField value={name} onChange={(e) => setName(e.target.value)} />
                        </Row>
                        <Row>
                            <Label>Email</Label>
                            <TextField value={email} onChange={(e) => setEmail(e.target.value)} />
                        </Row>
                        <Row>
                            <Label>Type</Label>
                            <Select value={type} onChange={(e) => setType(e.target.value)}>
                                <MenuItem value={'Comment'}>Comment</MenuItem>
                                <MenuItem value={'Question'}>Question</MenuItem>
                                <MenuItem value={'Problem/Bug'}>Problem/Bug</MenuItem>
                                <MenuItem value={'Kudos'}>Kudos</MenuItem>
                                <MenuItem value={'Other'}>Other</MenuItem>
                            </Select>
                        </Row>
                        <div>
                            <LabelReq>
                                <div>Message</div>
                                {messageInvalid && (
                                    <>
                                        <span>* </span>
                                        <span>(required)</span>
                                    </>
                                )}
                            </LabelReq>
                            <StyledTextarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </Form>
                ) : (
                    <Submitted>
                        <SentCont>
                            <SentIcon />
                            <SentMessage>
                                Your message is on its way.
                            </SentMessage>
                        </SentCont>
                        <SubmittedMessage>
                            Thank you for making the PDS a better site. If you provided an email
                            address, a PDS representative will get back to you as soon as possible.
                        </SubmittedMessage>
                        {links && links.length > 0 && (
                            <Bottom>
                                <Typography>
                                    In the meantime, you may find the following links helpful:
                                </Typography>
                                <StyledUl>
                                    {links.map((item, idx) => (
                                        <Link key={idx}>
                                            <a href={item.link}>{item.name}</a>
                                        </Link>
                                    ))}
                                </StyledUl>
                            </Bottom>
                        )}
                    </Submitted>
                )}
            </Content>
            <Footer>
                {!submitted ? (
                    <>
                        <FooterLeft>
                            This site is protected by reCAPTCHA and the Google{' '}
                            <a href="https://policies.google.com/privacy" target="_blank">
                                Privacy Policy
                            </a>{' '}
                            and{' '}
                            <a href="https://policies.google.com/terms" target="_blank">
                                Terms of Service
                            </a>{' '}
                            apply.
                        </FooterLeft>
                        <div>
                            <SendButton
                                onClick={submit}
                                aria-label={'send feedback'}
                            >
                                Send Feedback
                            </SendButton>
                        </div>
                    </>
                ) : (
                    <>
                        <FooterLeft></FooterLeft>
                        <div>
                            <SendButton
                                onClick={handleClose}
                                aria-label={'close feedback'}
                            >
                                Close
                            </SendButton>
                        </div>
                    </>
                )}
            </Footer>
        </Dialog>
    );
}

const FEEDBACK_URL = 'https://pds.nasa.gov/email-service/SubmitFeedback'

const submitFeedback = (data, successCb, failureCb) => {
    let body = `subject=Feedback from ${window.location.hostname}&content=`
    for (let key in data) body += `${key}: ${data[key]}\n`
    body += `path: ${window.location.href}`

    // Skip captcha for now
    fetch(FEEDBACK_URL, {
        method: 'POST',
        body: body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })
        .then((res) => res.text())
        .then((text) => {
            successCb(text)
        })
        .catch((err) => {
            console.error(err)
            failureCb(err)
        })
}

export default Feedback
