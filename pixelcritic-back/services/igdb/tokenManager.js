const axios = require('axios');

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env;

  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error(
      'Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET in environment variables. ' +
      'Register an app at https://dev.twitch.tv/console to obtain credentials.'
    );
  }

  const response = await axios.post(TWITCH_TOKEN_URL, null, {
    params: {
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    },
  });

  cachedToken = response.data.access_token;
  // Refresh 60 seconds before actual expiry
  tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;

  return cachedToken;
}

function clearToken() {
  cachedToken = null;
  tokenExpiry = 0;
}

module.exports = { getAccessToken, clearToken };
