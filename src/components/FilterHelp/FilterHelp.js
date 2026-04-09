import React, { useState, useEffect } from 'react'
import { styled } from '@mui/material/styles'
import PropTypes from 'prop-types'

import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CloseSharpIcon from '@mui/icons-material/CloseSharp'

import axios from 'axios'

import { endpoints } from '../../core/constants'
import { getIn, prettify } from '../../core/utils'

const FilterHelpRoot = styled('div')({
    fontSize: '16px',
    lineHeight: '22px',
})

const NoDescription = styled(Typography)(({ theme }) => ({
    lineHeight: '20px',
    fontWeight: 'bold',
    padding: '6px 10px',
    textAlign: 'center',
    fontSize: '18px',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translateX(-50%) translateY(-50%)',
    color: theme.palette.swatches.grey.grey400,
}))

const HelpTitle = styled('div')(({ theme }) => ({
    'background': theme.palette.swatches.grey.grey50,
    'fontWeight': 'bold',
    'padding': '7px 10px 6px 10px',
    'textAlign': 'center',
    'fontSize': '18px',
    'borderBottom': `1px solid ${theme.palette.swatches.grey.grey200}`,
    '& span': {
        padding: '2px 8px 2px 8px',
        position: 'absolute',
        left: '0px',
    },
}))

const CloseButton = styled(IconButton)({
    padding: '7px 8px',
    position: 'absolute',
    right: '0px',
    top: '0px',
})

const HelpDescription = styled('div')(({ theme }) => ({
    padding: '20px',
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    whiteSpace: 'pre-line',
}))

const HelpList = styled('ul')({
    'margin': '0px',
    'padding': '20px',
    'listStyleType': 'none',
    '& li': {
        marginBottom: '10px',
    },
    '& li > div:first-child': {
        fontWeight: 'bold',
    },
    '& li > div:last-child': {
        marginLeft: '20px',
    },
})

const FilterHelp = (props) => {
    const { filter, filterKey, onClose } = props
    const [helpData, setHelpData] = useState(null)

    useEffect(() => {
        try {
            if (filter.description == null || filter.description === '') {
                let field = filter.facets[0].field.toLowerCase().replace('.keyword', '').split('.')
                field = field[field.length - 1]
                axios
                    .get(`${endpoints.pdsFieldSearch.replace('{field}', field)}`)
                    .then((response) => {
                        setHelpData(getIn(response, 'data.response.docs.0', null))
                    })
                    .catch((err) => {
                        setHelpData(null)
                    })
            }
        } catch (err) {}
    }, [JSON.stringify(filter)])

    let finalHelpData = helpData
    if (finalHelpData == null && filter.description)
        finalHelpData = {
            attribute_name: filter.display_name,
            description: filter.description,
        }

    return (
        <FilterHelpRoot>
            {finalHelpData ? (
                generateHelp(finalHelpData)
            ) : (
                <NoDescription variant="body2">
                    No Description
                </NoDescription>
            )}
            {typeof onClose === 'function' ? (
                <CloseButton
                    title="Close"
                    aria-label="close"
                    size="medium"
                    onClick={() => {
                        onClose()
                    }}
                >
                    <CloseSharpIcon fontSize="inherit" />
                </CloseButton>
            ) : null}
        </FilterHelpRoot>
    )
}

const generateHelp = (help) => {
    return (
        <div>
            <HelpTitle>
                <span>
                    <InfoOutlinedIcon fontSize="inherit" />
                </span>
                {help.attribute_name}
            </HelpTitle>
            <HelpDescription>{help.description}</HelpDescription>
            <HelpList>
                {Object.keys(help)
                    .filter(
                        (h) =>
                            h != 'attribute_name' &&
                            h != 'description' &&
                            h != 'attribute_definition'
                    )
                    .sort()
                    .map((h, idx) => (
                        <li key={idx}>
                            <div>{prettify(h.replace('attribute_', ''))}</div>
                            <div>{`${help[h]}`}</div>
                        </li>
                    ))}
            </HelpList>
        </div>
    )
}

FilterHelp.propTypes = {
    filter: PropTypes.object.isRequired,
    filterKey: PropTypes.string.isRequired,
}

export default FilterHelp
