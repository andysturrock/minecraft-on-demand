import 'source-map-support/register';
import {APIGatewayTokenAuthorizerEvent, AuthResponse, Context, PolicyDocument, Statement} from 'aws-lambda';
import {CognitoJwtVerifier} from 'aws-jwt-verify';
import {getEnv} from './common';
import {CognitoAccessTokenPayload} from 'aws-jwt-verify/jwt-model';

/**
 * Check whether the given group is within the list of groups
 *
 * @param left The left hand list of group names.
 * @param right The right hand list of group names.
 * @returns the intersection of the groups.
 */
function getGroupIntersection(left: string[], right: string[]): string[] {
  return left.filter(x => right.includes(x));
}

/**
 * Validate a JWT token contained in an APIGatewayTokenAuthorizerEvent.
 * @param event the event containing the token
 * @returns decoded token payload if valid, undefined otherwise.
 */
async function validateToken(event: APIGatewayTokenAuthorizerEvent): Promise<CognitoAccessTokenPayload | undefined> {
  try {
    const token = event.authorizationToken.replace('Bearer ', '');

    // Get the user_pool_id and client_id from the environment.
    // They have been put there when the lambda was created.
    // They aren't secret, so this is fine.
    const userPoolId = getEnv('USERPOOL_ID', false);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const clientIds = getEnv('CLIENT_IDS', false)!.trim().split(/\s+/);
    if(userPoolId !== undefined && clientIds !== undefined) {
      const verifier = CognitoJwtVerifier.create({
        userPoolId,
        tokenUse: 'access',
        clientId: clientIds,
        includeRawJwtInErrors: true // can also be specified as parameter to the `verify` call
      });
  
      const payload = await verifier.verify(token);
      console.log(`payload: ${JSON.stringify(payload)}`);

      return payload;
    }
    return undefined;
  } catch (error) {
    console.log(`Caught error :${error}`);
    return undefined;
  }
}

/**
 * Create a AuthResponse policy to be used as the return value of an APIGateway authorizer lambda.
 * @param principalId The Principal for the policy
 * @param effect Should be one of 'Allow' or 'Deny'
 * @param resource The resource or resources the policy should apply to.  Will probably be the API method ARN.
 * @returns 
 */
function generatePolicy(principalId: string, effect: 'Allow' | 'Deny', resource: string | string[]): AuthResponse {
  const policyDocument: PolicyDocument = {
    Version: '',
    Statement: []
  };
  const authResponse: AuthResponse = {
    principalId: '',
    policyDocument
  };

  authResponse.principalId = principalId;
  if((effect.length > 0) && (Boolean(resource))) {
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statement: Statement = {
      Action: 'execute-api:Invoke',
      Effect: effect,
      Resource: resource
    };
    statement.Action = 'execute-api:Invoke';
    statement.Effect = effect;
    statement.Resource = resource;
    policyDocument.Statement[0] = statement;
    authResponse.policyDocument = policyDocument;
  }

  return authResponse;
}

export {validateToken, generatePolicy, getGroupIntersection};
