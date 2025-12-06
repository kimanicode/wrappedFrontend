import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { GoogleGenAI } from "@google/genai";

/*
  NOTE:
  - Make sure VITE_GEMINI_API_KEY is defined in your .env (Vite) as:
    VITE_GEMINI_API_KEY=your_api_key_here
*/

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

/* ---------- Small helpers ---------- */
const formatCurrency = (amount) => {
  const n = Number(amount) || 0;
  const formatted = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(n);
  return formatted.replace("KES", "KSh ");
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

/* ---------- AI helper (inline) ---------- */
const createGenAI = () => {
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("Failed to init GoogleGenAI", err);
    return null;
  }
};

export async function generateFinancialInsights({
  totalSent,
  totalReceived,
  biggestMonth,
  totalTransactions,
}) {
  try {
    const ai = createGenAI();
    const prompt = `
Return ONLY valid JSON. No commentary. Currency should be in Kenya shillings(Ksh)

{
  "personality": "<Make it energetic, Gen-Z friendly & Kenyan.>",
  "poster_caption": "<short caption>",
  "captions": {
    "total_sent": "<1 line caption>",
    "total_received": "<1 line caption>",
    "biggest_month": "<1 line caption>",
    "transactions": "<1 line caption>"
  }
}

DATA:
- total sent: ${totalSent}
- total received: ${totalReceived}
- biggest month: ${JSON.stringify(biggestMonth)}
- total tx: ${totalTransactions}
`;

    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // 1. Get the raw text property (assuming you fixed the 'res.text is not a function' error)
    const rawText = res.text;

    // 2. Clean the text: Remove leading/trailing markdown code fences and 'json' tag,
    //    and trim any extra whitespace.
    const cleanedText = rawText
      .replace(/^```json\s*|```\s*$/g, "") // Remove ```json and ```, globally
      .trim();

    // 3. Parse the cleaned text
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("AI parse error:", e);
    return null;
  }
}

/* ---------- Component ---------- */
const WrappedDashboard = ({ data, onReset }) => {
  // data: expected shape from your backend (matching earlier messages)
  const totalSent = data?.total_sent ?? 0;
  const totalReceived = data?.total_received ?? 0;
  const totalMoved = totalSent + totalReceived;
  const biggestMonth = data?.biggest_month ?? { month: "N/A", amount: 0 };
  const earlyBird = data?.early_bird_tx ?? { time: "N/A", details: "" };
  const topMerchants = (data?.top_merchants ?? []).slice(0, 3);
  const txCount = data?.total_transactions ?? 0;

  // UI + AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [insights, setInsights] = useState({
    personality: null,
    poster_caption: null,
    captions: {},
  });

  // Refs
  const posterRef = useRef(null);
  const carouselRef = useRef(null);

  // init ai client once
  const aiClient = useRef(createGenAI()).current;

  // fetch AI insights on mount / when data changes
  useEffect(() => {
    async function loadAI() {
      const ai = await generateFinancialInsights({
        totalSent,
        totalReceived,
        biggestMonth,
        totalTransactions: data.total_transactions,
      });
      setInsights(ai);
    }
    loadAI();
  }, []);

  /* ---------- poster download (only poster) ---------- */
  const downloadPoster = async () => {
    if (!posterRef.current) return;
    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const link = document.createElement("a");
      link.download = "mpesa-wrapped-2025.png";
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Poster download failed:", err);
      alert("Failed to download poster. Try again.");
    }
  };

  /* ---------- sharing ---------- */
  const sharePosterViaWebShare = async () => {
    if (!navigator.share)
      return alert("Sharing not supported on this browser/device.");
    if (!posterRef.current) return;

    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "mpesa-wrapped-2025.png", {
        type: "image/png",
      });

      // check navigator.canShare for file support
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My M-Pesa Wrapped 2025",
          text: insights.poster_caption || "Check my M-Pesa Wrapped!",
        });
      } else {
        // fallback: open share dialog with url/text only
        alert(
          "Native image share not supported. We'll open a shareable page instead."
        );
        const shareUrl = `${window.location.href}`; // or generate a hosted share page
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            insights.poster_caption || "My M-Pesa Wrapped!"
          )}&url=${encodeURIComponent(shareUrl)}`,
          "_blank"
        );
      }
    } catch (err) {
      console.error("Share failed:", err);
      alert("Share failed — try downloading and sharing manually.");
    }
  };

  /* ---------- quick share helpers (WhatsApp / X) ---------- */
  const shareToWhatsApp = () => {
    const text = `${
      insights.poster_caption || "Check out my M-Pesa Wrapped!"
    } \n\n${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const shareToX = () => {
    const text = `${insights.poster_caption || "Check out my M-Pesa Wrapped!"}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank");
  };

  /* ---------- carousel scroll helpers ---------- */
  const scrollLeft = () =>
    carouselRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  const scrollRight = () =>
    carouselRef.current?.scrollBy({ left: 320, behavior: "smooth" });

  /* ---------- UI ---------- */
  return (
    <div className="p-6 md:p-10 text-white">
      <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-linear-to-r from-[#8BC53F] to-[#EB2026]">
        Your 2025 M-Pesa Wrapped ✨
      </h1>

      {/* Carousel */}
      <div className="relative">
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50"
        >
          ‹
        </button>

        <motion.div
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
        >
          {/* Total movement */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="min-w-[290px] snap-center p-6 rounded-2xl bg-gradient-to-br from-[#8BC53F] to-[#EB2026] shadow-lg"
          >
            <p className="text-sm text-white/90">Total Movement</p>
            <h2 className="text-4xl font-extrabold mt-2">
              {formatCurrency(totalMoved)}
            </h2>
            <p className="mt-3 text-white/80">
              {insights.captions?.total_sent ?? "Your year in one number."}
            </p>
          </motion.div>

          {/* Sent */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="min-w-[260px] snap-center p-6 rounded-2xl bg-[#08110A] border border-[#8BC53F]/20"
          >
            <p className="text-sm text-white/70">Money Sent</p>
            <h2 className="text-3xl font-bold mt-2 text-[#8BC53F]">
              {formatCurrency(totalSent)}
            </h2>
            <p className="mt-3 text-white/70 italic">
              {insights.captions?.total_sent ??
                "Spent on bills, moves & vibes."}
            </p>
          </motion.div>

          {/* Received */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="min-w-[260px] snap-center p-6 rounded-2xl bg-[#2A0B0B] border border-[#EB2026]/20"
          >
            <p className="text-sm text-white/70">Money Received</p>
            <h2 className="text-3xl font-bold mt-2 text-[#EB2026]">
              {formatCurrency(totalReceived)}
            </h2>
            <p className="mt-3 text-white/70 italic">
              {insights.captions?.total_received ?? "Income, gifts & deposits."}
            </p>
          </motion.div>

          {/* Biggest month */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="min-w-[260px] snap-center p-6 rounded-2xl bg-[#0F1114] border border-white/10"
          >
            <p className="text-sm text-green-200">Biggest Month</p>
            <h2 className="text-2xl font-bold mt-2">{biggestMonth.month}</h2>
            <p className="mt-2 text-xl font-extrabold">
              {formatCurrency(biggestMonth.amount)}
            </p>
            <p className="mt-3 text-white/70 italic">
              {insights.captions?.biggest_month ?? "Your peak month."}
            </p>
          </motion.div>

          {/* Early bird */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="min-w-[260px] snap-center p-6 rounded-2xl bg-[#0E0A14] border border-green-500/10"
          >
            <p className="text-sm text-red-300">Earliest Tx</p>
            <h2 className="text-xl font-bold mt-2">{earlyBird.time}</h2>
            <p className="mt-2 text-sm text-white/70">{earlyBird.details}</p>
            <p className="mt-3 text-white/70 italic">
              {insights.captions?.early_bird ?? ""}
            </p>
          </motion.div>

          {/* Top merchant */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="min-w-[260px] snap-center p-6 rounded-2xl bg-[#141015] border border-white/10"
          >
            <p className="text-sm text-green-300">Top Merchant</p>
            <h2 className="text-lg font-bold mt-2">
              {topMerchants[0]?.name ?? "—"}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              You spent {formatCurrency(topMerchants[0]?.amount ?? 0)}
            </p>
            <p className="mt-3 text-white/70 italic">
              {insights.captions?.top_merchant ?? ""}
            </p>
          </motion.div>
        </motion.div>

        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50"
        >
          ›
        </button>
      </div>

      {/* Poster */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Share Your M-Pesa Story</h2>

        <div
          ref={posterRef}
          id="share-poster"
          className="mx-auto w-full max-w-md p-6 rounded-3xl text-black bg-linear-to-br from-[#8BC53F] to-[#0F0A19] shadow-2xl border border-white/10"
          style={{ color: "#fff" }}
        >
          <div className="relative">
            <div className="absolute -left-10 -top-8 w-36 h-36 bg-[#8BC53F] opacity-20 rounded-full filter blur-3xl" />
            <div className="absolute -right-8 -bottom-6 w-36 h-36 bg-[#EB2026] opacity-20 rounded-full filter blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-3xl font-extrabold">
                My 2025 M-Pesa Wrapped ✨
              </h3>
              <p className="mt-2 text-sm text-white/90">
                {insights.personality ??
                  (aiLoading
                    ? "Generating your vibe..."
                    : "Your financial personality will appear here.")}
              </p>

              {/* poster stats grid */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-left">
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-xs text-white/70">Sent</p>
                  <p className="font-bold">{formatCurrency(totalSent)}</p>
                  <p className="text-xs text-white/60">
                    {insights?.captions?.total_sent}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <p className="text-xs text-white/70">Received</p>
                  <p className="font-bold">{formatCurrency(totalReceived)}</p>
                  <p className="text-xs text-white/60">
                    {insights?.captions?.total_received}
                  </p>
                </div>

                <div className="col-span-2 bg-white/10 p-3 rounded-xl">
                  <p className="text-xs text-white/70">Biggest Month</p>
                  <p className="font-bold">
                    {biggestMonth.month} — {formatCurrency(biggestMonth.amount)}
                  </p>
                  <p className="text-xs text-white/60">
                    {insights?.captions?.biggest_month}
                  </p>
                </div>

                <div className="col-span-2 bg-white/10 p-3 rounded-xl">
                  <p className="text-xs text-white/70">Top Merchant</p>
                  <p className="font-bold">{topMerchants[0]?.name ?? "—"}</p>
                  <p className="text-xs text-white/60">
                    {insights?.captions?.transactions}
                  </p>
                </div>

                <div className="col-span-2 text-center mt-2">
                  <p className="text-xs text-white/70">Total Transactions</p>
                  <p className="text-2xl font-extrabold">{txCount}</p>
                </div>
              </div>

              <p className="mt-4 text-xs text-white/80">
                {insights.poster_caption ??
                  (aiLoading
                    ? "Crafting a poster caption..."
                    : "Share your vibe with friends!")}
              </p>
              <p className="mt-3 text-xs text-white/60">#MPesaWrapped2025</p>
            </div>
          </div>
        </div>

        {/* action buttons */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={downloadPoster}
            className="px-5 py-2 rounded-full bg-white text-black font-semibold shadow"
          >
            Download Poster
          </button>

          <button
            onClick={sharePosterViaWebShare}
            className="px-5 py-2 rounded-full bg-[#8BC53F] text-black font-semibold shadow"
          >
            Share (Native)
          </button>

          <button
            onClick={shareToWhatsApp}
            className="px-4 py-2 rounded-full bg-[#25D366] text-white font-semibold shadow"
          >
            WhatsApp
          </button>

          <button
            onClick={shareToX}
            className="px-4 py-2 rounded-full bg-black text-white font-semibold shadow"
          >
            X
          </button>
        </div>
      </div>

      {/* footer */}
      <div className="text-center mt-8">
        <button
          onClick={onReset}
          className="px-6 py-2 rounded-full bg-white/10 text-white"
        >
          Analyze Another Statement
        </button>
      </div>

      {/* AI status */}
      <div className="mt-4 text-xs text-white/60 text-center">
        {aiLoading
          ? "Generating fun captions & personality..."
          : aiError
          ? `AI: ${aiError}`
          : ""}
      </div>
    </div>
  );
};

export default WrappedDashboard;
