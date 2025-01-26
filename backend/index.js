const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");
const axios = require("axios");
const cheerio = require("cheerio");
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

// Function to scrape and summarize job vacancy details from a URL
const summarizeJobDetails = async (jobUrl) => {
  try {
    const { data } = await axios.get(jobUrl);
    const $ = cheerio.load(data);

    let jobContent = "";
    $("h1, h2, h3, p, li").each((index, element) => {
      jobContent += $(element).text().trim() + " ";
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI that extracts job details from web content and returns it in structured JSON format.",
        },
        {
          role: "user",
          content: `Extract and summarize the following job listing content:
          \n${jobContent}\n\nProvide a summary in JSON format with fields: title, jobDescription, and keyRequirements.`,
        },
      ],
    });

    const jsonResponse = response.choices[0].message.content.trim();
    return JSON.parse(jsonResponse);
  } catch (error) {
    console.error("Error summarizing job details:", error);
    throw new Error("Failed to summarize job details.");
  }
};

// Endpoint to Upload, Summarize, and Create CV
app.post("/upload", upload.single("pdfFile"), async (req, res) => {
  try {
    if (!req.file || !req.body.jobUrl) {
      return res
        .status(400)
        .send({ message: "File and job URL are required!" });
    }

    const jobUrl = req.body.jobUrl;
    const jobSummary = await summarizeJobDetails(jobUrl);

    // Read and Extract Text from the PDF
    const pdfBuffer = req.file.buffer;
    const data = await pdfParse(pdfBuffer);
    const extractedText = data.text;

    console.log("Extracted Text:", extractedText);
    console.log("Job Summary:", jobSummary);

    // Send Extracted Text and Job Summary to OpenAI API for CV creation
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI that extracts and organizes information into a CV format relevant to a job description.",
        },
        {
          role: "user",
          content: `From the following text and job summary, create a CV in valid JSON format with these sections:
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
              "AboutMe": "",
              "SkillsRelevantToJob": [],
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
            Ensure the response is only valid JSON with no additional text or markdown formatting:
            \n\nExtracted Text:\n${extractedText}\n\nJob Summary:\n${JSON.stringify(
            jobSummary
          )}`,
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
    res.send(cvData);
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).send({ message: "Failed to process PDF file." });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
