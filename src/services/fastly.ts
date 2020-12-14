import fetch, {HeadersInit, Response} from 'node-fetch'
const {FASTLY_API_KEY} = process.env

export type FastlyParameters = HeadersInit & {
}
export type FastlyResponse = {
    [key: string]: string|Object|Object[]
    links?: {
        next: string
        last?: string
    }
    meta?: {
        total_pages: Number
        current_page: Number
    }
    data?: FastlyResponse[]
}
export type FastlyService = FastlyResponse & {
    id: string
    name: string
    attributes: {
        [key: string]: string
    }
    version: Object[]
}

export async function fastly(endpoint: string, parameters: FastlyParameters = {}): Promise<FastlyResponse> {
    const fastlyRoot = 'https://api.fastly.com/'
    const url = endpoint.startsWith(fastlyRoot) ? endpoint : `${fastlyRoot}${endpoint}`
    const headers = ('headers' in parameters) ? parameters.headers : {}
    const options = Object.assign({
        headers: Object.assign({
            'Fastly-Key': FASTLY_API_KEY
        }, headers)
    }, parameters)
    console.debug(`EVENT=FASTLY_FETCH URL=${url}"`)
    return fetch(url, options).then((res: Response) => res.json())
}

export async function* fastlyCollection(endpoint: string, parameters = {}): AsyncIterable<FastlyResponse[]> {
    let page: FastlyResponse = {links: {next: endpoint}, meta:{ total_pages: 0, current_page: -1}, data: []}
    while (page.meta.total_pages > page.meta.current_page) {
        page = await fastly(page.links.next, parameters)
        yield page.data
    }
}