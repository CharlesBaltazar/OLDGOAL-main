const express = require("express");
const app = express();
const port = 3022;
const db = require("./db_config");
const cors = require("cors");

app.use(express.json());
app.use(cors());

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));