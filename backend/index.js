const express = require("express");
const cors = require("cors"); // Import cors
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON parsing

// API Endpoints
app.get("/", (req, res) => {
  res.send("Welcome to the Node.js API with CORS enabled!");
});

app.post("/data", (req, res) => {
  const { name, age } = req.body;
  res.send(`Received data: Name - ${name}, Age - ${age}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
