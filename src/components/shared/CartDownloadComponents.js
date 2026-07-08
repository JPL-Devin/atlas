import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

export const DownloadButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'isDownloading',
})(({ theme, isDownloading }) => ({
    height: 30,
    width: '100%',
    margin: '7px 0px',
    background: theme.palette.primary.light,
    ...(isDownloading && {
        background: theme.palette.swatches.grey.grey300,
        color: theme.palette.text.primary,
        pointerEvents: 'none',
    }),
}))

export const StyledP = styled(Typography)(({ theme }) => ({
    padding: `${theme.spacing(1.5)} 0px`,
}))

export const CodeBlock = styled(Typography)(({ theme }) => ({
    background: theme.palette.swatches.grey.grey200,
    padding: theme.spacing(3),
    fontFamily: 'monospace',
    marginBottom: '5px',
}))

export const DownloadingWrapper = styled('div')({
    bottom: '0px',
    position: 'sticky',
    width: '100%',
    padding: '12px',
    boxSizing: 'border-box',
})

export const ErrorMessage = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isVisible',
})(({ theme, isVisible }) => ({
    display: 'none',
    fontSize: '16px',
    padding: '12px',
    background: theme.palette.swatches.red.red500,
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.swatches.red.red600}`,
    textAlign: 'center',
    ...(isVisible && {
        display: 'block',
    }),
}))
