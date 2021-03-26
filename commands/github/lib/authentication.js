const installOptions = (yargs) => {
    yargs.option('github-key', {
        describe: 'Github key',
        type: 'string',
        alias: 'u'
    })
}

const handleOptions = (argv, options) => {
    const { githubKey } = argv

    options.githubKey = githubKey
}

module.exports = {
    installOptions,
    handleOptions
}
