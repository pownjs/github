const { EventEmitter } = require('events')
const querystring = require('querystring')
const { sleep } = require('@pown/async/lib/timers')
const { Scheduler } = require('@pown/request/lib/scheduler')

class Github extends EventEmitter {
    constructor(options) {
        super()

        const { tryFetch = true, tryFetchDelay = 0, userAgent = 'Pown', githubKey, githubToken, ...schedulerOptions } = options || {}

        this.scheduler = new Scheduler({ maxConcurrent: 100, ...schedulerOptions })

        this.tryFetch = tryFetch
        this.tryFetchDelay = tryFetchDelay

        this.headers = {
            'user-agent': userAgent || 'Pown'
        }

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
        while (true) {
            const response = await this.scheduler.fetch(uri, this.headers)

            const { responseHeaders } = response

            if (this.tryFetch) {
                const { 'x-ratelimit-remaining': xRateLimitRemaining = Infinity, 'x-ratelimit-reset': xRateLimitReset = (Math.round(Date.now() / 1000) + 60) } = responseHeaders

                const xrm = parseInt(xRateLimitRemaining)
                const xrr = parseInt(xRateLimitReset)

                this.emit('info', `x-ratelimit-remaining: ${xrm}r`)
                this.emit('info', `x-ratelimit-reset: ${xrr}u`)

                if (xrm === 0) {
                    let sleepTime

                    if (this.tryFetchDelay) {
                        sleepTime = this.tryFetchDelay
                    }
                    else {
                        sleepTime = (xrr * 1000) - Date.now()
                    }

                    this.emit('info', `sleeping for: ${sleepTime}ms`)

                    await sleep(sleepTime)

                    continue
                }
            }

            return response
        }
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
