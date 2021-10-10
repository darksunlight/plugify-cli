import { Command, CommandExecuteArguments } from "@/types";

export class InviteCommand implements Command {
    public data = {
        name: "invite",
        aliases: [],
        expectArg: "help info create use accept",
        description: "Use, create and get info about invites"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        switch (line[1]) {
            case "help": {
                console.log("Subcommands: help, info, create, use\n\nhelp\n====\nDisplays help for this command.\n\ninfo [invite id]\n====\nGets info about a particular invite.\n\ncreate [group id] [uses (integer)] [expires (unix timestamp)]\n====\nCreates an invite for the specified group. Enter any non-positive number for unlimited uses. Enter 0 for no expiry.\n\nuse [invite id]\n====\nUses the given invite code.");
                break;
            }
            case "info": {
                if (!line[2]) return console.log("Please specify an invite ID.");
                const apiData = await client.rest.get(`/invites/info/${line[2]}`);
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
                    "id": line[2],
                    "uses": parseInt(line[3]) < 1 ? null : parseInt(line[3]),
                    "expires": line[4] === "0" ? null : new Date(parseInt(line[4])*1000)
                };
                const apiData = await client.rest.post("/invites/create", body);
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
                const apiData = await client.rest.post("/invites/use", { "id": line[2] });
                if (apiData.success) return console.log(apiData.data);
                switch (apiData.error) {
                    case 9:
                        console.log("Group doesn't exist");
                        break;
                    case 13:
                        console.log("Invite doesn't exist");
                        break;
                    default:
                        console.log(`Error: ${apiData.error}\nDetails: ${apiData.data}`);
                }
                break;
            }
            default: {
                console.log(client.prompt.expectArg("help info create use accept"));
                break;
            }
        }
    }
    constructor() {}
}