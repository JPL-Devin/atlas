import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import axios from 'axios'

import {
    getIn,
    getHeader,
    getExtension,
    prettify,
    humanFileSize,
    getPDSUrl,
    getFilename,
    copyToClipboard,
} from '../../../core/utils'

import {
    updateFilexColumn,
    goToFilexURI,
    addToCart,
    setSnackBarText,
} from '../../../core/redux/actions/actions'
import { ES_PATHS, HASH_PATHS, IMAGE_EXTENSIONS, domain, endpoints } from '../../../core/constants'
import { streamDownloadFile } from '../../../core/downloaders/ZipStream.js'

import ProductIcons from '../../../components/ProductIcons/ProductIcons'

import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'

import PageviewIcon from '@mui/icons-material/Pageview'
import GetAppIcon from '@mui/icons-material/GetApp'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import LaunchIcon from '@mui/icons-material/Launch'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import WarningIcon from '@mui/icons-material/Warning'

import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'

import Image from 'mui-image'

import { styled } from '@mui/material/styles'

import './Preview.css'

const PreviewRoot = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isMobileView',
})(({ theme, isMobileView }) => ({
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    boxShadow: '0px 0px 6px 0px rgba(0,0,0,0.4)',
    display: 'flex',
    flexFlow: 'column',
    background: theme.palette.swatches.grey.grey800,
    color: theme.palette.swatches.grey.grey150,
    zIndex: 2,
    ...(isMobileView && {
        zIndex: 999,
        borderLeft: 'none',
    }),
}))

const Header = styled('div')(({ theme }) => ({
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.19)',
    background: theme.palette.swatches.grey.grey700,
}))

const HeaderMobile = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    boxSizing: 'border-box',
    background: theme.palette.swatches.grey.grey700,
}))

const HeaderBanner = styled('div')(({ theme }) => ({
    'fontSize': '15px',
    'padding': '6px',
    'background': theme.palette.swatches.orange.orange600,
    'color': 'rgba(0,0,0,0.6)',
    'fontWeight': 'bold',
    'display': 'flex',
    'justifyContent': 'space-between',
    'cursor': 'pointer',
    '& > div': {
        display: 'flex',
    },
    '& > div > div': {
        paddingLeft: '5px',
    },
}))

const PreviewTitle = styled(Typography)({
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '8px 8px 0px 8px',
    fontFamily: 'inherit',
    wordBreak: 'break-all',
})

const PreviewTitleMobile = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    margin: '0px',
    fontFamily: 'inherit',
    lineHeight: `${theme.headHeights[2]}px`,
}))

const HeaderRight = styled('div')({
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
})

const ActionButton = styled(IconButton)(({ theme }) => ({
    'width': `${theme.headHeights[2]}px`,
    'height': `${theme.headHeights[2]}px`,
    'color': theme.palette.swatches.blue.blue400,
    '&:hover': {
        background: 'rgba(255,255,255,0.1)',
    },
    '&.Mui-disabled': {
        color: theme.palette.swatches.grey.grey400,
        cursor: 'not-allowed',
    },
}))

const Body = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isMobileView',
})(({ isMobileView }) => ({
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
}))

const BodyInner = styled('div')({
    padding: '16px 0px',
})

const SectionHeading = styled('div')(({ theme }) => ({
    fontSize: '14px',
    lineHeight: '30px',
    color: theme.palette.swatches.yellow.yellow500,
    textTransform: 'uppercase',
    padding: '0px 16px 4px 16px',
}))

const SectionBody = styled('div')({
    marginBottom: '20px',
})

const RelatedList = styled('ul')(({ theme }) => ({
    'listStyleType': 'none',
    'margin': `4px 0px 0px 0px`,
    'padding': '0px 16px',
    '& > li': {
        lineHeight: '24px',
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'flex-start',
    },
}))

const RelatedGroup = styled('div')(({ theme }) => ({
    textTransform: 'uppercase',
    lineHeight: '28px',
    width: '70px',
    color: theme.palette.swatches.grey.grey300,
}))

const RelatedLinks = styled('div')({
    display: 'flex',
    justifyContent: 'flex-start',
    flex: '1',
})

const RelatedButton = styled(Button)(({ theme }) => ({
    'background': theme.palette.swatches.grey.grey700,
    'color': theme.palette.swatches.blue.blue400,
    'border': `1px solid ${theme.palette.swatches.grey.grey900}`,
    'marginLeft': '4px',
    '&:hover': {
        border: `1px solid ${theme.palette.swatches.grey.grey600}`,
    },
    '& .MuiButton-label': {
        lineHeight: '20px',
    },
    '& .MuiButton-endIcon': {
        marginLeft: '6px',
    },
    '& .MuiButton-endIcon > svg': {
        fontSize: '14px',
    },
}))

const PropertiesList = styled('ul')(({ theme }) => ({
    'listStyleType': 'none',
    'margin': `0px`,
    'padding': '0px',
    '& > li': {
        'display': 'flex',
        'justifyContent': 'space-between',
        'lineHeight': '24px',
        'padding': '2px 16px',
        'transition': 'max-height 0.3s ease-in',
        'wordBreak': 'break-all',
        '& > div:last-child': {
            whiteSpace: 'inherit',
        },
    },
    '& > li:nth-child(odd)': {
        background: theme.palette.swatches.grey.grey700,
    },
}))

const PropertyKey = styled('div')(({ theme }) => ({
    marginRight: '16px',
    textTransform: 'uppercase',
    color: theme.palette.swatches.grey.grey300,
    fontSize: '12px',
}))

const PropertyValue = styled('div')({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    flex: '1',
})

const ImageContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '400px',
    position: 'relative',
    cursor: 'pointer',
    overflow: 'hidden',
    borderTop: `1px solid ${theme.palette.swatches.grey.grey700}`,
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey700}`,
}))

const PreviewImageStyled = styled('div')({
    'overflow': 'hidden',
    'position': 'static !important',
    'objectFit': 'cover !important',
    'transition': 'filter 0.15s ease-in-out !important',
    '&:hover': {
        filter: 'brightness(1.25)',
    },
})

const ImageCover = styled('div')({
    position: 'absolute',
    pointerEvents: 'none',
    top: 0,
    width: '100%',
    height: '100%',
    boxShadow: 'inset 0px 1px 6px 1px rgba(0,0,0,0.16)',
})

const ImagelessContainer = styled('div')({
    'width': '100%',
    'height': '100%',
    'position': 'relative',
    '& > div': {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
    },
})

const NavHeader = styled('div')(({ theme }) => ({
    'height': `${theme.headHeights[2]}px`,
    'minHeight': `${theme.headHeights[2]}px`,
    'background': theme.palette.swatches.grey.grey700,
    'boxSizing': 'border-box',
    'display': 'flex',
    'justifyContent': 'space-between',
    'borderBottom': `1px solid ${theme.palette.swatches.grey.grey900}`,
    '& > div': {
        display: 'flex',
        justifyContent: 'space-between',
    },
    '& > div:last-child': {
        flex: 1,
    },
}))

const BackButton = styled(IconButton)(({ theme }) => ({
    lineHeight: '28px',
    borderRadius: 0,
    color: theme.palette.swatches.grey.grey150,
}))

const EmptyPreview = styled('div')(({ theme }) => ({
    textAlign: 'center',
    margin: `${theme.spacing(10)} 0px`,
    color: theme.palette.swatches.grey.grey500,
    fontSize: '16px',
}))

const StyledFormControl = styled(FormControl)({
    minWidth: 125,
    margin: '5px 0px 3px 8px',
})

const StyledSelect = styled(Select)(({ theme }) => ({
    'color': theme.palette.swatches.grey.grey300,
    'background': theme.palette.swatches.grey.grey800,
    'borderBottom': `2px solid ${theme.palette.swatches.grey.grey600}`,
    'paddingLeft': '4px',
    '& > div:first-child': {
        padding: '8px 20px 6px 6px',
        textAlign: 'left',
    },
    '& > svg': {
        color: '#efefef',
        top: '4px',
        right: '2px',
    },
}))

const ButtonBar = (props) => {
    const { isMobile, preview, related } = props
    const dispatch = useDispatch()
    const navigate = useNavigate()

    let iconSize = isMobile ? 'inherit' : 'inherit'

    return (
        <div>
            <Tooltip title="View" arrow>
                <span>
                    <ActionButton
                        aria-label="view"
                        disabled={
                            preview.fs_type !== 'file' || related == null || related.uri == null
                        }
                        onClick={() => {
                            if (related && related.uri)
                                navigate(`${HASH_PATHS.record}?uri=${related.uri}&back=page`)
                        }}
                        size="large"
                    >
                        <PageviewIcon fontSize={iconSize} />
                    </ActionButton>
                </span>
            </Tooltip>
            <Tooltip title="Open" arrow>
                <span>
                    <ActionButton
                        aria-label="open"
                        disabled={preview.fs_type !== 'file'}
                        onClick={() => {
                            if (preview.uri)
                                window.open(
                                    getPDSUrl(preview.uri, getIn(preview, ES_PATHS.release_id)),
                                    '_blank'
                                )
                        }}
                        size="large"
                    >
                        <LaunchIcon fontSize={iconSize} />
                    </ActionButton>
                </span>
            </Tooltip>
            <Tooltip title="Download" arrow>
                <span>
                    <ActionButton
                        aria-label="quick download"
                        disabled={preview.fs_type !== 'file'}
                        onClick={() => {
                            if (preview.uri != null) {
                                streamDownloadFile(
                                    getPDSUrl(preview.uri, getIn(preview, ES_PATHS.release_id)),
                                    getFilename(preview.uri)
                                )
                            }
                        }}
                        size="large"
                    >
                        <GetAppIcon fontSize={iconSize} />
                    </ActionButton>
                </span>
            </Tooltip>
            <Tooltip title="Add to Cart" arrow>
                <span>
                    <ActionButton
                        aria-label="add to cart"
                        disabled={preview.fs_type !== 'file' && preview.fs_type !== 'directory'}
                        onClick={() => {
                            dispatch(
                                addToCart(preview.fs_type === 'directory' ? 'directory' : 'file', {
                                    uri: preview.uri,
                                    related: related,
                                    size: preview.size,
                                    release_id: getIn(preview, ES_PATHS.release_id),
                                })
                            )
                            dispatch(setSnackBarText('Added to Cart!', 'success'))
                        }}
                        size="large"
                    >
                        <AddShoppingCartIcon size="small" />
                    </ActionButton>
                </span>
            </Tooltip>
        </div>
    )
}

const Preview = (props) => {
    const { isMobile, showMobilePreview, setShowMobilePreview, forcedPreview } = props

    const navigate = useNavigate()

    const dispatch = useDispatch()

    const [related, setRelated] = useState(null)
    const [versions, setVersions] = useState([])
    const [activeVersion, setActiveVersion] = useState(null)
    const [hasBrowse, setHasBrowse] = useState(null)

    let preview = useSelector((state) => {
        const filexPreview = state.get('filexPreview')
        return typeof filexPreview.toJS === 'function' ? {} : filexPreview
    })
    preview = forcedPreview || preview

    useEffect(() => {
        // Query Related
        if (preview.uri && preview.fs_type === 'file') {
            let uri = preview.uri
            uri = uri
                .replaceAll('/', '\\/')
                .replaceAll(':', '\\:')
                .replace(/\.[^/.]+$/, '')
            const dsl = {
                query: {
                    bool: {
                        must: [
                            { query_string: { query: `${uri}.*`, default_field: '*uri' } },
                            { exists: { field: 'gather.common' } },
                        ],
                    },
                },
                size: 1,
                _source: ['uri', 'gather.pds_archive.related', ES_PATHS.release_id.join('.')],
                sort: [{ [ES_PATHS.release_id.join('.')]: 'desc' }],
                collapse: {
                    field: 'uri',
                },
            }

            axios
                .post(`${domain}${endpoints.search}`, dsl, getHeader())
                .then((response) => {
                    const hit = response?.data?.hits?.hits?.[0]?._source
                    if (hit) {
                        setHasBrowse(true)
                        setRelated(hit)
                    } else setRelated(null)
                })
                .catch((err) => {
                    setRelated(null)
                })
        } else {
            setRelated(null)
        }

        // Query Versions (Current PDS4 specific)
        if (preview.uri && preview.fs_type === 'file' && preview.lidvid) {
            let [lid, vid] = preview.lidvid.split('::')
            lid = lid
                .replaceAll('/', '\\/')
                .replaceAll(':', '\\:')
                .replace(/\.[^/.]+$/, '')
            const dsl = {
                query: {
                    bool: {
                        must: [
                            {
                                regexp: {
                                    [ES_PATHS.pds4_label.lidvid.join('.')]: {
                                        value: `${lid}.*`,
                                    },
                                },
                            },
                        ],
                    },
                },
                _source: [
                    'uri',
                    ES_PATHS.pds4_label.lidvid.join('.'),
                    ES_PATHS.release_id.join('.'),
                ],
            }

            axios
                .post(`${domain}${endpoints.search}`, dsl, getHeader())
                .then((response) => {
                    const nextVersions = []
                    if (response?.data?.hits?.hits?.[0] != null) {
                        response.data.hits.hits.forEach((r) => {
                            if (r._source?.pds4_label?.lidvid != null) {
                                let [rlid, rvid] = r._source.pds4_label.lidvid.split('::')
                                nextVersions.push({
                                    uri: r._source.uri,
                                    name: r._source.uri.split('/').pop(),
                                    version: `Version ${rvid}`,
                                    versionRaw: rvid,
                                    versionNum: parseFloat(rvid),
                                })
                            }
                        })
                        nextVersions.sort(function (a, b) {
                            return b.versionNum - a.versionNum
                        })
                    }

                    if (nextVersions.length > 0) {
                        const [flid, fvid] = preview.lidvid.split('::')
                        for (let i = 0; i < nextVersions.length; i++) {
                            if (nextVersions[i].versionRaw == fvid) {
                                setActiveVersion(i)
                                break
                            }
                        }
                    }

                    setVersions(nextVersions)
                })
                .catch((err) => {
                    setVersions([])
                })
        } else {
            setVersions([])
        }
    }, [JSON.stringify(preview)])

    if (!showMobilePreview && isMobile && (preview == null || preview.fs_type != 'file'))
        return null

    let imageUrl = 'null'
    const browseUri = getIn(related, 'gather.pds_archive.related.browse.uri')
    const release_id = getIn(related, ES_PATHS.release_id)

    if (browseUri && IMAGE_EXTENSIONS.includes(getExtension(browseUri, true)))
        imageUrl = getPDSUrl(browseUri, release_id, 'md')

    if (Object.keys(preview).length == 0) {
        return (
            <PreviewRoot>
                <EmptyPreview>No File Object Selected</EmptyPreview>
            </PreviewRoot>
        )
    }

    return (
        <PreviewRoot isMobileView={isMobile} className={isMobile ? 'fade-in' : undefined}>
            {isMobile && (
                <>
                    <NavHeader>
                        <div>
                            <BackButton
                                aria-label="back"
                                onClick={() => {
                                    if (showMobilePreview && setShowMobilePreview)
                                        setShowMobilePreview(false)
                                    // If preview was not forced (i.e. a final file)
                                    if (!showMobilePreview)
                                        dispatch(
                                            updateFilexColumn(null, {
                                                removePreview: true,
                                                active: null,
                                            })
                                        )
                                }}
                                size="large"
                            >
                                <ArrowBackIcon fontSize="small" />
                            </BackButton>
                        </div>
                        <div>
                            <PreviewTitleMobile
                                noWrap
                                title={preview.key}
                                variant="h5"
                            >
                                {preview.key}
                            </PreviewTitleMobile>
                        </div>
                    </NavHeader>

                    {activeVersion != 0 && activeVersion != null && versions.length > 0 ? (
                        <HeaderBanner
                            aria-label="go to latest version"
                            onClick={() => {
                                dispatch(goToFilexURI(versions[0].uri))
                            }}
                        >
                            <div>
                                <WarningIcon fontSize="small" />
                                <div>A newer version of this data product is available.</div>
                            </div>
                            <ArrowForwardIcon fontSize="small" />
                        </HeaderBanner>
                    ) : null}
                </>
            )}
            {!isMobile && (
                <Header>
                    <div>
                        <div>
                            <PreviewTitle title={preview.key} variant="h5">
                                {preview.key}
                            </PreviewTitle>
                        </div>
                    </div>
                    <HeaderRight>
                        <ButtonBar preview={preview} related={related} />
                    </HeaderRight>
                    {activeVersion != 0 && activeVersion != null && versions.length > 0 ? (
                        <HeaderBanner
                            aria-label="go to latest version"
                            onClick={() => {
                                dispatch(goToFilexURI(versions[0].uri))
                            }}
                        >
                            <div>
                                <WarningIcon fontSize="small" />
                                <div>A newer version of this data product is available.</div>
                            </div>
                            <ArrowForwardIcon fontSize="small" />
                        </div>
                    ) : null}
                </Header>
            )}
            <Body isMobileView={isMobile}>
                <ImageContainer
                    style={imageUrl == 'null' ? { height: '100px' } : {}}
                    onClick={() => {
                        if (imageUrl != null && preview.uri)
                            navigate(`${HASH_PATHS.record}?uri=${preview.uri}&back=page`)
                    }}
                >
                    {imageUrl != 'null' && hasBrowse !== false ? (
                        <Image
                            className="previewImage"
                            wrapperStyle={{
                                height: '100%',
                                paddingTop: 'unset',
                                position: 'initial',
                                background:
                                    'radial-gradient(ellipse, rgb(46, 46, 50), rgb(10, 10, 10))',
                            }}
                            duration={250}
                            src={imageUrl}
                            alt={imageUrl}
                            errorIcon={<ProductIcons filename={imageUrl} type={preview.fs_type} />}
                            onLoad={() => {
                                setHasBrowse(true)
                            }}
                            onError={() => {
                                setHasBrowse(false)
                            }}
                        />
                    ) : (
                        <ImagelessContainer>
                            <ProductIcons filename={imageUrl} type={preview.fs_type} />
                        </ImagelessContainer>
                    )}
                    <ImageCover />
                </ImageContainer>
                {isMobile && (
                    <HeaderMobile>
                        <div>
                            <ButtonBar preview={preview} related={related} isMobile={true} />
                        </div>
                    </HeaderMobile>
                )}
                <BodyInner>
                    {/*
                        <div className={c.description}>
                            <SectionHeading>
                                <Typography noWrap variant="subtitle2">
                                    Description
                                </Typography>
                                <Divider />
                            </div>
                            <SectionBody>
                                <Typography>
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce
                                    volutpat mi tincidunt nisi gravida tincidunt. Pellentesque a mattis
                                    purus. Sed rutrum, lectus at aliquet dapibus, ligula risus aliquet
                                    mi, id efficitur ex nulla quis augue. Fusce ultrices lectus in dui
                                    scelerisque maximus. Quisque id tristique arcu.
                                </Typography>
                            </div>
                        </div>
                    */}

                    {related && (
                        <div>
                            <SectionHeading>
                                <Typography noWrap variant="subtitle2">
                                    Related
                                </Typography>
                                <Divider />
                            </SectionHeading>
                            <SectionBody>
                                <RelatedList>
                                    {getIn(related, 'uri') && (
                                        <li>
                                            <RelatedGroup>Product</RelatedGroup>

                                            <RelatedLinks>
                                                <div>
                                                    <RelatedButton
                                                        size="small"
                                                        variant="outlined"
                                                        endIcon={
                                                            <LaunchIcon />
                                                        }
                                                        onClick={() => {
                                                            const uri = getIn(related, 'uri')
                                                            const release_id = getIn(
                                                                related,
                                                                ES_PATHS.release_id
                                                            )
                                                            if (uri)
                                                                window.open(
                                                                    getPDSUrl(uri, release_id),
                                                                    '_blank'
                                                                )
                                                        }}
                                                    >
                                                        {getExtension(getIn(related, 'uri'))}
                                                    </RelatedButton>
                                                </div>
                                            </RelatedLinks>
                                        </li>
                                    )}
                                    {getIn(related, 'gather.pds_archive.related.label.uri') && (
                                        <li>
                                            <RelatedGroup>Label</RelatedGroup>

                                            <RelatedLinks>
                                                <div>
                                                    <RelatedButton
                                                        size="small"
                                                        variant="outlined"
                                                        endIcon={
                                                            <LaunchIcon />
                                                        }
                                                        onClick={() => {
                                                            const uri = getIn(
                                                                related,
                                                                'gather.pds_archive.related.label.uri'
                                                            )
                                                            const release_id = getIn(
                                                                related,
                                                                ES_PATHS.release_id
                                                            )
                                                            if (uri)
                                                                window.open(
                                                                    getPDSUrl(uri, release_id),
                                                                    '_blank'
                                                                )
                                                        }}
                                                    >
                                                        {getExtension(
                                                            getIn(
                                                                related,
                                                                'gather.pds_archive.related.label.uri'
                                                            )
                                                        )}
                                                    </RelatedButton>
                                                </div>
                                            </RelatedLinks>
                                        </li>
                                    )}
                                    {hasBrowse === true &&
                                        getIn(related, 'gather.pds_archive.related.browse.uri') && (
                                            <li>
                                                <RelatedGroup>Browse</RelatedGroup>
                                                <RelatedLinks>
                                                    <RelatedButton
                                                        size="small"
                                                        variant="outlined"
                                                        endIcon={
                                                            <LaunchIcon />
                                                        }
                                                        onClick={() => {
                                                            const uri = getIn(
                                                                related,
                                                                'gather.pds_archive.related.browse.uri'
                                                            )
                                                            const release_id = getIn(
                                                                related,
                                                                ES_PATHS.release_id
                                                            )
                                                            if (uri)
                                                                window.open(
                                                                    getPDSUrl(uri, release_id),
                                                                    '_blank'
                                                                )
                                                        }}
                                                    >
                                                        <div>Full</div>
                                                    </RelatedButton>
                                                    <RelatedButton
                                                        size="small"
                                                        variant="outlined"
                                                        endIcon={
                                                            <LaunchIcon />
                                                        }
                                                        onClick={() => {
                                                            const uri = getIn(
                                                                related,
                                                                'gather.pds_archive.related.browse.uri'
                                                            )
                                                            const release_id = getIn(
                                                                related,
                                                                ES_PATHS.release_id
                                                            )
                                                            if (uri)
                                                                window.open(
                                                                    getPDSUrl(
                                                                        uri,
                                                                        release_id,
                                                                        'lg'
                                                                    ),
                                                                    '_blank'
                                                                )
                                                        }}
                                                    >
                                                        <div>Large</div>
                                                    </RelatedButton>
                                                    <RelatedButton
                                                        size="small"
                                                        variant="outlined"
                                                        endIcon={
                                                            <LaunchIcon />
                                                        }
                                                        onClick={() => {
                                                            const uri = getIn(
                                                                related,
                                                                'gather.pds_archive.related.browse.uri'
                                                            )
                                                            const release_id = getIn(
                                                                related,
                                                                ES_PATHS.release_id
                                                            )
                                                            if (uri)
                                                                window.open(
                                                                    getPDSUrl(
                                                                        uri,
                                                                        release_id,
                                                                        'md'
                                                                    ),
                                                                    '_blank'
                                                                )
                                                        }}
                                                    >
                                                        <div>Medium</div>
                                                    </RelatedButton>
                                                    <RelatedButton
                                                        size="small"
                                                        variant="outlined"
                                                        endIcon={
                                                            <LaunchIcon />
                                                        }
                                                        onClick={() => {
                                                            const uri = getIn(
                                                                related,
                                                                'gather.pds_archive.related.browse.uri'
                                                            )
                                                            const release_id = getIn(
                                                                related,
                                                                ES_PATHS.release_id
                                                            )
                                                            if (uri)
                                                                window.open(
                                                                    getPDSUrl(
                                                                        uri,
                                                                        release_id,
                                                                        'sm'
                                                                    ),
                                                                    '_blank'
                                                                )
                                                        }}
                                                    >
                                                        <div>Small</div>
                                                    </RelatedButton>
                                                    <RelatedButton
                                                        size="small"
                                                        variant="outlined"
                                                        endIcon={
                                                            <LaunchIcon />
                                                        }
                                                        onClick={() => {
                                                            const uri = getIn(
                                                                related,
                                                                'gather.pds_archive.related.browse.uri'
                                                            )
                                                            const release_id = getIn(
                                                                related,
                                                                ES_PATHS.release_id
                                                            )
                                                            if (uri)
                                                                window.open(
                                                                    getPDSUrl(
                                                                        uri,
                                                                        release_id,
                                                                        'xs'
                                                                    ),
                                                                    '_blank'
                                                                )
                                                        }}
                                                    >
                                                        <div>Tiny</div>
                                                    </RelatedButton>
                                                </div>
                                            </li>
                                        )}
                                </RelatedList>
                            </SectionBody>
                        </div>
                    )}

                    <div>
                        <SectionHeading>
                            <Typography noWrap variant="subtitle2">
                                Properties
                            </Typography>
                            <Divider />
                        </SectionHeading>
                        <SectionBody>
                            <PropertiesList>
                                {Object.keys(preview)
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((key, idx) => {
                                        let value = preview[key]
                                        switch (key) {
                                            case 'size':
                                                value = humanFileSize(value, true)
                                                break
                                            default:
                                                break
                                        }
                                        let versionSelector = null
                                        if (
                                            key.toLowerCase().endsWith('version_id') &&
                                            versions.length > 0
                                        ) {
                                            versionSelector = (
                                                <div>
                                                    <StyledFormControl
                                                        size="small"
                                                    >
                                                        <StyledSelect
                                                            onChange={(e) => {
                                                                dispatch(
                                                                    goToFilexURI(
                                                                        versions[e.target.value].uri
                                                                    )
                                                                )
                                                            }}
                                                            value={
                                                                activeVersion == null
                                                                    ? ''
                                                                    : activeVersion
                                                            }
                                                        >
                                                            {versions.map((v, idx) => {
                                                                return (
                                                                    <MenuItem
                                                                        key={idx}
                                                                        value={idx}
                                                                    >
                                                                        <div>{v.version}</div>
                                                                    </MenuItem>
                                                                )
                                                            })}
                                                        </StyledSelect>
                                                    </StyledFormControl>
                                                </div>
                                            )
                                        }
                                        return (
                                            <li key={idx}>
                                                <PropertyKey>{prettify(key)}</PropertyKey>
                                                {versionSelector || (
                                                    <PropertyValue
                                                        title={`Click to copy: ${value}`}
                                                        onClick={() => {
                                                            copyToClipboard(value)
                                                        }}
                                                    >
                                                        {value}
                                                    </PropertyValue>
                                                )}
                                            </li>
                                        )
                                    })}
                            </PropertiesList>
                        </SectionBody>
                    </div>
                </BodyInner>
            </Body>
        </PreviewRoot>
    )
}

Preview.propTypes = {}

export default Preview
