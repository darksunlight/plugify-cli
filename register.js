const fetch = require('node-fetch').default;
fetch('https://api.plugify.cf/v2/users/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        'username': process.argv[2],
        'displayName': process.argv[3],
        'email': process.argv[4],
        'password': process.argv[5],
        'recaptchaToken': process.argv[6],
        'inviteCode': process.argv[7]
    })
}).then(response => {
    return response.json();
}).then(data => {
    console.log(data);
});