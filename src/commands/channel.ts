import { Command, CommandExecuteArguments, GatewayEvent } from "@/types";

export class ChannelCommand implements Command {
    public data = {
        name: "channel",
        aliases: [],
        expectArg: "info create",
        description: "Create and get info about channels"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!line[1]) return console.log(client.prompt.expectArg(this.data.expectArg));
        switch (line[1]) {
            case "info": {
                let channel;
                if (line[2]) channel = line[2];
                else if (client.joinedChannel) channel = client.joinedChannel;
                else return console.log("Please join a channel first or supply a valid channel ID");
                if (!client.channels.get(channel)) return console.log(`The specified channel cannot be found. Try running \`${client.commandPrefix}groups fetch\`.`);
                const data = await client.rest.get(`/channels/info/${client.channels.get(channel)!.groupId}/${channel}`);
                if (data.success) {
                    return console.log(data.data);
                }
                console.log(`Error: ${data.error}`);
                if (data.data) console.log(data.data);
                break;
            }
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
                switch (data.error) {
                    case 14: {
                        console.log("Not enough permissions!");
                        break;
                    }
                    default: {
                        console.log(`Error: ${data.error}`);
                        if (data.data) console.log(data.data);
                    }
                }
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