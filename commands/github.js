exports.yargs = {
    command: 'github <command>',
    describe: 'Github utility',
    aliases: ['gh'],

    builder: (yargs) => {
        yargs.command(require('./sub/search').yargs)
        yargs.command(require('./sub/user').yargs)
        yargs.command(require('./sub/gists').yargs)
        yargs.command(require('./sub/org').yargs)
        yargs.command(require('./sub/orgs').yargs)
        yargs.command(require('./sub/members').yargs)
    }
}
