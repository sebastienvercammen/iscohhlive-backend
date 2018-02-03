/*
    Developed by Sébastien Vercammen for IsCohh.live.
    https://iscohh.live
    https://github.com/sebastienvercammen/iscohhlive
 */

// Parse config.
require('dotenv').config();

const http = require('http');
const request = require('request');
const debug = require('debug')('master');


/* Settings. */

const WEB_HOST = process.env.HOST || '127.0.0.1';
const WEB_PORT = parseInt(process.env.PORT) || 45050;
const TWITCH_API_CLIENT_ID = process.env.TWITCH_API_CLIENT_ID || '';
const TWITCH_API_CLIENT_SECRET = process.env.TWITCH_API_CLIENT_SECRET || '';
const TWITCH_API_UPDATE_SEC = 30;
const TWITCH_CHANNEL_NAME = process.env.TWITCH_CHANNEL_NAME || 'cohhcarnage';


/* App. */

var channelId = -1;
var lastToken = '';
var expiresAt = 0;

// Constant reference. Update status once in a while.
// -1 = unknown, 0 = offline, 1 = online.
const lastResponse = {
    'status': -1
};

// We keep this reference to save some cycles.
var responseString = JSON.stringify(lastResponse);


/* Helper methods. */

function gotChannelStatus(status) {
    debug('Current channel status: %s.', status);

    if (status === 'live') {
        lastResponse.status = 1;
    } else if (status === 'offline') {
        lastResponse.status = 0;
    } else {
        debug('Unknown channel status: %s.', status);
        lastResponse.status = -1;
    }

    responseString = JSON.stringify(lastResponse);
}

function getChannelStatus(token, callback) {
    // We need a token. Avoiding callback hell w/ a trick.
    // If one arg is passed, it's the callback.
    // Could just use promises but I'm feeling lazy. ¯\_(ツ)_/¯
    if (typeof callback === 'undefined') {
        debug('booboo');
        return getTwitchToken((t) => {
            getChannelStatus(t, token);
        });
    }

    const url = `https://api.twitch.tv/helix/streams?user_id=${channelId}`;
    request.get({
        'url': url,
        'json': true,
        'auth': {
            'bearer': token
        }
    }, (error, response, body) => {
        if (error) {
            console.error(error);
            process.exit(1);
        }

        const data = body.data;

        // We *really* need this.
        if (data && data.length > 0 && data[0].type) {
            debug('Retrieved %s channel status: %s.', TWITCH_CHANNEL_NAME, data[0].type);
            callback(data[0].type);
        } else {
            callback('offline');
        }
    });
}

function getChannelId(token, callback) {
    // We need a token. Avoiding callback hell w/ a trick.
    // If one arg is passed, it's the callback.
    // Could just use promises but I'm feeling lazy. ¯\_(ツ)_/¯
    if (typeof callback === 'undefined') {
        return getTwitchToken((t) => {
            getChannelId(t, token);
        });
    }

    const url = `https://api.twitch.tv/helix/users?login=${TWITCH_CHANNEL_NAME}`;
    request.get({
        'url': url,
        'json': true,
        'auth': {
            'bearer': token
        }
    }, (error, response, body) => {
        if (error) {
            console.error(error);
            process.exit(1);
        }

        const data = body.data;

        // We *really* need this.
        if (data && data.length > 0 && data[0].id) {
            debug('Retrieved %s channel ID: %s.', TWITCH_CHANNEL_NAME, data[0].id);
            callback(data[0].id);
        } else {
            debug('Error retrieving channel ID for %s!', TWITCH_CHANNEL_NAME);
            debug('API channel ID: %O', body);
            process.exit(1);
        }
    });
}

function getTwitchToken(callback) {
    // Re-use token.
    if (expiresAt > Date.now()) {
        const validFor = expiresAt - Date.now();
        debug('Re-used old access token %s. Still valid for %d seconds.', lastToken, validFor);
        return callback(lastToken);
    }

    const data = {
        'client_id': TWITCH_API_CLIENT_ID,
        'client_secret': TWITCH_API_CLIENT_SECRET,
        'grant_type': 'client_credentials',
        'scope': 'user:edit'
    };
    const url = 'https://api.twitch.tv/kraken/oauth2/token';
    request.post({
        'url': url,
        'json': true,
        'body': data
    }, (error, response, body) => {
        if (error) {
            console.error(error);
            process.exit(1);
        }

        // We *really* need this.
        if (body.access_token) {
            debug('Retrieved access token: %s.', body.access_token);
            lastToken = body.access_token;

            // Make expiry time, minus a few "safety" seconds.
            const expiresIn = body.expires_in;
            const now = new Date();
            now.setSeconds(now.getSeconds() + expiresIn - 30);
            expiresAt = now.getTime();

            callback(body.access_token);
        } else {
            debug('Error retrieving API token!');
            debug('API token response: %O', body);
            process.exit(1);
        }
    });
}

function updateTwitchChannelStatus() {
    debug('Retrieving channel status...');

    // We don't want to mess with the refresh token and track it all the time
    // for our limited requests, so we'll just get a new one.
    getTwitchToken((token) => {
        getChannelStatus(token, gotChannelStatus);
    });

    debug('Sleeping %s seconds before next update.', TWITCH_API_UPDATE_SEC);
    setTimeout(updateTwitchChannelStatus, TWITCH_API_UPDATE_SEC * 1000);
}


function main() {
    // Only one request type to handle, yay!
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(responseString);
    });

    // We disregard the token, but we need the ID.
    getChannelId((id) => {
        // Store globally.
        channelId = id;

        // Update status once in a while.
        updateTwitchChannelStatus();

        // Start server.
        server.listen(WEB_PORT, WEB_HOST, (err) => {
            if (err) {
                debug('Error starting HTTP server: %O.', err);
            } else {
                debug('Server started successfully! Listening on %o.', server.address());
            }
        });
    });
}

main();
