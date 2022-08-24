import 'source-map-support/register';
import {APIGatewayTokenAuthorizerEvent, AuthResponse} from 'aws-lambda';
import {getGroupIntersection, generatePolicy, validateToken} from './authorization';
import {getEnv} from './common';

// You can use Cognito directly with API Gateway to authorize API calls.
// See https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-enable-cognito-user-pool.html
// But it's more interesting to learn about JWTs etc and do it "by hand"
// See https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
// On the other hand, there is an AWS library to do the validation, so use that as a compromise

async function lambdaHandler(event: APIGatewayTokenAuthorizerEvent): Promise<AuthResponse> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const validGroupNames = getEnv('VALID_GROUP_NAMES', false)!.trim().split(/\s+/);

    const cognitoAccessTokenPayload = await validateToken(event);
    if(cognitoAccessTokenPayload !== undefined) {
      const groupNames = cognitoAccessTokenPayload['cognito:groups'];
      if(groupNames === undefined || groupNames.length == 0) {
        console.log(`User ${cognitoAccessTokenPayload.username} does not belong to any Cognito groups.`);
        return generatePolicy('user', 'Deny', event.methodArn);
      }
      const validGroups = getGroupIntersection(validGroupNames, groupNames);
      console.log(`User ${cognitoAccessTokenPayload.username} is in following valid groups: ${validGroups}`);
      if(validGroups.length > 0) {
        return generatePolicy('user', 'Allow', event.methodArn);
      }
    }
    
    return generatePolicy('user', 'Deny', event.methodArn);
  }
  catch (error) {
    console.log(`Caught error :${error}`);
    return generatePolicy('user', 'Deny', event.methodArn);
  }
}

export {lambdaHandler};
