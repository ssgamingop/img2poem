
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Attempt to read the API key from environment variables
const apiKey = process.env.GOOGLE_API_KEY;

// Log an error if the API key is not found in a production environment
// VERCEL_ENV is 'production' for production deployments, 'preview' for preview deployments.
if (!apiKey && (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview')) {
  console.error("CRITICAL_ERROR: GOOGLE_API_KEY environment variable is not set or not accessible in the Vercel environment. Please check Vercel project settings.");
}

export const ai = genkit({
  plugins: [
    // Explicitly pass the API key. If apiKey is undefined here,
    // the googleAI plugin might still try to find it from process.env by default,
    // but being explicit can help in some cases or with diagnostics.
    googleAI(apiKey ? { apiKey } : undefined)
  ],
  model: 'googleai/gemini-2.0-flash',
});

