import { Command, CommandExecuteArguments } from "@/types";

export class RestCommand implements Command {
    public data = {
        name: "rest",
        aliases: [],
        description: "For developers: make requests through the raw REST API"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!line[1]) return console.log("Please supply a HTTP method");
        if (!["get", "post", "patch", "delete"].includes(line[1].toLowerCase())) return console.log("Please supply a supported HTTP method. Currently supported methods: GET, POST.");
        if (!line[2]) return console.log("Please supply a valid path");
        switch (line[1].toLowerCase()) {
            case "get": {
                const data = await client.rest.get(line[2]);
                console.log(data);
                console.log(data.data);
                break;
            }
            case "post": {
                const data = await client.rest.post(line[2], line[3] ? JSON.parse(line.slice(3).join(" ")) : null);
                console.log(data);
                console.log(data.data);
                break;
            }
            case "patch": {
                const data = await client.rest.patch(line[2], line[3] ? JSON.parse(line.slice(3).join(" ")) : null);
                console.log(data);
                console.log(data.data);
                break;
            }
            case "delete": {
                const data = await client.rest.delete(line[2]);
                console.log(data);
                console.log(data.data);
                break;
            }
        }
    }
    constructor() {}
}