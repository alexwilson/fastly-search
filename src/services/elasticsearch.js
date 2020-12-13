import { Client } from '@elastic/elasticsearch'

const { ELASTICSEARCH_URL} = process.env
const ES_INDEX = (process.env.ES_INDEX || 'fastly-services')

const client = new Client({node: ELASTICSEARCH_URL})

export async function ifIndexEmpty(fn) {
    const {body} = await client.indices.stats({index: ES_INDEX})
    console.debug(`EVENT=ELASTICSEARCH_INDEX_SIZE SIZE=${body.indices[ES_INDEX].total.docs.count}`)
    if (body.indices[ES_INDEX].total.docs.count === 0) {
        await fn.call(this)
    }
}

export async function clearIndexItems() {
    return await client.deleteByQuery({
        index: ES_INDEX,
        q: '*:*',
        body: {}
    })
}

export async function deleteIndex() {
    await client.indices.delete({
        index: ES_INDEX
    })
}

export async function createIndex() {
    const {body: exists} = await client.indices.exists({index: ES_INDEX})
    if (!exists) {
        await client.indices.create({index: ES_INDEX})
    }
    await client.indices.putMapping({
        index: ES_INDEX,
        body: {
            dynamic_templates: []
        }
    })
}

export async function flush() {
    return await client.indices.refresh({index: ES_INDEX})
}

export async function ingest(document) {
    console.debug(`EVENT=ELASTICSEARCH_INGEST ID=${document.id}`)
    return  client.index({
        index: ES_INDEX,
        id: document.id,
        body: document
    })
}

export async function ingestBatch(batch) {
    const ingestion = []
    for await (const document of batch) {
        ingestion.push(ingest(document))
    }

    const batchSize = await Promise.all(ingestion)
    const {body: flushResponse} = await flush()
    console.debug(`EVENT=ELASTICSEARCH_FLUSH SUCCESSFUL=${flushResponse._shards.successful}`)
}

export async function search(query = {}) {
    return (await client.search(Object.assign({
        index: ES_INDEX
    }, query))).body.hits.hits.map(hit => hit.fields ? hit.fields : hit._source)
}