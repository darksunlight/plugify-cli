import { config } from "dotenv";
import { Client } from "@/client";

config();
const client = new Client();

const token = process.argv[2] ?? process.env.TOKEN;

if (token) {
    client.login(token);
} else if (process.env.APP_LOGIN === "true") { // WIP
    client.login(token);
} else {
    console.log("Please supply your token first.");
    process.exit(1);
}
