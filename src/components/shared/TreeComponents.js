import { styled } from '@mui/material/styles'
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem'
import IconButton from '@mui/material/IconButton'

export const StyledTreeGroup = styled(TreeItem)(({ theme }) => ({
    minHeight: theme.headHeights[3],
    textTransform: 'uppercase',
    paddingLeft: '6px',
    [`& .${treeItemClasses.content}`]: {
        height: theme.headHeights[3],
        flex: 1,
        justifyContent: 'left',
        alignItems: 'center',
        [`&.${treeItemClasses.selected}:hover`]: {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
    },
}))

export const StyledTreeItem = styled(TreeItem)(({ theme }) => ({
    height: theme.headHeights[3],
    marginLeft: '-20px',
    [`& > div > .${treeItemClasses.label}`]: {
        padding: '0px',
    },
}))

export const InfoIconButton = styled(IconButton)(({ theme }) => ({
    fontSize: '18px',
    padding: '12px 7px',
    color: theme.palette.accent.main,
}))
