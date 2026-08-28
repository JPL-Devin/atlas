import cas from './cas.json'
import ch1 from './ch1.json'
import clem from './clem.json'
import go from './go.json'
import juno from './juno.json'
import lcro from './lcro.json'
import lo from './lo.json'
import lro from './lro.json'
import mars_2020 from './mars_2020.json'
import mer from './mer.json'
import mess from './mess.json'
import mgs from './mgs.json'
import mpf from './mpf.json'
import mro from './mro.json'
import msl from './msl.json'
import nsyt from './nsyt.json'
import ody from './ody.json'
import phx from './phx.json'

// Every grammar at once, for tests and tooling. The app loads them one mission
// at a time through `filenameLoaders`, so don't import this from src.
export const filenameSpecs = {
    cas,
    ch1,
    clem,
    go,
    juno,
    lcro,
    lo,
    lro,
    mars_2020,
    mer,
    mess,
    mgs,
    mpf,
    mro,
    msl,
    nsyt,
    ody,
    phx,
}
