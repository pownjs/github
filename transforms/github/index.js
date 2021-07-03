const { Transform } = require('@pown/recon/lib/transform')
const { BRAND_TYPE, NICK_TYPE, STRING_TYPE } = require('@pown/recon/lib/types')

const Github = require('../../lib/github')
const { extractGithubRepo } = require('../../lib/utils')
const { createEmailFilter, createCompanyFilter, createBioFilter } = require('../../lib/filters')

const GITHUB_ORG_TYPE = 'github:org'
const GITHUB_USER_TYPE = 'github:user'
const GITHUB_GIST_TYPE = 'github:gist'
const GITHUB_REPO_TYPE = 'github:repo'

const defaultOptions = {
    githubKey: {
        description: 'GitHub API Key. The key is either in the format username:password or username:token.',
        type: 'string',
        value: ''
    },

    retryRequest: {
        description: 'Re-try requests which are out of the rate limit policy.',
        type: 'boolean',
        value: true
    },

    retryRequestDelay: {
        description: 'The delay between retrying requests which are out of the rate limit policy.',
        type: 'number',
        value: 0
    },

    maxResults: {
        description: 'Maximum results. Used for limiting expensive search operations.',
        type: 'number',
        value: Infinity
    }
}

const getClient = function(options) {
    const { githubKey = process.env.GITHUB_KEY, retryRequest = true, retryRequestDelay = 0, maxResults = Infinity } = options

    const github = new Github({ githubKey, retryRequest, retryRequestDelay, maxResults, scheduler: this.scheduler })

    github.on('info', this.emit.bind(this, 'info'))
    github.on('warn', this.emit.bind(this, 'warn'))
    github.on('error', this.emit.bind(this, 'error'))
    github.on('debug', this.emit.bind(this, 'debug'))

    return github
}

class githubUser extends Transform {
    static get alias() {
        return ['github_user', 'ghu']
    }

    static get title() {
        return 'Map GitHub User'
    }

    static get description() {
        return 'Map GitHub user for a given term.'
    }

    static get group() {
        return 'GitHub User'
    }

    static get tags() {
        return ['ce']
    }

    static get types() {
        return [BRAND_TYPE, NICK_TYPE, STRING_TYPE]
    }

    static get options() {
        return {
            ...defaultOptions
        }
    }

    static get priority() {
        return 1
    }

    static get noise() {
        return 1
    }

    async handle({ id: source = '', label }, options) {
        const github = getClient.call(this, options)

        const results = []

        const info = await github.user(label)

        const { login, html_url: uri, avatar_url } = info

        results.push({ type: GITHUB_USER_TYPE, label: login, image: avatar_url, props: { login, uri, info }, edges: [source] })

        return results
    }
}

class githubOrg extends Transform {
    static get alias() {
        return ['github_org', 'gho']
    }

    static get title() {
        return 'Map GitHub Org'
    }

    static get description() {
        return 'Map GitHub org for a given term.'
    }

    static get group() {
        return 'GitHub Org'
    }

    static get tags() {
        return ['ce']
    }

    static get types() {
        return [BRAND_TYPE, NICK_TYPE, STRING_TYPE]
    }

    static get options() {
        return {
            ...defaultOptions
        }
    }

    static get priority() {
        return 1
    }

    static get noise() {
        return 1
    }

    async handle({ id: source = '', label = '' }, options) {
        const github = getClient.call(this, options)

        const results = []

        const info = await github.org(label)

        const { login, html_url: uri, avatar_url } = info

        results.push({ type: GITHUB_ORG_TYPE, label: login, image: avatar_url, props: { login, uri, info }, edges: [source] })

        return results
    }
}

class githubSearchUsers extends Transform {
    static get alias() {
        return ['github_search_users', 'ghsu']
    }

    static get title() {
        return 'Search GitHub Users'
    }

    static get description() {
        return 'Search GitHub users for a given term.'
    }

    static get group() {
        return 'GitHub Users'
    }

    static get tags() {
        return ['ce']
    }

    static get types() {
        return [BRAND_TYPE, NICK_TYPE, STRING_TYPE]
    }

    static get options() {
        return {
            ...defaultOptions,

            quitIfNoFilters: {
                description: 'Do not search if no filters specified.',
                type: 'boolean',
                default: false,
                alias: ['quit-if-no-filter', 'if-no-filters-quit', 'if-no-filter-quit']
            },

            emailFilter: {
                description: 'Regex to filter based on email domain.',
                type: 'string',
                default: '',
                alias: ['filter-email']
            },

            companyFilter: {
                description: 'Regex to filter based on company details.',
                type: 'string',
                default: '',
                alias: ['filter-company']
            },

            bioFilter: {
                description: 'Regex to filter based on bio details.',
                type: 'string',
                default: '',
                alias: ['filter-bio']
            },

            fuzzyDomainFilter: {
                description: 'Filter users based on fuzzy domain name criteria',
                type: 'string',
                default: ''
            },

            fuzzyBrandFilter: {
                description: 'Filter users based on fuzzy brand name criteria',
                type: 'string',
                default: ''
            },

            andFilter: {
                description: 'Treat all filters as if they are in and condition',
                type: 'boolean',
                default: true,
                alias: ['and-filters', 'filter-and', 'filters-and']
            },

            orFilter: {
                description: 'Treat all filter as if they are in or condition',
                type: 'boolean',
                default: false,
                alias: ['or-filters', 'filter-or', 'filters-or']
            },

            maxUsers: {
                description: 'Maximum number of users',
                type: 'number',
                default: Infinity,
                alias: ['max-user', 'users-max', 'user-max']
            }
        }
    }

    static get priority() {
        return 1
    }

    static get noise() {
        return 100
    }

    async handle({ id: source = '', label = '' }, options) {
        const github = getClient.call(this, options)

        const { quitIfNoFilters, emailFilter, companyFilter, bioFilter, fuzzyDomainFilter, fuzzyBrandFilter, andFilter, orFilter, maxUsers } = options

        const filters = []

        if (emailFilter) {
            const regex = new RegExp(emailFilter, 'i')

            filters.push(({ email }) => regex.test(email))
        }

        if (companyFilter) {
            const regex = new RegExp(companyFilter, 'i')

            filters.push(({ company }) => regex.test(company))
        }

        if (bioFilter) {
            const regex = new RegExp(bioFilter, 'i')

            filters.push(({ bio }) => regex.test(bio))
        }

        const pushFuzzyEmailFilter = ({ domains, brands }) => {
            if (domains) {
                const f = createEmailFilter({ domains })

                if (f) {
                    const regex = new RegExp(f, 'i')

                    filters.push(({ email }) => regex.test(email))
                }
            }

            if (brands) {
                const f = createEmailFilter({ brands })

                if (f) {
                    const regex = new RegExp(f, 'i')

                    filters.push(({ email }) => regex.test(email))
                }
            }
        }

        const pushFuzzyCompanyFilter = ({ domains, brands }) => {
            if (domains) {
                const f = createCompanyFilter({ domains })

                if (f) {
                    const regex = new RegExp(f, 'i')

                    filters.push(({ company }) => regex.test(company))
                }
            }

            if (brands) {
                const f = createCompanyFilter({ brands })

                if (f) {
                    const regex = new RegExp(f, 'i')

                    filters.push(({ company }) => regex.test(company))
                }
            }
        }

        const pushFuzzyBioFilter = ({ domains, brands }) => {
            if (domains) {
                const f = createBioFilter({ domains })

                if (f) {
                    const regex = new RegExp(f, 'i')

                    filters.push(({ bio }) => regex.test(bio))
                }
            }

            if (brands) {
                const f = createBioFilter({ brands })

                if (f) {
                    const regex = new RegExp(f, 'i')

                    filters.push(({ bio }) => regex.test(bio))
                }
            }
        }

        if (fuzzyDomainFilter) {
            pushFuzzyEmailFilter({ domains: fuzzyDomainFilter })
            pushFuzzyCompanyFilter({ domains: fuzzyDomainFilter })
            pushFuzzyBioFilter({ domains: fuzzyDomainFilter })
        }

        if (fuzzyBrandFilter) {
            pushFuzzyEmailFilter({ brands: fuzzyBrandFilter })
            pushFuzzyCompanyFilter({ brands: fuzzyBrandFilter })
            pushFuzzyBioFilter({ brands: fuzzyBrandFilter })
        }

        let filter = () => true

        if (filters.length) {
            if (orFilter) {
                filter = (args) => filters.some(f => f(args))
            }
            else
            if (andFilter) {
                filter = (args) => filters.every(f => f(args))
            }
        }
        else
        if (quitIfNoFilters) {
            return []
        }

        const results = []

        let i = 0

        for await (let { login: user, type } of github.search(label, ['users'])) {
            if (type !== 'User') {
                continue
            }

            try {
                const info = await github.user(user)

                const { login, html_url: uri, avatar_url, email, company, bio } = info

                if (!filter({ email: email || '', company: company || '', bio: bio || '' })) {
                    continue
                }

                this.info(`found user ${user}`)

                results.push({ type: GITHUB_USER_TYPE, label: login, image: avatar_url, props: { login, uri, info }, edges: [source] })

                if (++i >= maxUsers) {
                    break
                }
            }
            catch (e) {
                this.error(e)
            }
        }

        return results
    }
}

class githubListOrgs extends Transform {
    static get alias() {
        return ['github_list_orgs', 'ghlo']
    }

    static get title() {
        return 'List GitHub Orgs'
    }

    static get description() {
        return 'List GitHub orgs for a given member.'
    }

    static get group() {
        return 'GitHub Orgs'
    }

    static get tags() {
        return ['ce']
    }

    static get types() {
        return [BRAND_TYPE, GITHUB_USER_TYPE]
    }

    static get options() {
        return {
            ...defaultOptions
        }
    }

    static get priority() {
        return 1
    }

    static get noise() {
        return 1
    }

    async handle({ id: source = '', label = '', }, options) {
        const github = getClient.call(this, options)

        const results = []

        for await (let { login: org } of github.orgs(label)) {
            try {
                const info = await github.org(org)

                const { login, html_url: uri, avatar_url } = info

                results.push({ type: GITHUB_ORG_TYPE, label: login, image: avatar_url, props: { login, uri, info }, edges: [source] })
            }
            catch (e) {
                this.error(e)
            }
        }

        return results
    }
}

class githubListMembers extends Transform {
    static get alias() {
        return ['github_list_members', 'ghlm']
    }

    static get title() {
        return 'List GitHub Members'
    }

    static get description() {
        return 'List GitHub members for a given org.'
    }

    static get group() {
        return 'GitHub Members'
    }

    static get tags() {
        return ['ce']
    }

    static get types() {
        return [BRAND_TYPE, GITHUB_ORG_TYPE]
    }

    static get options() {
        return {
            ...defaultOptions
        }
    }

    static get priority() {
        return 1
    }

    static get noise() {
        return 1
    }

    async handle({ id: source = '', label = '' }, options) {
        const github = getClient.call(this, options)

        const results = []

        for await (let { login: user } of github.members(label)) {
            try {
                const info = await github.user(user)

                const { login, html_url: uri, avatar_url } = info

                results.push({ type: GITHUB_USER_TYPE, label: login, image: avatar_url, props: { login, uri, info }, edges: [source] })
            }
            catch (e) {
                this.error(e)
            }
        }

        return results
    }
}

class githubListRepos extends Transform {
    static get alias() {
        return ['github_list_repos', 'ghlr']
    }

    static get title() {
        return 'List GitHub Repos'
    }

    static get description() {
        return 'List GitHub repos for a given user/org.'
    }

    static get group() {
        return 'GitHub Repos'
    }

    static get tags() {
        return ['ce']
    }

    static get types() {
        return [BRAND_TYPE, GITHUB_ORG_TYPE, GITHUB_USER_TYPE]
    }

    static get options() {
        return {
            ...defaultOptions,

            forks: {
                description: 'Include forks',
                type: 'boolean',
                default: false
            }
        }
    }

    static get priority() {
        return 1
    }

    static get noise() {
        return 1
    }

    async handle({ id: source = '', label = '' }, options) {
        const github = getClient.call(this, options)

        const { forks } = options

        const results = []

        for await (let info of github.repos(label)) {
            const { name, html_url: uri, description, fork } = info

            if (fork && !forks) {
                continue
            }

            results.push({ type: GITHUB_REPO_TYPE, label: name, props: { name, uri, description, info }, edges: [source] })
        }

        return results
    }
}

class githubListGists extends Transform {
    static get alias() {
        return ['github_list_gists', 'ghlg']
    }

    static get title() {
        return 'List GitHub Gists'
    }

    static get description() {
        return 'List GitHub gists for a given user/org.'
    }

    static get group() {
        return 'GitHub Gists'
    }

    static get tags() {
        return ['ce']
    }

    static get types() {
        return [BRAND_TYPE, GITHUB_ORG_TYPE, GITHUB_USER_TYPE]
    }

    static get options() {
        return {
            ...defaultOptions
        }
    }

    static get priority() {
        return 1
    }

    static get noise() {
        return 1
    }

    async handle({ id: source = '', label = '' }, options) {
        const github = getClient.call(this, options)

        const results = []

        for await (let info of github.gists(label)) {
            const { id, html_url: uri, description } = info

            results.push({ type: GITHUB_GIST_TYPE, label: id, props: { id, uri, description, info }, edges: [source] })
        }

        return results
    }
}

class githubListContributors extends Transform {
    static get alias() {
        return ['github_list_contributors', 'ghlc']
    }

    static get title() {
        return 'List GitHub Contributors'
    }

    static get description() {
        return 'List GitHub contributors for a given repo.'
    }

    static get group() {
        return 'GitHub Contributors'
    }

    static get tags() {
        return ['ce']
    }

    static get types() {
        return [GITHUB_REPO_TYPE]
    }

    static get options() {
        return {
            ...defaultOptions
        }
    }

    static get priority() {
        return 1
    }

    static get noise() {
        return 1
    }

    async handle({ id: source = '', label = '', props = {} }, options) {
        const github = getClient.call(this, options)

        const results = []

        for await (let { login: user } of github.contributors(extractGithubRepo(label, props.uri, props.url))) {
            try {
                const info = await github.user(user)

                const { login, html_url: uri, avatar_url } = info

                results.push({ type: GITHUB_USER_TYPE, label: login, image: avatar_url, props: { login, uri, info }, edges: [source] })
            }
            catch (e) {
                this.error(e)
            }
        }

        return results
    }
}

module.exports = {
    githubUser,
    githubOrg,
    githubSearchUsers,
    githubListOrgs,
    githubListMembers,
    githubListRepos,
    githubListGists,
    githubListContributors
}
