/**
 * Serves the Solid-OIDC Client ID Document for the `solid-save.html` playground demo.
 *
 * A Solid provider reads this document, at the URL that is also the client's ID, to learn which app is logging in
 * and where it may redirect back to. Identifying Scratch this way means it never registers itself with the provider,
 * so there is no registration for the browser and a wiped provider to disagree about. The document is built per
 * request because its `client_id` must be exactly the URL it is served from, whatever port the dev server runs on.
 */

const SOLID_CLIENT_ID_PATH = '/solid-client-id.jsonld';

/**
 * @param {string} origin The dev server's origin, such as `http://localhost:8601`
 * @returns {object} The Client ID Document for the demo page on that origin
 */
const solidClientIdDocument = origin => ({
    '@context': ['https://www.w3.org/ns/solid/oidc-context.jsonld'],
    'client_id': `${origin}${SOLID_CLIENT_ID_PATH}`,
    'client_name': 'Scratch',
    'redirect_uris': [`${origin}/solid-save.html`],
    'scope': 'openid webid offline_access',
    'grant_types': ['authorization_code', 'refresh_token'],
    'response_types': ['code'],
    'token_endpoint_auth_method': 'none'
});

const serveSolidClientId = (req, res) => {
    res.type('application/ld+json');
    res.send(JSON.stringify(solidClientIdDocument(`${req.protocol}://${req.get('host')}`), null, 4));
};

module.exports = {SOLID_CLIENT_ID_PATH, serveSolidClientId, solidClientIdDocument};
