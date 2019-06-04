const querystring = require('querystring')
const { Scheduler } = require('@pown/request/lib/scheduler')

class Github {
    constructor(options) {
        this.scheduler = new Scheduler({ maxConcurrent: 100, ...options })

        this.headers = {
            'user-agent': 'Pown'
        }

        const { githubKey, githubToken } = options || {}

        if (githubKey || githubToken) {
            this.headers['authorization'] = `Basic ${Buffer.from(githubKey || githubToken).toString('base64')}`
        }
    }

    throw (errors) {
        for (let error of errors) {
            const { message } = error

            throw new Error(`${message}`)
        }
    }

    async fetch(uri) {
        return await this.scheduler.fetch(uri, this.headers)
    }

    async * paginate(uri) {
        do {
            const { responseCode, responseHeaders, responseBody } = await this.fetch(uri)

            const result = JSON.parse(responseBody)

            const { errors } = result

            if (errors) {
                this.throw(errors)
            }

            if (responseCode !== 200) {
                this.throw([JSON.parse(responseBody)])
            }

            yield result

            const { link } = responseHeaders

            if (link) {
                const match = link.match(/<([^>]+?)>;\s*rel="next"/)

                if (match) {
                    uri = match[1]
                }
                else {
                    uri = null
                }
            }
            else {
                uri = null
            }
        } while (uri)
    }

    async * search(q, categories = ['code'], options) {
        if (!Array.isArray(categories)) {
            categories = [categories]
        }

        const search = querystring.stringify({ ...options, q })

        for (let category of categories) {
            for await (let { items } of this.paginate(`https://api.github.com/search/${category}?${search}`)) {
                for (let item of items) {
                    yield item
                }
            }
        }
    }

    async * repos(username, options) {
        const search = querystring.stringify({ ...options })

        for await (let items of this.paginate(`https://api.github.com/users/${encodeURIComponent(username)}/repos?${search}`)) {
            for (let item of items) {
                yield item
            }
        }
    }

    async user(username, options) {
        const search = querystring.stringify({ ...options })

        const { responseBody } = await this.fetch(`https://api.github.com/users/${encodeURIComponent(username)}?${search}`)

        return JSON.parse(responseBody)
    }

    async * gists(username, options) {
        const search = querystring.stringify({ ...options })

        for await (let items of this.paginate(`https://api.github.com/users/${encodeURIComponent(username)}/gists?${search}`)) {
            for (let item of items) {
                yield item
            }
        }
    }

    async org(org, options) {
        const search = querystring.stringify({ ...options })

        const { responseBody } = await this.fetch(`https://api.github.com/orgs/${encodeURIComponent(org)}?${search}`)

        return JSON.parse(responseBody)
    }

    async * orgs(org, options) {
        const search = querystring.stringify({ ...options })

        for await (let items of this.paginate(`https://api.github.com/users/${encodeURIComponent(org)}/orgs?${search}`)) {
            for (let item of items) {
                yield item
            }
        }
    }

    async * members(org, options) {
        const search = querystring.stringify({ ...options })

        for await (let items of this.paginate(`https://api.github.com/orgs/${encodeURIComponent(org)}/members?${search}`)) {
            for (let item of items) {
                yield item
            }
        }
    }
}

module.exports = Github
