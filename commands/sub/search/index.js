exports.yargs = {
    command: 'search <term>',
    describe: 'Search github',

    builder: (yargs) => {
        require('../../lib/concurrency').installOptions(yargs)

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

        const github = new Github()

        require('../../lib/concurrency').handleOptions(argv, github)

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
