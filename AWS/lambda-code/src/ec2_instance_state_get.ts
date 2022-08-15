import util from 'util';
import {EC2, InstanceState} from '@aws-sdk/client-ec2';
import {SecretsManager} from '@aws-sdk/client-secrets-manager';
import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';

async function lambdaHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    // TODO pass in region
    const region = 'eu-west-2';

    type ReturnData = {
      instanceId?: string
      launchTime?: Date
      state?: InstanceState
    } | undefined;
    let returnData: ReturnData;

    // Get the instance id from secrets manager
    const smClient = new SecretsManager({
      region
    });
    const secretValue = await smClient.getSecretValue({SecretId: 'minecraftEC2InstanceId'});
    const secretString = secretValue?.SecretString;
    let ec2InstanceId: String | undefined;
    if(secretString !== undefined) {
      ec2InstanceId = JSON.parse(secretString).minecraftEC2InstanceId;
    }
    if(ec2InstanceId !== undefined) {
      const ec2Client = new EC2({region});

      const params = {
        DryRun: false
      };

      const data = await ec2Client.describeInstances(params);
      data.Reservations?.find((reservation) => {
        reservation?.Instances?.find((instance) => {
          if(instance.InstanceId === ec2InstanceId) {
            returnData = {
              instanceId: instance.InstanceId,
              launchTime: instance.LaunchTime,
              state: instance.State
            };
            return true;
          }
          return false;
        });
        return returnData !== undefined;
      });
    } else {
      console.log('Could not get instance id from input');
    }

    const httpReturn = returnData === undefined
      ? {
          statusCode: 200,
          body: '{}'
        }
      : {
          statusCode: 200,
          body: JSON.stringify(returnData)
        };
    console.log(`Returning ${util.inspect(httpReturn)}`);
    return httpReturn;
  } catch (err) {
    if(err instanceof Error) {
      console.error(`Error: ${err.stack as string}`);
    } else {
      console.error(`Error: ${JSON.stringify(err)}`);
    }
    return {
      statusCode: 500,
      body: 'Error'
    };
  }
}

export {lambdaHandler};
