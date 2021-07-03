exports.yargs = {
    command: 'contributors <repo>',
    describe: 'Show contributors',

    builder: (yargs) => {
        require('../../lib/retryrequest').installOptions(yargs)
        require('../../lib/concurrency').installOptions(yargs)
        require('../../lib/authentication').installOptions(yargs)
    },

    handler: async(argv) => {
        const { repo } = argv

        const Github = require('../../../../lib/github')
        const { extractGithubRepo } = require('../../../../lib/utils')

        const options = {}

        require('../../lib/retryrequest').handleOptions(argv, options)
        require('../../lib/concurrency').handleOptions(argv, options)
        require('../../lib/authentication').handleOptions(argv, options)

        const github = new Github(options)

        require('../../lib/logging').handleOptions(argv, options, github)

        for await (let item of github.contributors(extractGithubRepo(repo))) {
            console.table(item)
        }
    }
}
