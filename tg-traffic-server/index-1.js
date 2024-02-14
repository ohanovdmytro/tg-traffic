const express = require("express");
const { TelegramClient } = require("telegram");
const { StoreSession } = require("telegram/sessions");
const fs = require("fs");
const cors = require("cors");

const app = express();
const port = 3000;

let stringSession = new StringSession("");

app.use(express.json());
app.use(cors());

app.post("/api/sendCode", async (req, res) => {
  try {
    const { apiId, apiHash, phoneNumber } = req.body;

    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    res.json({
      message: 'Code received. Please enter the code and press "Make CSV".',
      session: client.session.save(),
    });

    await client.start({
      phoneNumber: phoneNumber,
      phoneCode: async () =>
        await askQuestion("Please enter the code you received: "),
      onError: (err) => console.log(err),
    });
    console.log(client.session.save());
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred");
  }
});

app.post("/api/getGroups", async (req, res) => {
  try {
    const { apiId, apiHash, sessionString } = req.body;

    const client = new TelegramClient(sessionString, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.connect();

    const chats = await client.getDialogs();
    const groups = chats.filter((chat) => chat.isGroup);
    const groupTitles = groups.map((group) => group.title);

    res.json({ groupTitles: groupTitles });
  } catch (error) {
    console.error(error);
  }
});

app.post("/api/makeCsv", async (req, res) => {
  try {
    const { code, groupId, groupTitle } = req.body;
    const client = new TelegramClient(code, apiId, apiHash, {
      connectionRetries: 5,
    });

    const allParticipants = await client.getParticipants(groupId);
    const csvData = allParticipants.map((user) => {
      const username = user.username || "";
      const name = (user.firstName || "") + " " + (user.lastName || "");
      return [username, user.id, "", name, groupTitle, groupId];
    });

    const csvHeader = [
      "username",
      "user id",
      "access hash",
      "name",
      "group",
      "group id",
    ];
    const csvRows = [csvHeader, ...csvData];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    fs.writeFileSync("members.csv", csvContent, { encoding: "UTF-8" });
    res.json({ csvContent });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred");
  }
});

async function askQuestion(question) {
  return new Promise((resolve) => {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

const phoneCallback = callbackPromise();
const codeCallback = callbackPromise();
const passwordCallback = callbackPromise();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
