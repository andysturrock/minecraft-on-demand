import 'source-map-support/register';
import {APIGatewayTokenAuthorizerEvent, AuthResponse, Context, PolicyDocument, Statement} from 'aws-lambda';
import {CognitoJwtVerifier} from 'aws-jwt-verify';
import {GetAssociatedEnclaveCertificateIamRolesCommand} from '@aws-sdk/client-ec2';
import {getEnv} from './common';

// You can use Cognito directly with API Gateway to authorize API calls.
// See https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-enable-cognito-user-pool.html
// But it's more interesting to learn about JWTs etc and do it "by hand"
// See https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
// On the other hand, there is an AWS library to do the validation, so use that as a compromise

async function lambdaHandler(event: APIGatewayTokenAuthorizerEvent, context: Context): Promise<AuthResponse> {
  console.log(`event: ${JSON.stringify(event)}`);
  console.log(`context: ${JSON.stringify(context)}`);
  try {
    let token = event.authorizationToken;
    console.log(`token = ${token}`);
    token = token.replace('Bearer ', '');
    console.log(`token now = <${token}>`);

    // Get the user_pool_id and client_id from the environment.
    // They have been put there when the lambda was created.
    // They aren't secret, so this is fine.
    const userPoolId = getEnv('USERPOOL_ID', false);
    const clientId = getEnv('CLIENT_ID', false);
    if(userPoolId !== undefined && clientId !== undefined) {
      const verifier = CognitoJwtVerifier.create({
        userPoolId,
        tokenUse: 'access',
        clientId,
        includeRawJwtInErrors: true // can also be specified as parameter to the `verify` call
      });
  
      const payload = await verifier.verify(token);
      console.log(`payload: ${JSON.stringify(payload)}`);
  
      return generatePolicy('user', 'Allow', event.methodArn);
    }

    return generatePolicy('user', 'Deny', event.methodArn);
    
  } catch (error) {
    console.log(`Caught error :${error}`);
    return generatePolicy('user', 'Deny', event.methodArn);
  }
}

function generatePolicy(principalId: string, effect: string, resource: any): AuthResponse {
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

export {lambdaHandler};
