import schedule from 'node-schedule'
import {fastly, fastlyCollection, FastlyService, FastlyResponse} from './services/fastly'
import {ifIndexEmpty, createIndex, ingestBatch, search} from './services/elasticsearch'

export type FastlyESDocument = {
    id: string
    name: string
    version: {
        [key: string]: string|object[]
    }
    [key: string]: string|object|object[]
}

async function* withDetails(services: FastlyService[]): AsyncIterable<FastlyService> {
    const detailedServices = services.map((service) => {
        console.debug(`EVENT=FETCH ID=${service.id} NAME="${service.attributes.name}"`)
        return fastly(`service/${service.id}/details`) as Promise<FastlyService>
    })
    for (const details of detailedServices) {
        yield details
    }
}

export async function* fastlyDocuments(): AsyncIterable<FastlyESDocument> {
    for await (const services of fastlyCollection('services')) {
        const detailedServices = withDetails(services as FastlyService[])
        // const detailedServices = services.map((service) => {
        //     console.debug(`EVENT=FETCH ID=${service.id} NAME="${service.attributes.name}"`)
        //     return fastly(`service/${service.id}/details`)
        // })
        for await (const service of detailedServices) {
            console.debug(`EVENT=GENERATE_DOCUMENT ID=${service.id} NAME="${service.name}"`)
            const document: FastlyESDocument = Object.create(null)
            for (const [key, value] of Object.entries(service)) {

                // We squash down the version/active_version object separately
                // for "current" information.
                if (key === 'version') continue;
                if (key === 'active_version') continue;

                document[key] = value
            }
            for (const [key, value] of Object.entries(service.version)) {

                let field = value
                if (Array.isArray(value)) {
                    field = value.map(item => Object.fromEntries(
                        Object.entries(item)
                            // .filter(([subFieldKey]) => subFieldKey !== 'content' && subFieldKey !== 'format')
                            .reduce((aggregatedField, [subFieldKey, subFieldValue]) => aggregatedField.set(subFieldKey, new String(subFieldValue).toString()), new Map())
                            .entries()
                    ))
                }
                document[key] = field
            }

            document.url = `https://manage.fastly.com/configure/services/${document.id}/`

            yield document
        }
    }
}

export async function ingestFastly() {
    ingestBatch(fastlyDocuments())
}

export async function setup(immediate = false, backgroundUpdate = true) {
    // Create an index if one doesn't exist.
    await createIndex()

    // Retrieve an initial batch & poll for updates every 5m.
    if (immediate) {
        await ingestFastly()
    } else {
        await ifIndexEmpty(async () => 
            await ingestFastly()
        )
    }
    if (backgroundUpdate) {
        schedule.scheduleJob('*/5 * * * *', ingestFastly)
    }
}

export { search }