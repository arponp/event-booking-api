import bodyParser from "body-parser";
import express from "express";

const app = express();

app.use(bodyParser.json());

app.listen(3000, () => console.log("Server Live"));
