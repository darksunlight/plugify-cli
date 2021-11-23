import { Command, CommandExecuteArguments } from "@/types";

export class DeleteCommand implements Command {
    public data = {
        name: "delete",
        aliases: [],
        description: "Delete a message"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (client.allRooms && !line[2]) return console.log("Please supply a channel ID.");
        else if (!client.joinedChannel) return console.log("Please join a channel first.");
        if (!line[1]) return console.log("Please supply a message ID.");
        const data = await client.rest.delete(`/channels/${client.allRooms ? line[2] : client.joinedChannel}/messages/${line[1]}`);
        if (data.success) {
            console.log(data.data);
        } else {
            console.log(`Error: ${data.error}`);
        }
    }
    constructor() {}
}