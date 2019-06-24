exports.yargs = {
    command: 'user <login>',
    describe: 'Show user',

    builder: (yargs) => {
        require('../../lib/tryfetch').installOptions(yargs)
        require('../../lib/concurrency').installOptions(yargs)
        require('../../lib/authentication').installOptions(yargs)
    },

    handler: async(argv) => {
        const { login } = argv

        const Github = require('../../../lib/github')

        const options = {}

        require('../../lib/tryfetch').handleOptions(argv, options)
        require('../../lib/concurrency').handleOptions(argv, options)
        require('../../lib/authentication').handleOptions(argv, options)

        const github = new Github(options)

        require('../../lib/logging').handleOptions(argv, options, github)

        console.table(await github.user(login))
    }
}
