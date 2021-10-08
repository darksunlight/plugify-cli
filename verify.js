if (!process.argv[2]) return console.log('Please follow the instructions in the invitation.');
require('dotenv').config();
const fetch = require('node-fetch').default;
fetch(`https://${process.env.API_DOMAIN ?? 'api.plugify.cf'}/v2/users/verify`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        'token': process.argv[2]
    })
}).then(response => {
    return response.json();
}).then(data => {
    console.log(data);
});