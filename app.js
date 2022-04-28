import fs from 'fs';
import bodyParser from 'body-parser';
import { app, errorHandler } from 'mu';
import { filterDeltaForInsertedType } from './lib/delta';
import selectSubjectsWithoutUuid from './queries/select-without-uuid';
import insertUuid from './queries/insert-uuid';
import { ProcessingQueue } from './lib/processing-queue';
import { CronJob } from 'cron';
import fetch from 'node-fetch';

const CONFIG = readConfig();
const RUN_CRON_JOBS = process.env.RUN_CRON_JOBS == 'true' || false;
const CRON_FREQUENCY = process.env.CRON_FREQUENCY || '* */1 * * *';

function readConfig() {
  const configText = fs.readFileSync('/config/config.json', { encoding: 'utf8' });
  const config = JSON.parse(configText);

  return config;
}

const processingQueue = new ProcessingQueue();

if(RUN_CRON_JOBS) {
  new CronJob(CRON_FREQUENCY, function() {
    console.log(`uuid-generation cron job started at ${new Date().toISOString()}`);
    fetch('http://localhost/run', { method: 'POST' } );
  }, null, true);
}

app.post('/run', async (_req, res) => {

  processingQueue.addJob(async () => {

    console.log('Starting processing uuid-generation-job');

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

    console.info(`Finished adding uuid's to the following uris: ${uris.join('\n')}`);
  });

  return res
    .status(200)
    .send(JSON.stringify({"message": "Scheduled uuid-generation-job"}));
});

app.post('/delta', bodyParser.json(), async (req, res) => {


  processingQueue.addJob(async () => {

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

  return  res.status(202).send();

});

app.use(errorHandler);
