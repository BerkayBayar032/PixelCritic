const axios = require('axios');
const { getAccessToken, clearToken } = require('./tokenManager');

const IGDB_BASE_URL = 'https://api.igdb.com/v4';

// Rate limiting: max 4 requests/second → minimum 250ms between requests
let lastRequestTime = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function igdbRequest(endpoint, query, retried = false) {
  // Enforce rate limit
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 250) {
    await sleep(250 - elapsed);
  }
  lastRequestTime = Date.now();

  const token = await getAccessToken();

  try {
    const response = await axios.post(`${IGDB_BASE_URL}/${endpoint}`, query, {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    // If 401 and haven't retried yet, clear token and retry once
    if (error.response?.status === 401 && !retried) {
      clearToken();
      return igdbRequest(endpoint, query, true);
    }
    throw error;
  }
}

module.exports = { igdbRequest };
