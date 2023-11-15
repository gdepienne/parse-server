"use strict";

/*
  # Parse Server Keycloak Authentication

  ## Keycloak `authData`

  ```
    {
      "keycloak": {
        "access_token": "access token you got from keycloak JS client authentication",
        "id": "the id retrieved from client authentication in Keycloak",
      }
    }
  ```

  The options passed to Parse server:

  ```
    {
      auth: {
        keycloak: {
          enabled: true,
          config: {
            "hostname": "keycloak instance hostname",
            "realm": "keycloak realm"
          }
        }
      }
    }
  ```
*/

const {
  Parse
} = require('parse/node');
const httpsRequest = require('./httpsRequest');

const handleAuth = async ({
  access_token,
  id,
} = {}, {
  config
} = {}) => {
  if (!(access_token && id)) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Missing access token and/or User id');
  }
  if (!config || !(config['hostname'] && config['realm'])) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Missing keycloak configuration');
  }
  try {
    const response = await httpsRequest.get({
      host: config['hostname'],
      path: `/auth/realms/${config['realm']}/protocol/openid-connect/userinfo`,
      headers: {
        Authorization: 'Bearer ' + access_token
      }
    });
    if (response && response.sub == id) {
      return;
    }
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Invalid authentication');
  } catch (e) {
    if (e instanceof Parse.Error) {
      throw e;
    }
    const error = JSON.parse(e.text);
    if (error.error_description) {
      throw new Parse.Error(Parse.Error.HOSTING_ERROR, error.error_description);
    } else {
      throw new Parse.Error(Parse.Error.HOSTING_ERROR, 'Could not connect to the authentication server');
    }
  }
};

/*
  @param {Object} authData: the client provided authData
  @param {string} authData.access_token: the access_token retrieved from client authentication in Keycloak
  @param {string} authData.id: the id retrieved from client authentication in Keycloak
  @param {Object} options: additional options
  @param {Object} options.config: the config object passed during Parse Server instantiation
*/
function validateAuthData(authData, options = {}) {
  return handleAuth(authData, options);
}

// Returns a promise that fulfills if this app id is valid.
function validateAppId() {
  return Promise.resolve();
}
module.exports = {
  validateAppId,
  validateAuthData
};
