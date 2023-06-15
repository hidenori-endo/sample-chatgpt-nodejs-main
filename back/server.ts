import express from "express";
import * as fs from 'fs';
const path = require('path');
import { getCompletion } from "./chatmain";

const app: express.Express = express();
app.use(express.json());
app.use(express.static("public"));
const port = 8000;

// POST 送信
app.post("/api", (req: express.Request, res: express.Response) => {
  const body = req.body;

  try {
    getCompletion(body, res);
  } catch (e) {
    console.log(e)
  }
});

// POST 保存z
app.post('/save-json', (req, res) => {
  const body = req.body;
  if (!body) {
    res.status(400).send('Invalid request body');
    return;
  }
  const json = JSON.stringify(body, null, 2);

  fs.writeFile('../' + (body.name == "" ? body.name2 : body.name) + '-data.json', json, (err) => {
    if (err) {
      res.status(500).send('Failed to save data');
      return;
    }
    res.send('Data saved successfully');
  });
});

// GET API: load from file
app.post('/load-json', (req, res) => {
  const body = req.body;
  if (!body) {
    res.status(400).send('Invalid request body');
    return;
  }
  const name = (body.name == "" ? body.name2 : body.name);
  fs.readFile('../' + name + '-data.json', 'utf-8', (err, data) => {
    if (err) {
      res.status(500).send('Failed to load data');
      return;
    }
    res.send(data);
  });
});
app.post('/delete-json', (req, res) => {
  const body = req.body;
  if (!body) {
    res.status(400).send('Invalid request body');
    return;
  }
  const name = (body.name == "" ? body.name2 : body.name);

  // Check if file exists
  fs.stat('../' + name + '-data.json', (err, stats) => {
    if (err && err.code === 'ENOENT') {
      res.status(404).send('File not found');
    } else if (err) {
      res.status(500).send('Failed to remove file');
    } else {
      // Remove the file
      fs.unlink('../' + name + '-data.json', (err) => {
        if (err) {
          res.status(500).send('Failed to remove file');
        } else {
          res.send('File removed successfully');
        }
      });
    }
  });
});
app.post('/files', (req, res) => {

  const parentDir = path.join(__dirname, '..'); // 一つ上のフォルダに移動
  console.log(parentDir);
  fs.readdir(parentDir, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
      return;
    }

    const matchingFiles = files.filter(file => file.endsWith('-data.json'));
    const fileTitles = matchingFiles.map(file => path.basename(file, '-data.json'));

    res.json({ data: fileTitles });
  });
});
app.listen(port, () => {
  console.log(`running at port ${port} `);
});

