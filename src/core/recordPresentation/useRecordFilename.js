import { useEffect, useMemo, useState } from 'react'

import { loadFilenameSpec, parseFilename, readFilenameKey, resolveFilenameSpec } from './filename'

/**
 * A record filename split into labelled pieces, or null while the mission's
 * grammar is still loading and for names no grammar covers.
 */
export const useRecordFilename = (filename, recordData) => {
    const { mission, pds_standard } = readFilenameKey(recordData)
    const [spec, setSpec] = useState(() => resolveFilenameSpec({ mission, pds_standard }))

    useEffect(() => {
        let current = true
        setSpec(resolveFilenameSpec({ mission, pds_standard }))
        loadFilenameSpec({ mission, pds_standard }).then((next) => current && setSpec(next))
        return () => {
            current = false
        }
    }, [mission, pds_standard])

    return useMemo(() => parseFilename(filename, spec), [filename, spec])
}
