import { GoogleGenAI, Type } from '@google/genai';
import { config } from 'dotenv';

config();

const apiKey = process.env.GEMINI_API_KEY;

async function testGeminiAPI() {
  console.log('🧠 Testing new Gemini API integration...');
  
  try {
    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Test basic content generation
    console.log('Testing basic content generation...');
    const basicResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Explain how AI works in a few words",
    });
    
    console.log('✅ Basic response received:', basicResponse.text);
    
    // Test structured output
    console.log('\nTesting structured output...');
    const structuredResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "List a few popular cookie recipes, and include the amounts of ingredients.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              recipeName: {
                type: Type.STRING,
              },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },
            },
            propertyOrdering: ["recipeName", "ingredients"],
          },
        },
      },
    });
    
    console.log('✅ Structured response received:', structuredResponse.text);
    
    // Try to parse the structured response
    try {
      const responseText = structuredResponse.text;
      if (!responseText) {
        throw new Error('No response text received');
      }
      const parsed = JSON.parse(responseText);
      console.log('✅ Successfully parsed JSON response');
      console.log('Number of recipes:', parsed.length);
      if (parsed.length > 0) {
        console.log('First recipe:', parsed[0].recipeName);
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse structured response as JSON:', parseError);
    }
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    
    if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
      console.log('💡 Make sure you have set the GEMINI_API_KEY environment variable');
      console.log('💡 You can set it in your .env file or export it in your shell');
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testGeminiAPI();
}

export { testGeminiAPI };
