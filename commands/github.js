exports.yargs = {
    command: 'github <command>',
    describe: 'Github utility',
    aliases: ['gh'],

    builder: (yargs) => {
        yargs.command(require('./sub/search').yargs)
    }
}
