exports.yargs = {
    command: 'repos <login>',
    describe: 'List repos',

    builder: (yargs) => {
        require('../../lib/tryfetch').installOptions(yargs)
        require('../../lib/concurrency').installOptions(yargs)
        require('../../lib/authentication').installOptions(yargs)

        yargs.options('type', {
            description: 'Repository type',
            type: 'string',
            default: 'all',
            choices: ['all', 'public', 'private', 'forks', 'sources', 'member']
        })
    },

    handler: async(argv) => {
        const { login, type } = argv

        const Github = require('../../../lib/github')

        const options = {}

        require('../../lib/tryfetch').handleOptions(argv, options)
        require('../../lib/concurrency').handleOptions(argv, options)
        require('../../lib/authentication').handleOptions(argv, options)

        const github = new Github(options)

        require('../../lib/logging').handleOptions(argv, options, github)

        for await (let item of github.repos(login, { type })) {
            console.table(item)
        }
    }
}
