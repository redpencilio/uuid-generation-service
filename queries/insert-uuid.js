import { sparqlEscapeString, sparqlEscapeUri, uuid as generateUuid, update } from 'mu';

function insertUuid (subject, graphs) {
  const uuid = generateUuid();
  const queryString = `PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

INSERT {
    GRAPH ?g {
        ${sparqlEscapeUri(subject)} mu:uuid ${sparqlEscapeString(uuid)} .
    }
}
WHERE {
    GRAPH ?g {
        ${sparqlEscapeUri(subject)} a ?type .
        FILTER NOT EXISTS { 
            ${sparqlEscapeUri(subject)} mu:uuid ?mu_uuid .
        }
    }
    VALUES ?g {
        ${graphs.map(sparqlEscapeUri).join('\n        ')}
    }
}
`;
  return update(queryString, { sudo: true });
}

export default insertUuid;
