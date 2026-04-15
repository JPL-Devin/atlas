import { styled } from '@mui/material/styles'
import Button from '@mui/material/Button'

export const ClearButton = styled(Button)(({ theme }) => ({
    'background': theme.palette.swatches.grey.grey500,
    '&:hover': {
        background: theme.palette.swatches.red.red500,
    },
}))

export const SubmitButton = styled(Button)({
    width: '80px',
    float: 'right',
})

export const BottomDiv = styled('div')(({ theme }) => ({
    marginTop: theme.spacing(2),
}))
