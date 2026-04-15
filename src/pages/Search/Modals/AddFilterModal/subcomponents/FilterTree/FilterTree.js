import React, { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { styled } from '@mui/material/styles'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { treeItemClasses } from '@mui/x-tree-view/TreeItem'
import Collapse from '@mui/material/Collapse'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Input from '@mui/material/Input'
import InputAdornment from '@mui/material/InputAdornment'
import { useSpring, animated } from '@react-spring/web'

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import FilterListIcon from '@mui/icons-material/FilterList'
import CloseSharpIcon from '@mui/icons-material/CloseSharp'
import Box from '@mui/material/Box'

import Highlighter from 'react-highlight-words'

import { isObject } from '../../../../../../core/utils'
import FilterHelp from '../../../../../../components/FilterHelp/FilterHelp'
import { StyledTreeGroup, StyledTreeItem as BaseStyledTreeItem, InfoIconButton } from '../../../../../../components/shared/TreeComponents'

function TransitionComponent(props) {
    const style = useSpring({
        from: { opacity: 0, transform: 'translate3d(20px,0,0)' },
        to: { opacity: props.in ? 1 : 0, transform: `translate3d(${props.in ? 0 : 20}px,0,0)` },
    })

    return (
        <animated.div style={style}>
            <Collapse {...props} />
        </animated.div>
    )
}

TransitionComponent.propTypes = {
    /**
     * Show the component; triggers the enter or exit states
     */
    in: PropTypes.bool,
}

const StyledTreeItem = styled(BaseStyledTreeItem)({
    textTransform: 'uppercase',
})

// TODO: Investigation consolidation of StyledTreeItem with FilterTreeLabel
// The two noted component appear to be redundant, investigate how they can
// merged to reduce code complexity
const FilterTreeLabelRoot = styled('div')(({ theme }) => ({
    display: 'flex',
    height: theme.headHeights[3],
}))

const FilterCheckbox = styled(Checkbox)({
    borderRadius: 0,
})

const FilterLabel = styled('span')(({ theme }) => ({
    flex: 1,
    lineHeight: `${theme.headHeights[3]}px`,
    paddingLeft: '3px',
    fontSize: '14px',
    textTransform: 'none',
}))

const LabelBefore = styled('span')({
    opacity: 0.9,
})

const LabelAfter = styled('span')({
    fontWeight: 'bold',
})

const FilterTreeLabel = (props) => {
    const { id, label, active, onCheck, onInfoClick, filterString } = props

    // Let's split on the last ':' to highlight the relevant portion
    let labelBefore = null
    let labelAfter = label
    const lastIndex = label.lastIndexOf(':')
    if (lastIndex != -1) {
        labelBefore = label.slice(0, lastIndex) + ':'
        labelAfter = label.slice(lastIndex + 1)
    }

    return (
        <FilterTreeLabelRoot>
            <FilterCheckbox
                color="default"
                checked={active}
                size="medium"
                title="Add"
                aria-label="add"
                onClick={onCheck}
            />
            <InfoIconButton
                title="Info"
                aria-label="info"
                size="medium"
                onClick={onInfoClick}
            >
                <InfoOutlinedIcon fontSize="inherit" />
            </InfoIconButton>
            <FilterLabel onClick={onCheck}>
                {labelBefore != null && (
                    <LabelBefore>
                        <Highlighter
                            searchWords={[filterString]}
                            autoEscape={true}
                            textToHighlight={String(labelBefore)}
                        />
                    </LabelBefore>
                )}
                <LabelAfter>
                    <Highlighter
                        searchWords={[filterString]}
                        autoEscape={true}
                        textToHighlight={String(labelAfter)}
                    />
                </LabelAfter>
            </FilterLabel>
        </FilterTreeLabelRoot>
    )
}

let shownExpandedIds = []
// Makes the addFilter tree and does so with respect to the filterString (which subsets the tree)
const makeTree = (
    mapping,
    activeFilterIds,
    filterString,
    addStagedFilter,
    removeStagedFilter,
    setSelected,
    toggleExpanded
) => {
    // We'll search with a lowercase string
    filterString = filterString.toLowerCase()

    // Checks if an element is to be filtered out or not
    // Uses recursion to support visibilities where the parent doesn't match but a child does
    const isShown = (key, obj, forceShown) => {
        // fromNesting signifies whether it's only shown because a child is shown
        // it's useful so that we don't assume all children are shown because one is
        let shown = { shown: true, fromNesting: false }

        if (obj.hidden === true) return { shown: false, fromNesting: false }

        // If forcing or not filtering
        // Forcing let's us show ALL children of a matched group
        if (forceShown || filterString == null || filterString.length == 0) return shown
        // check key
        if (key.toLowerCase().includes(filterString)) return shown
        // check display_name
        if (
            obj.display_name &&
            typeof obj.display_name === 'string' &&
            obj.display_name.toLowerCase().includes(filterString)
        )
            return shown
        // check display_subname
        if (
            obj.display_subname &&
            typeof obj.display_subname === 'string' &&
            obj.display_subname.toLowerCase().includes(filterString)
        )
            return shown
        // check tags
        if (obj.tags && obj.tags.length > 0)
            for (const tag of obj.tags)
                if (typeof tag === 'string' && tag.toLowerCase().includes(filterString))
                    return shown
        // check description
        if (
            obj.description &&
            typeof obj.description === 'string' &&
            obj.description.toLowerCase().includes(filterString)
        )
            return shown

        // Let's check the children too
        shown = { shown: false, fromNesting: false }
        const iter = Object.keys(obj)
        for (let i = 0; i < iter.length; i++)
            if (isObject(obj[iter[i]]))
                if (isShown(iter[i], obj[iter[i]]).shown) shown = { shown: true, fromNesting: true }

        return shown
    }

    const groupIds = []

    // Iterate this to conveniently make keys in order
    let keyI = 0
    // A depth first traversal through the facet json tree to construct the react elements
    const depthTraversal = (node, type, depth, path, forceShown) => {
        let tree = []
        // Sort by type (groups first, then items), then alphabetically within each type
        let iter = Object.keys(node).sort((a, b) => {
            const aIsGroup = node[a].groups != null
            const bIsGroup = node[b].groups != null

            // Groups come before items
            if (aIsGroup && !bIsGroup) return -1
            if (!aIsGroup && bIsGroup) return 1

            // Within same type, sort alphabetically
            return a.localeCompare(b)
        })
        //console.log(type, node)
        for (let i = 0; i < iter.length; i++) {
            const shown = isShown(iter[i], node[iter[i]], forceShown)
            let nextPath = `${path}${path.length > 0 ? '.' : ''}${iter[i]}`
            nextPath = nextPath.replace(/.groups/g, '')

            // After flattening gather, add 'gather.' prefix to its former children
            // to maintain filter key compatibility (e.g., 'gather.common.mission')
            const topLevelNonGatherGroups = ['archive', 'pds4_label', 'groups', 'facets']
            const pathParts = nextPath.split('.')
            if (pathParts.length > 0 && !topLevelNonGatherGroups.includes(pathParts[0])) {
                // This is a former gather child that needs the prefix
                if (!nextPath.startsWith('gather.')) {
                    nextPath = 'gather.' + nextPath
                }
            }

            if (node[iter[i]].facets != null) {
                keyI++
                tree.push(
                    <StyledTreeItem
                        itemId={`${keyI}`}
                        key={keyI}
                        style={{
                            display: shown.shown ? 'inherit' : 'none',
                        }}
                        label={
                            <FilterTreeLabel
                                id={iter[i]}
                                label={node[iter[i]].display_name || iter[i]}
                                active={activeFilterIds.includes(nextPath)}
                                filterString={filterString}
                                onCheck={() => {
                                    if (!activeFilterIds.includes(nextPath))
                                        addStagedFilter(nextPath, node[iter[i]])
                                    else removeStagedFilter(nextPath)
                                }}
                                onInfoClick={() => {
                                    setSelected({
                                        filter: node[iter[i]],
                                        filterKey: nextPath,
                                    })
                                }}
                            />
                        }
                        slots={{
                            groupTransition: TransitionComponent,
                        }}
                    />
                )
            } else if (type === 'groups') {
                keyI++
                if (shown.shown) groupIds.push(keyI + '')
                tree.push(
                    <StyledTreeGroup
                        itemId={`${keyI}`}
                        key={keyI}
                        label={
                            <Highlighter
                                searchWords={[filterString]}
                                autoEscape={true}
                                textToHighlight={String(node[iter[i]].display_name || iter[i])}
                            />
                        }
                        slots={{
                            groupTransition: TransitionComponent,
                        }}
                        style={{ display: shown.shown ? 'inherit' : 'none' }}
                        onClick={(function (kI) {
                            return function () {
                                toggleExpanded(kI)
                            }
                        })(keyI)}
                    >
                        {depthTraversal(
                            node[iter[i]],
                            'group',
                            depth + 1,
                            nextPath,
                            shown.shown && !shown.fromNesting
                        )}
                    </StyledTreeGroup>
                )
            } else if (type === 'group') {
                if (iter[i] === 'groups') {
                    tree.push(
                        depthTraversal(node[iter[i]], 'groups', depth + 1, nextPath, forceShown)
                    )
                } else if (iter[i] === 'filters') {
                    tree.push(
                        depthTraversal(node[iter[i]], 'filters', depth + 1, nextPath, forceShown)
                    )
                }
            }
        }
        return tree
    }

    if (mapping?.groups == null) return []
    const returnValue = depthTraversal(mapping.groups, 'groups', 0, '')
    shownExpandedIds = groupIds
    return returnValue
}

const Left = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isHelpOpen',
})(({ isHelpOpen }) => ({
    flexGrow: 1,
    overflow: 'hidden',
    width: '800px',
    display: 'flex',
    flexFlow: 'column',
    ...(isHelpOpen && {
        transition: 'width 0.2s ease-out',
    }),
}))

const Tree = styled(SimpleTreeView)(({ theme }) => ({
    flex: 1,
    overflowX: 'hidden',
    padding: `0 ${theme.spacing(2)} 0 ${theme.spacing(2)}`,
}))

const RightPanel = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isHelpOpen',
})(({ theme, isHelpOpen }) => ({
    width: '0px',
    opacity: 0,
    pointerEvents: 'none',
    overflowX: 'hidden',
    padding: '0px',
    transition: 'width 0.2s ease-out, opacity 0.2s ease-out, padding 0.2s ease-out',
    ...(isHelpOpen && {
        width: '500px',
        minHeight: '100%',
        opacity: 1,
        pointerEvents: 'inherit',
        position: 'relative',
        borderLeft: `1px solid ${theme.palette.swatches.grey.grey200}`,
    }),
}))

const StyledInput = styled(Input)(({ theme }) => ({
    'width': '100%',
    'margin': `${theme.spacing(1)} 0 ${theme.spacing(2)} 0`,
    'padding': `0 ${theme.spacing(2)} 0 ${theme.spacing(2)}`,
    'borderBottom': `1px solid ${theme.palette.swatches.grey.grey200}`,
    '&:before': {
        borderBottom: `1px solid rgba(255,255,255,0.2)`,
    },
    '& > input': {
        padding: '5px 0 6px',
    },
}))

const ClearInputButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'isHidden',
})(({ theme, isHidden }) => ({
    'color': theme.palette.text.primary,
    'fontSize': '11px',
    'lineHeight': '11px',
    'padding': '4px 7px',
    'margin': '7px',
    'height': '21px',
    'position': 'absolute',
    'right': 0,
    'transition': 'opacity 0.2s ease-in-out',
    '& .MuiButton-endIcon': {
        marginTop: '-2px',
        marginLeft: '3px',
    },
    ...(isHidden && {
        opacity: 0,
        pointerEvents: 'none',
    }),
}))

let filterStringTimeout

const FilterTree = (props) => {
    const { activeFilterIds, addStagedFilter, removeStagedFilter } = props

    const filterRef = useRef()
    const [filterString, setFilterString] = useState('')
    const [expandeds, setExpandeds] = useState([])

    const atlasMapping = useSelector((state) => {
        return state.getIn(['mappings', 'atlas'])
    })

    const [selected, setSelected] = useState({
        filter: null,
        filterKey: null,
    })

    const isHelpOpen = selected && selected.filter && selected.filterKey

    const toggleExpanded = (keyI) => {
        const nextExpandeds = JSON.parse(JSON.stringify(expandeds))
        keyI = keyI + ''
        const idx = nextExpandeds.indexOf(keyI)
        if (idx === -1) {
            nextExpandeds.push(keyI)
        } else {
            nextExpandeds.splice(idx, 1)
        }
        setExpandeds(nextExpandeds)
    }

    let finalExpandeds = expandeds
    if (filterString != null && filterString.length > 0) finalExpandeds = shownExpandedIds

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            <Left isHelpOpen={isHelpOpen}>
                <Box sx={{ display: 'flex' }}>
                    <StyledInput
                        ref={filterRef}
                        placeholder={'Find Filter'}
                        startAdornment={
                            <InputAdornment position="start">
                                <FilterListIcon />
                            </InputAdornment>
                        }
                        onInput={(e) => {
                            const val = e.target.value
                            clearTimeout(filterStringTimeout)
                            filterStringTimeout = setTimeout(() => {
                                setFilterString(val)
                            }, 400)
                        }}
                    />
                    <ClearInputButton
                        isHidden={filterString === ''}
                        aria-label="clear filter"
                        size="small"
                        onClick={() => {
                            if (filterRef?.current) {
                                filterRef.current.querySelector('input').value = ''
                                setFilterString('')
                            }
                        }}
                        endIcon={<CloseSharpIcon />}
                    >
                        Clear
                    </ClearInputButton>
                </Box>
                <Tree expanded={finalExpandeds}>
                    {makeTree(
                        atlasMapping,
                        activeFilterIds,
                        filterString,
                        addStagedFilter,
                        removeStagedFilter,
                        setSelected,
                        toggleExpanded
                    )}
                </Tree>
            </Left>
            <RightPanel isHelpOpen={isHelpOpen}>
                {isHelpOpen ? (
                    <FilterHelp
                        filter={selected.filter}
                        filterKey={selected.filterKey}
                        onClose={() => {
                            setSelected({
                                filter: null,
                                filterKey: null,
                            })
                        }}
                    />
                ) : null}
            </RightPanel>
        </Box>
    )
}

FilterTree.propTypes = {}

export default FilterTree
