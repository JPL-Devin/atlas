const path = require('node:path')
const { spawnSync } = require('node:child_process')

for (const instance of ['atlas', 'raws']) {
    const result = spawnSync(process.execPath, [
        require.resolve('@docusaurus/core/bin/docusaurus.mjs'),
        'build',
        '--out-dir',
        path.resolve(__dirname, '../build/documentation', instance),
    ], {
        cwd: __dirname,
        env: { ...process.env, DOCS_INSTANCE: instance },
        stdio: 'inherit',
    })
    if (result.error) throw result.error
    if (result.status !== 0) process.exit(result.status || 1)
}
