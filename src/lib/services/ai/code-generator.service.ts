import { claudeClient } from '../../clients/ai/claude';

export interface CodeGenerationRequest {
  prompt: string;
  model?: string;
  language?: 'ja' | 'en';
}

export interface CodeGenerationResponse {
  files: Record<string, string>;
  description: string;
  instructions?: string;
  framework: string;
  language: string;
  styling: string;
  usedModel?: string;
  warnings?: string[];
}

export interface GeneratedCode {
  html: string;
  css: string;
  js: string;
  description: string;
  features: string[];
}

export class CodeGeneratorService {
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    try {

      const response = await claudeClient.generateCode(request.prompt, request.language);
      
      const parsedCode = this.parseGeneratedCode(response);
      const cleanedFiles = this.cleanExternalReferences({
        'index.html': parsedCode.html,
        'style.css': parsedCode.css,
        'script.js': parsedCode.js
      });

      const embeddedHTML = this.embedFilesInHTML(
        cleanedFiles['index.html'],
        cleanedFiles
      );

      return {
        files: {
          'index.html': embeddedHTML
        },
        description: parsedCode.description,
        framework: 'Vanilla JavaScript',
        language: request.language || 'ja',
        styling: 'CSS3',
        usedModel: 'claude-3-5-sonnet-20241022',
        warnings: this.validateGeneratedCode(embeddedHTML)
      };

    } catch (error) {
      console.error('❌ Code generation failed:', error);
      throw new Error(`Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseGeneratedCode(response: string): GeneratedCode {
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const parsed = JSON.parse(jsonStr);
        return {
          html: parsed.html || '',
          css: parsed.css || '',
          js: parsed.js || '',
          description: parsed.description || 'Generated application',
          features: parsed.features || []
        };
      }

      const directJsonMatch = response.match(/^\s*\{[\s\S]*\}\s*$/);
      if (directJsonMatch) {
        const parsed = JSON.parse(response);
        return {
          html: parsed.html || '',
          css: parsed.css || '',
          js: parsed.js || '',
          description: parsed.description || 'Generated application',
          features: parsed.features || []
        };
      }

      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('❌ Failed to parse generated code:', error);
      throw new Error('Failed to parse generated code');
    }
  }

  private cleanExternalReferences(files: Record<string, string>): Record<string, string> {
    const cleanedFiles = { ...files };
    
    Object.keys(cleanedFiles).forEach(filename => {
      if (filename.endsWith('.html')) {
        let html = cleanedFiles[filename];
        
        
        // Remove external CSS links
        html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*\.css["'][^>]*\/?>/gi, '');
        html = html.replace(/<link[^>]*href=["'][^"']*\.css["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi, '');
        
        // Remove external JS script tags
        html = html.replace(/<script[^>]*src=["'][^"']*\.js["'][^>]*>[\s\S]*?<\/script>/gi, '');
        
        // Remove other external resources
        html = html.replace(/<link[^>]*href=["'][^"']*\.(css|js|ico|png|jpg|gif|svg|woff|woff2|ttf|eot)["'][^>]*>/gi, '');
        
        cleanedFiles[filename] = html;
      }
    });
    
    return cleanedFiles;
  }

  private embedFilesInHTML(html: string, files: Record<string, string>): string {
    let embeddedHTML = html;
    
    // Find CSS content
    const cssContent = files['style.css'] || '';
    if (cssContent && !embeddedHTML.includes('<style>')) {
      const styleTag = `<style>\n${cssContent}\n</style>`;
      
      if (embeddedHTML.includes('</head>')) {
        embeddedHTML = embeddedHTML.replace('</head>', `${styleTag}\n</head>`);
      } else {
        embeddedHTML = styleTag + '\n' + embeddedHTML;
      }
    }
    
    // Find JS content
    const jsContent = files['script.js'] || '';
    if (jsContent && !embeddedHTML.includes('<script>')) {
      const scriptTag = `<script>\n${jsContent}\n</script>`;
      
      if (embeddedHTML.includes('</body>')) {
        embeddedHTML = embeddedHTML.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        embeddedHTML = embeddedHTML + '\n' + scriptTag;
      }
    }
    
    return embeddedHTML;
  }

  private validateGeneratedCode(html: string): string[] {
    const warnings: string[] = [];
    
    // Check for external dependencies
    if (html.includes('http://') || html.includes('https://')) {
      warnings.push('External URLs detected - may not work in iframe');
    }
    
    // Check for basic HTML structure
    if (!html.includes('<!DOCTYPE html>')) {
      warnings.push('Missing DOCTYPE declaration');
    }
    
    if (!html.includes('<html>') && !html.includes('<html ')) {
      warnings.push('Missing HTML tag');
    }
    
    // Check for JavaScript errors (basic)
    if (html.includes('console.error') || html.includes('throw new Error')) {
      warnings.push('Code contains error handling - review for production use');
    }
    
    return warnings;
  }
}

export const codeGeneratorService = new CodeGeneratorService();