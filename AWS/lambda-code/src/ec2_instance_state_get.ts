import {EC2, InstanceState} from '@aws-sdk/client-ec2';

async function lambdaHandler(event: any): Promise<any> {
  try {
    // TODO pass in region
    const client = new EC2({region: 'eu-west-1'});
    var params = {
      DryRun: false
    };

    const data = await client.describeInstances(params);

    type ReturnData = {
      KeyName: string;
      LaunchTime: Date | undefined;
      State: InstanceState | undefined;
    } | undefined;
    let returnData: ReturnData;
    // TODO pass in instance name.
    // For now just look for an instance called "minecraft-ubuntu"
    data.Reservations?.every((reservation) => {
      reservation?.Instances?.every((instance) => {
        if(instance.KeyName == "minecraft-ubuntu") {
          returnData = {
            KeyName: instance.KeyName,
            LaunchTime: instance.LaunchTime,
            State: instance.State
          };
          return false;
        }
      })
      if(returnData) {
        return false;
      }
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