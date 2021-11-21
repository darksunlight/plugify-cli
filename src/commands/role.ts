import { Command, CommandExecuteArguments } from "@/types";

export class RoleCommand implements Command {
    public data = {
        name: "role",
        aliases: [],
        expectArg: "list info create edit delete neworder",
        description: "Perform actions related to roles"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!line[1]) return console.log(client.prompt.expectArg(this.data.expectArg));
        switch (line[1]) {
            case "info": {
                if (!client.focusedGroup) return console.log("Please focus on a group first or supply a valid group ID.");
                if (!line[2]) return console.log("Please supply a valid role ID.");
                const data = await client.rest.get(`/roles/${client.focusedGroup}/${line[2]}`);
                if (data.success) {
                    return console.log(data.data);
                }
                console.log(`Error: ${data.error}`);
                if (data.data) console.log(data.data);
                break;
            }
            case "list": {
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
            case "create": {
                if (!client.focusedGroup) return console.log("Please focus on a group first or supply a valid group ID.");
                if (!line[2]) return console.log("Please specify what to edit.");
                const args = Object.fromEntries(line.slice(2).join(" ").split(";").map(x => x.split(":")).filter(x => ["name", "hoist", "order", "permissions"].includes(x[0])));
                if ("name" in args && args["name"] === "") return console.log("Role name cannot be empty");
                const data = await client.rest.post(`/roles/${client.focusedGroup}`, {
                    "name": "name" in args ? args["name"] : undefined,
                    "hoist": "hoist" in args ? args["hoist"] === "true" : undefined,
                    "order": "order" in args ? parseInt(args["order"]) : undefined,
                    "permissions": "permissions" in args ? parseInt(args["permissions"]) : undefined
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
                if (!client.focusedGroup) return console.log("Please focus on a group first or supply a valid group ID.");
                if (!line[2]) return console.log("Please specify the ID of the role you want to edit.");
                if (!line[3]) return console.log("Please specify what to edit.");
                const args = Object.fromEntries(line.slice(3).join(" ").split(";").map(x => x.split(":")).filter(x => ["name", "hoist", "order", "permissions"].includes(x[0])));
                if ("name" in args && args["name"] === "") return console.log("Role name cannot be empty");
                const data = await client.rest.patch(`/roles/${client.focusedGroup}/${line[2]}`, {
                    "name": "name" in args ? args["name"] : undefined,
                    "hoist": "hoist" in args ? args["hoist"] === "true" : undefined,
                    "order": "order" in args ? parseInt(args["order"]) : undefined,
                    "permissions": "permissions" in args ? parseInt(args["permissions"]) : undefined
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
                if (!line[2]) return console.log("Please specify the ID of the role you want to delete.");

                const data = await client.rest.delete(`/roles/${client.focusedGroup}/${line[2]}`);
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
            case "neworder": {
                if (!client.focusedGroup) return console.log(`Please focus on a group by using \`${client.commandPrefix}focus\` or joining a channel`);
                if (!line[2]) return console.log("Please specify the new order.");
                const orders = line[2].split(";").map(x => ({
                    roleID: x.split(":")[0],
                    order: parseInt(x.split(":")[1])
                }));
                console.log(orders);
                const data = await client.rest.patch(`/groups/${client.focusedGroup}/roles`, {
                    roles: orders
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
            default: {
                console.log(client.prompt.expectArg(this.data.expectArg));
                break;
            }
        }
    }
    constructor() {}
}