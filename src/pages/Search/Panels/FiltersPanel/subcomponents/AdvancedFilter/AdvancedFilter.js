import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import Url from 'url-parse'

import {
    setModal,
    setAdvancedFilters,
    setAdvancedFiltersExpression,
    search,
} from '../../../../../../core/redux/actions/actions.js'
import { removeComments } from '../../../../../../core/utils.js'
import {
    getAtlasMappingOptions,
    getAutocompleteValues,
    basicToAdvancedFilters,
} from './AutocompleteMapping'

import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import InfoIcon from '@mui/icons-material/Info'

import ReactFilterBox, {
    AutoCompleteOption,
    SimpleResultProcessing,
} from './react-filter-box-customized/react-filter-box'
import './react-filter-box-customized/react-filter-box.css'

import { styled } from '@mui/material/styles'

const literals = [
    {
        value: '(',
        description: 'Group expressions',
        example: '(f0:on AND f1:(good OR great))',
    },
    {
        value: '[',
        description: 'Range start (inclusive)',
        example: 'f0:[v1 TO v2]',
    },
    {
        value: '{',
        description: 'Range start (exclusive)',
        example: 'f0:{v1 TO v2}',
    },
    {
        value: '"',
        description: 'String quote',
        example: 'f0:"some string"',
    },
    {
        value: '>',
        description: 'Greater than',
        example: 'f0:>5',
    },
    {
        value: '>=',
        description: 'Greater than or equal to',
        example: 'f0:>=5',
    },
    {
        value: '<',
        description: 'Less than',
        example: 'f0:<5',
    },
    {
        value: '<=',
        description: 'Less than or equal to',
        example: 'f0:<=5',
    },
    {
        value: '+',
        description: 'Term must exist',
        example: 'TODO',
    },
    {
        value: '-',
        description: 'Term must not exist',
        example: 'TODO',
    },
    {
        value: '/',
        description: 'Regex block',
        example: 'planet:/(e|m)ar(th|s)/',
    },
    {
        value: '\\',
        description: 'Escape character',
        example: 'f0:(status = well)',
    },
]

const AdvancedFilterRoot = styled('div')({
    'display': 'flex',
    'flexFlow': 'column',
    'height': '100%',
    'transition': 'width 0.4s ease-out',
    '& > .react-filter-box': {
        flex: 1,
        boxSizing: 'border-box',
        borderRadius: '0px',
        border: 'none',
        padding: '0px',
        marginBottom: '0px',
    },
    '& .react-codemirror2': {
        height: '100%',
    },
    '& .CodeMirror': {
        height: '100%',
    },
})

const HeaderButtons = styled('div')({
    height: '40px',
    position: 'absolute',
    top: '0px',
    right: '41px',
    padding: '6px 0px',
})

const RunButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'hasError',
})(({ theme, hasError }) => ({
    'color': 'white',
    'background': theme.palette.accent.main,
    'padding': '5px 6px 6px 6px',
    'borderRadius': '3px',
    'marginRight': theme.spacing(3),
    '&:hover': {
        background: theme.palette.swatches.blue.blue500,
    },
    ...(hasError && {
        'cursor': 'not-allowed',
        'background': theme.palette.swatches.red.red500,
        '&:hover': {
            background: theme.palette.swatches.red.red500,
        },
    }),
}))

const InfoButton = styled(IconButton)(({ theme }) => ({
    padding: '5px 6px 6px 6px',
    borderRadius: '3px',
    marginRight: theme.spacing(1),
}))

const ErrorBar = styled('div')(({ theme }) => ({
    background: theme.palette.swatches.red.red500,
    color: 'white',
    padding: theme.spacing(2),
    display: 'flex',
    flexFlow: 'column',
}))

const KeybindingTooltip = styled('span')(({ theme }) => ({
    color: theme.palette.swatches.grey.grey200,
    fontSize: '12px',
    marginLeft: theme.spacing(2),
}))

const toHumanFriendlyErrorMessage = (errorMessage) => {
    switch (errorMessage) {
        case String.raw`Expected "\\"" or [^"] but end of input found.`:
            return 'A closing quotation mark is missing.'
            break
        case String.raw`Expected "!", "&&", "(", "+", "-", ".", "/", "AND", "NOT", "OR", "[", "\"", "\\", "{", "||", [^: \t\r\n\x0C{}()"+-/\^~[\]], or end of input but ")" found.`:
        case String.raw`Expected "!", "&&", "(", "+", "-", ".", "/", "AND", "NOT", "OR", "[", "\"", "\\", "^", "{", "||", "~", [:], [^: \t\r\n\x0C{}()"+-/\^~[\]], or end of input but ")" found.`:
            return 'An opening parenthesis is missing.'
            break
        case String.raw`Expected "!", "&&", "+", "-", "AND", "NOT", "OR", or "||" but end of input found.`:
        case String.raw`Expected "!", "&&", "(", ")", "+", "-", ".", "/", "AND", "NOT", "OR", "[", "\"", "\\", "{", "||", or [^: \t\r\n\x0C{}()"+-/\^~[\]] but end of input found.`:
        case String.raw`Expected "!", "&&", "(", ")", "+", "-", ".", "/", "AND", "NOT", "OR", "[", "\"", "\\", "{", "||", [:], or [^: \t\r\n\x0C{}()"+-/\^~[\]] but end of input found.`:
            return 'A closing parenthesis is missing.'
            break
        case String.raw`Expected "!", "&&", "(", "+", "-", ".", "/", "AND", "NOT", "OR", "[", "\"", "\\", "{", "||", or [^: \t\r\n\x0C{}()"+-/\^~[\]] but ")" found.`:
            return 'Parentheses cannot be empty.'
            break
        case String.raw`Expected [^"] but "\"" found.`:
            return 'Strings cannot be empty.'
            break
        default:
            break
    }

    if (
        errorMessage.includes(
            String.raw`Expected "(", "+", "-", ".", "/", "[", "\"", "\\", "{", or [^: \t\r\n\x0C{}()"+-/\^~[\]] but`
        )
    )
        return "The symbol following '{key}:' is unsupported."

    return errorMessage
}

const AdvancedFilter = (props) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const activeFilters = useSelector((state) => {
        return state.getIn(['activeFilters'])
    }).toJS()
    const advancedFilters = useSelector((state) => {
        return state.getIn(['advancedFilters'])
    })
    const allMappings = useSelector((state) => {
        return state.getIn(['mappings', 'all']) || {}
    })

    const options = getAtlasMappingOptions(allMappings)

    const [parseError, setParseError] = useState(null)
    const [parsedExpression, setParsedExpression] = useState(null)
    const [firstPass, setFirstPass] = useState(true)

    useEffect(() => {
        const desiredSearchUrl = `?_adv=${encodeURI(removeComments(advancedFilters))}`
        const currentURL = new Url(window.location)
        if (currentURL.pathname + currentURL.query !== desiredSearchUrl) {
            navigate(desiredSearchUrl, { replace: true })
        }
    }, [advancedFilters])

    useEffect(() => {
        // On Mount
        document.removeEventListener('keydown', runKeyBinding)
        document.addEventListener('keydown', runKeyBinding)
        return () => {
            // On Will Unmount
            document.removeEventListener('keydown', runKeyBinding)
        }
    }, [parseError, parsedExpression])

    // Ctrl + Enter triggers run()
    const runKeyBinding = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            run()
        }
    }

    // prettier-ignore
    const baseEditorText = firstPass ? [
            `/* Welcome to the Atlas Advanced Search! Here you can write`,
            ` * advanced queries using keywords and operators.`, 
            ` *`,
            ` * Press the play button above when your query is ready`,
            ` * to be executed or use ('ctrl/cmd + enter').`,
            ` *`,
            ` * Autocompletion can be triggered with 'ctrl/cmd + shift'.`,
            ` *`,
            ` * Queries use the Lucene query string syntax.`,
            ` */`,
            ``,
            (advancedFilters == null || advancedFilters === '') ? basicToAdvancedFilters(activeFilters) : removeComments(advancedFilters),
            ``,
            `// Example queries:`,
            `# gather.common.mission:"cas" AND gather.common.target:(*ring OR dione)`,
            `# gather.common.target:(dione AND tethys AND NOT saturn)`
        ].join('\n') : ''

    // Set the advancedFilters to the base text if unset
    useEffect(() => {
        if (advancedFilters == null && parsedExpression == null) {
            dispatch(setAdvancedFilters(baseEditorText, true))
            // trigger search if not empty/default query
            if (removeComments(baseEditorText).length > 0) dispatch(search(0, true, true))

            setParsedExpression(baseEditorText)
        }
        setFirstPass(false)
    }, [])

    const findOption = (value) => {
        for (let i = 0; i < options.length; i++) {
            if (options[i].columnField === value) return options[i]
        }
        return false
    }
    const findLiteral = (value) => {
        for (let i = 0; i < literals.length; i++) {
            if (literals[i].value === value) return literals[i]
        }
        return false
    }

    const run = () => {
        if (parseError) {
        } else {
            //run
            dispatch(setAdvancedFilters(parsedExpression))
        }
    }

    const onChange = (query, expressions) => {
        setParsedExpression(query)
        dispatch(setAdvancedFiltersExpression(expressions))
        if (expressions.isError) {
            setParseError(expressions)
        } else setParseError(null)
    }
    //customer your rendering item in auto complete
    const customRenderCompletionItem = (self, data, pick) => {
        const option = findOption(data.value)
        const literal = findLiteral(data.value)

        return (
            <div className="hint-value">
                <span
                    style={{
                        fontWeight: 'bold',
                        fontSize: ['literal', 'condition'].includes(data.type) ? 18 : 14,
                    }}
                >
                    {data.value}
                </span>
                {option && option.type && (
                    <span style={{ color: '#ffd36f', fontSize: 12 }}> - {option.type}</span>
                )}
                {option && option.mission && (
                    <span style={{ color: '#e1e1e1', fontSize: 12 }}> [{option.mission}]</span>
                )}
                {literal && literal.description && (
                    <span style={{ color: '#ffd36f', fontSize: 12 }}> - {literal.description}</span>
                )}
                {literal && literal.example && (
                    <span style={{ color: '#e1e1e1', fontSize: 12 }}>, ex. {literal.example}</span>
                )}
                {data.count != null && (
                    <span style={{ color: '#e1e1e1', fontSize: 12 }}> ({data.count})</span>
                )}
            </div>
        )
    }

    return (
        <AdvancedFilterRoot>
            <HeaderButtons>
                <Tooltip
                    title={
                        parseError ? (
                            'Fix Errors First'
                        ) : (
                            <>
                                Run <KeybindingTooltip>(Ctrl + Enter)</KeybindingTooltip>
                            </>
                        )
                    }
                    arrow
                >
                    <RunButton
                        hasError={!!parseError}
                        aria-label="run advanced filter"
                        size="small"
                        onClick={run}
                    >
                        <PlayArrowIcon fontSize="inherit" />
                    </RunButton>
                </Tooltip>
                <Tooltip title="Info" arrow>
                    <InfoButton
                        aria-label="info for advanced filter"
                        size="small"
                        onClick={() => {
                            dispatch(setModal('advancedFilter'))
                        }}
                    >
                        <InfoIcon fontSize="inherit" />
                    </InfoButton>
                </Tooltip>
            </HeaderButtons>
            <ReactFilterBox
                options={options}
                customRenderCompletionItem={customRenderCompletionItem}
                getAutocompleteValues={getAutocompleteValues}
                maxAutoCompleteSize={2000}
                onChange={onChange}
                refreshUntilMs={420}
                editorConfig={{
                    theme: 'elegant',
                    viewportMargin: Infinity,
                    lineNumbers: true,
                    lineWrapping: true,
                    autoRefresh: true,
                    matchBrackets: true,
                    value: baseEditorText,
                }}
            />
            {parseError && (
                <Tooltip title={parseError.message} arrow>
                    <ErrorBar>
                        <span>{`Line ${parseError.location?.start?.line}, Column ${parseError.location?.start?.column}  -  ${parseError.name}:`}</span>
                        <span>{`${toHumanFriendlyErrorMessage(parseError.message)}`}</span>
                    </ErrorBar>
                </Tooltip>
            )}
        </AdvancedFilterRoot>
    )
}

AdvancedFilter.propTypes = {}

export default AdvancedFilter
