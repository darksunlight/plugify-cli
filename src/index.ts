import { config } from "dotenv";
import { Client } from "@/client";

config();
// console.log(process.env.API_DOMAIN);
const client = new Client();
// console.log([...client.commandHandler.commands.entries()]);

if (!process.env.TOKEN) {
    console.log("Please supply your token first.");
    process.exit(1);
}
console.log("Loading...");
client.login(process.env.TOKEN);