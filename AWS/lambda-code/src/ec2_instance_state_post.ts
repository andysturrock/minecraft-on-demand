import util from 'util';
import {EC2} from '@aws-sdk/client-ec2';

async function lambdaHandler(event: any): Promise<any> {
  try {
    console.log(`event: ${util.inspect(event)}`);
    const body = JSON.parse(event.body);
    const action = body?.action;
    const instanceId = body?.InstanceId;

    // TODO pass in region
    const client = new EC2({region: 'eu-west-2'});
    var params = {
      InstanceIds: [instanceId],
      DryRun: false
    };

    if(action === "start") {
      console.log("Starting server...");
      const data = await client.startInstances(params);
      console.log(`start data: ${util.inspect(data)}`);
    } else if(action === "stop") {
      console.log("Stopping server...");
      const data = await client.stopInstances(params);
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