import { expect, test } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import NacoStubCreateModal from '@/components/panels/edit/modals/NacoStubCreateModal.vue'


const sorSemi = 'Timothy R. Amidon; Ehren Helmut Pflugfelder; Daniel P. Richards; Donnie Johnson Sackey'
const sorSpaceSemi = 'Timothy R. Amidon ; Ehren Helmut Pflugfelder ; Daniel P. Richards ; Donnie Johnson Sackey'
const sorSpaceMixedSemi = 'Timothy R. Amidon ; Ehren Helmut Pflugfelder; Daniel P. Richards ; Donnie Johnson Sackey'
const sorSemiAnd = 'Timothy R. Amidon; Ehren Helmut Pflugfelder; Daniel P. Richards and Donnie Johnson Sackey'
const sorSemisAnd = 'Timothy R. Amidon; Ehren Helmut Pflugfelder; Daniel P. Richards; and Donnie Johnson Sackey'

const sorSemiAmp = 'Timothy R. Amidon; Ehren Helmut Pflugfelder; Daniel P. Richards & Donnie Johnson Sackey'
const sorSemisAmp = 'Timothy R. Amidon; Ehren Helmut Pflugfelder; Daniel P. Richards; & Donnie Johnson Sackey'

const sorSemiUnd = 'Timothy R. Amidon; Ehren Helmut Pflugfelder; Daniel P. Richards und Donnie Johnson Sackey'
const sorSemisUnd = 'Timothy R. Amidon; Ehren Helmut Pflugfelder; Daniel P. Richards; und Donnie Johnson Sackey'

const sorCommas = 'Timothy R. Amidon, Ehren Helmut Pflugfelder, Daniel P. Richards, Donnie Johnson Sackey'
const sorCommasAnd = 'Timothy R. Amidon, Ehren Helmut Pflugfelder, Daniel P. Richards, and Donnie Johnson Sackey'
const sorCommaAnd = 'Timothy R. Amidon, Ehren Helmut Pflugfelder, Daniel P. Richards and Donnie Johnson Sackey'

const sorCommasUnd = 'Timothy R. Amidon, Ehren Helmut Pflugfelder, Daniel P. Richards, und Donnie Johnson Sackey'
const sorCommasAmp = 'Timothy R. Amidon, Ehren Helmut Pflugfelder, Daniel P. Richards, & Donnie Johnson Sackey'

const sorCommaUnd = 'Timothy R. Amidon, Ehren Helmut Pflugfelder, Daniel P. Richards und Donnie Johnson Sackey'
const sorCommaAmp = 'Timothy R. Amidon, Ehren Helmut Pflugfelder, Daniel P. Richards & Donnie Johnson Sackey'


const sorAnd = 'Timothy R. Amidon and Ehren Helmut Pflugfelder and Daniel P. Richards and Donnie Johnson Sackey'

const resultExpected = ['Timothy R. Amidon', 'Ehren Helmut Pflugfelder', 'Daniel P. Richards', 'Donnie Johnson Sackey']

describe('SOR Splitting', () => {

    test('Only Semicolons', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorSemi)
        expect(split).toStrictEqual(resultExpected)
    });

    test('<space> Semicolons', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorSpaceSemi)
        expect(split).toStrictEqual(resultExpected)
    });

    test('Mixed spaced semicolons', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorSpaceMixedSemi)
        expect(split).toStrictEqual(resultExpected)
    });

    test('semicolons with "and"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorSemiAnd)
        expect(split).toStrictEqual(resultExpected)
    });

    test('semicolons with "; and"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorSemisAnd)
        expect(split).toStrictEqual(resultExpected)
    });

    test('semicolons with "&"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorSemiAmp)
        expect(split).toStrictEqual(resultExpected)
    });

    test('semicolons with "; &"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorSemisAmp)
        expect(split).toStrictEqual(resultExpected)
    });

    test('semicolons with "und"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorSemiUnd)
        expect(split).toStrictEqual(resultExpected)
    });

    test('semicolons with "; und"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorSemisUnd)
        expect(split).toStrictEqual(resultExpected)
    });

    test('only commas', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorCommas)
        expect(split).toStrictEqual(resultExpected)
    });

    test('commas with ", and"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorCommasAnd)
        expect(split).toStrictEqual(resultExpected)
    });

    test('commas with "and"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorCommaAnd)
        expect(split).toStrictEqual(resultExpected)
    });

    test('commas with "und"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorCommaUnd)
        expect(split).toStrictEqual(resultExpected)
    });

    test('commas with "&"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorCommaAmp)
        expect(split).toStrictEqual(resultExpected)
    });

    test('commas with ", und"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorCommasUnd)
        expect(split).toStrictEqual(resultExpected)
    });

    test('commas with ", &"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorCommasAmp)
        expect(split).toStrictEqual(resultExpected)
    });

    test('Only "and"', async () => {
        let split = NacoStubCreateModal.methods.splitSor(sorAnd)
        expect(split).toStrictEqual(resultExpected)
    });


})
