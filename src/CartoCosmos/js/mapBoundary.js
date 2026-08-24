// Lets the UI erase the drawn search boundary without reaching into Leaflet itself.
// The draw control registers the eraser when it mounts.

let eraser = null

export const setMapBoundaryEraser = (fn) => {
    eraser = fn
}

export const clearDrawnMapBoundary = () => {
    if (eraser != null) eraser()
}
