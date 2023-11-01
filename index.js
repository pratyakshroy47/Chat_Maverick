require("dotenv/config");
const { Client, GatewayIntentBits } = require("discord.js");
const openai = require("openai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log("The bot is online.");
});

const IGNORE_PREFIX = "!";
const CHANNELS = ['881572362418524211', '862777407697322004', '985941954116321300', '737565091393831068'];

client.on('messageCreate', async (message) => {
  if (message.author.bot || message.content.startsWith(IGNORE_PREFIX)) return;
  if (!CHANNELS.includes(message.channel.id) && !message.mentions.users.has(client.user.id)) return;

  await message.channel.sendTyping();

  const sendTypingInterval = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  let conversation = [
    { role: 'system', content: 'Chat GPT is a friendly chatbot.' }
  ];

  let prevMessages = await message.channel.messages.fetch({ limit: 10 });
  prevMessages = prevMessages.filter(msg => !msg.author.bot && !msg.content.startsWith(IGNORE_PREFIX)).array().reverse();

  prevMessages.forEach((msg) => {
    const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

    conversation.push({
      role: msg.author.id === client.user.id ? 'assistant' : 'user',
      name: username,
      content: msg.content,
    });
  });

  try {
    const response = await openai.Chat.Completions.create({
      model: 'gpt-3.5-turbo', // Replace with the appropriate model name if different
      messages: conversation,
    });

    clearInterval(sendTypingInterval);

    if (response.choices && response.choices.length > 0) {
      const responseMessage = response.choices[0].message.content;
      const chunkSizeLimit = 2000;

      for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
        const chunk = responseMessage.substring(i, i + chunkSizeLimit);
        await message.reply(chunk);
      }
    } else {
      message.reply("I'm having some trouble with OpenAI. Try again in a moment.");
    }
  } catch (error) {
    console.error('OpenAI Error:', error);
    clearInterval(sendTypingInterval);
    message.reply("I encountered an error while processing your request. Please try again later.");
  }
});

client.login(process.env.TOKEN);
