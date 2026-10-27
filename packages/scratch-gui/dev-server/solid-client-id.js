/**
 * Serves the Solid-OIDC Client ID Document for the `solid-save.html` playground demo. The document is built per
 * request because its `client_id` must be exactly the URL it is served from, whatever port the dev server runs on.
 */

const {CLIENT_ID_DOCUMENT_CONTENT_TYPE, clientIdDocument} = require('@viboko/satchel-core/client-id');

const SOLID_CLIENT_ID_PATH = '/solid-client-id.jsonld';

const serveSolidClientId = (req, res) => {
    const origin = `${req.protocol}://${req.get('host')}`;
    res.type(CLIENT_ID_DOCUMENT_CONTENT_TYPE);
    res.send(JSON.stringify(clientIdDocument({
        clientId: `${origin}${SOLID_CLIENT_ID_PATH}`,
        clientName: 'Scratch',
        redirectUris: [`${origin}/solid-save.html`]
    }), null, 4));
};

module.exports = {SOLID_CLIENT_ID_PATH, serveSolidClientId};
