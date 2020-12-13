#!/usr/bin/env node --max-old-space-size=4096
import os from 'os'
import inquirer from 'inquirer'
import {setup, search} from './src/fastly-es-interface.js'
import { exit } from 'process'

async function main() {
    if (!(`ELASTICSEARCH_URL` in process.env)) {
        console.error('You must have an ELASTICSEARCH_URL set.')
        exit(1)
    }
    if (!('FASTLY_API_KEY') in process.env) {
        console.error('You must have a FASTLY_API_KEY set.')
        exit(1)
    }

    // Set-up tasks.
    await setup()

    // Run queries in a loop.
    while (true) {
        const {QUERY} = await inquirer.prompt([{
            name: "QUERY",
            type: "input",
            message: "Which services are you looking for?"
        }])


        const fields = ['id', 'name', 'url']
        const results = await search({
            // q: QUERY,
            size: 1000,
            body: {
                query: {
                    query_string: {
                        query: QUERY
                    }
                },
                fields
            },
        })
        results.forEach(result => {
            fields.forEach(field => console.log(field, result[field].join(', ')))
            console.log()
        })
        console.log(`${results.length} Services Found.`)
    }
}

main()