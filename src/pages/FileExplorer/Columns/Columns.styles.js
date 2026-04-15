import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import SortIcon from '@mui/icons-material/Sort'

const minColumnWidth = 220
const DEPRECATED_COLOR = '#834325'

export const ColumnsRoot = styled('div', {
    shouldForwardProp: (prop) => !['isMobileView', 'hasModalOver'].includes(prop),
})(({ theme, isMobileView, hasModalOver }) => ({
    height: '100%',
    display: 'inline-flex',
    transition: 'opacity 0.2s ease-in-out',
    ...(isMobileView && {
        width: 'unset !important',
        borderRight: 'none',
    }),
    ...(hasModalOver && {
        opacity: 0,
        maxWidth: '100%',
        overflow: 'hidden',
    }),
}))

export const IntroMessage = styled('div')(({ theme }) => ({
    'position': 'relative',
    'width': '280px',
    'lineHeight': '20px',
    'fontSize': '16px',
    'color': theme.palette.text.primary,
    'background': theme.palette.swatches.yellow.yellow700,
    'margin': theme.spacing(4),
    'padding': theme.spacing(4),
    'boxShadow': '0px 2px 4px 0px rgba(0, 0, 0, 0.2)',
    '& > span': {
        position: 'absolute',
        top: '50%',
        left: '-8px',
        transform: 'translateY(-50%)',
        width: 0,
        height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderRight: `8px solid ${theme.palette.swatches.yellow.yellow800}`,
    },
}))

export const ColumnRoot = styled('div', {
    shouldForwardProp: (prop) => !['isMobileView', 'isTabletColumn', 'isHidden', 'isFinal'].includes(prop),
})(({ theme, isMobileView, isTabletColumn, isHidden, isFinal }) => ({
    display: 'flex',
    height: '100%',
    minWidth: `${minColumnWidth}px`,
    borderRight: `1px solid ${theme.palette.swatches.grey.grey200}`,
    position: 'relative',
    background: theme.palette.swatches.grey.grey100,
    boxShadow: 'inset -1px 0px 2px rgba(0,0,0,0.06)',
    transition: 'width 0.3s ease-in-out, flex-basis 0.3s ease-in-out',
    ...(isMobileView && {
        width: '100vw !important',
    }),
    ...(isTabletColumn && {
        height: `calc(100% - ${theme.headHeights[4]}px)`,
        width: '50%',
    }),
    ...(isHidden && {
        width: 0,
        flexBasis: 'unset !important',
        transition: 'width 0.3s ease-in-out',
        minWidth: '0px',
        overflow: 'hidden',
    }),
}))

export const ColumnContent = styled('div')({
    height: '100%',
    width: '100%',
    position: 'relative',
})

export const Header = styled('div', {
    shouldForwardProp: (prop) => !['isMobileView', 'headerType', 'isFinalHead'].includes(prop),
})(({ theme, isMobileView, headerType, isFinalHead }) => ({
    'height': `${theme.headHeights[2]}px`,
    'background': theme.palette.swatches.grey.grey0,
    'borderBottom': `1px solid ${theme.palette.swatches.grey.grey200}`,
    'boxSizing': 'border-box',
    'display': 'flex',
    'justifyContent': 'space-between',
    '& > div': {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
    },
    '& > div > div:first-child': {
        flex: 1,
        display: 'flex',
        maxWidth: 'calc(100% - 0px)',
    },
    ...(isMobileView && {
        '& > div > div:first-child': {
            flex: 1,
            display: 'flex',
            maxWidth: 'calc(100% - 88px)',
        },
    }),
    ...(headerType === 'volume' && {
        '& > div': {
            display: 'flex',
        },
    }),
}))

export const BackButton = styled(IconButton)({
    lineHeight: '32px',
    borderRadius: 0,
    marginRight: '-12px',
})

export const SearchButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    lineHeight: '32px',
    borderRadius: 0,
    marginRight: '-12px',
    ...(isActive && {
        borderTop: '2px solid Transparent',
        borderBottom: `2px solid ${theme.palette.accent.main}`,
    }),
}))

export const Dropdown = styled(Select, {
    shouldForwardProp: (prop) => prop !== 'isMobileView',
})(({ theme, isMobileView }) => ({
    'margin': '4px',
    'background': theme.palette.swatches.grey.grey600,
    'padding': '0px 0px 0px 11px',
    'borderRadius': '3px',
    'color': theme.palette.swatches.grey.grey0,
    '&::before': {
        borderBottom: 'unset',
    },
    '& > svg': {
        color: theme.palette.swatches.grey.grey0,
    },
    ...(isMobileView && {
        float: 'right',
    }),
}))

export const SortButton = styled(IconButton)(({ theme }) => ({
    width: `${theme.headHeights[2]}px`,
    height: `${theme.headHeights[2]}px`,
}))

export const MoreButton = styled(IconButton)(({ theme }) => ({
    width: `${theme.headHeights[2]}px`,
    height: `${theme.headHeights[2]}px`,
}))

export const SortIconStyled = styled(SortIcon)({
    transform: 'rotateY(180deg)',
})

export const Body = styled('div', {
    shouldForwardProp: (prop) => !['isMobileView', 'isFilterOpen'].includes(prop),
})(({ theme, isMobileView, isFilterOpen }) => ({
    height: `calc(100% - ${theme.headHeights[2] + theme.headHeights[4]}px)`,
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    boxSizing: 'border-box',
    overflowY: 'auto',
    transition: 'height 0.2s ease-in-out',
    ...(isFilterOpen && {
        height: `calc(100% - ${theme.headHeights[2] + theme.headHeights[4] + 37}px)`,
    }),
    ...(isMobileView && {
        height: `calc(100% - ${theme.headHeights[2] + theme.headHeights[4] + theme.headHeights[4]}px)`,
    }),
}))

export const List = styled('ul')({
    listStyleType: 'none',
    margin: 0,
    padding: '2px 0px',
})

export const ListItem = styled('li', {
    shouldForwardProp: (prop) => !['isActive', 'isLessPadding', 'isFilter', 'isMobileView'].includes(prop),
})(({ theme, isActive, isLessPadding, isFilter, isMobileView }) => ({
    'display': 'flex',
    'height': '28px',
    'lineHeight': '28px',
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
    ...(isLessPadding && {
        paddingRight: '0px',
    }),
    ...(isFilter && {
        justifyContent: 'space-between',
        padding: `0px ${theme.spacing(2)} 0px 0px`,
    }),
    ...(isActive && {
        background: `${theme.palette.accent.main} !important`,
        color: theme.palette.text.secondary,
    }),
    ...(isMobileView && {
        height: `${theme.headHeights[3]}px`,
        lineHeight: `${theme.headHeights[3]}px`,
        fontSize: '16px',
    }),
}))

export const LiType = styled('div', {
    shouldForwardProp: (prop) => !['isDeprecatedType', 'isDeprecatedColor'].includes(prop),
})(({ isDeprecatedType, isDeprecatedColor }) => ({
    fontSize: '24px',
    padding: '2px',
    ...(isDeprecatedType && {
        width: '22px',
        padding: '2px 2px 2px 5px',
    }),
    ...(isDeprecatedColor && {
        color: DEPRECATED_COLOR,
    }),
}))

export const LiName = styled('div', {
    shouldForwardProp: (prop) => !['isMobileView', 'isDeprecatedColor'].includes(prop),
})(({ theme, isMobileView, isDeprecatedColor }) => ({
    margin: `0px ${theme.spacing(1.5)}`,
    lineHeight: '30px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    ...(isMobileView && {
        lineHeight: `${theme.headHeights[3]}px`,
    }),
    ...(isDeprecatedColor && {
        color: DEPRECATED_COLOR,
    }),
}))

export const Footer = styled('div')(({ theme }) => ({
    padding: `0px ${theme.spacing(1.5)}`,
    height: `${theme.headHeights[4]}px`,
    lineHeight: `${theme.headHeights[4]}px`,
    color: theme.palette.swatches.grey.grey500,
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'space-between',
}))

export const FooterPath = styled('div')({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: 'calc(100% - 70px)',
})

export const Divider = styled('div')(({ theme }) => ({
    'width': '20px',
    'height': '40px',
    'position': 'absolute',
    'right': 0,
    'lineHeight': '40px',
    'cursor': 'col-resize',
    'boxSizing': 'border-box',
    'textAlign': 'center',
    'paddingTop': '4px',
    'color': theme.palette.swatches.grey.grey300,
    'transform': 'unset !important',
    'transition': 'color 0.2s ease-out',
    '&:hover': {
        color: theme.palette.swatches.grey.grey500,
    },
}))

export const Flex2 = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: '100%',
    width: '100%',
})

export const FlexBetween = styled('div')({
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
})

export const LiFlex = styled('div')({
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
})

export const IconSvg = styled('svg')({
    width: '24px',
    height: '24px',
    paddingLeft: '2px',
})

export const VolumeTitle = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'isMobileView',
})(({ isMobileView }) => ({
    padding: '8px 10px 6px 12px',
    fontSize: '15px',
    fontWeight: 700,
    fontFamily: 'inherit',
    textTransform: 'capitalize',
    ...(isMobileView && {
        fontSize: '16px',
        padding: '7px 2px 7px 12px',
        fontFamily: 'inherit',
    }),
}))

export const DirectoryTitle = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'isMobileView',
})(({ theme, isMobileView }) => ({
    padding: '12px 10px 9px 12px',
    color: theme.palette.swatches.grey.grey700,
    fontSize: '12px',
    overflow: 'hidden',
    boxSizing: 'border-box',
    textOverflow: 'ellipsis',
    fontFamily: 'inherit',
    ...(isMobileView && {
        fontSize: '16px',
        padding: '7px 2px 7px 12px',
        fontFamily: 'inherit',
    }),
}))

export const NoContent = styled('div')(({ theme }) => ({
    textAlign: 'center',
    color: theme.palette.swatches.grey.grey500,
    padding: '4px 0px',
}))

export const LoadingBar = styled('div')(({ theme }) => ({
    'position': 'absolute',
    'width': '100%',
    '& .MuiLinearProgress-barColorPrimary': {
        background: theme.palette.swatches.blue.blue500,
    },
}))

export const ViewSliderViewport = styled('div')({
    '& > div': {
        'overflow': 'hidden !important',
        'background': 'white',
        '& > div': {
            height: '100%',
        },
    },
})

export const SliderPosition = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isTablet',
})(({ theme, isTablet }) => ({
    'display': 'flex',
    'width': '100%',
    'height': `${theme.headHeights[4]}px`,
    'position': 'absolute',
    'bottom': '0px',
    'left': '0px',
    'boxSizing': 'border-box',
    'padding': '0px 4px',
    'borderTop': `1px solid ${theme.palette.swatches.grey.grey200}`,
    '& > div': {
        transition: 'all 0.2s ease-in-out',
    },
    '& > div > div': {
        height: '4px',
        borderRadius: '4px',
        transition: 'all 0.2s ease-in-out',
    },
    ...(isTablet && {
        width: 'calc(100% - 553px)',
        marginLeft: `${theme.headHeights[1] + 1}px`,
    }),
}))

export const PositionDot = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    '& > div': {
        background: isActive ? theme.palette.accent.main : theme.palette.swatches.grey.grey200,
    },
}))

export const ListItemButtons = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    lineHeight: '25px',
    right: '0px',
    background: theme.palette.swatches.grey.grey150,
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

export const ItemButton = styled(IconButton)({
    padding: '4px 4px 3px 4px',
})

export const CheckLabel = styled('div')(({ theme }) => ({
    lineHeight: '30px',
    color: theme.palette.swatches.grey.grey50,
    fontSize: '11px',
}))

export const FilterSearch = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ isOpen }) => ({
    height: '0px',
    overflow: 'hidden',
    transition: 'height 0.2s ease-in-out',
    ...(isOpen && {
        height: '37px',
    }),
}))

export const FilterSearchInput = styled(TextField)(({ theme }) => ({
    'width': '100%',
    'height': '37px',
    '& input': {
        padding: '10px 12px',
    },
    '& .MuiFilledInput-underline:after': {
        borderBottom: `2px solid ${theme.palette.accent.main}`,
    },
    '& .MuiInputAdornment-root': {
        marginTop: '0px !important',
        marginRight: '-3px',
    },
}))

export const HighlightClass = styled('span')({
    fontWeight: 'bold',
})

export const SubHeader = styled('li')(({ theme }) => ({
    'padding': '8px 12px 4px 12px',
    'borderBottom': 'none',
    'background': theme.palette.swatches.grey.grey50,
    'margin': '0px',
    'cursor': 'default',
    '&:hover': {
        background: theme.palette.swatches.grey.grey50,
    },
}))

export const SubHeaderText = styled(Typography)(({ theme }) => ({
    color: theme.palette.swatches.grey.grey600,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontSize: '11px',
}))

export const PdsVersionText = styled('span')(({ theme }) => ({
    fontSize: '0.7em',
    fontWeight: 400,
    color: theme.palette.swatches.grey.grey500,
    marginLeft: theme.spacing(0.5),
    opacity: 0.8,
}))

export const DetailsButton = styled('div')({
    'marginRight': '-9px',
    'marginTop': '-1px',
    '& > button': {
        padding: '7px 12px',
    },
})

