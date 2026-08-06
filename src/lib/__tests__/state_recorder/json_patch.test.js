import { expect, test, describe } from 'vitest'
import { diffStates, applyOps } from '@/lib/state_recorder/json_patch'

const clone = (v) => JSON.parse(JSON.stringify(v))

// diff a -> b, apply the ops to a copy of a, expect to land exactly on b
const roundTrip = (a, b) => {
    const ops = diffStates(a, b)
    const patched = applyOps(clone(a), ops)
    expect(patched).toEqual(b)
    return ops
}

describe('diffStates + applyOps round trip', () => {

    test('identical states produce no ops', () => {
        const state = { a: 1, b: { c: [1, 2, 3] } }
        expect(diffStates(state, clone(state))).toEqual([])
    })

    test('changed literal value', () => {
        const ops = roundTrip({ title: 'old title', count: 1 }, { title: 'new title', count: 1 })
        expect(ops).toEqual([{ o: 'set', p: ['title'], v: 'new title' }])
    })

    test('added and removed object keys', () => {
        roundTrip({ keep: 1, drop: 2 }, { keep: 1, added: { nested: true } })
    })

    test('keys containing slashes (URIs) work as path segments', () => {
        const a = { userValue: { 'http://id.loc.gov/ontologies/bibframe/title': [{ label: 'x' }] } }
        const b = { userValue: { 'http://id.loc.gov/ontologies/bibframe/title': [{ label: 'y' }] } }
        const ops = roundTrip(a, b)
        expect(ops).toEqual([{ o: 'set', p: ['userValue', 'http://id.loc.gov/ontologies/bibframe/title', 0, 'label'], v: 'y' }])
    })

    test('array grows', () => {
        roundTrip({ ptOrder: ['a', 'b'] }, { ptOrder: ['a', 'b', 'c', 'd'] })
    })

    test('array shrinks', () => {
        const ops = roundTrip({ ptOrder: ['a', 'b', 'c'] }, { ptOrder: ['a'] })
        expect(ops).toContainEqual({ o: 'len', p: ['ptOrder'], v: 1 })
    })

    test('element removed from the middle of an array', () => {
        roundTrip({ list: [{ id: 1 }, { id: 2 }, { id: 3 }] }, { list: [{ id: 1 }, { id: 3 }] })
    })

    test('element inserted at the front of an array', () => {
        roundTrip({ list: [{ id: 2 }, { id: 3 }] }, { list: [{ id: 1 }, { id: 2 }, { id: 3 }] })
    })

    test('type changes: object to array, literal to object, value to null', () => {
        roundTrip(
            { a: { x: 1 }, b: 'text', c: 5 },
            { a: [1, 2], b: { deep: true }, c: null }
        )
    })

    test('nested profile-ish structure', () => {
        const a = {
            rt: {
                'lc:RT:bf2:Monograph:Work': {
                    URI: 'http://id.loc.gov/resources/works/123',
                    ptOrder: ['title', 'contribution'],
                    pt: {
                        title: { userValue: { 'http://id/label': [{ label: 'A title' }] } },
                        contribution: { userValue: {} }
                    }
                }
            },
            rtOrder: ['lc:RT:bf2:Monograph:Work']
        }
        const b = clone(a)
        b.rt['lc:RT:bf2:Monograph:Work'].pt.title.userValue['http://id/label'][0].label = 'Changed title'
        b.rt['lc:RT:bf2:Monograph:Work'].pt.contribution.userValue = { 'http://id/agent': [{ '@guid': 'abc', label: 'Someone' }] }
        b.rt['lc:RT:bf2:Monograph:Work'].ptOrder.push('note')
        b.rt['lc:RT:bf2:Monograph:Work'].pt.note = { userValue: {} }
        roundTrip(a, b)
    })

    test('a sequence of diffs replays back to each intermediate state', () => {
        const states = [
            { rt: { w: { pt: {}, ptOrder: [] } } },
            { rt: { w: { pt: { a: { v: 1 } }, ptOrder: ['a'] } } },
            { rt: { w: { pt: { a: { v: 2 }, b: { v: 1 } }, ptOrder: ['a', 'b'] } } },
            { rt: { w: { pt: { b: { v: 1 } }, ptOrder: ['b'] } } },
        ]
        const events = []
        for (let i = 1; i < states.length; i++) {
            events.push(diffStates(states[i - 1], states[i]))
        }
        let current = clone(states[0])
        for (let i = 0; i < events.length; i++) {
            current = applyOps(current, events[i])
            expect(current).toEqual(states[i + 1])
        }
    })

    test('root replacement', () => {
        const ops = diffStates({ a: 1 }, [1, 2])
        expect(applyOps({ a: 1 }, ops)).toEqual([1, 2])
    })

    test('ops values are detached copies, mutating the patched state later is safe', () => {
        const a = { list: [] }
        const b = { list: [{ label: 'x' }] }
        const ops = diffStates(a, b)
        const patched = applyOps(clone(a), ops)
        patched.list[0].label = 'mutated'
        expect(ops[0].v).toEqual({ label: 'x' })
    })

    test('applyOps against a state that is out of sync throws', () => {
        const ops = [{ o: 'set', p: ['missing', 'deeper', 'key'], v: 1 }]
        expect(() => applyOps({ something: 1 }, ops)).toThrow(/out of sync/)
    })

})
