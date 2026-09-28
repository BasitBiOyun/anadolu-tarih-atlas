import { Researcher } from './research.ts';

// Uses the deployer's ADC. Runtime service-account access is verified by the pilot.
// Never print credentials or full API error objects.
async function main() {
  const researcher = new Researcher();
  for (const model of new Set([researcher.model, researcher.checker])) {
    console.log(JSON.stringify({stage:'model_preflight',model,status:'checking'}));
    const response = await researcher.ai.models.generateContent({
      model, contents:'Return the JSON object {"ok":true}.',
      config:{responseMimeType:'application/json',maxOutputTokens:2048},
    });
    if (response.candidates?.[0]?.finishReason !== 'STOP' || JSON.parse(response.text ?? '{}').ok !== true) {
      throw new Error(`Structured output preflight failed for ${model}`);
    }
    console.log(JSON.stringify({stage:'model_preflight',model,status:'ok'}));
  }
  const search = await researcher.ai.models.generateContent({
    model:researcher.model,
    contents:'Search the web for the official UNESCO page for the archaeological site of Arslantepe. Return its URL.',
    config:{tools:[{googleSearch:{}}],maxOutputTokens:2048},
  });
  const chunks = search.candidates?.flatMap(c=>c.groundingMetadata?.groundingChunks ?? []) ?? [];
  if (!chunks.some(c=>c.web?.uri)) throw new Error('Search preflight returned no grounded URLs');
  console.log(JSON.stringify({stage:'search_preflight',status:'ok',groundedUrls:chunks.length}));
}
main().catch(error=>{
  console.error(JSON.stringify({stage:'model_preflight',status:'failed',error:String(error?.message ?? error).slice(0,1200)}));
  process.exitCode=1;
});
