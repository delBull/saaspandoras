const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    });
    console.log(response.choices[0].message.content);
  } catch (err) {
    console.error("OpenAI Error:", err.message);
  }
}
test();
