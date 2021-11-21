import { config } from "dotenv";
import { Client } from "@/client";

config();
const client = new Client();

const token = process.argv[2] ?? process.env.TOKEN;

if (!token) {
    console.log("Please supply your token first.");
    process.exit(1);
}
console.log("Loading...");
client.login(token);
