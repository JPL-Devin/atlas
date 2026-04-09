import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import {
    setModal,
    queryFilexRegex,
    setFilexPreview,
    addToCart,
    setSnackBarText,
} from '../../../../core/redux/actions/actions.js'
import {
    getIn,
    getPDSUrl,
    getFilename,
    abbreviateNumber,
    getExtension,
    humanFileSize,
} from '../../../../core/utils'

import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseSharpIcon from '@mui/icons-material/CloseSharp'
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'
import GetAppIcon from '@mui/icons-material/GetApp'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import FolderIcon from '@mui/icons-material/Folder'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import Tooltip from '@mui/material/Tooltip'
import InputAdornment from '@mui/material/InputAdornment'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import SpellcheckIcon from '@mui/icons-material/Spellcheck'
import Pagination from '@mui/material/Pagination'
import LinearProgress from '@mui/material/LinearProgress'

import { styled, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import { publicUrl, ES_PATHS, IMAGE_EXTENSIONS } from '../../../../core/constants'
import { streamDownloadFile } from '../../../../core/downloaders/ZipStream.js'

import ReactMarkdown from 'react-markdown'

const RegexModalRoot = styled('div')(({ theme }) => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    background: theme.palette.swatches.grey.grey0,
    zIndex: 998,
    boxShadow: 'inset -1px 0px 5px 0px rgba(0,0,0,0.2)',
}))

const Contents = styled('div')({
    width: '100%',
    height: '100%',
})

const TopBar = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    height: '40px',
    background: theme.palette.swatches.grey.grey0,
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey300}`,
}))

const CloseIconButton = styled(IconButton)(({ theme }) => ({
    padding: theme.spacing(1.5),
    margin: '4px',
}))

const ModalTitle = styled(Typography)({
    fontSize: '18px',
    fontWeight: 'bold',
    lineHeight: '42px',
    textTransform: 'uppercase',
})

const Subtitle = styled('div')(({ theme }) => ({
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

const BottomSection = styled('div')({
    display: 'flex',
    flexFlow: 'column',
    width: '100%',
    height: 'calc(100% - 41px)',
})

const InputSection = styled('div')(({ theme }) => ({
    width: '100%',
    background: theme.palette.swatches.grey.grey100,
    borderBottom: `1px solid ${theme.palette.accent.main}`,
}))

const InputBar = styled('div')(({ theme }) => ({
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

const RegexSearchInput = styled(TextField)(({ theme }) => ({
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

const RegexSearchButton = styled(Button)({
    padding: '4px 40px',
    borderRadius: '0px',
    boxShadow: 'none',
})

const HelpButton = styled(IconButton)({
    height: '40px',
    width: '40px',
})

const HelpSection = styled('div', {
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

const CloseHelpIconButton = styled(IconButton, {
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

const Results = styled('div')({
    flex: 1,
    overflowY: 'auto',
})

const ResultList = styled('ul')({
    listStyleType: 'none',
    margin: 0,
    padding: '2px 0px',
})

const ListItem = styled('li', {
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

const ListItemButtons = styled('div', {
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

const FlexBetween = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
})

const FlexBetween1 = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
    flex: 1,
})

const Flex = styled('div')({
    display: 'flex',
})

const LiType = styled('div')({
    fontSize: '24px',
    padding: '2px',
})

const LiName = styled('div', {
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

const LiSize = styled('div', {
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

const ItemButton = styled(IconButton)({
    padding: '4px 4px 3px 4px',
    marginTop: '-4px',
})

const BottomBar = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    background: theme.palette.swatches.grey.grey50,
    borderTop: `1px solid ${theme.palette.swatches.grey.grey300}`,
    height: '40px',
    width: '100%',
}))

const PaginationWrapper = styled('div')({
    display: 'flex',
    justifyContent: 'center',
})

const InputWrapper = styled('div')({
    width: '100%',
    height: '100%',
    position: 'relative',
})

const Flags = styled('div')({
    position: 'absolute',
    right: 0,
    top: 0,
    display: 'flex',
})

const FlagIconButton = styled(IconButton, {
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

const ResultCount = styled('div')({
    lineHeight: '40px',
    padding: '0px 16px',
    fontStyle: 'italic',
})

const LoadingBar = styled('div')(({ theme }) => ({
    'position': 'absolute',
    'width': '100%',
    '& .MuiLinearProgress-barColorPrimary': {
        background: theme.palette.swatches.blue.blue500,
    },
    '& > div': {
        height: '2px !important',
    },
}))

const NoResults = styled(Paper)(({ theme }) => ({
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

const AddAllCartButton = styled(Button)(({ theme }) => ({
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

let regexSearchValue = null

const RegexModal = (props) => {
    const { modal } = props
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    const dispatch = useDispatch()

    const [helpOpen, setHelpOpen] = useState(false)
    const [caseSensitive, setCaseSensitive] = useState(false)
    const [includeDirectories, setIncludeDirectories] = useState(false)
    const [results, setResults] = useState(false)
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(200)
    const [selectedUri, setSelectedUri] = useState(false)

    const open = modal !== false
    if (regexSearchValue == null && modal?.uri && typeof modal.uri === 'string')
        regexSearchValue = modal.uri.replace(/\//g, '\\/').replace(/:/g, '\\:') + '.*'
    const handleClose = () => {
        // close modal
        regexSearchValue = null
        dispatch(setModal(false))
    }

    const regexSearch = () => {
        if (!modal?.uri) return
        setHelpOpen(false)
        setPage(1)
        setLoading(true)
        dispatch(
            queryFilexRegex(
                regexSearchValue,
                0,
                {
                    caseSensitive: caseSensitive,
                    pageSize: pageSize,
                    includeDirectories: includeDirectories,
                },
                (res) => {
                    setLoading(false)
                    const newResults = getIn(res, ['data', 'hits', 'hits'], [])
                    setResults(newResults)
                    const newTotal = getIn(res, ['data', 'hits', 'total', 'value'], 0)
                    setTotal(newTotal)
                }
            )
        )
    }

    useEffect(() => {
        if (open) {
            regexSearch()
        }
    }, [open])

    if (!open) return null
    return (
        <RegexModalRoot>
            <Contents>
                <TopBar>
                    <Flex>
                        <Tooltip title="Help" arrow>
                            <HelpButton
                                aria-label="regex help"
                                onClick={() => {
                                    setHelpOpen(!helpOpen)
                                }}
                                size="large">
                                <HelpOutlineIcon size="small" />
                            </HelpButton>
                        </Tooltip>
                        <ModalTitle variant="h2">
                            URI Regex Search
                        </ModalTitle>
                    </Flex>

                    <Flex>
                        <AddAllCartButton
                            size="small"
                            variant="contained"
                            endIcon={<AddShoppingCartIcon />}
                            onClick={() => {
                                dispatch(addToCart('regex', 'lastRegexQuery'))

                                dispatch(setSnackBarText('Added to Cart!', 'success'))
                            }}
                        >
                            Add All Results to Cart
                        </AddAllCartButton>
                        <Tooltip title="Close" arrow>
                            <CloseIconButton
                                aria-label="close"
                                onClick={handleClose}
                                size="large">
                                <CloseSharpIcon fontSize="inherit" />
                            </CloseIconButton>
                        </Tooltip>
                    </Flex>
                </TopBar>
                <BottomSection>
                    <InputSection>
                        <InputBar>
                            <InputWrapper>
                                <RegexSearchInput
                                    placeholder="Enter a Regular Expression"
                                    defaultValue={regexSearchValue}
                                    variant="filled"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    onChange={(e) => {
                                        regexSearchValue = e.target.value
                                    }}
                                    onKeyDown={(e) => {
                                        // Search when enter pressed
                                        if (e.keyCode == 13) regexSearch()
                                    }}
                                />
                                <Flags>
                                    <Tooltip
                                        title={`Case Sensitivity ${
                                            caseSensitive ? '(ON)' : '(OFF)'
                                        }`}
                                        arrow
                                    >
                                        <FlagIconButton
                                            isOn={caseSensitive}
                                            aria-label="toggle case-sensitivity"
                                            onClick={() => {
                                                setCaseSensitive(!caseSensitive)
                                            }}
                                            size="large">
                                            <SpellcheckIcon fontSize="inherit" />
                                        </FlagIconButton>
                                    </Tooltip>
                                    <Tooltip
                                        title={`Include Directories ${
                                            includeDirectories ? '(ON)' : '(OFF)'
                                        }`}
                                        arrow
                                    >
                                        <FlagIconButton
                                            isOn={includeDirectories}
                                            aria-label="toggle include directories"
                                            onClick={() => {
                                                setIncludeDirectories(!includeDirectories)
                                            }}
                                            size="large">
                                            <FolderIcon fontSize="inherit" />
                                        </FlagIconButton>
                                    </Tooltip>
                                </Flags>
                            </InputWrapper>
                            <RegexSearchButton
                                size="small"
                                variant="contained"
                                endIcon={<ArrowForwardIcon />}
                                onClick={regexSearch}
                            >
                                Search
                            </RegexSearchButton>
                        </InputBar>
                        {loading ? (
                            <LoadingBar>
                                <LinearProgress />
                            </LoadingBar>
                        ) : null}
                    </InputSection>
                    <HelpSection isOpen={helpOpen}>
                        <ReactMarkdown linkTarget="_blank">
                            {[
                                `# Help - Regular Expressions`,
                                `A regular expression (regex) is a way to match patterns in data using placeholder characters, called operators.`,
                                `AtlasIV uses Elasticsearch to perform search queries. Full regular expression documentation can be found [here.](https://www.elastic.co/guide/en/elasticsearch/reference/7.10/regexp-syntax.html)`,
                                ``,
                                `## Quick and Common Examples`,
                                '- `.*` - Search for everything',
                                '- `.*\\.IMG` - Search for everything that ends with ".IMG"',
                                '- `.*\\/00<090-300>\\/.*` - Search for everything with a Sol directory of 00090 to 00300',
                                ``,
                                `## URI`,
                                'Regex queries are done over the `uri` field. `uri`s are unique AtlasIV cross-pds-standard IDs that are applied to each file and directory.',
                                ``,
                                '- `uri` is of the form:',
                                '  `atlas:{standard}:{mission}:{spacecraft}:/{bundleName?}{restOfPath?}`',
                                '  - _standard:_ `pds3` or `pds4`',
                                '  - _mission:_ Standardized mission name.',
                                '  - _spacecraft:_ Standardized spacecraft name.',
                                "  - _bundleName:_ Name of the volume or bundle. Optional but the only uri where the bundleName does not exist are on the mission-spacecraft's root directory (`atlas:{standard}:{mission}:{spacecraft}:/`)",
                                '  - _restOfPath:_ Rest of path to directory or file. Directory uris do not end with a `/`. Optional but the only uris without a restOfPath are root directories and bundle directories.',
                                ``,
                                `## Reserved characters`,
                                `All Unicode characters are supported, however, the following characters are reserved as operators:`,
                                ``,
                                '`. ? + * | { } [ ] ( ) " \\`',
                                ``,
                                `Depending on the optional operators enabled, the following characters may also be reserved:`,
                                ``,
                                '`# @ & < > ~`',
                                ``,
                                `To use one of these characters literally, escape it with a preceding backslash or surround it with double quotes. For example:`,
                                ``,
                                "`\\@` - renders as a literal '@'\n",
                                "`\\\\` - renders as a literal '\\\\'\n",
                                `\`"john@smith.com"\` - renders as 'john@smith.com'`,
                                ``,
                                `### Standard operators`,
                                `The following standard operators are supported:`,
                                ``,
                                '#### `.`',
                                `- Matches any character. For example:`,
                                ``,
                                "  - `ab.` - matches 'aba', 'abb', 'abz', etc.",
                                '#### `?`',
                                `- Repeat the preceding character zero or one times. Often used to make the preceding character optional. For example:`,
                                ``,
                                "  - `abc?` - matches 'ab' and 'abc'",
                                '#### `+`',
                                `- Repeat the preceding character one or more times. For example:`,
                                ``,
                                "  - `ab+` - matches 'ab', 'abb', 'abbb', etc.",
                                '#### `*`',
                                `- Repeat the preceding character zero or more times. For example:`,
                                ``,
                                "  - `ab*` - matches 'a', 'ab', 'abb', 'abbb', etc.",
                                '  - `.*` - matches as a full wildcard',
                                '#### `{}`',
                                `- Minimum and maximum number of times the preceding character can repeat. For example:`,
                                ``,
                                "  - `a{2}` - matches 'aa'",
                                "  - `a{2,4}` - matches 'aa', 'aaa', and 'aaaa'",
                                "  - `a{2,}` - matches 'a' repeated two or more times",
                                '#### `|`',
                                `- OR operator. The match will succeed if the longest pattern on either the left side OR the right side matches. For example:`,
                                ``,
                                "  - `abc|xyz` - matches 'abc' and 'xyz'",
                                '#### `( … )`',
                                `- Forms a group. You can use a group to treat part of the expression as a single character. For example:`,
                                ``,
                                "  - `abc(def)?` - matches 'abc' and 'abcdef' but not 'abcd'",
                                '#### `[ … ]`',
                                `- Match one of the characters in the brackets. For example:`,
                                ``,
                                "  - `[abc]` - matches 'a', 'b', 'c'",
                                ``,
                                `- Inside the brackets, - indicates a range unless - is the first character or escaped. For example:`,
                                ``,
                                "  - `[a-c]` - matches 'a', 'b', or 'c'",
                                "  - `[-abc]` - '-' is first character. Matches '-', 'a', 'b', or 'c'",
                                "  - `[abc-]` - Escapes '-'. Matches 'a', 'b', 'c', or '-'",
                                `- A ^ before a character in the brackets negates the character or range. For example:`,
                                ``,
                                "  - `[^abc]` - matches any character except 'a', 'b', or 'c'",
                                "  - `[^a-c]` - matches any character except 'a', 'b', or 'c'",
                                "  - `[^-abc]` - matches any character except '-', 'a', 'b', or 'c'",
                                "  - `[^abc-]` - matches any character except 'a', 'b', 'c', or '-'",
                                ``,
                                '#### `~`',
                                '- You can use `~` to negate the shortest following pattern. For example:',
                                ``,
                                "  - `a~bc` - matches 'adc' and 'aec' but not 'abc'",
                                ``,
                                '#### `<>`',
                                '- You can use `<>` to match a numeric range. For example:',
                                ``,
                                "  - `foo<1-100>` - matches 'foo1', 'foo2' ... 'foo99', 'foo100'",
                                "  - `foo<01-100>` - matches 'foo01', 'foo02' ... 'foo99', 'foo100'",
                                ``,
                                '#### `&`',
                                `- Acts as an AND operator. The match will succeed if patterns on both the left side AND the right side matches. For example:`,
                                ``,
                                "  - `aaa.+&.+bbb` - matches 'aaabbb'",
                                ``,
                                '#### `@`',
                                '- You can use `@` to match any entire string.',
                                ``,
                                '- You can combine the `@` operator with `&` and `~` operators to create an "everything except" logic. For example:',
                                ``,
                                "  - `@&~(abc.+)` - matches everything except terms beginning with 'abc'",
                                ``,
                                `## Unsupported operators`,
                                '- The regular expression engine, Lucene, does not support anchor operators, such as `^` (beginning of line) or `$` (end of line). To match a term, the regular expression must match the entire string.',
                            ].join('\n')}
                        </ReactMarkdown>
                        <Tooltip title="Close Help" arrow>
                            <CloseHelpIconButton
                                isOpen={helpOpen}
                                aria-label="close help"
                                onClick={() => {
                                    setHelpOpen(false)
                                }}
                                size="large">
                                <CloseSharpIcon fontSize="inherit" />
                            </CloseHelpIconButton>
                        </Tooltip>
                    </HelpSection>
                    <Results>
                        {results && results.length > 0 ? (
                            results.map((r, idx) => {
                                const s = r._source || {}
                                const result = s.archive || {}
                                const pds4_label = s.pds4_label || {}

                                return (
                                    <ListItem
                                        key={idx}
                                        isLessPadding
                                        isActive={selectedUri === s.uri}
                                        onClick={() => {
                                            setSelectedUri(s.uri)
                                            dispatch(
                                                setFilexPreview({
                                                    ...r._source.archive,
                                                    ...r._source.pds4_label,
                                                    key: getFilename(s.uri),
                                                })
                                            )
                                        }}
                                    >
                                        <LiType>
                                            {getIn(r._source, ES_PATHS.archive.fs_type) ===
                                            'file' ? (
                                                <>
                                                    {IMAGE_EXTENSIONS.includes(
                                                        getExtension(result.uri, true)
                                                    ) ? (
                                                        <ImageIcon size="small" />
                                                    ) : (
                                                        <InsertDriveFileOutlinedIcon size="small" />
                                                    )}{' '}
                                                </>
                                            ) : (
                                                <FolderIcon size="small" />
                                            )}
                                        </LiType>
                                        <FlexBetween>
                                            <FlexBetween1>
                                                <LiName title={result.name}>
                                                    {s.uri.replace(modal.uri, '')}
                                                </LiName>
                                                {result.fs_type === 'file' && (
                                                    <LiSize
                                                        isActive={selectedUri === s.uri}
                                                        title={result.size}
                                                    >
                                                        {humanFileSize(result.size)}
                                                    </LiSize>
                                                )}
                                            </FlexBetween1>
                                            <ListItemButtons
                                                className="listItemButtons"
                                                isActive={selectedUri === s.uri}
                                            >
                                                {getIn(s, ES_PATHS.archive.fs_type) === 'file' ? (
                                                    <Tooltip title="Download" arrow>
                                                        <ItemButton
                                                            aria-label="quick download"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (s.uri != null) {
                                                                    streamDownloadFile(
                                                                        getPDSUrl(
                                                                            s.uri,
                                                                            getIn(
                                                                                s,
                                                                                ES_PATHS.release_id
                                                                            )
                                                                        ),
                                                                        getFilename(s.uri)
                                                                    )
                                                                }
                                                            }}
                                                            size="large">
                                                            <GetAppIcon size="small" />
                                                        </ItemButton>
                                                    </Tooltip>
                                                ) : null}
                                                <Tooltip title="Add to Cart" arrow>
                                                    <ItemButton
                                                        aria-label="add to cart"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            dispatch(
                                                                addToCart(
                                                                    getIn(
                                                                        s,
                                                                        ES_PATHS.archive.fs_type
                                                                    ) === 'directory'
                                                                        ? 'directory'
                                                                        : 'file',
                                                                    {
                                                                        uri: getIn(
                                                                            s,
                                                                            ES_PATHS.source
                                                                        ),
                                                                        related: getIn(
                                                                            s,
                                                                            ES_PATHS.related
                                                                        ),
                                                                        release_id: getIn(
                                                                            s,
                                                                            ES_PATHS.release_id
                                                                        ),
                                                                        size: getIn(
                                                                            s,
                                                                            ES_PATHS.archive.size
                                                                        ),
                                                                    }
                                                                )
                                                            )

                                                            dispatch(
                                                                setSnackBarText(
                                                                    'Added to Cart!',
                                                                    'success'
                                                                )
                                                            )
                                                        }}
                                                        size="large">
                                                        <AddShoppingCartIcon size="small" />
                                                    </ItemButton>
                                                </Tooltip>
                                            </ListItemButtons>
                                        </FlexBetween>
                                    </ListItem>
                                );
                            })
                        ) : !loading ? (
                            <NoResults>
                                <div>No Results Were Found</div>
                                <div>Try a different query.</div>
                            </NoResults>
                        ) : null}
                    </Results>
                    <BottomBar>
                        <PaginationWrapper>
                            <Pagination
                                count={total > 0 ? Math.ceil(Math.min(10000, total) / pageSize) : 0}
                                page={parseInt(page)}
                                onChange={(e, value) => {
                                    setLoading(true)
                                    dispatch(
                                        queryFilexRegex(
                                            regexSearchValue,
                                            value - 1,
                                            {
                                                caseSensitive: caseSensitive,
                                                pageSize: pageSize,
                                                includeDirectories: includeDirectories,
                                            },
                                            (res) => {
                                                setLoading(false)
                                                const newResults = getIn(
                                                    res,
                                                    ['data', 'hits', 'hits'],
                                                    []
                                                )
                                                setResults(newResults)
                                                const newTotal = getIn(
                                                    res,
                                                    ['data', 'hits', 'total', 'value'],
                                                    0
                                                )
                                                setTotal(newTotal)
                                                setPage(value)
                                            }
                                        )
                                    )
                                }}
                                shape="rounded"
                                size={'large'}
                                showFirstButton
                                showLastButton
                            />
                        </div>
                        <ResultCount>
                            {total > 0
                                ? `${Math.min((page - 1) * pageSize + 1, total)} to ${Math.min(
                                      page * pageSize,
                                      total
                                  )} out of ${total} items`
                                : '0 items'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

RegexModal.propTypes = {}

export default RegexModal
