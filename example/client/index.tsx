import { Api } from "../server/api";
import createConnection from "../../lib/createConnection";

const connection = createConnection<Api>("ws://localhost:3000");

connection.getSquare(5).then(console.log);
