// src/pages/api/estimate-hours.ts
import type { APIRoute } from 'astro';
import simpleGit from 'simple-git';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
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
    
    // Extract repo name from URL
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || '';
    
    // Use OS temp directory with a random UUID to avoid collisions
    const tempDirPath = `${tmpdir()}/${randomUUID()}-${repoName}`;
    console.log(`Using temp directory: ${tempDirPath}`);
    
    // Clone and analyze the repository
    const git = simpleGit();
    await git.clone(repoUrl, tempDirPath);
    const log = await simpleGit(tempDirPath).log();
    const commitTimestamps = log.all.map(commit => new Date(commit.date));
    const estimatedHours = estimateCodingHours(commitTimestamps);
    
    console.log(`Repository analysis complete. Estimated hours: ${estimatedHours}`);
    
    // Clean up
    try {
      await git.cwd(tempDirPath).clean('f', ['-d', '-x']);
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up temp directory:', cleanupError);
    }
    
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