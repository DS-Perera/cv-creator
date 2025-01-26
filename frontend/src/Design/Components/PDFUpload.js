import React, { useState } from "react";

function PDFUpload() {
  const [file, setFile] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("pdfFile", file);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file.");
      }

      const data = await response.json();
      setCvData(data.cvData);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Upload PDF and Generate CV</h1>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {cvData && (
        <div>
          <h2>Generated CV:</h2>
          <pre>{JSON.stringify(cvData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default PDFUpload;
