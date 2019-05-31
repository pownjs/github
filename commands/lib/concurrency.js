const installOptions = (yargs) => {
    yargs.option('concurrency', {
        describe: 'Number of concurrent requests',
        type: 'number',
        default: 100,
        alias: 'c'
    })
}

const handleOptions = (argv, options) => {
    const { concurrency } = argv

    options.maxConcurrent = concurrency
}

module.exports = {
    installOptions,
    handleOptions
}
