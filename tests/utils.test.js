const assert = require('assert')

const { extractGithubRepo } = require('../lib/utils')

describe('utils', () => {
    describe('extractGithubRepo', () => {
        it('positive tests', () => {
            const values = [
                [
                    ['test/abc'], 'test/abc'
                ],
                [
                    ['https://github.com/test/abc'], 'test/abc'
                ],
                [
                    ['https://github.com/test/abc.git'], 'test/abc'
                ],
                [
                    ['https://github.com/test/abc.git?test'], 'test/abc'
                ],
                [
                    ['test', 'abc', 'test/abc', 'https://github.com/test/xyz'], 'test/xyz' // because urls are more specific
                ],
                [
                    ['test', 'abc', 'https://github.com/test/xyz', 'test/abc'], 'test/xyz' // because urls are more specific
                ]
            ]

            for (let [repos, value] of values) {
                assert.equal(extractGithubRepo(...repos), value, `repos ${repos} should match value ${value}`)
            }
        })
    })
})
