import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'

export const BackButton = styled(IconButton)({
    padding: 2,
    borderRadius: 0,
})

export const BackIcon = styled(ChevronLeftIcon)(({ theme }) => ({
    fontSize: 36,
    color: theme.palette.text.primary,
}))
