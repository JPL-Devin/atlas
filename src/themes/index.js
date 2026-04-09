import { createTheme } from '@mui/material/styles';

export const palette = {
    type: 'dark',
    primary: {
        main: '#12181d',
        light: '#62c6f5', //'#D5EBFD',
    },
    secondary: {
        main: '#192028',
    },
    accent: {
        main: '#62c6f5', //'#D5EBFD',
        secondary: '#fee24a',
    },
    text: {
        primary: '#fdfdfd',
        secondary: '#ededed',
        muted: '#919496',
        accent: '#12181e',
    },
    swatches: {
        black: {
            black0: '#000000',
        },
        blue: {
            blue50: '#E5F3FE',
            blue100: '#D5EBFD',
            blue200: '#B5DCFB',
            blue300: '#64B6F7',
            blue400: '#57B4FF',
            blue500: '#2398F4',
            blue600: '#1390F3',
            blue700: '#0B7ED9',
            blue800: '#0A6BB9',
            blue900: '#085898',
        },
        green: {
            green200: '#8AF4D4',
        },
        grey: {
            grey0: '#FFFFFF',
            grey50: '#FDFDFD',
            grey100: '#EEEEEF',
            grey200: '#DEDFE0',
            grey300: '#C0C2C4',
            grey400: '#888B8E',
            grey500: '#656A6F',
            grey600: '#474C53',
            grey700: '#282F36',
            grey800: '#192028',
            grey900: '#12181e',
        },
        yellow: {
            yellow700: '#FBC02D',
        },
        orange: {
            orange600: '#FB8C00',
        },
    },
}

export const theme = {
    palette,
    spacing: 4,
    headHeights: [56, 48, 40, 32, 24],
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
    },
    components: {
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: '0px',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                contained: {
                    'fontSize': '13px',
                    'padding': '3px 10px',
                    'backgroundColor': palette.primary.light,
                    'borderRadius': '2px',
                    '&:hover': {
                        backgroundColor: palette.swatches.blue.blue400,
                    },
                },
                startIcon: {
                    marginRight: '4px',
                },
            },
        },
        MuiInput: {
            styleOverrides: {
                underline: {
                    '&:after': {
                        borderBottom: `2px solid ${palette.swatches.blue.blue600}`,
                    },
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    fontSize: '1em',
                    color: 'black',
                    backgroundColor: 'white',
                },
                arrow: {
                    color: 'white',
                },
            },
        },
        MuiBadge: {
            styleOverrides: {
                colorPrimary: {
                    backgroundColor: palette.accent.secondary,
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    minHeight: '40px',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    minHeight: '40px',
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    'color': palette.swatches.grey.grey300,
                    '&.Mui-checked': {
                        color: palette.swatches.green.green200,
                    },
                    'padding': '3.25px',
                },
            },
        },
        MuiPagination: {
            styleOverrides: {
                root: {},
                ul: {},
            },
        },
        MuiPaginationItem: {
            styleOverrides: {
                root: {
                    height: '24px',
                    minWidth: '24px',
                },
            },
        },
        MuiCircularProgress: {
            styleOverrides: {
                colorPrimary: {
                    color: palette.accent.main,
                },
            },
        },
        MuiSwitch: {
            styleOverrides: {
                root: {
                    '& > span': {
                        'color': palette.primary.light,
                        '&.Mui-checked': {
                            color: palette.accent.main,
                        },
                        '&.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: palette.accent.main,
                        },
                    },
                },
            },
        },
        MuiDialogActions: {
            styleOverrides: {
                root: {
                    backgroundColor: palette.swatches.grey.grey700,
                    padding: '4px',
                    justifyContent: 'space-between',
                },
            },
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    color: palette.accent.main,
                },
                rail: {
                    color: 'white',
                },
                valueLabel: {
                    '& > span > span': {
                        color: 'black',
                        fontWeight: 'bold',
                    },
                },
            },
        },
    },
}

const muiTheme = createTheme(theme)

export default muiTheme
