import util from 'util';
import {Context, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {EC2, StartInstancesCommandInput, StopInstancesCommandInput} from '@aws-sdk/client-ec2';
import {DeleteRuleCommandInput, EventBridge, PutRuleCommandInput, PutTargetsCommandInput, RemoveTargetsCommandInput, Target} from '@aws-sdk/client-eventbridge';

async function lambdaHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    console.debug(`event: ${util.inspect(event)}`);
    console.debug(`context: ${util.inspect(context)}`);
    if(event.body == null) {
      throw new Error('Missing event.body');
    }
    const body = JSON.parse(event.body);
    const action: string = body.action;
    if(action === undefined) {
      throw new Error('Missing action field in body');
    }
    const instanceId: string = body?.instanceId;
    if(instanceId === undefined) {
      throw new Error('Missing instanceId field in body');
    }
    const invokedFunctionArn = context.invokedFunctionArn;

    // TODO pass in region
    const region = {region: 'eu-west-2'};
    const ec2Client = new EC2(region);
    const eventBridgeClient = new EventBridge(region);

    if(action === 'start') {
      await startServer(instanceId, invokedFunctionArn, eventBridgeClient, ec2Client);
    } else if(action === 'stop') {
      const deleteStopRule = body.deleteStopRule;
      await stopServer(instanceId, deleteStopRule, eventBridgeClient, ec2Client);
    } else {
      console.warn(`Unexpected action: ${action}`);
    }
    return {
      statusCode: 200,
      body: `${JSON.stringify({Status: 'OK'})}`
    };
  } catch (err) {
    let errorText = 'Unknown error';
    if(err instanceof Error) {
      console.error(`Caught Error exception: ${err.stack as string}`);
      const error = err;
      errorText = error.message;
    } else {
      console.error(`Caught exception: ${JSON.stringify(err)}`);
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: errorText
      })
    };
  }
}

export {lambdaHandler};

async function startServer(instanceId: string,
  invokedFunctionArn: string,
  eventBridgeClient: EventBridge,
  ec2Client: EC2): Promise<void> {
  console.log('Creating EventBridge rule to stop server...');
  const now = new Date();
  let hours = now.getUTCHours() + 2;
  if(hours >= 24) {
    hours -= 24;
  }
  const minutes = now.getUTCMinutes();
  // Only need to worry about the minutes and hours in the pattern.
  // The rule will be deleted before "tomorrow" anyway.
  const cronPattern = `cron(${minutes} ${hours} * * ? *)`;
  const putRuleParams: PutRuleCommandInput = {
    Name: `Turn_off_${instanceId}`,
    ScheduleExpression: cronPattern
  };
  console.debug(`putRuleParams = ${JSON.stringify(putRuleParams)}`);
  const putRuleResult = await eventBridgeClient.putRule(putRuleParams);
  console.debug(`putRuleResult = ${JSON.stringify(putRuleResult)}`);
  const body = {
    action: 'stop',
    instanceId,
    deleteStopRule: true
  };
  const input = {
    body: JSON.stringify(body)
  };
  const target: Target = {
    Id: `Turn_off_${instanceId}`,
    Arn: invokedFunctionArn,
    Input: JSON.stringify(input)
  };
  const putTargetsCommandInput: PutTargetsCommandInput = {
    Rule: `Turn_off_${instanceId}`,
    Targets: [target]
  };
  console.debug(`putTargetsCommandInput = ${JSON.stringify(putTargetsCommandInput)}`);
  const putTargetResult = await eventBridgeClient.putTargets(putTargetsCommandInput);
  console.debug(`putTargetResult = ${JSON.stringify(putTargetResult)}`);

  console.log('Starting server...');
  const startInstancesCommandInput: StartInstancesCommandInput = {
    InstanceIds: [instanceId]
  };
  console.debug(`startInstancesCommandInput: ${JSON.stringify(startInstancesCommandInput)}`);
  const startInstancesResult = await ec2Client.startInstances(startInstancesCommandInput);
  console.debug(`startInstancesResult: ${JSON.stringify(startInstancesResult)}`);
}

async function stopServer(instanceId: string,
  deleteStopRule: boolean,
  eventBridgeClient: EventBridge,
  ec2Client: EC2): Promise<void> {
  console.log('Stopping server...');
  const stopInstancesCommandInput: StopInstancesCommandInput = {
    InstanceIds: [instanceId]
  };
  console.debug(`stopInstancesCommandInput = ${JSON.stringify(stopInstancesCommandInput)}`);
  const stopInstancesResult = await ec2Client.stopInstances(stopInstancesCommandInput);
  console.debug(`stopInstancesResult = ${JSON.stringify(stopInstancesResult)}`);

  if(deleteStopRule) {
    console.log('Deleting EventBridge stop server rule...');
    const removeTargetsCommandInput: RemoveTargetsCommandInput = {
      Rule: `Turn_off_${instanceId}`,
      Ids: [`Turn_off_${instanceId}`]
    };
    console.debug(`removeTargetsCommandInput = ${JSON.stringify(removeTargetsCommandInput)}`);
    const removeTargetsResult = await eventBridgeClient.removeTargets(removeTargetsCommandInput);
    console.debug(`removeTargetsResult = ${JSON.stringify(removeTargetsResult)}`);

    const deleteRuleCommandInput: DeleteRuleCommandInput = {
      Name: `Turn_off_${instanceId}`
    };
    console.debug(`deleteRuleCommandInput = ${JSON.stringify(deleteRuleCommandInput)}`);
    const deleteRuleResult = await eventBridgeClient.deleteRule(deleteRuleCommandInput);
    console.debug(`deleteRuleResult = ${JSON.stringify(deleteRuleResult)}`);
  }
}
