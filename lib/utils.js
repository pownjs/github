const isGithubRepo = /^([a-z0-0-]+)\/([a-z0-0-]+)(\.git)?$/

const isGithubUrl = /^https:\/\/github.com\/([a-z0-0-]+)\//
const isGithubRepoUrl = /^https:\/\/github.com\/([a-z0-0-]+)\/([a-z0-0-]+)(\.git)?/

const extractGithubRepo = (...options) => {
    for (let option of options) {
        const match = String(option).match(isGithubRepoUrl)

        if (match) {
            return `${match[1]}/${match[2]}`
        }
    }

    for (let option of options) {
        const match = String(option).match(isGithubRepo)

        if (match) {
            return `${match[1]}/${match[2]}`
        }
    }

    throw new Error(`Cannot extract GitHub repo from options ${options}`)
}

module.exports = {
    isGithubRepo,

    isGithubUrl,
    isGithubRepoUrl,

    extractGithubRepo
}
