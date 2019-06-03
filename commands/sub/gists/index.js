exports.yargs = {
    command: 'gists <user|org>',
    describe: 'List gists',

    builder: (yargs) => {
        require('../../lib/concurrency').installOptions(yargs)
        require('../../lib/authentication').installOptions(yargs)
    },

    handler: async(argv) => {
        const { user } = argv

        const Github = require('../../../lib/github')

        const options = {}

        require('../../lib/concurrency').handleOptions(argv, options)
        require('../../lib/authentication').handleOptions(argv, options)

        const github = new Github(options)

        for await (let item of github.gists(user)) {
            console.table(item)
        }
    }
}