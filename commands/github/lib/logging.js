const installOptions = (yargs) => {}

const handleOptions = (argv, options, github) => {
    github.on('info', console.info.bind(console))
}

module.exports = {
    installOptions,
    handleOptions
}
