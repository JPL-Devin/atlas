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

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseSharpIcon from '@mui/icons-material/CloseSharp'
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

import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'

import { publicUrl, ES_PATHS, IMAGE_EXTENSIONS } from '../../../../core/constants'
import { streamDownloadFile } from '../../../../core/downloaders/ZipStream.js'

import ReactMarkdown from 'react-markdown'

import {
    RegexModalRoot,
    Contents,
    TopBar,
    CloseIconButton,
    ModalTitle,
    Subtitle,
    BottomSection,
    InputSection,
    InputBar,
    RegexSearchInput,
    RegexSearchButton,
    HelpButton,
    HelpSection,
    CloseHelpIconButton,
    Results,
    ResultList,
    ListItem,
    ListItemButtons,
    FlexBetween1,
    LiName,
    LiSize,
    ItemButton,
    BottomBar,
    InputWrapper,
    Flags,
    FlagIconButton,
    ResultCount,
    LoadingBar,
    NoResults,
    AddAllCartButton,
} from './RegexModal.styles'

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
                    <Box sx={{ display: 'flex' }}>
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
                    </Box>

                    <Box sx={{ display: 'flex' }}>
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
                    </Box>
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
                                        <Box sx={{ fontSize: '24px', padding: '2px' }}>
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
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                                        </Box>
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
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
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
                        </Box>
                        <ResultCount>
                            {total > 0
                                ? `${Math.min((page - 1) * pageSize + 1, total)} to ${Math.min(
                                      page * pageSize,
                                      total
                                  )} out of ${total} items`
                                : '0 items'}
                        </ResultCount>
                    </BottomBar>
                </BottomSection>
            </Contents>
        </RegexModalRoot>
    );
}

RegexModal.propTypes = {}

export default RegexModal
