// src/components/Hero.jsx
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";

// Replace this with your actual backend URL
const API_URL = "https://api-wrapped.onrender.com/upload-and-wrap";

const Hero = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // --- Dropzone Handler ---
  const onDrop = useCallback((acceptedFiles) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      if (uploadedFile.type !== "application/pdf") {
        setError("Only M-Pesa Statement PDF files are supported.");
        setFile(null);
        return;
      }
      setFile(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  // --- Upload Handler ---
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process statement.");
      }

      const analysisData = await response.json();
      onAnalysisComplete(analysisData); // Pass data to App.jsx
    } catch (err) {
      setError(err.message || "An unknown error occurred during upload.");
      console.error("Upload Error:", err);
    } finally {
      setIsUploading(false);
      setFile(null); // Clear file after attempt
    }
  };

  return (
    <div className="w-full h-screen flex justify-center items-start bg-[#0F0A19] ">
      <div className=" w-full flex justify-center px-4 md:px-0 ">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0F0A19] p-8 md:p-10 rounded-xl shadow-2xl w-full  max-w-lg text-center"
        >
          {/* Your Original Hero Content */}
          <p className="text-3xl font-bold text-[#8BC53F] py-3 mb-2">
            See how your M-Pesa year really went
          </p>
          <p className="text-white py-2 mb-6">
            Upload your PDF statement to get your personalized, Wrapped
            experience.
          </p>

          {/* Dropzone Area */}
          <div
            {...getRootProps()}
            className={`
            border-2 border-dashed rounded-lg p-10 text-center transition duration-200 cursor-pointer mb-4
            ${
              isDragActive
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }
            `}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-600 font-semibold">
                Drop the M-Pesa PDF here...
              </p>
            ) : (
              <>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Drag &amp; drop statement or **click to select file**.
                </p>
              </>
            )}
          </div>

          {/* File Status & Error Message */}
          <div className="mt-4 min-h-[60px]">
            {error && (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            )}
            {file && !error && (
              <div className="flex justify-between items-center bg-green-100 p-3 rounded-md">
                <span className="text-green-800 font-medium truncate">
                  ✅ Ready: **{file.name}**
                </span>
                <button
                  onClick={() => setFile(null)}
                  className="ml-4 text-red-500 hover:text-red-700 text-sm"
                  disabled={isUploading}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Main Action Button (using the blur hover effect) */}
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`
                w-full mt-6 p-4 rounded-full text-white font-bold text-lg 
                transition duration-300 
                ${
                  !file || isUploading
                    ? " bg-linear-to-r from-[#8BC53F] via-[#8BC53F] to-[#EB2026] cursor-not-allowed"
                    : "bg-linear-to-r from-[#8BC53F] via-[#EB2026] to-[#EB2026] hover: cursor-pointer"
                }
            `}
          >
            {isUploading
              ? "Processing Statement..."
              : "Upload M-Pesa Statement"}
          </button>

          {isUploading && (
            <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: "0%" }}
                animate={{ width: ["0%", "100%", "0%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
