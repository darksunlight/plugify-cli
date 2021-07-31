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
let users = {};
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "???", 
    completer: completer
});

fixStdoutFor(rl);

function completer(line) {
    const completions = ".exit .quit .q .join .groups .group .invite .channels .channel .userinfo .ui".split(" ");
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

async function apiPost(path, body) {
    return await (await fetch(`https://api.plugify.cf/v2/${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify(body)
    })).json();
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

                    case ".channels":
                        let currentGroup;
                        if (line[1]) {
                            currentGroup = line[1];
                        } else {
                            if (group.id) currentGroup = group.id;
                            else return console.log('Please specify a group ID or join a channel first.');
                        }
                        const apiDataG = await apiPost('groups/info', { 'id': currentGroup });
                        if (apiDataG.success && apiDataG.data.channels) return console.log(apiDataG.data.channels);
                        if (!apiDataG.success) {
                            switch (apiDataG.error) {
                                case 9:
                                    return console.log('Group doesn\'t exist or you aren\'t in it');
                                default:
                                    return console.log(`Error: ${apiDataG.error}`);
                            }
                        }
                        console.log('Unknown error.');
                        break;

                    case ".channel":
                        switch (line[1]) {
                            case 'join':
                                if (!line[2]) return console.log('Please specify a channel ID.');
                                ws.send(JSON.stringify({ event: 4, data: { id: line[1] } }));
                                break;
                            case 'create':
                                if (!line[2]) return console.log('Please specify a channel name.');
                                if (!line[3]) return console.log('Please specify a group ID.');
                                const apiData = await apiPost('channels/create', {
                                    'name': line[2],
                                    'groupID': line[3],
                                    'type': 'text'
                                });
                                if (apiData.success) return console.log(apiData.data);
                                console.log(`Error: ${apiData.error}`);
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
                                const apiData = await apiPost('groups/info', { 'id': line[2] });
                                if (apiData.success) return console.log(apiData.data);
                                console.log(`Error: ${apiData.error}`);
                                break;
                            case 'create':
                                if (!line[2]) return console.log('Please specify a name.');
                            const apiDataC = await apiPost('groups/create', { 'name': line.slice(2).join(' ') });
                                if (apiDataC.success) return console.log(apiDataC.data);
                                console.log(`Error: ${apiDataC.error}`);
                                break;
                            default:
                                console.log(expectArg('info create'));
                        }
                        break;
                    
                    case '.invite':
                        switch (line[1]) {
                            case 'help':
                                console.log('Subcommands: help, info, create, use\n\nhelp\n====\nDisplays help for this command.\n\ninfo [invite id]\n====\nGets info about a particular invite.\n\ncreate [group id] [uses (integer)] [expires (unix timestamp)]\n====\nCreates an invite for the specified group. Enter any non-positive number for unlimited uses. Enter 0 for no expiry.\n\nuse [invite id]\n====\nUses the given invite code.');
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
                                }).then(function(apiData) {
                                    if (apiData.success) return console.log(apiData.data);
                                    switch (apiData.error) {
                                        case 9:
                                            console.log('Group doesn\'t exist');
                                            break;
                                        case 13:
                                            console.log('Invite doesn\'t exist');
                                            break;
                                        default:
                                            console.log(`Error: ${apiData.error}`);
                                    }
                                });
                                break;
                            case 'create':
                                if (!line[2]) return console.log('Please specify a group ID.');
                                let body = {
                                    'id': line[2],
                                    'uses': parseInt(line[3]) < 1 ? null : parseInt(line[3]),
                                    'expires': line[4] === '0' ? null : new Date(parseInt(line[4])*1000)
                                };
                                const apiData = await apiPost('invites/create', body);
                                console.log(`Creating invite with following data: ${JSON.stringify(body)}`)
                                if (apiData.success) return console.log(apiData.data);
                                switch (apiData.error) {
                                    case 9:
                                        console.log('Group doesn\'t exist or you aren\'t in it');
                                        break;
                                    default:
                                        console.log(`Error: ${apiData.error}`);
                                }
                                break;
                            case 'use':
                            case 'accept':
                                if (!line[2]) return console.log('Please specify an invite ID.');
                                const apiDataU = await apiPost('invites/use', { 'id': line[2] });
                                if (apiDataU.success) return console.log(apiDataU.data);
                                switch (apiDataU.error) {
                                    case 9:
                                        console.log('Group doesn\'t exist');
                                        break;
                                    case 13:
                                        console.log('Invite doesn\'t exist');
                                        break;
                                    default:
                                        console.log(`Error: ${apiDataU.error}`);
                                }
                                break;
                            default:
                                console.log(expectArg('help info create use accept'));
                        }
                        break;
                    
                    case ".ui":
                    case ".userinfo":
                        let username = line[1];
                        if (!username) username = user.username;
                        const apiData = await (await fetch(`https://api.plugify.cf/v2/users/info/${username.replace(/@/g, '')}`)).json();
                        if (apiData.success) {
                            const flags = {
                                pro: (apiData.data.flags & 1 << 0) === 1 << 0,
                                dev: (apiData.data.flags & 1 << 1) === 1 << 1,
                                early: (apiData.data.flags & 1 << 2) === 1 << 2,
                                closedBeta: (apiData.data.flags & 1 << 3) === 1 << 3,
                            };
                            const labels = {
                                pro: ' \x1b[42mPRO\x1b[0m',
                                dev: ' \x1b[44mDEV\x1b[0m',
                                early: ' \x1b[45mEARLY\x1b[0m',
                                closedBeta: ' \x1b[43mBETA\x1b[0m'
                            }
                            return console.log(`${apiData.data.displayName} (@${apiData.data.name})${flags.pro ? labels.pro : ''}${flags.dev ? labels.dev : ''}${flags.early ? labels.early : ''}${flags.closedBeta ? labels.closedBeta : ''}\nAvatar URL: ${apiData.data.avatarURL}`);
                        }
                        switch (apiData.error) {
                            case 8:
                                console.log('User doesn\'t exist');
                                break;
                            default:
                                console.log(`Error: ${apiData.error}`);
                        }
                        break;

                    case ".eval":
                        eval(line[1]);
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

        case 3:
            console.log('Your account has not been verified yet. Please check your email and verify your account first.');
            process.exit();

        case 5:
            channel = data.data.channel;
            rl.setPrompt(`${user.displayName}, #${channel.name}> `);
            if (data.data.history) data.data.history.forEach(message => handleMessage(message));
            if (channel.groupId) {
                if (!group.id || group.id !== channel.groupId) {
                    const groupData = await apiPost('groups/info', { 'id': channel.groupId });
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
            handleMessage(data.data);
            break;

        case 12:
            console.log(data.data);
            break;
        
        case 16:
            const triggeredTime = new Date(data.data.triggeredAt);
            const triggeredTimeString = `${triggeredTime.getHours() < 10 ? '0' : ''}${triggeredTime.getHours()}:${triggeredTime.getMinutes() < 10 ? '0' : ''}${triggeredTime.getMinutes()}`;
            console.log(`${triggeredTimeString} [Plugify (@system)]: ${data.data.content}`);
            break;
        
        case 9001:
            isDead = false;
            break;

        default:
            console.log(`WS >>`, data);
            break;
    }
}

function handleMessage(data) {
    const author = data.author;
    users[author.username] = author;
    const time = new Date(data.timestamp);
    const timeString = `${time.getHours() < 10 ? '0' : ''}${time.getHours()}:${time.getMinutes() < 10 ? '0' : ''}${time.getMinutes()}`;
    let content = data.content;
    let output = '';
    if (content.match(new RegExp(`<@${user.username}>`))) {
        output = '\x1b[47m\x1b[30m';
        content = content.replace(/<@([a-z0-9_-]+)>/gi, '@$1');
    } else {
        content = content.replace(/<@([a-z0-9_-]+)>/gi, '\x1b[47m\x1b[30m@$1\x1b[0m');
    }
    output += `${timeString} [${author.displayName} (@${author.username})]: ${content}\x1b[0m`;
    console.log(output);
}