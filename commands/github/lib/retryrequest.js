const installOptions = (yargs) => {
    yargs.option('retry-request', {
        describe: 'Repeat failed requests',
        type: 'boolean',
        default: true
    })

    yargs.option('retry-request-delay', {
        describe: 'The delay before failed requests are repeated',
        type: 'number',
        default: 0
    })
}

const handleOptions = (argv, options) => {
    const { retryRequest, retryRequestDelay } = argv

    options.retryRequest = retryRequest
    options.retryRequestDelay = retryRequestDelay
}

module.exports = {
    installOptions,
    handleOptions
}
