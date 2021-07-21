import { querySudo } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri } from 'mu';
import { parseSparqlResults } from './util';

async function selectSubjectsWithoutUuid (type, graphs) {
  const queryString = `PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

SELECT ?s
WHERE {
    GRAPH ?g {
        ?s a ${sparqlEscapeUri(type)} .
        FILTER NOT EXISTS { 
            ?s mu:uuid ?mu_uuid .
        }
    }
    VALUES ?g {
        ${graphs.map(sparqlEscapeUri).join('\n        ')}
    }
}
`;
  const res = await querySudo(queryString);
  const parsedRes = parseSparqlResults(res);
  return parsedRes.map(res => res.s);
}

export default selectSubjectsWithoutUuid;
