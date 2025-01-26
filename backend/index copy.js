const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const PORT = 5000;

// OpenAI API Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Multer Setup for File Uploads (using memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint to Upload, Summarize, and Create CV
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded!" });
    }

    // Read and Extract Text from the PDF
    const pdfBuffer = req.file.buffer;
    const data = await pdfParse(pdfBuffer);
    const extractedText = data.text;

    console.log("Extracted Text:", extractedText);

    // Send Extracted Text to OpenAI API for Summarization
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI that extracts and organizes information into a CV format.",
        },
        {
          role: "user",
          content: `From the following text, create a CV in valid JSON format. Use the following structure:
      {
        "PersonalInformation": {
          "Name": "",
          "Address": "",
          "Phone": "",
          "Email": "",
          "DateOfBirth": "",
          "Age": "",
          "Gender": "",
          "CivilStatus": "",
          "Nationality": "",
          "NIC": ""
        },
        "Skills": [],
        "WorkExperience": [
          {
            "Role": "",
            "Company": "",
            "Duration": "",
            "Responsibilities": ""
          }
        ],
        "Education": [
          {
            "Degree": "",
            "Institution": "",
            "Year": "",
            "GPA": ""
          }
        ],
        "Achievements": []
      }
      Ensure the response is only valid JSON with no additional text or markdown formatting:\n\n${extractedText}`,
        },
      ],
    });

    let cvData;
    try {
      cvData = JSON.parse(response.choices[0].message.content.trim());
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return res.status(500).send({ message: "Failed to parse CV data." });
    }

    console.log("AI Response:", response.choices[0].message.content);

    // Send the CV Data Back to the Frontend
    res.send({}); // Parse and send JSON CV data
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).send({ message: "Failed to process PDF file." });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
