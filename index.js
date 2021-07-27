const Websocket = require("ws");
const fetch = require('node-fetch').default;
const fs = require("fs");
const readline = require("readline");

let loggedIn = false;
let isDead = false;
let bypassSafetyFilter = false;
let user = {
    displayName: "none"
};
let channel = {
    name: "none",
    id: undefined
};
let group = {
    name: "none",
    id: undefined
};
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "???", 
    completer: completer
});

fixStdoutFor(rl);

function completer(line) {
    const completions = ".exit .quit .q .join .groups .group .invite .channel .userinfo .ui".split(" ");
    const hits = completions.filter((c) => c.startsWith(line));
    // Show all completions if none found
    return [hits.length ? hits : completions, line];
}

function fixStdoutFor(cli) {
    var oldStdout = process.stdout;
    var newStdout = Object.create(oldStdout);
    newStdout.write = function() {
        cli.output.write('\x1b[2K\r');
        var result = oldStdout.write.apply(
            this,
            Array.prototype.slice.call(arguments)
        );
        cli._refreshLine();
        return result;
    }
    process.__defineGetter__('stdout', function() { return newStdout; });
}

function expectArg(args) {
    return `The first argument to this command must be one of the following: ${args.split(' ').join(', ')}`;
}

if (process.argv[2] == "auth") {
    fs.writeFileSync("token", process.argv[3], { encoding: "utf-8" });
    
    console.log("done");
    return process.exit(0);
}

const token = fs.readFileSync("token", { encoding: "utf-8" });

const ws = new Websocket(process.argv[2]);

ws.onopen = () => {
    console.log("WS | Opened.");
    setInterval(() => { 
        if (isDead) {
            console.log("We lost connection with Plugify server. Quitting.");
            process.exit(1);
        }
        ws.send(JSON.stringify({ event: 9001 })); 
        isDead = true; 
    }, 10000);
}

ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    switch (data.event) {
        case 0:
            ws.send(JSON.stringify({ event: 1, data: { token: token } }))
            break

        case 2:
            loggedIn = true;
            user = data.data;
            console.log("\n\n\n\n\nWS | Logged in.");
            rl.setPrompt(`${user.displayName}, #${channel.name}> `);
            rl.prompt();

            rl.on("line", async (input) => {
                const line = input.split(" ");
                switch (line[0]) {
                    case ".exit":
                    case ".quit":
                    case ".q":
                        process.exit(0);
                        break;

                    case ".join":
                        if (!line[1]) return console.log('Please specify a channel ID.');
                        ws.send(JSON.stringify({ event: 4, data: { id: line[1] } }));
                        break;

                    case ".channel":
                        switch (line[1]) {
                            case 'join':
                                if (!line[2]) return console.log('Please specify a channel ID.');
                                ws.send(JSON.stringify({ event: 4, data: { id: line[1] } }));
                                break;
                            case 'create':
                                if (!line[2]) return console.log('Please specify a channel name.');
                                if (!line[3]) return console.log('Please specify a guild ID.');
                                fetch('https://api.plugify.cf/v2/channels/create', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': token
                                    },
                                    body: JSON.stringify({
                                        'name': line[2],
                                        'groupID': line[3],
                                        'type': 'text'
                                    })
                                }).then(function(response) {
                                    return response.json();
                                }).then(function(data) {
                                    if (data.success) return console.log(data.data);
                                    console.log(`Error: ${data.error}`);
                                });
                                break;
                            default:
                                console.log(expectArg('join create'));
                        }
                        break;

                    case ".groups":
                        ws.send(JSON.stringify({ event: 11 }));
                        break;

                    case ".group":
                        switch (line[1]) {
                            case 'info':
                                if (!line[2]) return console.log('Please specify a group ID.');
                                fetch('https://api.plugify.cf/v2/groups/info', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': token
                                    },
                                    body: JSON.stringify({
                                        'id': line[2]
                                    })
                                }).then(function(response) {
                                    return response.json();
                                }).then(function(data) {
                                    if (data.success) return console.log(data.data);
                                    console.log(`Error: ${data.error}`);
                                });
                                break;
                            case 'create':
                                if (!line[2]) return console.log('Please specify a name.');
                                fetch('https://api.plugify.cf/v2/groups/create', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': token
                                    },
                                    body: JSON.stringify({
                                        'name': line.slice(2).join(' ')
                                    })
                                }).then(function(response) {
                                    return response.json();
                                }).then(function(data) {
                                    if (data.success) return console.log(data.data);
                                    console.log(`Error: ${data.error}`);
                                });
                                break;
                            default:
                                console.log(expectArg('info create'));
                        }
                        break;
                    
                    case '.invite':
                        switch (line[1]) {
                            case 'help':
                                console.log('Subcommands: help, info, create, use\n\nhelp\n====\nDisplays help for this command.\n\ninfo [invite id]\n====\nGets info about a particular invite.\n\ncreate [guild id] [uses (integer)] [expires (unix timestamp)]\n====\nCreates an invite for the specified guild. Enter any non-positive number for unlimited uses. Enter 0 for no expiry.\n\nuse [invite id]\n====\nUses the given invite code.');
                                break;
                            case 'info':
                                if (!line[2]) return console.log('Please specify an invite ID.');
                                fetch('https://api.plugify.cf/v2/invites/info', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        'id': line[2]
                                    })
                                }).then(function(response) {
                                    return response.json();
                                }).then(function(data) {
                                    if (data.success) return console.log(data.data);
                                    switch (data.error) {
                                        case 9:
                                            console.log('Guild doesn\'t exist');
                                            break;
                                        case 13:
                                            console.log('Invite doesn\'t exist');
                                            break;
                                        default:
                                            console.log(`Error: ${data.error}`);
                                    }
                                });
                                break;
                            case 'create':
                                if (!line[2]) return console.log('Please specify a guild ID.');
                                fetch('https://api.plugify.cf/v2/invites/create', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': token
                                    },
                                    body: JSON.stringify({
                                        'id': line[2],
                                        'uses': parseInt(line[3]) < 1 ? null : parseInt(line[3]),
                                        'expires': line[4] === '0' ? null : new Date(parseInt(line[4])*1000)
                                    })
                                }).then(function(response) {
                                    return response.json();
                                }).then(function(data) {
                                    if (data.success) return console.log(data.data);
                                    switch (data.error) {
                                        case 9:
                                            console.log('Guild doesn\'t exist or you aren\'t in it');
                                            break;
                                        default:
                                            console.log(`Error: ${data.error}`);
                                    }
                                });
                                break;
                            case 'use':
                            case 'accept':
                                if (!line[2]) return console.log('Please specify an invite ID.');
                                fetch('https://api.plugify.cf/v2/invites/use', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': token
                                    },
                                    body: JSON.stringify({
                                        'id': line[2]
                                    })
                                }).then(function(response) {
                                    return response.json();
                                }).then(function(data) {
                                    if (data.success) return console.log(data.data);
                                    switch (data.error) {
                                        case 9:
                                            console.log('Guild doesn\'t exist');
                                            break;
                                        case 13:
                                            console.log('Invite doesn\'t exist');
                                            break;
                                        default:
                                            console.log(`Error: ${data.error}`);
                                    }
                                });
                                break;
                            default:
                                console.log(expectArg('help info create use accept'));
                        }
                        break;
                    
                    case ".ui":
                    case ".userinfo":
                        let username = line[1];
                        if (!username) username = user.displayName;
                        const data = await (await fetch(`https://api.plugify.cf/v2/users/info/${username.replace(/@/g, '')}`)).json();
                        if (data.success) return console.log(data.data);
                        switch (data.error) {
                            case 8:
                                console.log('User doesn\'t exist');
                                break;
                            default:
                                console.log(`Error: ${data.error}`);
                        }
                        break;

                    default:
                        if (!channel.id) {
                            console.log("You should join a channel. Use `.join <channel ID>` for that.");
                            rl.prompt();
                            return;
                        }
                        if (input.match(/[0-9a-f]{130}/) && !bypassSafetyFilter) {
                            console.log("[Plugify (@system)]: You attempted to send what appears to be an auth token. Send again to confirm.");
                            bypassSafetyFilter = true;
                            rl.prompt();
                            return;
                        }
                        if (ws.readyState == 1 && loggedIn) {
                            bypassSafetyFilter = false;
                            ws.send(JSON.stringify({ event: 7, data: { content: input } }));
                        }
                        break;
                }
            });
            break;

        case 5:
            channel = data.data.channel;
            rl.setPrompt(`${user.displayName}, #${channel.name}> `);
            if (channel.groupId) {
                if (!group.id || group.id !== channel.groupId) {
                    const groupData = await (await fetch('https://api.plugify.cf/v2/groups/info', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify({
                            'id': channel.groupId
                        })
                    })).json();
                    if (!groupData.success) return console.log(`WS | Joined #${data.data.channel.name} in unknown group`);
                    group = groupData.data;
                }
                console.log(`WS | Joined #${data.data.channel.name} in group ${group.name}`);
            } else {
                console.log(`WS | Joined #${data.data.channel.name}`);
            }
            break;

        case 7:
            break;

        case 8:
            break;

        case 10:
            const author = data.data.author;
            console.log(`[${author.displayName} (@${author.username})]: ${data.data.content}`);
            break;

        case 12:
            console.log(data.data);
            break;
    
        case 9001:
            isDead = false;
            break;

        default:
            console.log(`WS >>`, data);
            break;
    }
}