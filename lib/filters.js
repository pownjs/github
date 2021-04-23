const getTokens = (input) => {
    return input.trim().split(/\s+/g).filter(token => token).map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
}

const getOptions = (input) => {
    return `(${getTokens(input)})`
}

const createEmailFilter = ({ domains = '' }) => {
    domains = domains ? domains.trim() : ''

    const parts = []

    if (domains) {
        domains = getOptions(domains)

        parts.push(`@${domains}$`)
    }


    if (parts.length) {
        return parts.map(part => `(${part})`).join('|')
    }
}

const createCompanyFilter = ({ domains = '', brands = '' }) => {
    domains = domains ? domains.trim() : ''
    brands = brands ? brands.trim() : ''

    const parts = []

    if (domains) {
        domains = getOptions(domains)

        parts.push(`(^|\\s|\\.|@)${domains}(\\s|$)`)
    }

    if (brands) {
        brands = getOptions(brands)

        parts.push(`^\\s*${brands}\\s*$`)
        parts.push(`(@\\s?)${brands}(\\s|$)`)
    }

    if (parts.length) {
        return parts.map(part => `(${part})`).join('|')
    }
}

const createBioFilter = ({ domains = '', brands = '' }) => {
    domains = domains ? domains.trim() : ''
    brands = brands ? brands.trim() : ''

    const parts = []

    if (domains) {
        domains = getOptions(domains)

        parts.push(`(^|\\s|\\.|@)${domains}(\\s|$)`)
    }

    if (brands) {
        brands = getOptions(brands)

        parts.push(`(@\\s?|(^|\\s)at\\s|ex-)${brands}(\\s|$)`)
    }

    if (parts.length) {
        return parts.map(part => `(${part})`).join('|')
    }
}

module.exports = { createEmailFilter, createCompanyFilter, createBioFilter }
