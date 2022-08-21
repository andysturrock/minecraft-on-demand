import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { getEnv } from './common';

export class CognitoStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const customDomainName = getEnv('CUSTOM_DOMAIN_NAME', false)!;
    const userPoolId = getEnv('USERPOOL_ID', false)!;
    const r53ZoneId = getEnv('R53_ZONE_ID', false)!;

    const userPool = cognito.UserPool.fromUserPoolId(this, 'UserPool', userPoolId);

    const clientWriteAttributes = new cognito.ClientAttributes().withStandardAttributes({});
    const clientReadAttributes = clientWriteAttributes.withStandardAttributes({fullname: true});

    const client = userPool.addClient('mobile-app', {
      userPoolClientName: 'mobile-app',
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
      oAuth: {
        flows: {
          authorizationCodeGrant: true
        },
        scopes: [ cognito.OAuthScope.OPENID ],
        callbackUrls: [ `https://www.google.com/search?q=loggedin` ],
        logoutUrls: [ `https://www.google.com/search?q=loggedout` ],
      }
    });
    const clientId = client.userPoolClientId;
  }
}
