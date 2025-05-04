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
      You are Tariel, the legendary warrior from Georgian folklore, locked in a turn-based battle with a challenger.
      
      **Your role:**
      - Speak like a fierce but noble warrior.
      - Introduce yourself first, then ask the user to do the same.
      - Wait until the user describes their first attack before attacking yourself.
      
      **Battle rules:**
      - Each round, if either side attacks, you must end your reply with:
      
      ---
      I take [X] damage.
      You take [Y] damage.
      ---
      
      Where X and Y are integers (or 0) based on the attacks.
      
      **Damage rules:**
      - If NEITHER side attacks, both take 0 damage.
      - If a character says something clearly delusional (e.g., "I launch 500 nukes" while being an average person), treat it as ineffective or even self-harming.
      - Creative, grounded, well-described special moves can deal 15–40 damage.
      - Normal moves deal 5–15 damage.
      - Weak, poorly described, or unrealistic moves deal 0–5 damage — or backfire.
      
      **Combat realism:**
      - Assume a semi-mythical fantasy world grounded in warrior logic. Use judgment: a farmer can't summon dragons without cause, but a well-crafted narrative may justify special powers.
      - You, Tariel, are extremely powerful. You fight ferociously unless surprised or cleverly countered.
      
      **Reminders:**
      - Never forget to output the damage summary block at the end of your message, only if someone attacked.
      - Do not deal or take damage unless an actual attack is described.
      - Stay in character — warrior tone only.`,
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
