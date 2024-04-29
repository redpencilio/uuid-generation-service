# UUID generation service

Data used within a [semantic.works](http://semantic.works)-stack (and [mu-cl-resources](https://github.com/mu-semtech/mu-cl-resources) in particular) requires each RDF-object to  have a [mu:uuid](http://mu.semte.ch/vocabularies/core/uuid) property. Data imported from third parties might not have this uuid. Thus, in order to integrate with other sources while harnessing the power of semantic.works, uuid's need to be added to each imported object. This service does exactly that.

## Getting started
### How to add the service to your stack
Add the following snippet to your `docker-compose.yml`
```yaml
uuid-generation:
  image: redpencil/uuid-generation
  volumes:
    - ./config/uuid-generation/:/config
```

Create a file `config.json` in `./config/uuid-generation` and list the resource type/graph combinations for which a UUID must be generated.

E.g.

``` json
{
    "http://data.europa.eu/eli/ontology#LegalResource": ["http://mu.semte.ch/graphs/public"]
}
```


Next, configure a delta rule in `./config/delta/rules.js` to dispatch interesting delta's to this service:

```js
{
  match: {
    predicate: {
      type: 'uri',
      value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
    },
    object: {
      type: 'uri',
      value: 'http://data.europa.eu/eli/ontology#LegalResource' // Example type.
    }
  },
  callback: {
    url: 'http://uuid-generation/delta',
    method: 'POST'
  },
  options: {
    resourceFormat: 'v0.0.1',
    gracePeriod: 250,
    ignoreFromSelf: false
  }
}
```

Finally, start your new service and restart the delta-notifier

```bash
docker compose up -d uuid-generation
docker compose restart delta-notifier
```

## Reference
### Resource type configuration
The service can be configured through a configuration file `config.json`. If you use the docker-compose config below, this file should be in `config/uuid-generation/`. This file consists of one object with the accepted types as keys and a list of all the graphs those types should be checked in. UUIDs will only be generated for resources that match these types/graphs.

For example:

``` json
{
    "http://data.vlaanderen.be/ns/besluit#Agendapunt": ["http://mu.semte.ch/graphs/public"],
    "http://data.vlaanderen.be/ns/besluit#Zitting": ["http://mu.semte.ch/graphs/public"],
    "http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#Email": ["http://mu.semte.ch/graphs/public", "http://mu.semte.ch/graphs/emails"]
}
```

### Service configuration
The following environment variables can be configured:

```
  RUN_CRON_JOBS: set to "true" if cron jobs should be enabled (default: false)
  CRON_FREQUENCY: default "* */1 * * *"
  QUEUE_POLL_INTERVAL: tick interval of the processing-queue in ms (default: 60000)
```
### API
#### POST /delta

Internal endpoint which receives [deltas](https://github.com/mu-semtech/delta-notifier).

#### POST /run

Service-endpoint to manually trigger running uuid-insertion for the configured types.
