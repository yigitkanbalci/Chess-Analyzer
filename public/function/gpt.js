import {OpenAI} from 'openai';
import dotenv from 'dotenv';
dotenv.config();


const openai = new OpenAI(process.env.OPENAI_API_KEY);


async function evaluateChessMove(fenString, moveString) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{role:'user', content:`Evaluate why the following chess move, "${moveString}" in the given position FEN string: "${fenString}" is good move to make. Use no more than 100 tokens.`}],
        max_tokens: 100,
      });
  
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error querying OpenAI:", error);
    }
  }

  export {evaluateChessMove};