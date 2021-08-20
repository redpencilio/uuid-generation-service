# UUID generation service

Data used within a [semantic.works](http://semantic.works)-stack (and [mu-cl-resources](https://github.com/mu-semtech/mu-cl-resources) in particular) requires each RDF-object to  have a [mu:uuid](http://mu.semte.ch/vocabularies/core/uuid) property. Data imported from third parties might not have this uuid. Thus, in order to integrate with other sources while harnessing the power of semantic.works, uuid's need to be added to each imported object. This service does exactly that.

## Configuration

### config.json

The service can be configured through a configuration file `config.json`. If you use the docker-compose config below, this file should be in `config/uuid-generation/`. This file consists of one object with the accepted types as keys and a list of all the graphs those types should be checked in. For example:

``` json
{
    "http://data.vlaanderen.be/ns/besluit#Agendapunt": ["http://mu.semte.ch/graphs/public"],
    "http://data.vlaanderen.be/ns/besluit#Zitting": ["http://mu.semte.ch/graphs/public"],
    "http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#Email": ["http://mu.semte.ch/graphs/public", "http://mu.semte.ch/graphs/emails"]
}
```

### docker-compose snippet

```yaml
uuid-generation:
  build: https://github.com/kanselarij-vlaanderen/uuid-generation-service.git
  volumes:
    - ./config/uuid-generation/:/config
```

### delta-notifier configuration

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

## API

### POST /delta

Internal endpoint which receives [deltas](https://github.com/mu-semtech/delta-notifier).

### POST /run

Service-endpoint to manually trigger running uuid-insertion for the configured types.
