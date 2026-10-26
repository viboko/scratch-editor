const {SOLID_CLIENT_ID_PATH, solidClientIdDocument} = require('../../../dev-server/solid-client-id');

describe('solidClientIdDocument', () => {
    const doc = solidClientIdDocument('http://localhost:8601');

    test('names its own URL as the client ID, as Solid-OIDC requires', () => {
        expect(SOLID_CLIENT_ID_PATH).toBe('/solid-client-id.jsonld');
        expect(doc.client_id).toBe('http://localhost:8601/solid-client-id.jsonld');
    });

    test('allows redirects back to the demo page only', () => {
        expect(doc.redirect_uris).toEqual(['http://localhost:8601/solid-save.html']);
    });

    test('asks for the webid scope, which Solid-OIDC requires', () => {
        expect(doc.scope.split(' ')).toEqual(expect.arrayContaining(['openid', 'webid']));
    });
});
