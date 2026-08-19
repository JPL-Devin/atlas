/* Renders the parts of the Record page that the redesign keeps as-is:
   the NASA/PDS topbar and the left icon rail. Every mockup reuses these so
   the redesigned areas can be compared against untouched chrome. */

const icon = (d, size = 20, opts = {}) =>
    `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${
        opts.fill || 'currentColor'
    }" style="${opts.style || ''}"><path d="${d}"/></svg>`

const ICONS = {
    menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    help: 'M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z',
    info: 'M11 7h2v2h-2V7zm0 4h2v6h-2v-6zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
    chevronLeft: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z',
    link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    cart: 'M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    imageSearch:
        'M18 13v7H4V6h5.02c.05-.71.22-1.38.48-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-5l-2-2zm-1.5-5h.61l3.68 3.68 1.42-1.42-3.69-3.68V5.5A4.5 4.5 0 1 0 16.5 10a4.42 4.42 0 0 0 1.9-.43L18 9.11V8.5c0-.28.22-.5.5-.5zM5 17h12l-3.75-5-2.85 3.79L8.9 13.4 5 17z',
    tree: 'M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    fullscreen: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
    rotateCcw:
        'M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z',
    rotateCw:
        'M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11a7.906 7.906 0 0 0-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41A9.982 9.982 0 0 0 19.93 13h-2.02c-.14.87-.48 1.72-1.02 2.48z',
    plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    minus: 'M19 13H5v-2h14v2z',
    search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    expand: 'M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z',
    collapse:
        'M7.41 18.59L8.83 20 12 16.83 15.17 20l1.41-1.41L12 14l-4.59 4.59zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.42 5.41 12 10l4.59-4.59z',
    copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    chevronDown: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
    chevronRight: 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z',
    pin: 'M16 12V4h1V2H7v2h1v8l-2 2v2h5v4l1 1 1-1v-4h5v-2l-2-2z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    code: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
    warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    play: 'M8 5v14l11-7z',
    layers: 'M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z',
    ruler: 'M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2v8z',
    sun: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
    clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    place: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z',
    download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
    file: 'M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z',
    quote: 'M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z',
    template:
        'M3 3h8v8H3V3zm10 0h8v4h-8V3zm0 6h8v2h-8V9zm0 4h8v2h-8v-2zm0 4h8v2h-8v-2zM3 13h8v8H3v-8z',
    arrowRight: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z',
    visibility:
        'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    filmstrip:
        'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 3v2h2V6H5zm0 5v2h2v-2H5zm0 5v2h2v-2H5zm12-10v2h2V6h-2zm0 5v2h2v-2h-2zm0 5v2h2v-2h-2zM9 6v12h6V6H9z',
}

const railHTML = () => `
<div class="rail">
    <div class="top">${icon(ICONS.menu, 24)}</div>
    <div class="bottom">${icon(ICONS.help, 20)}${icon(ICONS.info, 20)}</div>
</div>`

const topbarHTML = () => `
<div class="topbar">
    <div class="left">
        <img class="logo" src="../assets/nasa-logo.svg" />
        <div class="titles">
            <div class="node"><b>PDS</b> Cartography and Imaging Sciences</div>
            <div class="appname">ATLAS<span class="slash">/</span><span class="page">IMAGE SEARCH</span></div>
        </div>
    </div>
    <div class="right">
        <div class="tb" style="letter-spacing:2px">API</div>
        <div class="tb active">${icon(ICONS.imageSearch, 22)}</div>
        <div class="tb">${icon(ICONS.tree, 22)}</div>
        <div class="tb">${icon(ICONS.cart, 22)}</div>
    </div>
</div>`

const titlebarHTML = (name, opts = {}) => `
<div class="titlebar">
    <div class="left">
        <div class="back">${icon(ICONS.chevronLeft, 32)}</div>
        <div class="name">${name}</div>
        ${opts.ml ? `<div class="chip-ml">ML - ${opts.ml}</div>` : ''}
        <div style="opacity:.5;padding:0 6px">${icon(ICONS.link, 20)}</div>
    </div>
    <div class="right">
        <div class="btn-primary">DOWNLOAD<span class="split">${icon(
            ICONS.chevronDown,
            14
        )}</span></div>
        <div style="color:var(--accent)">${icon(ICONS.cart, 22)}</div>
    </div>
</div>`

const osdHTML = () => `
<div class="osd">
    <div class="b">${icon(ICONS.home, 18)}</div>
    <div class="b">${icon(ICONS.fullscreen, 18)}</div>
    <div class="b">${icon(ICONS.rotateCcw, 18)}</div>
    <div class="b">${icon(ICONS.rotateCw, 18)}</div>
    <div class="b">${icon(ICONS.plus, 18)}</div>
    <div class="b">${icon(ICONS.minus, 18)}</div>
</div>`

const mount = () => {
    document.querySelectorAll('[data-shell="rail"]').forEach((e) => (e.outerHTML = railHTML()))
    document.querySelectorAll('[data-shell="topbar"]').forEach((e) => (e.outerHTML = topbarHTML()))
    document
        .querySelectorAll('[data-shell="titlebar"]')
        .forEach((e) => (e.outerHTML = titlebarHTML(e.dataset.name, { ml: e.dataset.ml })))
    document.querySelectorAll('[data-shell="osd"]').forEach((e) => (e.outerHTML = osdHTML()))
    document
        .querySelectorAll('[data-icon]')
        .forEach(
            (e) => (e.innerHTML = icon(ICONS[e.dataset.icon], parseInt(e.dataset.size || '18', 10)))
        )
}
document.addEventListener('DOMContentLoaded', mount)
