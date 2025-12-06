import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Hero from "./components/Hero";
import WrappedDashboard from "./components/WrappedDashboard";

function App() {
  const [analysisData, setAnalysisData] = useState(null);

  const handleAnalysisComplete = (data) => {
    console.log("Analysis complete:", data);
    setAnalysisData(data);
  };

  const handleReset = () => {
    setAnalysisData(null);
  };

  return (
    <div className="bg-[#0F0A19] min-h-screen w-full">
      <Header />

      {/* If NO results yet → show Hero */}
      {!analysisData ? (
        <Hero onAnalysisComplete={handleAnalysisComplete} />
      ) : (
        <WrappedDashboard data={analysisData} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
