import React, { useState } from "react";

const PdfSummarizer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobUrl, setJobUrl] = useState("");
  const [cvData, setCvData] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUrlChange = (e) => {
    setJobUrl(e.target.value);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile || !jobUrl) {
      setStatus("Please select a file and provide a job URL.");
      return;
    }

    const formData = new FormData();
    formData.append("pdfFile", selectedFile);
    formData.append("jobUrl", jobUrl);

    try {
      setStatus("Uploading and processing...");
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCvData(data);
        setStatus("CV generated successfully!");
      } else {
        setStatus("Failed to process the file.");
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus("An error occurred. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Upload a PDF File and Provide Job URL</h2>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        <input
          type="text"
          placeholder="Enter job vacancy URL"
          value={jobUrl}
          onChange={handleUrlChange}
          style={{ marginLeft: "10px", width: "300px" }}
        />
        <button type="submit" style={{ marginLeft: "10px" }}>
          Upload and Generate CV
        </button>
      </form>
      {status && <p>{status}</p>}
      {cvData && (
        <div>
          <h3>Generated CV:</h3>
          <pre>{JSON.stringify(cvData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PdfSummarizer;
