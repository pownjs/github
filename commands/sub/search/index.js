exports.yargs = {
    command: 'search <term>',
    describe: 'Search github',

    builder: (yargs) => {
        require('../../lib/tryfetch').installOptions(yargs)
        require('../../lib/concurrency').installOptions(yargs)
        require('../../lib/authentication').installOptions(yargs)

        yargs.option('category', {
            describe: 'Search category',
            type: 'array',
            default: ['code'],
            choices: ['code', 'repositories', 'users', 'commits', 'issues', 'topics'],
            alias: 't',
        })

        yargs.option('extended', {
            describe: 'Extended output',
            type: 'boolean',
            default: false,
            alias: 'e'
        })
    },

    handler: async(argv) => {
        const { term, category, extended } = argv

        const Github = require('../../../lib/github')

        const options = {}

        require('../../lib/tryfetch').handleOptions(argv, options)
        require('../../lib/concurrency').handleOptions(argv, options)
        require('../../lib/authentication').handleOptions(argv, options)

        const github = new Github(options)

        require('../../lib/logging').handleOptions(argv, options, github)

        for (let cat of category) {
            for await (let item of github.search(term, cat)) {
                if (cat === 'users' && extended) {
                    item = await github.user(item.login)
                }

                console.table(item)
            }
        }
    }
}
