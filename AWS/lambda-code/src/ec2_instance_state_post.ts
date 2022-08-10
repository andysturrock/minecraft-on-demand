import util from 'util';
import { Context, APIGatewayEvent } from 'aws-lambda';
import { EC2 } from '@aws-sdk/client-ec2';
import { EventBridge, PutRuleCommandInput, PutTargetsCommandInput, Target } from "@aws-sdk/client-eventbridge";

async function lambdaHandler(event: APIGatewayEvent, context: Context): Promise<any> {
  try {
    console.log(`event: ${util.inspect(event)}`);
    console.log(`context: ${util.inspect(context)}`);
    const body = JSON.parse(event.body!);
    const action = body.action;
    const instanceId = body?.InstanceId;
    
    // TODO pass in region
    const region = {region: 'eu-west-2'};
    const ec2Client = new EC2(region);
    
    var ec2Params = {
      InstanceIds: [instanceId],
      DryRun: false
    };
    
    if(action === "start") {
      console.log("Creating eventbridge rule to stop server...");
      const eventBridgeClient = new EventBridge(region);
      const now = new Date();
      const hours = now.getUTCHours() + 2;
      const minutes = now.getUTCMinutes();
      // const cronPattern = `cron(${minutes} ${hours} * * ? *)`;
      const cronPattern = `cron(* * * * ? *)`;
      const putRuleParams: PutRuleCommandInput = {
        Name: `Turn_off_${instanceId}`,
        ScheduleExpression: cronPattern
      };
      console.log(`putRuleParams = ${JSON.stringify(putRuleParams)}`);
      const putRuleResult = await eventBridgeClient.putRule(putRuleParams);
      console.log(`putRule res = ${JSON.stringify(putRuleResult)}`);
      const body = {
        "action": "stop",
        "InstanceId": instanceId
      };
      const input = {
        body: JSON.stringify(body)
      }
      const invokedFunctionArn = context.invokedFunctionArn;
      let target: Target = {
        Id: `Turn_off_${instanceId}`,
        Arn: invokedFunctionArn,
        Input: JSON.stringify(input)
      };
      console.log(`putRule target = ${JSON.stringify(target)}`);
      const putTargetsCommandInput: PutTargetsCommandInput = {
        Rule: `Turn_off_${instanceId}`,
        Targets: [target]
      };
      const putTargetResult = await eventBridgeClient.putTargets(putTargetsCommandInput);
      console.log(`putRule putTargetResult = ${JSON.stringify(putTargetResult)}`);
      
      console.log("Starting server...");
      // const data = await ec2Client.startInstances(ec2Params);
      // console.log(`start data: ${util.inspect(data)}`);
    } else if(action === "stop") {
      console.log("Stopping server...");
      const data = await ec2Client.stopInstances(ec2Params);
      console.log(`stop data: ${util.inspect(data)}`);
    } else {
      console.log(`Unexpected action: ${action}`);
    }
    return {
      statusCode: 200,
      body: `${JSON.stringify({ "Status": `OK` })}`
    }
  }
  catch (err) {
    if(err instanceof Error) {
      console.error(`Error: ${err.stack}`);
    } else {
      console.error(`Error: ${JSON.stringify(err)}`);
    }
    return {
      statusCode: 500,
      body: "Error"
    }
  }
}

export { lambdaHandler };

/*
{
  "event": {
    "body": {
      "action": "start",
      "InstanceId": "i-03a206101969e1f87"
    }
  },
  "context": {
    "invokedFunctionArn": "1223"
  }
}
*/