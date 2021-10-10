import { Command, CommandExecuteArguments } from "@/types";

export class GroupCommand implements Command {
    public data = {
        name: "group",
        aliases: [],
        expectArg: "info create",
        description: "Create and get info about groups"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!line[1]) return console.log(client.prompt.expectArg(this.data.expectArg));
        switch (line[1]) {
            case "info": {
                let group;
                if (line[2]) group = line[2];
                else if (client.focusedGroup) group = client.focusedGroup;
                else return console.log("Please focus on a group first or supply a valid group ID");
                const data = await client.rest.get(`/groups/info/${group}`);
                if (data.success) {
                    return console.log(data.data);
                }
                console.log(`Error: ${data.error}`);
                if (data.data) console.log(data.data);
                break;
            }
            case "create": {
                if (!line[2]) return console.log("Please specify a name.");
                const data = await client.rest.post("/groups/create", {
                    "name": line.slice(2).join(" ")
                });
                if (data.success) return console.log(data.data);
                console.log(`Error: ${data.error}`);
                if (data.data) console.log(data.data);
                break;
            }
            default: {
                console.log(client.prompt.expectArg(this.data.expectArg));
                break;
            }
        }
    }
    constructor() {}
}