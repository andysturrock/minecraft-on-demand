import {EC2, InstanceState} from '@aws-sdk/client-ec2';
import {SecretsManager} from '@aws-sdk/client-secrets-manager';
import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';
import {EventBridge, ListRulesCommandInput, ListTagsForResourceCommandInput} from '@aws-sdk/client-eventbridge';

async function lambdaHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    // TODO pass in region
    const region = 'eu-west-2';

    type ReturnData = {
      instanceId?: string
      launchTime?: Date
      state?: InstanceState
      serverStopTime?: Date
    } | undefined;
    let returnData: ReturnData;

    // Get the instance id from secrets manager
    const smClient = new SecretsManager({
      region
    });
    const secretValue = await smClient.getSecretValue({SecretId: 'minecraftEC2InstanceId'});
    const secretString = secretValue?.SecretString;
    let ec2InstanceId: string | undefined;
    if(secretString !== undefined) {
      ec2InstanceId = JSON.parse(secretString).minecraftEC2InstanceId;
    }
    if(ec2InstanceId !== undefined) {
      const ec2Client = new EC2({region});
      const eventBridgeClient = new EventBridge(region);

      let serverStopTime: Date;
      const listRulesCommandInput: ListRulesCommandInput = {
        NamePrefix: `Turn_off_${ec2InstanceId}`
      };
      console.debug(`listRulesCommandInput = ${JSON.stringify(listRulesCommandInput)}`);
      const listRulesResult = await eventBridgeClient.listRules(listRulesCommandInput);
      console.debug(`listRulesResult = ${JSON.stringify(listRulesResult)}`);
      if(listRulesResult.Rules?.length === 1) {
        const listTagsForResourceCommandInput: ListTagsForResourceCommandInput = {
          ResourceARN: listRulesResult.Rules[0].Arn
        };
        console.debug(`listTagsForResourceCommandInput = ${JSON.stringify(listTagsForResourceCommandInput)}`);
        const listTagsForResourceResult = await eventBridgeClient.listTagsForResource(listTagsForResourceCommandInput);
        console.debug(`listTagsForResourceResult = ${JSON.stringify(listTagsForResourceResult)}`);
        if(listTagsForResourceResult.Tags?.length === 1) {
          if(listTagsForResourceResult.Tags[0].Key === 'nextTriggerTime') {
            const value = listTagsForResourceResult.Tags[0].Value;
            if(value !== undefined && value !== null) {
              serverStopTime = new Date(value);
              console.debug(`serverStopTime = ${JSON.stringify(serverStopTime)}`);
            }
          }
        }
      }

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
              state: instance.State,
              serverStopTime
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
    console.log(`Returning ${JSON.stringify(httpReturn)}`);
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
