const installOptions = (yargs) => {
    yargs.option('try-fetch', {
        describe: 'Repeat failed requests',
        type: 'boolean',
        default: true
    })

    yargs.option('try-fetch-delay', {
        describe: 'The delay before failed requests are repeated',
        type: 'number',
        default: 0
    })
}

const handleOptions = (argv, options) => {
    const { tryFetch, tryFetchDelay } = argv

    options.tryFetch = tryFetch
    options.tryFetchDelay = tryFetchDelay
}

module.exports = {
    installOptions,
    handleOptions
}
