# UUID generation service

Data used within a [semantic.works](http://semantic.works)-stack (and [mu-cl-resources](https://github.com/mu-semtech/mu-cl-resources) in particular) requires each RDF-object to  have a [mu:uuid](http://mu.semte.ch/vocabularies/core/uuid) property. Data imported from third parties might not have this uuid. Thus, in order to integrate with other sources while harnessing the power of semantic.works, uuid's need to be added to each imported object. This service does exactly that.

## Configuration

### Environment variables

The service can be configured through the following environment variables:
* `GRAPH`: graph to write to.
* `RDF_TYPE`: rdf type of the objects to watch for missing `mu:uuid`.

### docker-compose snippet

```yaml
uuid-generation:
  build: https://github.com/kanselarij-vlaanderen/uuid-generation-service.git
  environment:
    RDF_TYPE: "http://data.europa.eu/eli/ontology#LegalResource"
    GRAPH: "http://mu.semte.ch/graphs/staatsblad"
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

Internal endpoint which receives [delta's](https://github.com/mu-semtech/delta-notifier).

### POST /run

Service-endpoint to manually trigger running uuid-insertion for the configured type.
