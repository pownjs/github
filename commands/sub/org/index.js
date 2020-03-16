exports.yargs = {
    command: 'org <login>',
    describe: 'Show org',

    builder: (yargs) => {
        require('../../lib/retryrequest').installOptions(yargs)
        require('../../lib/concurrency').installOptions(yargs)
        require('../../lib/authentication').installOptions(yargs)
    },

    handler: async(argv) => {
        const { login } = argv

        const Github = require('../../../lib/github')

        const options = {}

        require('../../lib/retryrequest').handleOptions(argv, options)
        require('../../lib/concurrency').handleOptions(argv, options)
        require('../../lib/authentication').handleOptions(argv, options)

        const github = new Github(options)

        require('../../lib/logging').handleOptions(argv, options, github)

        console.table(await github.org(login))
    }
}
