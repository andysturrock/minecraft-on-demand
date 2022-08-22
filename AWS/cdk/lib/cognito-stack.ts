import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import {getEnv} from './common';

export class CognitoStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const userPoolId = getEnv('USERPOOL_ID', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const clientName = getEnv('CLIENT_NAME', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const callbackUrls = getEnv('CALLBACK_URLS', false)!.trim().split(/\s+/);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const logoutUrls = getEnv('LOGOUT_URLS', false)!.trim().split(/\s+/);

    const userPool = cognito.UserPool.fromUserPoolId(this, 'UserPool', userPoolId);

    const clientWriteAttributes = new cognito.ClientAttributes().withStandardAttributes({});
    const clientReadAttributes = clientWriteAttributes.withStandardAttributes({fullname: true});

    const client = userPool.addClient(clientName, {
      userPoolClientName: clientName,
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
      oAuth: {
        flows: {
          authorizationCodeGrant: true
        },
        scopes: [ cognito.OAuthScope.OPENID ],
        callbackUrls,
        logoutUrls,
      }
    });
    const clientId = client.userPoolClientId;
    console.log(`clientId = ${clientId}`);
  }
}
