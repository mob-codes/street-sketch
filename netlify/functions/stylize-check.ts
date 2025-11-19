// netlify/functions/stylize-check.ts
import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

const getStoreName = () => {
  const context = process.env.CONTEXT || 'dev';
  return `stylized-images-${context}`;
}

// NEW V2 SYNTAX
export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  
  if (!jobId) {
    return new Response(JSON.stringify({ error: "Missing jobId" }), { status: 400 });
  }

  // Get store using the v2 context
  const store = getStore(getStoreName());
  
  // === THIS IS THE FIX ===
  // It's not store.getJSON(jobId, ...), it's store.get(jobId, ...)
  const jobData = await store.get(jobId, { type: 'json' });
  // === END OF FIX ===

  if (jobData) {
    if (jobData.status === "complete") {
      await store.delete(jobId);
      return new Response(JSON.stringify({ 
        status: "complete", 
        generatedUrl: jobData.generatedUrl 
      }), { status: 200 });
    } else if (jobData.status === "error") {
      await store.delete(jobId);
      return new Response(JSON.stringify({ 
        status: "error", 
        message: jobData.message 
      }), { status: 500 });
    }
  }

  // Job not found yet
  return new Response(JSON.stringify({ status: "pending" }), { status: 202 });
};