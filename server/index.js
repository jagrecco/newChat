import express from "express";
import logger from "morgan";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { log } from "node:console";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config();

const db = createClient({
  url: "libsql://pro-bette-jagrecco.turso.io",
  authToken: process.env.DB_TOKEN,
});

await db.execute(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT
)`);

const port = process.env.PORT ?? 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

io.on("connection", (socket) => {
  console.log("user connected!");
  socket.on("disconnect", () => {
    console.log("a user has disconected!");
  });
  socket.on("chat message", async (msg) => {
    let result;
    try {
      result = await db.execute({
        sql: "INSERT INTO messages (content) VALUES (:msg)",
        args: { msg },
      });
    } catch (e) {
      console.error(`Error al guardar datos ${e}`);
      return;
    }
    io.emit("chat message", msg, result.lastInsertRowid.toString());
  });
});

app.use(logger(`dev`));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(port, () => {
  console.log(`Server en port ${port}`);
});
