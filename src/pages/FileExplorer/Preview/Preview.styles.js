import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

export const PreviewRoot = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isMobileView',
})(({ theme, isMobileView }) => ({
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    boxShadow: '0px 0px 6px 0px rgba(0,0,0,0.4)',
    display: 'flex',
    flexFlow: 'column',
    background: theme.palette.swatches.grey.grey800,
    color: theme.palette.swatches.grey.grey150,
    zIndex: 2,
    ...(isMobileView && {
        zIndex: 999,
        borderLeft: 'none',
    }),
}))

export const Header = styled('div')(({ theme }) => ({
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.19)',
    background: theme.palette.swatches.grey.grey700,
}))

export const HeaderMobile = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    boxSizing: 'border-box',
    background: theme.palette.swatches.grey.grey700,
}))

export const HeaderBanner = styled('div')(({ theme }) => ({
    'fontSize': '15px',
    'padding': '6px',
    'background': theme.palette.swatches.orange.orange600,
    'color': 'rgba(0,0,0,0.6)',
    'fontWeight': 'bold',
    'display': 'flex',
    'justifyContent': 'space-between',
    'cursor': 'pointer',
    '& > div': {
        display: 'flex',
    },
    '& > div > div': {
        paddingLeft: '5px',
    },
}))

export const PreviewTitle = styled(Typography)({
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '8px 8px 0px 8px',
    fontFamily: 'inherit',
    wordBreak: 'break-all',
})

export const PreviewTitleMobile = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    margin: '0px',
    fontFamily: 'inherit',
    lineHeight: `${theme.headHeights[2]}px`,
}))

export const HeaderRight = styled('div')({
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
})

export const ActionButton = styled(IconButton)(({ theme }) => ({
    'width': `${theme.headHeights[2]}px`,
    'height': `${theme.headHeights[2]}px`,
    'color': theme.palette.swatches.blue.blue400,
    '&:hover': {
        background: 'rgba(255,255,255,0.1)',
    },
    '&.Mui-disabled': {
        color: theme.palette.swatches.grey.grey400,
        cursor: 'not-allowed',
    },
}))

export const Body = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isMobileView',
})(({ isMobileView }) => ({
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
}))

export const SectionHeading = styled('div')(({ theme }) => ({
    fontSize: '14px',
    lineHeight: '30px',
    color: theme.palette.swatches.yellow.yellow500,
    textTransform: 'uppercase',
    padding: '0px 16px 4px 16px',
}))

export const RelatedList = styled('ul')(({ theme }) => ({
    'listStyleType': 'none',
    'margin': `4px 0px 0px 0px`,
    'padding': '0px 16px',
    '& > li': {
        lineHeight: '24px',
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'flex-start',
    },
}))

export const RelatedGroup = styled('div')(({ theme }) => ({
    textTransform: 'uppercase',
    lineHeight: '28px',
    width: '70px',
    color: theme.palette.swatches.grey.grey300,
}))

export const RelatedLinks = styled('div')({
    display: 'flex',
    justifyContent: 'flex-start',
    flex: '1',
})

export const RelatedButton = styled(Button)(({ theme }) => ({
    'background': theme.palette.swatches.grey.grey700,
    'color': theme.palette.swatches.blue.blue400,
    'border': `1px solid ${theme.palette.swatches.grey.grey900}`,
    'marginLeft': '4px',
    '&:hover': {
        border: `1px solid ${theme.palette.swatches.grey.grey600}`,
    },
    '& .MuiButton-label': {
        lineHeight: '20px',
    },
    '& .MuiButton-endIcon': {
        marginLeft: '6px',
    },
    '& .MuiButton-endIcon > svg': {
        fontSize: '14px',
    },
}))

export const PropertiesList = styled('ul')(({ theme }) => ({
    'listStyleType': 'none',
    'margin': `0px`,
    'padding': '0px',
    '& > li': {
        'display': 'flex',
        'justifyContent': 'space-between',
        'lineHeight': '24px',
        'padding': '2px 16px',
        'transition': 'max-height 0.3s ease-in',
        'wordBreak': 'break-all',
        '& > div:last-child': {
            whiteSpace: 'inherit',
        },
    },
    '& > li:nth-child(odd)': {
        background: theme.palette.swatches.grey.grey700,
    },
}))

export const PropertyKey = styled('div')(({ theme }) => ({
    marginRight: '16px',
    textTransform: 'uppercase',
    color: theme.palette.swatches.grey.grey300,
    fontSize: '12px',
}))

export const PropertyValue = styled('div')({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    flex: '1',
})

export const ImageContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '400px',
    position: 'relative',
    cursor: 'pointer',
    overflow: 'hidden',
    borderTop: `1px solid ${theme.palette.swatches.grey.grey700}`,
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey700}`,
}))

export const PreviewImageStyled = styled('div')({
    'overflow': 'hidden',
    'position': 'static !important',
    'objectFit': 'cover !important',
    'transition': 'filter 0.15s ease-in-out !important',
    '&:hover': {
        filter: 'brightness(1.25)',
    },
})

export const ImageCover = styled('div')({
    position: 'absolute',
    pointerEvents: 'none',
    top: 0,
    width: '100%',
    height: '100%',
    boxShadow: 'inset 0px 1px 6px 1px rgba(0,0,0,0.16)',
})

export const ImagelessContainer = styled('div')({
    'width': '100%',
    'height': '100%',
    'position': 'relative',
    '& > div': {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
    },
})

export const NavHeader = styled('div')(({ theme }) => ({
    'height': `${theme.headHeights[2]}px`,
    'minHeight': `${theme.headHeights[2]}px`,
    'background': theme.palette.swatches.grey.grey700,
    'boxSizing': 'border-box',
    'display': 'flex',
    'justifyContent': 'space-between',
    'borderBottom': `1px solid ${theme.palette.swatches.grey.grey900}`,
    '& > div': {
        display: 'flex',
        justifyContent: 'space-between',
    },
    '& > div:last-child': {
        flex: 1,
    },
}))

export const BackButton = styled(IconButton)(({ theme }) => ({
    lineHeight: '28px',
    borderRadius: 0,
    color: theme.palette.swatches.grey.grey150,
}))

export const EmptyPreview = styled('div')(({ theme }) => ({
    textAlign: 'center',
    margin: `${theme.spacing(10)} 0px`,
    color: theme.palette.swatches.grey.grey500,
    fontSize: '16px',
}))

export const StyledFormControl = styled(FormControl)({
    minWidth: 125,
    margin: '5px 0px 3px 8px',
})

export const StyledSelect = styled(Select)(({ theme }) => ({
    'color': theme.palette.swatches.grey.grey300,
    'background': theme.palette.swatches.grey.grey800,
    'borderBottom': `2px solid ${theme.palette.swatches.grey.grey600}`,
    'paddingLeft': '4px',
    '& > div:first-of-type': {
        padding: '8px 20px 6px 6px',
        textAlign: 'left',
    },
    '& > svg': {
        color: '#efefef',
        top: '4px',
        right: '2px',
    },
}))

