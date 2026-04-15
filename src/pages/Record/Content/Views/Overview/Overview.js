import React from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

import { styled, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import { getIn, getPDSUrl, prettify, getExtension } from '../../../../../core/utils.js'
import { HASH_PATHS, ES_PATHS, IMAGE_EXTENSIONS } from '../../../../../core/constants.js'

import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'

import OpenSeadragonViewer from '../../../../../components/OpenSeadragonViewer/OpenSeadragonViewer'
import ThreeViewer from '../../../../../components/ThreeViewer/ThreeViewer'

const OverviewRoot = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    background: theme.palette.swatches.grey.grey900,
    color: theme.palette.swatches.grey.grey150,
    display: 'flex',
    [theme.breakpoints.down('md')]: {
        flexFlow: 'column',
    },
}))

const ViewerWrapper = styled('div')(({ theme }) => ({
    height: '100%',
    flex: 1,
    [theme.breakpoints.down('md')]: {
        minHeight: '60%',
        flex: 'unset',
        height: 'unset',
    },
}))

const FieldsPanel = styled('div')(({ theme }) => ({
    width: '480px',
    height: '100%',
    boxSizing: 'border-box',
    overflowY: 'auto',
    background: '#101013',
    borderLeft: `1px solid ${theme.palette.swatches.grey.grey700}`,
    padding: '0px 0px 32px 0px',
    [theme.breakpoints.down('md')]: {
        width: '100%',
        borderLeft: 'none',
        borderTop: `2px solid ${theme.palette.swatches.grey.grey900}`,
    },
}))

const FieldList = styled('ul')(({ theme }) => ({
    'listStyleType': 'none',
    'margin': `0px`,
    'padding': '0px',
    '& > li': {
        'display': 'flex',
        'justifyContent': 'space-between',
        'lineHeight': '24px',
        'padding': '4px 8px',
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

const FieldName = styled('div')(({ theme }) => ({
    marginRight: '16px',
    textTransform: 'uppercase',
    color: theme.palette.swatches.grey.grey300,
    fontSize: '12px',
}))

const FieldValue = styled('div')({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    flex: '1',
})

const StyledFormControl = styled(FormControl)({
    minWidth: 125,
    margin: '5px 0px 3px 8px',
})

const StyledSelect = styled(Select)(({ theme }) => ({
    'color': theme.palette.swatches.grey.grey300,
    'background': theme.palette.swatches.grey.grey800,
    'borderBottom': `2px solid ${theme.palette.swatches.grey.grey600}`,
    'paddingLeft': '4px',
    '& > div:first-of-type': {
        padding: '8px 20px 6px 6px',
        textAlign: 'left',
    },
    '& > svg': {
        color: '#efefef',
        top: '4px',
        right: '2px',
    },
}))

const Heading = styled('div')(({ theme }) => ({
    fontSize: '14px',
    lineHeight: '32px',
    fontWeight: 'bold',
    color: theme.palette.swatches.grey.grey100,
    textTransform: 'uppercase',
    padding: '4px 8px 4px 8px',
}))

const fields = [
    'gather.pds_archive.bundle_id',
    'gather.pds_archive.collection_id',
    'gather.pds_archive.data_set_id',
    'gather.pds_archive.file_name',
    'gather.common.instrument',
    'gather.common.latitude',
    'pds4_label.lidvid',
    'gather.common.longitude',
    'gather.common.mission',
    'gather.pds_archive.pds_standard',
    'gather.time.product_creation_time',
    'gather.pds_archive.product_id',
    'gather.common.product_type',
    'gather.common.spacecraft',
    'gather.time.spacecraft_clock_start_count',
    'gather.time.start_time',
    'gather.time.stop_time',
    'gather.common.target',
    'uri',
    'pds4_label.pds:Identification_Area/pds:version_id',
    'gather.pds_archive.volume_id',
]

const Overview = (props) => {

    const { recordData, versions, activeVersion } = props
    const navigate = useNavigate()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    const release_id = getIn(recordData, ES_PATHS.release_id)

    const browse_uri = getIn(recordData, ES_PATHS.browse)
    const uri = getIn(recordData, ES_PATHS.source)
    const supplemental = getIn(recordData, ES_PATHS.supplemental)

    let imgURL = getPDSUrl(browse_uri, release_id)

    let type = getExtension(imgURL, true)
    if (!IMAGE_EXTENSIONS.includes(type)) {
        imgURL = getPDSUrl(uri, release_id)
        type = getExtension(imgURL, true)
    }

    let Viewer
    switch (type) {
        case 'obj':
            Viewer = (
                <ThreeViewer url={imgURL} release_id={release_id} supplemental={supplemental} />
            )
            break
        default:
            Viewer = (
                <OpenSeadragonViewer
                    image={{
                        src: imgURL,
                    }}
                    settings={{ defaultZoomLevel: 0.5 }}
                />
            )
    }

    const pds_standard = getIn(recordData, ES_PATHS.pds_standard)

    return (
        <OverviewRoot>
            <ViewerWrapper>{Viewer}</ViewerWrapper>
            <FieldsPanel>
                <Heading>Overview Fields</Heading>
                <FieldList>
                    {fields.map((field, idx) => {
                        const split = field.split('.')
                        const name = prettify(split[split.length - 1])
                        let value = getIn(recordData, field)
                        if (name == null || value == null) return
                        if (typeof value != 'string' && value.length != null)
                            value = value.join(', ')

                        let versionSelector = null
                        if (
                            pds_standard === 'pds4' &&
                            field.toLowerCase().endsWith('version_id') &&
                            versions.length > 0
                        ) {
                            versionSelector = (
                                <div>
                                    <StyledFormControl size="small">
                                        <StyledSelect
                                            onChange={(e) => {
                                                navigate(
                                                    `${HASH_PATHS.record}?uri=${
                                                        versions[e.target.value].uri
                                                    }`
                                                )
                                            }}
                                            value={activeVersion == null ? '' : activeVersion}
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
                                <FieldName>{name}</FieldName>
                                <FieldValue>{versionSelector || value}</FieldValue>
                            </li>
                        )
                    })}
                </FieldList>
            </FieldsPanel>
        </OverviewRoot>
    )
}

Overview.propTypes = {
    recordData: PropTypes.object,
}

export default Overview;
