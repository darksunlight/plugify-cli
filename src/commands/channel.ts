import { Command, CommandExecuteArguments, GatewayEvent } from "@/types";

export class ChannelCommand implements Command {
    public data = {
        name: "channel",
        aliases: [],
        expectArg: "info create edit delete overrides",
        description: "Create and get info about channels"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!line[1]) return console.log(client.prompt.expectArg(this.data.expectArg));
        switch (line[1]) {
            case "info": {
                let channel: string;
                if (line[2]) channel = line[2];
                else if (client.joinedChannel) channel = client.joinedChannel;
                else return console.log("Please join a channel first or supply a valid channel ID");
                if (!client.channels.get(channel) && ![...client.channels.values()].filter(x => x.name === channel).length) return console.log(`The specified channel cannot be found. Try running \`${client.commandPrefix}groups fetch\`.`);
                if (client.channels.get(channel)) {
                    const data = await client.rest.get(`/channels/${client.channels.get(channel)!.groupID}/${channel}`);
                    if (data.success) {
                        return console.log(data.data);
                    }
                    console.log(`Error: ${data.error}`);
                    if (data.data) console.log(data.data);
                } else {
                    const mappedChannel = [...client.channels.values()].filter(x => x.name === channel)[0];
                    const data = await client.rest.get(`/channels/${mappedChannel.groupID}/${mappedChannel.id}`);
                    if (data.success) {
                        return console.log(data.data);
                    }
                    console.log(`Error: ${data.error}`);
                    if (data.data) console.log(data.data);
                }
                break;
            }
            case "create": {
                if (!client.focusedGroup) return console.log(`Please focus on a group by using \`${client.commandPrefix}focus\` or joining a channel`);
                if (!line[2]) return console.log("Please specify a channel name.");
                const data = await client.rest.post(`/channels/${client.focusedGroup}`, {
                    "name": line[2],
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
            case "edit": {
                if (!client.focusedGroup) return console.log(`Please focus on a group by using \`${client.commandPrefix}focus\` or joining a channel`);
                if (!line[3]) return console.log("Please specify what to edit.");
                let channel: string;
                if (line[2]) channel = line[2];
                else if (client.joinedChannel) channel = client.joinedChannel;
                else return console.log("Please join a channel first or supply a valid channel ID");
                if (!client.channels.get(channel)) return console.log(`The specified channel cannot be found. Try running \`${client.commandPrefix}groups fetch\`.`);

                const args = Object.fromEntries(line.slice(3).join(" ").split(";").map(x => x.split(":")).filter(x => ["name", "description"].includes(x[0])));
                if ("name" in args && args["name"] === "") return console.log("Channel name cannot be empty");
                const data = await client.rest.patch(`/channels/${client.focusedGroup}/${channel}`, {
                    "name": "name" in args ? args["name"] : undefined,
                    "description": "description" in args ? args["description"] : undefined
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
            case "delete": {
                if (!client.focusedGroup) return console.log(`Please focus on a group by using \`${client.commandPrefix}focus\` or joining a channel`);
                let channel: string;
                if (line[2]) channel = line[2];
                else if (client.joinedChannel) channel = client.joinedChannel;
                else return console.log("Please join a channel first or supply a valid channel ID");
                if (!client.channels.get(channel)) return console.log(`The specified channel cannot be found. Try running \`${client.commandPrefix}groups fetch\`.`);

                const data = await client.rest.delete(`/channels/${client.focusedGroup}/${channel}`);
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
            case "overrides": {
                if (!client.joinedChannel) console.log("Please join a channel first.");
                if (!client.channels.get(client.joinedChannel)) console.error("Error: Channel not in cache. Restart plugify-cli.");
                switch (line[2]) {
                    case "list": {
                        const data = await client.rest.get(`/channels/${client.channels.get(client.joinedChannel)!.groupID}/${client.joinedChannel}/roles`);
                        if (data.success) {
                            return console.log(data.data);
                        }
                        console.log(`Error: ${data.error}`);
                        if (data.data) console.log(data.data);
                        break;
                    }
                    case "create": {
                        if (!line[3]) return console.log("Please specify the role, and optionally the permissions you would like to allow and/or deny.");
                        const args = Object.fromEntries(line.slice(3).join(" ").split(";").map(x => x.split(":")).filter(x => ["role", "allow", "deny"].includes(x[0])));
                        if (!args.role) return console.log("Please specify the role");
                        const data = await client.rest.post(`/channels/${client.channels.get(client.joinedChannel)!.groupID}/${client.joinedChannel}/roles/${args["role"]}`, {
                            "allow": "allow" in args ? parseInt(args["allow"]) : undefined,
                            "deny": "deny" in args ? parseInt(args["deny"]) : undefined
                        });
                        if (data.success) {
                            return console.log(data.data);
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
                    case "edit": {
                        if (!line[3]) return console.log("Please specify the role, and optionally the permissions you would like to allow and/or deny.");
                        const args = Object.fromEntries(line.slice(3).join(" ").split(";").map(x => x.split(":")).filter(x => ["role", "allow", "deny"].includes(x[0])));
                        if (!args.role) return console.log("Please specify the role");
                        const data = await client.rest.patch(`/channels/${client.channels.get(client.joinedChannel)!.groupID}/${client.joinedChannel}/roles/${args["role"]}`, {
                            "allow": "allow" in args ? parseInt(args["allow"]) : undefined,
                            "deny": "deny" in args ? parseInt(args["deny"]) : undefined
                        });
                        if (data.success) {
                            return console.log(data.data);
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
                    case "delete": {
                        if (!line[3]) return console.log("Please specify a role ID for which the channel override you want to delete.");
                        const data = await client.rest.delete(`/channels/${client.channels.get(client.joinedChannel)!.groupID}/${client.joinedChannel}/roles/${line[3]}`);
                        if (data.success) {
                            return console.log("Success");
                        }
                        console.log(`Error: ${data.error}`);
                        if (data.data) console.log(data.data);
                        break;
                    }
                    default: {
                        return console.log(`Unknown subcommand for ${client.commandPrefix}channel overrides`);
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