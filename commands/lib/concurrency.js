const installOptions = (yargs) => {
    yargs.option('concurrency', {
        describe: 'Number of concurrent requests',
        type: 'number',
        default: 100,
        alias: 'c'
    })
}

const handleOptions = (argv, github) => {
    const { concurrency } = argv

    github.scheduler.update({ maxConcurrent: concurrency })
}

module.exports = {
    installOptions,
    handleOptions
}
