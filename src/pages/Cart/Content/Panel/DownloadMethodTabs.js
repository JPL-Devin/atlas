import React from 'react'
import PropTypes from 'prop-types'

import { styled } from '@mui/material/styles'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import BrowserTab from './Tabs/Browser/Browser'
import CURLTab from './Tabs/CURL/CURL'
import WGETTab from './Tabs/WGET/WGET'
import CSVTab from './Tabs/CSV/CSV'
import TXTTab from './Tabs/TXT/TXT'
const RootSection = styled('div', {
    shouldForwardProp: (prop) => prop !== 'withBorderBottom',
})(({ theme, withBorderBottom }) => ({
    padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
    background: theme.palette.swatches.grey.grey100,
    ...(withBorderBottom && {
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    }),
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: theme.spacing(3),
}))

const RadioGroupContainer = styled('div')({
    width: '100%',
    boxSizing: 'border-box',
})

const StyledRadioGroup = styled(RadioGroup)(({ theme }) => ({
    gap: theme.spacing(1),
}))

const RadioOption = styled(FormControlLabel, {
    shouldForwardProp: (prop) => prop !== 'isSelected',
})(({ theme, isSelected }) => ({
    'border': `1px solid ${theme.palette.swatches.grey.grey300}`,
    'borderRadius': '4px',
    'padding': theme.spacing(1.5),
    'margin': 0,
    'marginBottom': theme.spacing(1),
    'transition': 'all 0.2s',
    '&:hover:not(.selected)': {
        'borderColor': theme.palette.swatches.grey.grey500,
        '& .MuiRadio-root': {
            color: theme.palette.swatches.grey.grey500,
        },
    },
    ...(isSelected && {
        border: `1px solid ${theme.palette.accent.main}`,
    }),
}))

const RadioLabelContent = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
}))

const RadioTitle = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 'bold',
    color: theme.palette.common.black,
}))

const RadioDescription = styled(Typography)(({ theme }) => ({
    fontSize: '12px',
    color: theme.palette.swatches.grey.grey800,
    lineHeight: '1.4',
}))

const TabPanels = styled('div')({
    position: 'relative',
    padding: 0,
})

const StyledRadio = styled(Radio)(({ theme }) => ({
    'color': theme.palette.swatches.grey.grey300,
    'transition': 'color 0.2s',
    '&.Mui-checked': {
        color: theme.palette.accent.main,
    },
}))

const DownloadMethodTabs = ({
    selectedDownloadMethodIndex,
    onChange,
    selectorRef,
    selectionCount,
}) => {
    const methods = [
        {
            value: 0,
            title: 'ZIP',
            description: 'Download files as a compressed ZIP archive through your browser',
        },
        {
            value: 1,
            title: 'WGET',
            description: 'Use wget command-line tool to download files',
        },
        {
            value: 2,
            title: 'CURL',
            description: 'Use curl command-line tool to download files',
        },
        {
            value: 3,
            title: 'CSV',
            description: 'Download a CSV file containing URLs for all products',
        },
        {
            value: 4,
            title: 'TXT',
            description: 'Download a text file containing URLs for all products',
        },
    ]

    const handleRadioChange = (event) => {
        const newValue = parseInt(event.target.value, 10)
        onChange(event, newValue)
    }

    return (
        <>
            <RootSection withBorderBottom>
                <SectionTitle>2. Select a download method:</SectionTitle>
                <RadioGroupContainer>
                    <FormControl component="fieldset" fullWidth>
                        <StyledRadioGroup
                            aria-label="cart download method selection"
                            value={
                                selectedDownloadMethodIndex !== null
                                    ? selectedDownloadMethodIndex
                                    : ''
                            }
                            onChange={handleRadioChange}
                        >
                            {methods.map((method) => (
                                <RadioOption
                                    key={method.value}
                                    value={method.value}
                                    isSelected={selectedDownloadMethodIndex === method.value}
                                    className={selectedDownloadMethodIndex === method.value ? 'selected' : ''}
                                    control={<StyledRadio />}
                                    label={
                                        <RadioLabelContent>
                                            <RadioTitle>
                                                {method.title}
                                            </RadioTitle>
                                            {method.description && (
                                                <RadioDescription>
                                                    {method.description}
                                                </RadioDescription>
                                            )}
                                        </RadioLabelContent>
                                    }
                                />
                            ))}
                        </StyledRadioGroup>
                    </FormControl>
                </RadioGroupContainer>
            </RootSection>
            {selectedDownloadMethodIndex !== null && (
                <RootSection>
                    <SectionTitle>3. Download your products:</SectionTitle>
                    <TabPanels>
                        <BrowserTab
                            value={selectedDownloadMethodIndex}
                            index={0}
                            selectorRef={selectorRef}
                            selectionCount={selectionCount}
                        />
                        <WGETTab
                            value={selectedDownloadMethodIndex}
                            index={1}
                            selectorRef={selectorRef}
                            selectionCount={selectionCount}
                        />
                        <CURLTab
                            value={selectedDownloadMethodIndex}
                            index={2}
                            selectorRef={selectorRef}
                            selectionCount={selectionCount}
                        />
                        <CSVTab
                            value={selectedDownloadMethodIndex}
                            index={3}
                            selectorRef={selectorRef}
                            selectionCount={selectionCount}
                        />
                        <TXTTab
                            value={selectedDownloadMethodIndex}
                            index={4}
                            selectorRef={selectorRef}
                            selectionCount={selectionCount}
                        />
                    </TabPanels>
                </RootSection>
            )}
        </>
    )
}

DownloadMethodTabs.propTypes = {
    selectedDownloadMethodIndex: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    selectorRef: PropTypes.object,
    selectionCount: PropTypes.number,
}

export default DownloadMethodTabs
