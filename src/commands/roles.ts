import { Client } from "@/client";
import { Command, CommandExecuteArguments, Role } from "@/types";

export class RolesCommand implements Command {
    public data = {
        name: "roles",
        aliases: [],
        expectArg: "info create assign edit list fetch",
        description: "List, create, assign and get info about roles"
    }
    public async execute({ line, client }: CommandExecuteArguments): Promise<void> {
        if (!client.focusedGroup) return console.log(`Please focus on a group by using \`${client.commandPrefix}focus\` or joining a channel`);
        if (!line[1]) return console.log(client.prompt.expectArg(this.data.expectArg));
        switch (line[1]) {
            case "info": {
                if (!line[2]) return console.log("Please supply a valid role ID");
                if (line[2] === "default") {
                    const data = await client.rest.get(`/roles/info/${client.focusedGroup}`);
                    return console.log(data.data);
                }
                if (!client.groups.get(client.focusedGroup)!.roles!.get(line[2])) return console.log("Please supply a valid role ID");
                const data = await client.rest.get<Role>(`/roles/info/${client.focusedGroup}/${line[2]}`);
                if (data.data) {
                    Object.assign(client.groups.get(client.focusedGroup)!.roles!.get(line[2]), data.data);
                }
                break;
            }
            case "create": {
                if (!line[2]) return console.log("Please supply a name for the role.");
                const data = await client.rest.post("/roles/create", {
                    "name": line.slice(2).join(" "),
                    "groupID": client.focusedGroup
                });
                if (data.success) {
                    console.log(data.data);
                    this.fetchRoles(client);
                    return;
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
            case "assign": {
                if (!line[2]) return console.log("Please supply a valid role ID.");
                console.log(client.groups.get(client.focusedGroup)!.roles!.get(line[2]));
                break;
            }
            case "edit": {
                if (!line[2]) return console.log("Please supply a valid role ID or `default`.");
                const roles = client.groups.get(client.focusedGroup)!.roles;
                if (!roles) return console.log("There are either no roles in this group");
                const role = roles.get(line[2]);
                if (!role) return console.log("Please supply a valid role ID.");
                let name = role.name;
                if (!role.permissions) await this.fetchRoles(client);
                if (!role.permissions) return console.log("Failed to fetch permission data for provided role. Please run the command again.");
                let permissions = role.permissions;
                const matches = [line.join(" ").match(/\sname:((?!\s).)+/), line.join(" ").match(/\spermissions:((?!\s)\d)+/)];
                if (matches[0]) name = matches[0][0].substring(6);
                if (matches[1]) permissions = parseInt(matches[1][0].substring(13));
                const data = await client.rest.post("/roles/edit", {
                    "groupID": client.focusedGroup,
                    "roleID": line[2] === "default" ? undefined : line[2],
                    "name": name,
                    "permissions": permissions
                });
                if (data.success) {
                    console.log(data.data);
                    this.fetchRoles(client);
                    return;
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
            case "list": {
                const group = client.groups.get(client.focusedGroup);
                if (group && group!.roles) {
                    const roles = [...group.roles.values()];
                    if (roles.length < 1) return console.log(`There are no roles in this group (${group.name}).`);
                    console.log(roles);
                }
                break;
            }
            case "fetch": {
                const roles = await this.fetchRoles(client);
                if (roles) console.log(roles);
                break;
            }
            default: {
                console.log(client.prompt.expectArg(this.data.expectArg));
                break;
            }
        }
    }
    constructor() {}

    private async fetchRoles(client: Client) {
        const data = await client.rest.get<{ roles: Role[] }>(`/roles/group/${client.focusedGroup}`);
        if (data.data) {
            if (!client.groups.get(client.focusedGroup)!.roles) client.groups.get(client.focusedGroup)!.roles = new Map();
            data.data!.roles.forEach(async role => {
                client.groups.get(client.focusedGroup)!.roles!.set(role.id, role);
                const data = await client.rest.get<Role>(`/roles/info/${client.focusedGroup}/${role.id}`);
                if (data.data) {
                    Object.assign(client.groups.get(client.focusedGroup)!.roles!.get(role.id), data.data);
                }
            });
            return data.data.roles;
        }
        return false;
    }
}