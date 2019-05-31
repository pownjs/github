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
            const { responseHeaders, responseBody } = await this.fetch(uri)

            const { items = [], errors } = JSON.parse(responseBody)

            if (errors) {
                this.throw(errors)
            }

            yield items

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
        } while (uri)
    }

    async user(user) {
        const { responseBody } = await this.fetch(`https://api.github.com/users/${encodeURIComponent(user)}`)

        return JSON.parse(responseBody)
    }

    async * search(q, categories = ['code']) {
        if (!Array.isArray(categories)) {
            categories = [categories]
        }

        const search = querystring.stringify({ q })

        for (let category of categories) {
            for await (let items of this.paginate(`https://api.github.com/search/${category}?${search}`)) {
                for (let item of items) {
                    yield item
                }
            }
        }
    }
}

module.exports = Github
