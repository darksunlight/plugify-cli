import { config as configEnv } from "dotenv";
import { Client } from "@/client";
import { configure as configLog, getLogger } from "log4js";

configEnv();
export const devMode = process.env.DEV_MODE?.toUpperCase() === "TRUE";
const logger = getLogger("main");
configLog({
	appenders: {
		console: { type: "stdout" },
		file: { type: "file", filename: "log.txt" }
	},
	categories: {
		default: {
			appenders: devMode ? ["console"] : ["file"],
			level: devMode ? "debug" : "info"
		}
	}
});

const client = new Client();

const token = process.argv[2] ?? process.env.TOKEN;

if (token) {
    client.login(token);
} else if (process.env.APP_LOGIN === "true") { // WIP
    logger.debug("App login");
    client.login(token);
} else {
    console.log("Please supply your token first.");
    process.exit(1);
}
