import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Flex,
} from "@chakra-ui/react";

function App() {
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [groupTitles, setGroupTitles] = useState([]);
  const [groupIds, setGroupIds] = useState([]);
  const [code, setCode] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(0);

  const handleSendCode = async () => {
    try {
      const response = await axios.post("http://localhost:3000/api/sendCode", {
        apiId: Number(apiId),
        apiHash: apiHash,
        phoneNumber: phoneNumber,
      });
      setMessage(response.data.message);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const getGroups = async () => {
    try {
      const response = await axios.post("http://localhost:3000/api/getGroups", {
        apiId: Number(apiId),
        apiHash: apiHash,
      });

      setGroupTitles(response.data.groupTitles);
      setGroupIds(response.data.groupIds);
      console.log(groupTitles);
      console.log(groupIds);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const handleMakeCsv = async () => {
    try {
      const response = await axios.post("http://localhost:3000/api/makeCsv", {
        apiId: Number(apiId),
        apiHash: apiHash,
        groupId: groupIds[selectedGroupId],
        groupTitle: groupTitles[selectedGroupId],
      });

      setCsvContent(response.data.csvContent);
      setMessage("CSV file created successfully.");
    } catch (e: any) {
      console.error(e.message);
    }
  };

  return (
    <Box p={4} maxW="400px" mx="auto">
      <FormControl id="apiId" isRequired>
        <FormLabel>API ID</FormLabel>
        <Input
          type="text"
          value={apiId}
          onChange={(e) => setApiId(e.target.value)}
        />
      </FormControl>
      <FormControl id="apiHash" isRequired>
        <FormLabel>API Hash</FormLabel>
        <Input
          type="text"
          value={apiHash}
          onChange={(e) => setApiHash(e.target.value)}
        />
      </FormControl>
      <FormControl id="phoneNumber" isRequired>
        <FormLabel>Phone Number</FormLabel>
        <Input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </FormControl>
      <Button mt={4} colorScheme="teal" onClick={handleSendCode}>
        Send Code
      </Button>

      {message && (
        <>
          <FormControl id="code" mt={4} mb={4} isRequired>
            <FormLabel>Code</FormLabel>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </FormControl>
          <Button mt={4} colorScheme="teal" w="100%" onClick={getGroups}>
            Get Groups
          </Button>
        </>
      )}

      {message && (
        <>
          <Box mt={4} color={groupTitles ? "green" : "red"}>
            {message}
          </Box>
        </>
      )}

      {groupTitles && (
        <Box mt={4}>
          {groupTitles.map((title, index) => (
            <Flex
              mt={4}
              justifyContent="space-between"
              alignItems="center"
              key={index}
            >
              <Box>{title}</Box>
              <Box>
                <Button
                  onChange={() => setSelectedGroupId(index)}
                  colorScheme="blue"
                  w="100%"
                  onClick={handleMakeCsv}
                >
                  Make CSV
                </Button>
              </Box>
            </Flex>
          ))}
        </Box>
      )}

      {csvContent && (
        <Box mt={4}>
          <Button
            as="a"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(
              csvContent
            )}`}
            download="members.csv"
            colorScheme="teal"
          >
            Download CSV
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default App;
