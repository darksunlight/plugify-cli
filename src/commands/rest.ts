import { Command, CommandExecuteArguments } from "@/types";

export class RestCommand implements Command {
    public data = {
        name: "rest",
        aliases: []
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!line[1]) return console.log("Please supply a HTTP method");
        if (!["get", "post"].includes(line[1].toLowerCase())) return console.log("Please supply a supported HTTP method. Currently supported methods: GET, POST.");
        if (!line[2]) return console.log("Please supply a valid path");
        switch (line[1].toLowerCase()) {
            case "get": {
                const data = await client.rest.get(line[2]);
                console.log(data);
                break;
            }
            case "post": {
                const data = await client.rest.post(line[2], line[3] ? JSON.parse(line.slice(3).join(" ")) : null);
                console.log(data);
                break;
            }
        }
    }
    constructor() {}
}