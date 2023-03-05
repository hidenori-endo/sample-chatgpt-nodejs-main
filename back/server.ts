import express from "express";
import * as fs from 'fs';
import { getCompletion } from "./chatmain";


const app: express.Express = express();
app.use(express.json())
const port = 8000;

app.post("/api", (req: express.Request, res: express.Response) => {
  const body = req.body;

  try {
    getCompletion(body, res);
  } catch(e){
    console.log(e)
  }
});

// POST API: save to file
app.post('/save-json', (req, res) => {
  const body = req.body;
  if (!body) {
    res.status(400).send('Invalid request body');
    return;
  }
  const json = JSON.stringify(body, null, 2);

  fs.writeFile('../' + body.name + '-data.json', json, (err) => {
    if (err) {
      res.status(500).send('Failed to save data');
      return;
    }
    res.send('Data saved successfully');
  });
});

// GET API: load from file
app.get('/load-json', (req, res) => {
  const name = req.query?.name;
  fs.readFile('../' + name + '-data.json', 'utf-8', (err, data) => {
    if (err) {
      res.status(500).send('Failed to load data');
      return;
    }
    res.send(data);
  });
});

app.listen(port, () => {
  console.log(`running at port ${port} `);
});

