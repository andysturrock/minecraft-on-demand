import util from 'util';
import {Context, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {EC2, StartInstancesCommandInput, StopInstancesCommandInput} from '@aws-sdk/client-ec2';
import {DeleteRuleCommandInput, EventBridge, PutRuleCommandInput, PutTargetsCommandInput, RemoveTargetsCommandInput, Tag, TagResourceCommandInput, Target} from '@aws-sdk/client-eventbridge';

async function lambdaHandler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
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

    switch(action) {
    case 'start': {
      await startServer(instanceId, invokedFunctionArn, eventBridgeClient, ec2Client);
      break;
    }
    case 'stop':{
      const deleteStopRule = body.deleteStopRule;
      await stopServer(instanceId, deleteStopRule, eventBridgeClient, ec2Client);
      break;
    }
    case 'extend':{
      await extendServer(instanceId, invokedFunctionArn, eventBridgeClient);
      break;
    }
    default:
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

async function createOrReplaceStopRule(instanceId: string,
  invokedFunctionArn: string,
  eventBridgeClient: EventBridge): Promise<void> {
  const stopTime = new Date(Date.now() + 2 * (60 * 60 * 1000));
  const hours = stopTime.getUTCHours();
  const minutes = stopTime.getUTCMinutes();
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
  const nextTriggerTimeTag: Tag = {
    Key: 'nextTriggerTime',
    Value: `${stopTime.toISOString()}`
  };
  const tagResourceCommandInput: TagResourceCommandInput = {
    ResourceARN: putRuleResult.RuleArn,
    Tags: [nextTriggerTimeTag]
  };
  console.debug(`tagResourceCommandInput = ${JSON.stringify(tagResourceCommandInput)}`);
  const tagResourceResult = await eventBridgeClient.tagResource(tagResourceCommandInput);
  console.debug(`tagResourceResult = ${JSON.stringify(tagResourceResult)}`);
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
}

async function startServer(instanceId: string,
  invokedFunctionArn: string,
  eventBridgeClient: EventBridge,
  ec2Client: EC2): Promise<void> {
  console.log('Creating EventBridge rule to stop server...');
  await createOrReplaceStopRule(instanceId, invokedFunctionArn, eventBridgeClient);

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

async function extendServer(instanceId: string,
  invokedFunctionArn: string,
  eventBridgeClient: EventBridge): Promise<void> {
  console.log('Extending server...');
  await createOrReplaceStopRule(instanceId, invokedFunctionArn, eventBridgeClient);
}
