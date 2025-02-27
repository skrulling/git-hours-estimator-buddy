// src/pages/api/estimate-hours.ts
import type { APIRoute } from 'astro';
import { estimateCodingHours } from '../../lib/estimateUtils';

export const GET: APIRoute = async ({ request }) => {
  console.log('Estimate hours GET API called');
  
  try {
    // Get the repository URL from query parameters
    const url = new URL(request.url);
    const repoUrl = url.searchParams.get('repoUrl');
    console.log('Repository URL:', repoUrl);
    
    // Validate the repository URL
    if (!repoUrl) {
      return new Response(
        JSON.stringify({ error: 'Repository URL is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing repository: ${repoUrl}`);
    
    // Clone and analyze the repository
    const estimatedHours = await estimateRepoTime(repoUrl);
    
    console.log(`Repository analysis complete. Estimated hours: ${estimatedHours}`);
    
    return new Response(
      JSON.stringify({ hours: estimatedHours }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error processing repository:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process repository',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
async function getCommitTimestamps(repoUrl: string): Promise<Date[]> {
  const apiUrl = repoUrl.replace("https://github.com/", "https://api.github.com/repos/") + "/commits";
  
  const response = await fetch(apiUrl, {
      headers: { "User-Agent": "Cloudflare-Worker" }
  });

  if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const commits = await response.json() as Array<any>;
  return commits.map(commit => new Date(commit.commit.author.date));
}

async function estimateRepoTime(repoUrl: string) {
  const commitTimestamps = await getCommitTimestamps(repoUrl);
  return estimateCodingHours(commitTimestamps);
}
