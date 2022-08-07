import util from 'util';
import {EC2, InstanceState} from '@aws-sdk/client-ec2';

async function lambdaHandler(event: any): Promise<any> {
  try {
    // TODO pass in region
    const client = new EC2({region: 'eu-west-2'});
    var params = {
      DryRun: false
    };

    const data = await client.describeInstances(params);

    type ReturnData = {
      InstanceId: string;
      LaunchTime: Date | undefined;
      State: InstanceState | undefined;
    } | undefined;
    let returnData: ReturnData = undefined;
    // TODO pass in instance id.
    // For now just look for an instance id i-03a206101969e1f87
    data.Reservations?.find((reservation) => {
      reservation?.Instances?.find((instance) => {
        if(instance.InstanceId === "i-03a206101969e1f87") {
          returnData = {
            InstanceId: instance.InstanceId,
            LaunchTime: instance.LaunchTime,
            State: instance.State
          };
          return true;
        }
        return false;
      })
      return returnData !== undefined;
    });

    const httpReturn = returnData === undefined ?
    {
        statusCode: 200,
        body: "{}"
    } :
    {
      statusCode: 200,
      body: JSON.stringify(returnData)
    };
    console.log(`Returning ${util.inspect(httpReturn)}`);
    return httpReturn;
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