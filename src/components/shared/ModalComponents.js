import { styled } from '@mui/material/styles'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'

export const StyledDialog = styled(Dialog)(({ theme }) => ({
    margin: theme.headHeights[1],
    height: `calc(100% - ${theme.headHeights[1] * 2}px)`,
}))

export const ContentsMobile = styled('div')(({ theme }) => ({
    background: theme.palette.primary.main,
    height: '100%',
}))

export const Heading = styled(DialogTitle)(({ theme }) => ({
    height: theme.headHeights[2],
    boxSizing: 'border-box',
    background: theme.palette.swatches.grey.grey150,
    padding: `0 ${theme.spacing(2)} 0 ${theme.spacing(4)}`,
}))

export const ModalTitle = styled('div')(({ theme }) => ({
    padding: `${theme.spacing(2.5)} 0`,
    fontSize: theme.typography.pxToRem(16),
    fontWeight: 'bold',
}))

export const CloseIconButton = styled(IconButton)(({ theme }) => ({
    padding: theme.spacing(1.5),
    height: '100%',
    margin: '4px 0px',
}))

export const FlexBetween = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
})
