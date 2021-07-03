const assert = require('assert')

const { createEmailFilter, createCompanyFilter, createBioFilter } = require('../lib/filters')

describe('filters', () => {
    describe('email', () => {
        it('positive filters (bage)', () => {
            const values = [
                'joe.doe@bage.com'
            ]

            const filter = createEmailFilter({ domains: 'bage.com' })
            const regexp = new RegExp(filter, 'i')

            for (let value of values) {
                assert(regexp.test(value), `filter ${filter} should match value ${value}`)
            }
        })

        it('negative filters (bage) ', () => {
            const values = [
                'joe.doe@acme.com',
                ''
            ]

            const filter = createEmailFilter({ domains: 'bage.com' })
            const regexp = new RegExp(filter, 'i')

            for (let value of values) {
                assert(!regexp.test(value), `filter ${filter} should not match value ${value}`)
            }
        })
    })

    describe('company', () => {
        it('positive filters (bage)', () => {
            const values = [
                '@bage',
                '@Bage',
                'bage.com',
                'Group of bage.com',
                'Group of @bage.com'
            ]

            const filter = createCompanyFilter({ domains: 'bage.com', brands: 'bage' })
            const regexp = new RegExp(filter, 'i')

            for (let value of values) {
                assert(regexp.test(value), `filter ${filter} should match value ${value}`)
            }
        })

        it('negative filters (bage)', () => {
            const values = [
                '@bageacy',
                '@bage-bionetworks',
                'Bage Recruiting',
                ''
            ]

            const filter = createCompanyFilter({ domains: 'bage.com', brands: 'bage' })
            const regexp = new RegExp(filter, 'i')

            for (let value of values) {
                assert(!regexp.test(value), `filter ${filter} should not match value ${value}`)
            }
        })
    })

    describe('bio', () => {
        it('positive filters (bage)', () => {
            const values = [
                'Software engineer at @bage'
            ]

            const filter = createBioFilter({ domains: 'bage.com', brands: 'bage' })
            const regexp = new RegExp(filter, 'i')

            for (let value of values) {
                assert(regexp.test(value), `filter ${filter} should match value ${value}`)
            }
        })

        it('negative filters (bage)', () => {
            const values = [
                'Google, ex-bage',
                'They/Them Data Engineering @Bage-Bionetworks',
                'I am a bage',
                'Senior Software Engineer within Bage\'s Product team.'
            ]

            const filter = createBioFilter({ domains: 'bage.com', brands: 'bage' })
            const regexp = new RegExp(filter, 'i')

            for (let value of values) {
                assert(!regexp.test(value), `filter ${filter} should not match value ${value}`)
            }
        })
    })
})
