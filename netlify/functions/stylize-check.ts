// netlify/functions/stylize-check.ts
import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const handler: Handler = async (event) => {
  // Get the jobId from the query parameters
  const jobId = event.queryStringParameters?.jobId;
  
  if (!jobId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing jobId" }) };
  }

  const store = getStore("stylized-images");
  
  // Check the blob store for the job
  const jobData = await store.getJSON(jobId, { type: 'json' });

  if (jobData) {
    // Job is found! Send the result (complete or error)
    if (jobData.status === "complete") {
      await store.delete(jobId); // Clean up the blob
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: "complete", 
          generatedUrl: jobData.generatedUrl 
        })
      };
    } else if (jobData.status === "error") {
      await store.delete(jobId); // Clean up the blob
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          status: "error", 
          message: jobData.message 
        })
      };
    }
  }

  // Job not found yet, tell the frontend to keep polling
  return {
    statusCode: 202, // 202 "Accepted" is a good code for "pending"
    body: JSON.stringify({ status: "pending" })
  };
};

export { handler };