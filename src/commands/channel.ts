import { Command, CommandExecuteArguments, GatewayEvent } from "@/types";

export class ChannelCommand implements Command {
    public data = {
        name: "channel",
        aliases: [],
        expectArg: "create"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!line[1]) return console.log(client.prompt.expectArg("create"));
        switch (line[1]) {
            case "create": {
                if (!client.focusedGroup) return console.log(`Please focus on a group by using \`${client.commandPrefix}focus\` or joining a channel`);
                if (!line[2]) return console.log("Please specify a channel name.");
                const data = await client.rest.post("/channels/create", {
                    "name": line[2],
                    "groupID": client.focusedGroup,
                    "type": "text"
                });
                if (data.success) {
                    console.log(data.data);
                    return client.gateway.send(GatewayEvent.ROOMS_GET_REQUEST, { groupID: client.focusedGroup });
                }
                console.log(`Error: ${data.error}`);
                if (data.data) console.log(data.data);
                break;
            }
            default: {
                console.log(client.prompt.expectArg("create"));
                break;
            }
        }
    }
    constructor() {}
}