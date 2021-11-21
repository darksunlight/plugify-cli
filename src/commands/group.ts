import { Command, CommandExecuteArguments } from "@/types";

export class GroupCommand implements Command {
    public data = {
        name: "group",
        aliases: [],
        expectArg: "info create invites members memberinfo memberedit bans ban unban editban edit delete leave kick",
        description: "Create and get info about groups"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!line[1]) return console.log(client.prompt.expectArg(this.data.expectArg));
        switch (line[1]) {
            case "info": {
                let group;
                if (line[2]) group = line[2];
                else if (client.focusedGroup) group = client.focusedGroup;
                else return console.log("Please focus on a group first or supply a valid group ID.");
                const data = await client.rest.get(`/groups/${group}`);
                if (data.success) {
                    return console.log(data.data);
                }
                console.log(`Error: ${data.error}`);
                if (data.data) console.log(data.data);
                break;
            }
            case "create": {
                if (!line[2]) return console.log("Please specify a name.");
                const data = await client.rest.post("/groups/", {
                    "name": line.slice(2).join(" ")
                });
                if (data.success) return console.log(data.data);
                console.log(`Error: ${data.error}`);
                if (data.data) console.log(data.data);
                break;
            }
            case "invites": {
                let group;
                if (line[2]) group = line[2];
                else if (client.focusedGroup) group = client.focusedGroup;
                else return console.log("Please focus on a group first or supply a valid group ID.");
                const data = await client.rest.get(`/groups/${group}/invites`);
                if (data.success) {
                    return console.log(data.data);
                }
                console.log(`Error: ${data.error}`);
                if (data.data) console.log(data.data);
                break;
            }
            case "members": {
                let group;
                if (line[2]) group = line[2];
                else if (client.focusedGroup) group = client.focusedGroup;
                else return console.log("Please focus on a group first or supply a valid group ID.");
                const data = await client.rest.get(`/groups/${group}/members`);
                if (data.success) {
                    return console.log(data.data);
                }
                console.log(`Error: ${data.error}`);
                if (data.data) console.log(data.data);
                break;
            }
            case "memberinfo": {
                if (!client.focusedGroup && !line[3]) return console.log("Please focus on a group first or supply a valid group ID.");
                if (!line[2]) return console.log("Please specify a user.");
                const data = await client.rest.get(`/members/${line[3] ?? client.focusedGroup}/${line[2]}`);
                if (data.success) {
                    return console.log(data.data);
                }
                console.log(`Error: ${data.error}`);
                if (data.data) console.log(data.data);
                break;
            }
            case "memberedit": {
                if (!client.focusedGroup) return console.log("Please focus on a group first.");
                if (!line[3]) return console.log("Please specify what to edit.");
                const args = Object.fromEntries(line.slice(3).join(" ").split(";").map(x => x.split(":")).filter(x => ["nickname", "roles"].includes(x[0])));
                const data = await client.rest.patch(`/members/${client.focusedGroup}/${line[2]}`, {
                    "nickname": "nickname" in args ? (args["nickname"] ? args["nickname"] : null) : undefined,
                    "roles": "roles" in args ? args["roles"].split(",") : undefined
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
            case "bans": {
                let group;
                if (line[2]) group = line[2];
                else if (client.focusedGroup) group = client.focusedGroup;
                else return console.log("Please focus on a group first or supply a valid group ID.");
                const data = await client.rest.get(`/groups/${group}/bans`);
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
            case "leave":
            case "kick": {
                if (!client.focusedGroup) return console.log("Please focus on a group first.");
                if (!line[2] && line[1] !== "leave") return console.log("Please specify a user.");
                const username = line[2] ? line[2] : client.user.username;
                const data = await client.rest.delete(`/members/${client.focusedGroup}/${username}`);
                if (data.success) {
                    return console.log("Success");
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
            case "ban": {
                if (!client.focusedGroup) return console.log("Please focus on a group first.");
                if (!line[2]) return console.log("Please specify a user.");
                const data = await client.rest.post(`/groups/${client.focusedGroup}/bans/${line[2]}`, {
                    expires: line[3] ? new Date(parseInt(line[3])*1000) : null
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
            case "unban": {
                if (!client.focusedGroup && !line[3]) return console.log("Please focus on a group first or supply a valid group ID.");
                if (!line[2]) return console.log("Please specify a user.");
                const data = await client.rest.delete(`/groups/${line[3] ?? client.focusedGroup}/bans/${line[2]}`);
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
            case "editban": {
                if (!client.focusedGroup) return console.log("Please focus on a group first.");
                if (!line[2]) return console.log("Please specify a user.");
                const data = await client.rest.patch(`/groups/${client.focusedGroup}/bans/${line[2]}`, {
                    expires: line[3] ? new Date(parseInt(line[3])*1000) : null
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
            case "roles": {
                let group;
                if (line[2]) group = line[2];
                else if (client.focusedGroup) group = client.focusedGroup;
                else return console.log("Please focus on a group first or supply a valid group ID.");
                const data = await client.rest.get(`/groups/${group}/roles`);
                if (data.success) {
                    return console.log(data.data);
                }
                console.log(`Error: ${data.error}`);
                break;
            }
            case "edit": {
                if (!client.focusedGroup) return console.log(`Please focus on a group by using \`${client.commandPrefix}focus\` or joining a channel`);
                if (!line[2]) return console.log("Please specify what to edit.");
                const args = Object.fromEntries(line.slice(2).join(" ").split(";").map(x => x.split(":")).filter(x => ["name", "owner", "password"].includes(x[0])));
                if ("name" in args && args["name"] === "") return console.log("Channel name cannot be empty");
                const data = await client.rest.patch(`/groups/${client.focusedGroup}`, {
                    "name": "name" in args ? args["name"] : undefined,
                    "owner": "owner" in args ? args["owner"] : undefined,
                    "password": "password" in args ? args["password"] : undefined
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
                if (!client.focusedGroup) return console.log(`Please focus on a group by using \`${client.commandPrefix}focus\` or joining a channel`);

                const data = await client.rest.delete(`/groups/${client.focusedGroup}`);
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