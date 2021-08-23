import fs from 'fs';
import bodyParser from 'body-parser';
import { app, errorHandler } from 'mu';
import { filterDeltaForInsertedType } from './lib/delta';
import selectSubjectsWithoutUuid from './queries/select-without-uuid';
import insertUuid from './queries/insert-uuid';

const CONFIG = readConfig();

function readConfig() {
  const configText = fs.readFileSync('/config/config.json', { encoding: 'utf8' });
  const config = JSON.parse(configText);

  return config;
}

app.post('/run', async (_req, res) => {
  let uris = new Set();

  for (let [type, graphs] of Object.entries(CONFIG)) {
    const subjectsWithout = await selectSubjectsWithoutUuid(type, graphs);
    if (subjectsWithout.length > 0) {
      console.log(`Found ${subjectsWithout.length} objects of type <${type}> without a uuid. Handling now.`);
      for (const subject of subjectsWithout) {
        await insertUuid(subject, graphs);
        uris.add(subject);
      }
    }
  }

  let ret = [];

  uris.forEach((uri) => {
    ret.push({
      "uri": uri,
    })
  })

  return res.status(200).send(JSON.stringify(
    {
      "data": ret
    }
  ));
});

app.post('/delta', bodyParser.json(), async (req, res) => {
  res.status(202).send();
  for (let [type, graphs] of Object.entries(CONFIG)) {
    const insertedSubjects = filterDeltaForInsertedType(req.body, type);
    if (insertedSubjects.length > 0) {
      console.log(`Received ${insertedSubjects.length} object inserts of type ${type} through deltas. Handling now.`);
      for (const subject of insertedSubjects) {
        await insertUuid(subject, graphs);
      }
    }
  }
});

app.use(errorHandler);
