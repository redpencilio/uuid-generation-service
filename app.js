import bodyParser from 'body-parser';
import { app, errorHandler } from 'mu';
import { filterDeltaForInsertedType } from './lib/delta';
import selectSubjectsWithoutUuid from './queries/select-without-uuid';
import insertUuid from './queries/insert-uuid';

const RDF_TYPE = process.env.RDF_TYPE;
const GRAPH = process.env.GRAPH;

app.post('/run', async (req, res) => {
  const subjectsWithout = await selectSubjectsWithoutUuid(RDF_TYPE, [GRAPH]);
  if (subjectsWithout.length > 0) {
    console.log(`Found ${subjectsWithout.length} objects of type <${RDF_TYPE}> without a uuid. Handling now.`);
    for (const subject of subjectsWithout) {
      await insertUuid(subject, [GRAPH]);
    }
  }
  const data = subjectsWithout.map(s => {
    return { uri: s };
  });

  return res.send({
    data
  });
});

app.post('/delta', bodyParser.json(), async (req, res) => {
  res.status(202).end();
  const insertedSubjects = filterDeltaForInsertedType(req.body, RDF_TYPE);
  if (insertedSubjects.length > 0) {
    console.log(`Received ${insertedSubjects.length} object inserts of type <${RDF_TYPE}> through delta's. Handling now.`);
    for (const subject of insertedSubjects) {
      await insertUuid(subject, [GRAPH]);
    }
  }
});

app.use(errorHandler);
