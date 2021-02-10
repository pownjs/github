const { EventEmitter } = require('events')
const querystring = require('querystring')
const { sleep } = require('@pown/async/lib/sleep')
const { Scheduler } = require('@pown/request/lib/scheduler')

class Github extends EventEmitter {
    constructor(options) {
        super()

        const { retryRequest = true, retryRequestDelay = 0, userAgent = 'Pown', githubKey, githubToken, ...schedulerOptions } = options || {}

        this.scheduler = new Scheduler({ maxConcurrent: 100, ...schedulerOptions })

        this.retryRequest = retryRequest
        this.retryRequestDelay = retryRequestDelay

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
            const response = await this.scheduler.request({ uri, headers: this.headers })

            const { responseHeaders } = response

            if (this.retryRequest) {
                const { 'x-ratelimit-remaining': xRateLimitRemaining = 0, 'x-ratelimit-reset': xRateLimitReset = (Math.round(Date.now() / 1000) + 60) } = responseHeaders

                const xrm = parseInt(xRateLimitRemaining)
                const xrr = parseInt(xRateLimitReset)

                this.emit('info', `x-ratelimit-remaining: ${xrm}r`)
                this.emit('info', `x-ratelimit-reset: ${xrr}u`)

                if (xrm === 0) {
                    let sleepTime

                    if (this.retryRequestDelay) {
                        sleepTime = this.retryRequestDelay
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

    async user(username, options) {
        const search = querystring.stringify({ ...options })

        const { responseCode, responseBody } = await this.fetch(`https://api.github.com/users/${encodeURIComponent(username)}?${search}`)

        const props = JSON.parse(responseBody)

        if (responseCode !== 200) {
            this.throw([props])
        }

        if (props.type === 'Organization') {
            this.throw([new Error('Not found')])
        }

        return props
    }

    async org(org, options) {
        const search = querystring.stringify({ ...options })

        const { responseCode, responseBody } = await this.fetch(`https://api.github.com/orgs/${encodeURIComponent(org)}?${search}`)

        const props = JSON.parse(responseBody)

        if (responseCode !== 200) {
            this.throw([props])
        }

        if (props.type !== 'Organization') {
            this.throw([new Error('Not found')])
        }

        return props
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

    async * gists(username, options) {
        const search = querystring.stringify({ ...options })

        for await (let items of this.paginate(`https://api.github.com/users/${encodeURIComponent(username)}/gists?${search}`)) {
            for (let item of items) {
                yield item
            }
        }
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
