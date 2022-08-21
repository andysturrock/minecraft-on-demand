import {APIGatewayTokenAuthorizerEvent, AuthResponse, Context, PolicyDocument, Statement} from 'aws-lambda';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

// You can use Cognito directly with API Gateway to authorize API calls.
// See https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-enable-cognito-user-pool.html
// But it's more interesting to learn about JWTs etc and do it "by hand"
// See https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
// On the other hand, there is an AWS library to do the validation, so use that as a compromise

async function lambdaHandler(event: APIGatewayTokenAuthorizerEvent, context: Context): Promise<AuthResponse> {
  console.log(`event: ${JSON.stringify(event)}`);
  console.log(`context: ${JSON.stringify(context)}`);
  try {
    const token = event.authorizationToken;
    console.log(`token = ${token}`);

    return generatePolicy('user', 'Allow', event.methodArn);
  } catch (error) {
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
