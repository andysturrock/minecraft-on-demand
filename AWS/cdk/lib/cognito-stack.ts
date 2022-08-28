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
    const mobileClientName = getEnv('MOBILE_CLIENT_NAME', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const mobileCallbackUrls = getEnv('MOBILE_CALLBACK_URLS', false)!.trim().split(/\s+/);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const mobileLogoutUrls = getEnv('MOBILE_LOGOUT_URLS', false)!.trim().split(/\s+/);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const webClientName = getEnv('WEB_CLIENT_NAME', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const webCallbackUrls = getEnv('WEB_CALLBACK_URLS', false)!.trim().split(/\s+/);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const webLogoutUrls = getEnv('WEB_LOGOUT_URLS', false)!.trim().split(/\s+/);

    const userPool = cognito.UserPool.fromUserPoolId(this, 'UserPool', userPoolId);

    const clientWriteAttributes = new cognito.ClientAttributes().withStandardAttributes({});
    const clientReadAttributes = clientWriteAttributes.withStandardAttributes({fullname: true});

    userPool.addClient(mobileClientName, {
      userPoolClientName: mobileClientName,
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
      oAuth: {
        flows: {
          authorizationCodeGrant: true
        },
        scopes: [ cognito.OAuthScope.OPENID ],
        callbackUrls: mobileCallbackUrls,
        logoutUrls: mobileLogoutUrls,
      }
    });

    userPool.addClient(webClientName, {
      userPoolClientName: webClientName,
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
      oAuth: {
        flows: {
          authorizationCodeGrant: true
        },
        scopes: [ cognito.OAuthScope.OPENID ],
        callbackUrls: webCallbackUrls,
        logoutUrls: webLogoutUrls,
      }
    });
  }
}
