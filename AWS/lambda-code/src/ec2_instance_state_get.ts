async function lambdaHandler(event: any): Promise<any> {
  try {
    const queries = JSON.stringify(event.queryStringParameters);
    console.debug(`ec2_instance_state_get queries = ${queries}`);

    return {
      statusCode: 200,
      body: `ec2_instance_state_get: ${queries}`
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