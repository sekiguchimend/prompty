import { NextApiRequest, NextApiResponse } from 'next';
import { codeGeneratorService, CodeGenerationRequest } from '../../../../lib/services/ai/code-generator.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model, language }: CodeGenerationRequest = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }


    const result = await codeGeneratorService.generateCode({
      prompt,
      model,
      language: language || 'ja'
    });


    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Code generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      error: 'Code generation failed',
      details: errorMessage
    });
  }
}