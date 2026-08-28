// Filename naming conventions, keyed by `<mission>` or `<mission>.<pds_standard>`.
// Each grammar is large, so it loads on demand — a record only needs its own
// mission's. A mission with no spec renders its filename as plain text.
export const filenameLoaders = {
    cas: () => import('./cas.json'),
    ch1: () => import('./ch1.json'),
    clem: () => import('./clem.json'),
    go: () => import('./go.json'),
    juno: () => import('./juno.json'),
    lcro: () => import('./lcro.json'),
    lo: () => import('./lo.json'),
    lro: () => import('./lro.json'),
    mars_2020: () => import('./mars_2020.json'),
    mer: () => import('./mer.json'),
    mess: () => import('./mess.json'),
    mgs: () => import('./mgs.json'),
    mpf: () => import('./mpf.json'),
    mro: () => import('./mro.json'),
    msl: () => import('./msl.json'),
    nsyt: () => import('./nsyt.json'),
    ody: () => import('./ody.json'),
    phx: () => import('./phx.json'),
}
