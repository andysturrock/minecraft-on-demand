async function lambdaHandler(event: any): Promise<any> {
  try {

    const now = Date.now();
    return {
      statusCode: 200,
      body: `${JSON.stringify({ "Status": `TODO` })}`
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