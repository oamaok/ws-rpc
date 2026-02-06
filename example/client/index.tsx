import { Api } from "../server/api";
import createConnection from "../../lib/createConnection";

const connection = createConnection<Api>("ws://localhost:3000");

connection.getSquare(123).then(console.log)


connection.waitAndReverse('string').then(console.log)

connection.getValueFromDeepObject({
  foo: {
    bar: {
      value: 'test'
    }
  }
}).then(console.log)