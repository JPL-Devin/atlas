export const mergeKeywordValues = (baseline, counts, state = {}) => {
    let matches = () => true
    if (state.__filter) {
        try {
            const expression = new RegExp(state.__filter, 'i')
            matches = (key) => expression.test(String(key))
        } catch {
            matches = () => false
        }
    }
    const values = new Map()
    baseline.forEach((value) => {
        if (matches(value.key)) {values.set(value.key, { ...value, doc_count: 0 })}
    })
    counts.forEach((value) => values.set(value.key, value))
    Object.keys(state).forEach((key) => {
        if (key !== '__filter' && key !== 'exclude' && state[key] === true && !values.has(key))
            {values.set(key, { key, doc_count: 0 })}
    })
    return [...values.values()].sort((a, b) =>
        String(a.key) < String(b.key) ? -1 : String(a.key) > String(b.key) ? 1 : 0
    )
}
