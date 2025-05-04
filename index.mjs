import 'dotenv/config';
import OpenAI from 'openai';
import readline from 'readline';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let state = {
  userHP: 100,
  aiHP: 100,
  turn: 0,
  userIntroduced: false,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getResponse(messages) {
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
  });
  return completion.choices[0].message.content;
}

async function gameLoop() {
  let messages = [
    {
      role: 'system',
      content: `
      You are Tariel, the legendary warrior from Georgian folklore, facing a rival in a turn-based battle. 
      
      Each round:
      - After responding in character, **you must end with this exact format** (don't include explanations):
      
      ---
      I take [X] damage.
      You take [Y] damage.
      ---
      
      Where X and Y are integers based on the creativity, strategy, or power of the user's move.
      
      Rules:
      - You are very strong. If the user's move is normal or weak, they deal only 0–10 damage.
      - If the user's move is strategic, clever, or mythically powerful, they may deal 15–40 damage.
      - You deal 15–30 damage on average, unless the user's move cleverly defends or counters you.
      - Never forget to include the damage summary at the end of each turn in that exact format.
      
      Begin by introducing yourself, then ask the user to introduce themselves in the same warrior tone.`,
      }
  ];

  console.log("The Warrior awaits...");

  while (state.userHP > 0 && state.aiHP > 0 && state.turn < 10) {
    await new Promise((resolve) => {
      rl.question('Your move: ', async (userInput) => {
        messages.push({ role: 'user', content: userInput });

        const response = await getResponse(messages);
        console.log('\n⚔️ Warrior:', response);

        // Extract damage dealt by both sides
        const userHit = parseInt(response.match(/you take (\d+)/i)?.[1]) || 0;
        const aiHit = parseInt(response.match(/I take (\d+)/i)?.[1]) || 0;

        state.userHP -= userHit;
        state.aiHP -= aiHit;
        state.turn += 1;

        messages.push({ role: 'assistant', content: response });
        function drawHP(hp, max = 100) {
            const percent = Math.max(0, Math.min(hp / max, 1));
            const blocks = Math.round(percent * 20);
            return '█'.repeat(blocks) + '░'.repeat(20 - blocks);
          }
          
          console.log(`\n❤️ Your HP: ${state.userHP} [${drawHP(state.userHP)}]`);
          console.log(`🛡️ Warrior HP: ${state.aiHP} [${drawHP(state.aiHP)}]\n`);
        //console.log(`\n❤️ Your HP: ${state.userHP} | 🛡️ Warrior HP: ${state.aiHP}\n`);

        resolve();
      });
    });
  }

  // Game Over
  rl.close();
  if (state.userHP <= 0) {
    console.log("💀 The Warrior sighs: 'You were not strong enough. Perhaps in another life.'");
  } else if (state.aiHP <= 0) {
    console.log("🏆 The Warrior kneels: 'At last... a rival worthy of legend!'");
  } else {
    console.log("⏳ The battle pauses. A rematch may come another day.");
  }
}

gameLoop();
