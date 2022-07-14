import { Command, CommandExecuteArguments } from "@/types";

export class EditCommand implements Command {
    public data = {
        name: "edit",
        aliases: [],
        description: "Edit a message",
        usage: "Example: .edit 7e3eddbc-eb47-44b4-a9f3-08a10b262280"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!client.joinedChannel) return console.log("Please join a channel first.");
        if (!line[1]) return console.log("Please supply a message ID.");
        if (!line[2]) return console.log("Please specify new message content");
        const data = await client.rest.patch(`/channels/${client.joinedChannel}/messages/${line[1]}`, {
            "content": line.slice(2).join(" ")
        });
        if (data.success) {
            console.log(data.data);
        } else {
            console.log(`Error: ${data.error}`);
        }
    }
    constructor() {}
}