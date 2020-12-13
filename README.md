# Fastly Search

A utility for indexing & querying a Fastly account with ElasticSearch for quick, terse & granular searches.

## Usage

To use this, you need a Fastly API key & an ElasticSearch 7 compatible server.

```bash
$ export ELASTICSEARCH_URL={Your Elasticsearch DSN goes here}
$ export FASTLY_API_KEY={Your Fastly API key goes here}
$ npx fastly-search
```

## Local Development

Local development depends on Docker, and ships with a Kibana UI for inspecting local results.
You can get started with the below commands:

```bash
$ docker-compose up -d
$ export ELASTICSEARCH_URL=http://$(docker port fastly-search-elasticsearch 9200)/
$ export FASTLY_API_KEY={Your Fastly API key goes here}
$ open http://$(docker port fastly-search-kibana 5601)/app/discover
$ npm run start
```

## Running in Production
TBC, but in theory this can write to any ElasticSearch 7 host.


## Example Queries

### All active services which have do not have WAF enabled:

```
active:true AND NOT wafs:*
```

### All services with an S3 backend

```
backends.address:s3.amazonaws.com
```

### All services which manipulate vcl_hash with custom VCL

```
vcls.content:"sub vcl_hash"
```