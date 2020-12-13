import fetch from 'node-fetch'
const {FASTLY_API_KEY} = process.env

export async function fastly(endpoint, parameters = {}) {
    const fastlyRoot = 'https://api.fastly.com/'
    const url = endpoint.startsWith(fastlyRoot) ? endpoint : `${fastlyRoot}${endpoint}`
    const headers = ('headers' in parameters) ? parameters.headers : {}
    const options = Object.assign({
        headers: Object.assign({
            'Fastly-Key': FASTLY_API_KEY
        }, headers)
    }, parameters)
    console.debug(`EVENT=FASTLY_FETCH URL=${url}"`)
    return await fetch(url, options).then(res => res.json())
}

export async function* fastlyCollection(endpoint, parameters = {}) {
    let page = {links: {next: endpoint}, meta:{ total_pages: 0, current_page: -1}}
    while (page.meta.total_pages > page.meta.current_page) {
        page = await fastly(page.links.next, parameters)
        yield page.data
    }
}