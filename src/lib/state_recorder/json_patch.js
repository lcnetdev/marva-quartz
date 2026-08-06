/**
* Minimal JSON diff/patch used by the state recorder to store profile state
* changes as small deltas instead of full snapshots.
*
* Paths are arrays of keys/indexes (not JSON-Pointer strings) because profile
* data uses full URIs containing "/" as object keys.
*
* Ops:
*   { o: 'set', p: [path], v: value }  - assign value at path (object key or array index)
*   { o: 'del', p: [path] }            - delete the object key at path
*   { o: 'len', p: [path], v: n }      - truncate the array at path to length n
*/

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

const cloneValue = (v) => (v !== null && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)

/**
* Diff two JSON-safe states
* @param {any} oldState - the previous state
* @param {any} newState - the current state
* @return {array} the ops that transform oldState into newState
*/
export function diffStates(oldState, newState) {
    let ops = []
    diffValue(oldState, newState, [], ops)
    return ops
}

function diffValue(a, b, path, ops) {
    if (a === b) { return }

    if (Array.isArray(a) && Array.isArray(b)) {
        let min = Math.min(a.length, b.length)
        for (let i = 0; i < min; i++) {
            diffValue(a[i], b[i], path.concat(i), ops)
        }
        for (let i = min; i < b.length; i++) {
            ops.push({ o: 'set', p: path.concat(i), v: cloneValue(b[i]) })
        }
        if (a.length > b.length) {
            ops.push({ o: 'len', p: path.slice(), v: b.length })
        }
        return
    }

    if (isPlainObject(a) && isPlainObject(b)) {
        for (let k of Object.keys(a)) {
            if (!hasOwn(b, k)) { ops.push({ o: 'del', p: path.concat(k) }) }
        }
        for (let k of Object.keys(b)) {
            if (hasOwn(a, k)) {
                diffValue(a[k], b[k], path.concat(k), ops)
            } else {
                ops.push({ o: 'set', p: path.concat(k), v: cloneValue(b[k]) })
            }
        }
        return
    }

    // primitives or mismatched types
    ops.push({ o: 'set', p: path.slice(), v: cloneValue(b) })
}

/**
* Apply ops produced by diffStates to a state, mutating it in place
* @param {any} state - the state to patch, must be the same state the ops were diffed against
* @param {array} ops - the ops to apply
* @return {any} the patched state (a new value only when the root itself was replaced)
*/
export function applyOps(state, ops) {
    for (let op of ops) {
        // a root level set replaces the whole state
        if (op.p.length === 0) {
            if (op.o === 'set') { state = cloneValue(op.v) }
            else if (op.o === 'len' && Array.isArray(state)) { state.length = op.v }
            continue
        }

        let parent = state
        for (let i = 0; i < op.p.length - 1; i++) {
            parent = parent[op.p[i]]
            if (parent === undefined || parent === null) {
                throw new Error('State history is out of sync, missing path: ' + op.p.join(' > '))
            }
        }
        let key = op.p[op.p.length - 1]

        if (op.o === 'set') {
            parent[key] = cloneValue(op.v)
        } else if (op.o === 'del') {
            delete parent[key]
        } else if (op.o === 'len') {
            let target = parent[key]
            if (!Array.isArray(target)) {
                throw new Error('State history is out of sync, expected an array at: ' + op.p.join(' > '))
            }
            target.length = op.v
        } else {
            throw new Error('State history has an unknown operation: ' + op.o)
        }
    }
    return state
}
