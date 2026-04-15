import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

export const RegexModalRoot = styled('div')(({ theme }) => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    background: theme.palette.swatches.grey.grey0,
    zIndex: 998,
    boxShadow: 'inset -1px 0px 5px 0px rgba(0,0,0,0.2)',
}))

export const Contents = styled('div')({
    width: '100%',
    height: '100%',
})

export const TopBar = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    height: '40px',
    background: theme.palette.swatches.grey.grey0,
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey300}`,
}))

export const CloseIconButton = styled(IconButton)(({ theme }) => ({
    padding: theme.spacing(1.5),
    margin: '4px',
}))

export const ModalTitle = styled(Typography)({
    fontSize: '18px',
    fontWeight: 'bold',
    lineHeight: '42px',
    textTransform: 'uppercase',
})

export const Subtitle = styled('div')(({ theme }) => ({
    'padding': '0px 10px',
    'fontSize': '14px',
    'lineHeight': '40px',
    'fontFamily': 'monospace',
    '& span:first-child': {
        color: 'darkgoldenrod',
        fontSize: '12px',
        fontWeight: 500,
        textTransform: 'uppercase',
        fontFamily: 'PublicSans',
        paddingRight: '6px',
    },
    '& span:last-child': {
        fontWeight: 'bold',
        fontSize: '16px',
        color: theme.palette.accent.main,
    },
}))

export const BottomSection = styled('div')({
    display: 'flex',
    flexFlow: 'column',
    width: '100%',
    height: 'calc(100% - 41px)',
})

export const InputSection = styled('div')(({ theme }) => ({
    width: '100%',
    background: theme.palette.swatches.grey.grey100,
    borderBottom: `1px solid ${theme.palette.accent.main}`,
}))

export const InputBar = styled('div')(({ theme }) => ({
    'height': '40px',
    'width': '100%',
    'display': 'flex',
    '& > div > div:first-child': {
        width: '100%',
        height: '100%',
    },
    '& > div > div:first-child > div:first-child': {
        width: '100%',
        height: '100%',
    },
    '& input': {
        width: '100%',
        padding: '0px 84px 0px 3px',
        color: theme.palette.accent.main,
        fontFamily: 'monospace',
    },
}))

export const RegexSearchInput = styled(TextField)(({ theme }) => ({
    '& input': {
        fontWeight: 'bold',
        fontSize: '14px',
    },
    '& input::placeholder': {
        fontWeight: 'initial',
        fontSize: '14px',
    },
    '& .MuiInputAdornment-root': {
        marginTop: '0px !important',
    },
    '& .MuiFilledInput-underline:after': {
        borderBottom: `2px solid ${theme.palette.accent.main}`,
    },
}))

export const RegexSearchButton = styled(Button)({
    padding: '4px 40px',
    borderRadius: '0px',
    boxShadow: 'none',
})

export const HelpButton = styled(IconButton)({
    height: '40px',
    width: '40px',
})

export const HelpSection = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ theme, isOpen }) => ({
    'height': '0px',
    'overflow': 'hidden',
    'pointerEvents': 'none',
    'padding': '0px 25%',
    'transition': 'all 0.2s ease-in-out',
    'background': theme.palette.swatches.grey.grey0,
    '& code': {
        padding: '0px 4px',
        borderRadius: '2px',
        background: `rgba(0,0,0,0.07)`,
        borderBottom: `2px solid ${theme.palette.accent.main}`,
    },
    '& p': {
        fontSize: '16px',
    },
    '& li': {
        fontSize: '16px',
        lineHeight: '22px',
        marginBottom: '5px',
    },
    '& h2': {
        color: 'darkgoldenrod',
    },
    '& h4 > code': {
        fontSize: '20px',
    },
    ...(isOpen && {
        pointerEvents: 'all',
        height: '100%',
        overflowY: 'auto',
        paddingTop: '20px',
        paddingBottom: '20px',
    }),
}))

export const CloseHelpIconButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ theme, isOpen }) => ({
    padding: theme.spacing(1.5),
    margin: '4px',
    position: 'absolute',
    top: '120px',
    right: '40px',
    display: 'none',
    ...(isOpen && {
        display: 'block',
    }),
}))

export const Results = styled('div')({
    flex: 1,
    overflowY: 'auto',
})

export const ResultList = styled('ul')({
    listStyleType: 'none',
    margin: 0,
    padding: '2px 0px',
})

export const ListItem = styled('li', {
    shouldForwardProp: (prop) => !['isActive', 'isLessPadding', 'isMobile'].includes(prop),
})(({ theme, isActive, isLessPadding, isMobile }) => ({
    'display': 'flex',
    'height': '32px',
    'lineHeight': '32px',
    'padding': '0px 12px 0px 4px',
    'marginLeft': theme.spacing(1),
    'borderRadius': '4px 0px 0px 4px',
    'cursor': 'pointer',
    'overflow': 'hidden',
    'borderBottom': `1px solid ${theme.palette.swatches.grey.grey150}`,
    '&:hover': {
        'background': theme.palette.swatches.grey.grey150,
        '& .listItemButtons': {
            pointerEvents: 'inherit',
            opacity: 1,
        },
    },
    '& > div:last-child': {
        flex: 1,
    },
    ...(isLessPadding && {
        paddingRight: '0px',
    }),
    ...(isActive && {
        background: `${theme.palette.accent.main} !important`,
        color: theme.palette.text.secondary,
    }),
    ...(isMobile && {
        height: `${theme.headHeights[3]}px`,
        lineHeight: `${theme.headHeights[3]}px`,
        fontSize: '16px',
    }),
}))

export const ListItemButtons = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    lineHeight: '33px',
    transition: 'opacity 0.2s ease-out',
    opacity: 0,
    pointerEvents: 'none',
    ...(isActive && {
        'background': theme.palette.accent.main,
        '& button': {
            color: theme.palette.swatches.grey.grey0,
        },
    }),
}))

export const FlexBetween1 = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
    flex: 1,
})

export const LiName = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isMobile',
})(({ theme, isMobile }) => ({
    margin: `0px ${theme.spacing(1.5)}`,
    lineHeight: '32px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    ...(isMobile && {
        lineHeight: `${theme.headHeights[3]}px`,
    }),
}))

export const LiSize = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    marginRight: '10px',
    fontSize: '12px',
    color: theme.palette.swatches.grey.grey500,
    fontFamily: 'monospace',
    ...(isActive && {
        color: theme.palette.text.secondary,
    }),
}))

export const ItemButton = styled(IconButton)({
    padding: '4px 4px 3px 4px',
    marginTop: '-4px',
})

export const BottomBar = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    background: theme.palette.swatches.grey.grey50,
    borderTop: `1px solid ${theme.palette.swatches.grey.grey300}`,
    height: '40px',
    width: '100%',
}))

export const InputWrapper = styled('div')({
    width: '100%',
    height: '100%',
    position: 'relative',
})

export const Flags = styled('div')({
    position: 'absolute',
    right: 0,
    top: 0,
    display: 'flex',
})

export const FlagIconButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'isOn',
})(({ theme, isOn }) => ({
    'padding': '4px',
    'margin': '5px',
    'borderRadius': '4px',
    'transition': 'all 0.2s ease-in-out',
    '&:hover': {
        background: theme.palette.swatches.grey.grey600,
        color: theme.palette.swatches.grey.grey0,
    },
    ...(isOn && {
        background: theme.palette.swatches.grey.grey700,
        color: theme.palette.swatches.grey.grey0,
    }),
}))

export const ResultCount = styled('div')({
    lineHeight: '40px',
    padding: '0px 16px',
    fontStyle: 'italic',
})

export const LoadingBar = styled('div')(({ theme }) => ({
    'position': 'absolute',
    'width': '100%',
    '& .MuiLinearProgress-barColorPrimary': {
        background: theme.palette.swatches.blue.blue500,
    },
    '& > div': {
        height: '2px !important',
    },
}))

export const NoResults = styled(Paper)(({ theme }) => ({
    'position': 'absolute',
    'top': '50%',
    'left': '50%',
    'transform': 'translateX(-50%) translateY(-50%)',
    'background': theme.palette.swatches.grey.grey700,
    'color': theme.palette.swatches.grey.grey0,
    'padding': '10px 20px',
    'fontSize': '16px',
    'lineHeight': '24px',
    'textAlign': 'center',
    '& div:first-child': {
        fontWeight: 'bold',
    },
}))

export const AddAllCartButton = styled(Button)(({ theme }) => ({
    'padding': '4px 12px',
    'borderRadius': '4px',
    'boxShadow': 'none',
    'height': '28px',
    'margin': '6px 0px',
    'background': theme.palette.swatches.grey.grey600,
    'color': theme.palette.swatches.grey.grey0,
    '&:hover': {
        background: theme.palette.swatches.grey.grey500,
    },
}))

