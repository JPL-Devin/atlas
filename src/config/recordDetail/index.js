import emptyStates from './emptyStates.json'
import fields from './fields.json'
import icons from './icons.json'
import otherFields from './otherFields.json'
import sections from './sections.json'
import validity from './validity.json'
import mappingSnapshot from './mappingSnapshot.json'

import _default from './profiles/_default.json'
import cas from './profiles/cas.json'
import clem from './profiles/clem.json'
import mars_2020 from './profiles/mars_2020.json'
import mer from './profiles/mer.json'
import mess from './profiles/mess.json'
import mgs from './profiles/mgs.json'
import mro from './profiles/mro.json'
import msl_pds3 from './profiles/msl.pds3.json'
import msl_pds4 from './profiles/msl.pds4.json'
import ody from './profiles/ody.json'

import raws from './instances/raws.json'

import mars_2020_filename from './filenames/mars_2020.json'
import mer_filename from './filenames/mer.json'
import msl_filename from './filenames/msl.json'
import nsyt_filename from './filenames/nsyt.json'
import phx_filename from './filenames/phx.json'

// Keyed by `<mission>` or `<mission>.<pds_standard>`; the standard-specific
// profile is merged over the mission one when both exist.
export const profiles = {
    'cas': cas,
    'clem': clem,
    'mars_2020': mars_2020,
    'mer': mer,
    'mess': mess,
    'mgs': mgs,
    'mro': mro,
    'msl.pds3': msl_pds3,
    'msl.pds4': msl_pds4,
    'ody': ody,
}

// Per app instance (see src/core/appConfig.js). Absent instance means the
// shared profiles above are used as-is.
export const instanceProfiles = {
    raws,
}

export const defaultProfile = _default

// Filename naming conventions, keyed by `<mission>` or `<mission>.<pds_standard>`.
// A mission with no spec renders its filename as plain text.
export const filenameSpecs = {
    mars_2020: mars_2020_filename,
    mer: mer_filename,
    msl: msl_filename,
    nsyt: nsyt_filename,
    phx: phx_filename,
}

export { emptyStates, fields, icons, otherFields, sections, validity, mappingSnapshot }
