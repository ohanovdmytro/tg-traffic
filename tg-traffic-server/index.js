const express = require("express");
const { Api, TelegramClient } = require("telegram");
const { StoreSession } = require("telegram/sessions");
const fs = require("fs");
const cors = require("cors");

const app = express();
const port = 3000;

const session = new StoreSession("my_session");

app.use(express.json());
app.use(cors());

let phoneCodeHash;

app.post("/api/onboarding", async (req, res) => {
  const { apiId, apiHash, phoneNumber } = req.body;

  try {
    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.connect();

    const result = await client.sendCode(
      {
        apiId: apiId,
        apiHash: apiHash,
      },
      phoneNumber
    );

    phoneCodeHash = result.phoneCodeHash;

    res.json({
      isCodeSent: true,
      message: `Code sent. Enter the code and press "Send code" button.`,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ isCodeSent: false, message: "Error sending code!" });
  }
});

app.post("/api/getGroups", async (req, res) => {
  try {
    const { apiId, apiHash, phoneNumber, code } = req.body;
    const client = new TelegramClient(
      new StoreSession("my_session"),
      apiId,
      apiHash,
      {
        connectionRetries: 5,
      }
    );

    await client.connect();

    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: phoneNumber,
        phoneCodeHash,
        phoneCode: code,
      })
    );

    const chats = await client.getDialogs();
    const groups = chats.filter((chat) => chat.isGroup);
    const groupTitles = groups.map((group) => group.title);
    const groupIds = groups.map((group) => group.id);

    res.json({
      isOnboarded: true,
      groupTitles: groupTitles,
      groupIds: groupIds,
      message: "Choose a group to make a members list.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/makeCsv", async (req, res) => {
  try {
    const { apiId, apiHash, groupId, groupTitle } = req.body;

    const client = new TelegramClient(
      new StoreSession("my_session"),
      apiId,
      apiHash,
      {
        connectionRetries: 5,
      }
    );

    await client.connect();

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
