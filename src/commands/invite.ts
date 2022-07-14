import { Command, CommandExecuteArguments } from "@/types";

export class InviteCommand implements Command {
    public data = {
        name: "invite",
        aliases: [],
        expectArg: "info create use accept delete edit",
        description: "Use, create and get info about invites",
        usage: "help\n====\nDisplays help for this command.\n\ninfo [invite id]\n====\nGets info about a particular invite.\n\ncreate [group id] [uses (integer)] [expires (unix timestamp)]\n====\nCreates an invite for the specified group. Enter any non-positive number for unlimited uses. Enter 0 for no expiry.\n\nuse [invite id]\n====\nUses the given invite code."
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        switch (line[1]) {
            case "info": {
                if (!line[2]) return console.log("Please specify an invite ID.");
                const apiData = await client.rest.get(`/invites/${line[2]}`);
                if (apiData.success) return console.log(apiData.data);
                switch (apiData.error) {
                    case 9:
                        console.log("Group doesn't exist");
                        break;
                    case 13:
                        console.log("Invite doesn't exist");
                        break;
                    default:
                        console.log(`Error: ${apiData.error}\nData: ${apiData.data}`);
                }
                break;
            }
            case "create": {
                if (!line[2]) return console.log("Please specify a group ID.");
                const body = {
                    "uses": parseInt(line[3]) < 1 ? null : parseInt(line[3]),
                    "expires": line[4] === "0" ? null : new Date(parseInt(line[4])*1000)
                };
                const apiData = await client.rest.post(`/invites/${line[2]}`, body);
                console.log(`Creating invite with following data: ${JSON.stringify(body)}`);
                if (apiData.success) return console.log(apiData.data);
                switch (apiData.error) {
                    case 9:
                        console.log("Group doesn't exist or you aren't in it");
                        break;
                    default:
                        console.log(`Error: ${apiData.error}\nDetails: ${apiData.data}`);
                }
                break;
            }
            case "use":
            case "accept": {
                if (!line[2]) return console.log("Please specify an invite ID.");
                const apiData = await client.rest.post(`/invites/use/${line[2]}`);
                if (apiData.success) return console.log(apiData.data);
                switch (apiData.error) {
                    case 9:
                        console.log("Group doesn't exist");
                        break;
                    case 13:
                        console.log("Invite doesn't exist");
                        break;
                    default:
                        console.log(`Error: ${apiData.error}`);
                }
                break;
            }
            case "delete": {
                if (!line[2]) return console.log("Please specify an invite ID.");
                const apiData = await client.rest.delete(`/invites/${line[2]}`);
                if (apiData.success) return console.log(apiData.data);
                switch (apiData.error) {
                    case 9:
                        console.log("Group doesn't exist");
                        break;
                    case 13:
                        console.log("Invite doesn't exist");
                        break;
                    default:
                        console.log(`Error: ${apiData.error}`);
                }
                break;
            }
            case "edit": {
                if (!line[2]) return console.log("Please specify an invite code.");
                if (!line[3]) return console.log("Please specify what to edit.");
                const args = Object.fromEntries(line.slice(3).join(" ").split(";").map(x => x.split(":")).filter(x => ["uses", "expires"].includes(x[0])));
                const body = {
                    "uses": "uses" in args ? parseInt(args["uses"]) : undefined,
                    "expires": "expires" in args ? (args["uses"] === "null" ? null : new Date(parseInt(args["expires"]) * 1000)) : undefined
                };
                const data = await client.rest.patch(`/invites/${line[2]}`, body);
                console.log(JSON.stringify(body));
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
            default: {
                console.log(client.prompt.expectArg(this.data.expectArg));
                break;
            }
        }
    }
    constructor() {}
}