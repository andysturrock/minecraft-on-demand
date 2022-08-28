import {EC2, InstanceState} from '@aws-sdk/client-ec2';
import {APIGatewayProxyResult} from 'aws-lambda';
import {EventBridge, ListRulesCommandInput, ListTagsForResourceCommandInput} from '@aws-sdk/client-eventbridge';
import {getEnv} from './common';

async function lambdaHandler(): Promise<APIGatewayProxyResult> {
  let accessControlAllowOrigin = "";
  try {
    type ReturnData = {
      instanceId?: string
      launchTime?: Date
      state?: InstanceState
      serverStopTime?: Date
    } | undefined;
    let returnData: ReturnData;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ec2InstanceId = getEnv('MINECRAFT_EC2_INSTANCE_ID', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const region = getEnv('REGION', false)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    accessControlAllowOrigin = getEnv('ACCESS_CONTROL_ALLOW_ORIGIN', false)!;

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
      console.log('Could not get instance id from environment var MINECRAFT_EC2_INSTANCE_ID');
    }

    const httpReturn = returnData === undefined
      ? {
        statusCode: 200,
        body: '{}',
        headers: {
          "Access-Control-Allow-Origin" : accessControlAllowOrigin,
          "Access-Control-Allow-Credentials" : true
        }
      }
      : {
        statusCode: 200,
        body: JSON.stringify(returnData),
        headers: {
          "Access-Control-Allow-Origin" : accessControlAllowOrigin,
          "Access-Control-Allow-Credentials" : true
        },
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
      headers: {
        "Access-Control-Allow-Origin" : accessControlAllowOrigin,
        "Access-Control-Allow-Credentials" : true
      },
      statusCode: 500,
      body: 'Error'
    };
  }
}

export {lambdaHandler};
