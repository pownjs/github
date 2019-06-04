exports.yargs = {
    command: 'user <login>',
    describe: 'Show user',

    builder: (yargs) => {
        require('../../lib/concurrency').installOptions(yargs)
        require('../../lib/authentication').installOptions(yargs)
    },

    handler: async(argv) => {
        const { login } = argv

        const Github = require('../../../lib/github')

        const options = {}

        require('../../lib/concurrency').handleOptions(argv, options)
        require('../../lib/authentication').handleOptions(argv, options)

        const github = new Github(options)

        console.table(await github.user(login))
    }
}
