import { sparqlEscapeUri, query } from 'mu';
import { parseSparqlResults } from './util';

async function selectSubjectsWithoutUuid (type, graphs) {
  const countQueryResult = await query(`PREFIX mu: <http://mu.semte.ch/vocabularies/core/>

SELECT (COUNT(?s) as ?count)
WHERE {
    GRAPH ?g {
        ?s a ${sparqlEscapeUri(type)} .
        FILTER NOT EXISTS {
            ?s mu:uuid ?uuid .
        }
    }
    VALUES ?g {
        ${graphs.map(sparqlEscapeUri).join('\n        ')}
    }
}
`, { sudo: true });

  const count = parseInt(countQueryResult.results.bindings[0].count.value);

  const batchSize = 10000;
  const nbOfBatches = Math.ceil(count / batchSize);
  const subjects = new Set();
  for (let i = 0; i < nbOfBatches; i++) {
    const queryString = `PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
SELECT ?s
WHERE {
    GRAPH ?g {
        ?s a ${sparqlEscapeUri(type)} .
        FILTER NOT EXISTS {
            ?s mu:uuid ?uuid .
        }
    }
    VALUES ?g {
        ${graphs.map(sparqlEscapeUri).join('\n        ')}
    }
} ORDER BY ?s LIMIT ${batchSize} OFFSET ${i*batchSize}
`;
    const res = await query(queryString, { sudo: true });
    const parsedRes = parseSparqlResults(res);
    parsedRes.forEach(res => subjects.add(res.s));
  }

  return [...subjects];
}

export default selectSubjectsWithoutUuid;
