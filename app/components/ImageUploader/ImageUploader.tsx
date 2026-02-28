// "use client";

// import { enhanceImage } from "@/app/lib/api";
// import { EDITING_STYLES, EditingStyle } from "@/app/types/image";
// import { useState, useRef, useCallback } from "react";
// import { Upload, ArrowLeft, Download, X } from "lucide-react";
// import Header from "../Header/Header";

// type Stage = "idle" | "loading" | "done" | "error";

// const STATUS_STEPS = [
//   { key: "uploading", label: "Uploading image" },
//   { key: "straightening", label: "Correcting perspective" },
//   { key: "enhancing", label: "AI enhancing" },
//   { key: "finishing", label: "Finishing up" },
// ];

// export default function ImageUploader() {
//   const [file, setFile] = useState<File | null>(null);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [result, setResult] = useState<string | null>(null);
//   const [selectedStyle, setSelectedStyle] = useState<EditingStyle>(
//     EDITING_STYLES[0],
//   );
//   const [customPrompt, setCustomPrompt] = useState("");
//   const [useCustomPrompt, setUseCustomPrompt] = useState(false);
//   const [stage, setStage] = useState<Stage>("idle");
//   const [activeStep, setActiveStep] = useState(0);
//   const [error, setError] = useState<string | null>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const inputRef = useRef<HTMLInputElement>(null);

//   const activePrompt = useCustomPrompt ? customPrompt : selectedStyle.prompt;

//   const simulateSteps = () => {
//     let step = 0;
//     setActiveStep(0);
//     const interval = setInterval(() => {
//       step++;
//       if (step < STATUS_STEPS.length) setActiveStep(step);
//       else clearInterval(interval);
//     }, 1800);
//     return interval;
//   };

//   // Convert base64 result back to a File for "Enhance Again"
//   const resultToFile = async (): Promise<File | null> => {
//     if (!result || !file) return null;
//     const res = await fetch(result);
//     const blob = await res.blob();
//     return new File([blob], file.name, { type: blob.type });
//   };

//   const handleFile = (selected: File) => {
//     setFile(selected);
//     setPreview(URL.createObjectURL(selected));
//     setResult(null);
//     setError(null);
//     setStage("idle");
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selected = e.target.files?.[0];
//     if (selected) handleFile(selected);
//     e.target.value = "";
//   };

//   const handleDrop = useCallback((e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);
//     const selected = e.dataTransfer.files?.[0];
//     if (selected && selected.type.startsWith("image/")) handleFile(selected);
//   }, []);

//   const handleEnhance = async () => {
//     if (!activePrompt.trim()) return;

//     // On "Enhance Again" use the result image, not the original
//     let imageFile = file;
//     if (stage === "done" && result) {
//       imageFile = await resultToFile();
//     }
//     if (!imageFile) return;

//     setStage("loading");
//     setError(null);
//     setResult(null);
//     const stepInterval = simulateSteps();

//     try {
//       const data = await enhanceImage(imageFile, activePrompt, useCustomPrompt);
//       clearInterval(stepInterval);
//       setActiveStep(STATUS_STEPS.length);
//       setResult(`data:${data.mimeType};base64,${data.image}`);
//       setStage("done");
//     } catch (err: any) {
//       clearInterval(stepInterval);
//       setError(err.message);
//       setStage("error");
//     }
//   };

//   const handleDownload = () => {
//     if (!result) return;
//     const a = document.createElement("a");
//     a.href = result;
//     a.download = `enhanced-${file?.name || "image.jpg"}`;
//     a.click();
//   };

//   const handleReset = () => {
//     setFile(null);
//     setPreview(null);
//     setResult(null);
//     setError(null);
//     setStage("idle");
//     setActiveStep(0);
//   };

//   return (
//     <div className="h-screen w-screen bg-[#090909] text-white font-sans flex flex-col overflow-hidden">
//       <Header />

//       <div className="flex flex-1 overflow-hidden">
//         {/* ── SIDEBAR ─────────────────────────────────────── */}
//         <aside className="w-72 shrink-0 border-r border-white/10 flex flex-col overflow-y-auto">
//           <div className="px-5 py-5 border-b border-white/10">
//             <p className="text-[10px] tracking-[0.25em] uppercase text-[#c9a84c]/70 mb-1 font-light">
//               Mode
//             </p>
//             <h2 className="font-playfair text-base font-medium text-white/90">
//               Enhancement Style
//             </h2>
//           </div>

//           <nav className="px-3 py-3 space-y-0.5">
//             {EDITING_STYLES.map((style) => (
//               <button
//                 key={style.id}
//                 onClick={() => {
//                   setSelectedStyle(style);
//                   setUseCustomPrompt(false);
//                 }}
//                 className={[
//                   "cursor-pointer w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-center justify-between",
//                   !useCustomPrompt && selectedStyle.id === style.id
//                     ? "bg-[#c9a84c]/10 text-white border border-[#c9a84c]/25"
//                     : "text-white/45 hover:text-white/70 hover:bg-white/5 border border-transparent",
//                 ].join(" ")}
//               >
//                 <span>{style.label}</span>
//                 {!useCustomPrompt && selectedStyle.id === style.id && (
//                   <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
//                 )}
//               </button>
//             ))}

//             <button
//               onClick={() => setUseCustomPrompt(true)}
//               className={[
//                 "cursor-pointer w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-center justify-between",
//                 useCustomPrompt
//                   ? "bg-[#c9a84c]/10 text-white border border-[#c9a84c]/25"
//                   : "text-white/45 hover:text-white/70 hover:bg-white/5 border border-transparent",
//               ].join(" ")}
//             >
//               <span>Custom Prompt</span>
//               {useCustomPrompt && (
//                 <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
//               )}
//             </button>
//           </nav>

//           <div className="mx-5 h-px bg-white/10 my-1" />

//           {useCustomPrompt ? (
//             <div className="px-4 py-4">
//               <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-2.5">
//                 Instructions
//               </p>
//               <textarea
//                 value={customPrompt}
//                 onChange={(e) => setCustomPrompt(e.target.value)}
//                 placeholder="e.g. Convert to a warm twilight scene with golden hour lighting..."
//                 rows={5}
//                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/70 placeholder-white/25 resize-none focus:outline-none focus:border-[#c9a84c]/30 transition-colors leading-relaxed"
//               />
//               <div className="flex justify-between mt-1.5">
//                 <p className="text-[10px] text-white/35">
//                   AI will refine your prompt
//                 </p>
//                 <p className="text-[10px] text-white/35">
//                   {customPrompt.length}
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <div className="px-4 py-4">
//               <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-2.5">
//                 Active Prompt
//               </p>
//               <p className="text-[11px] text-white/40 leading-relaxed line-clamp-5 bg-white/5 border border-white/10 rounded-xl p-3">
//                 {selectedStyle.prompt}
//               </p>
//             </div>
//           )}

//           <div className="px-4 pb-6 mt-auto">
//             <div className="h-px bg-white/10 mb-4" />
//             <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-3">
//               Tips
//             </p>
//             <ul className="space-y-2.5">
//               {[
//                 "High-res photos give the best results",
//                 "Natural daylight enhances most effectively",
//                 "Custom prompts are AI-refined before processing",
//               ].map((tip, i) => (
//                 <li key={i} className="flex gap-2.5 items-start">
//                   <div className="w-1 h-1 rounded-full bg-[#c9a84c]/35 mt-1.25 shrink-0" />
//                   <p className="text-[11px] text-white/35 leading-relaxed">
//                     {tip}
//                   </p>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </aside>

//         {/* ── MAIN CANVAS ─────────────────────────────────── */}
//         <main className="flex-1 flex flex-col overflow-hidden">
//           {/* Empty state */}
//           {!preview && (
//             <div className="flex-1 flex items-center justify-center p-10">
//               <div
//                 onDragOver={(e) => {
//                   e.preventDefault();
//                   setIsDragging(true);
//                 }}
//                 onDragLeave={() => setIsDragging(false)}
//                 onDrop={handleDrop}
//                 onClick={() => inputRef.current?.click()}
//                 className={[
//                   "cursor-pointer w-full max-w-xl border-2 border-dashed rounded-3xl py-24 px-16 text-center transition-all duration-300",
//                   isDragging
//                     ? "border-[#c9a84c]/50 bg-[#c9a84c]/5"
//                     : "border-white/10 hover:border-white/20 hover:bg-white/1",
//                 ].join(" ")}
//               >
//                 <input
//                   ref={inputRef}
//                   type="file"
//                   accept="image/jpeg,image/png,image/webp"
//                   onChange={handleFileChange}
//                   className="hidden"
//                 />
//                 <div className="w-14 h-14 rounded-2xl border border-[#c9a84c]/25 bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-6">
//                   <Upload size={22} className="text-[#c9a84c]" />
//                 </div>
//                 <p className="font-playfair text-xl font-medium text-white/70 mb-2">
//                   Drop your property photo
//                 </p>
//                 <p className="text-sm text-white/35 mb-1">
//                   or <span className="text-[#c9a84c]/70">browse files</span>
//                 </p>
//                 <p className="text-xs text-white/25 mt-2">
//                   JPEG · PNG · WEBP · up to 20MB
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Image loaded */}
//           {preview && (
//             <>
//               <div className="flex-1 overflow-auto p-5">
//                 <div
//                   className={`grid gap-4 h-full ${result ? "grid-cols-2" : "grid-cols-1"}`}
//                 >
//                   {/* Original */}
//                   <div className="relative group rounded-2xl overflow-hidden bg-[#0f0f0f] border border-white/5 flex items-center justify-center min-h-75">
//                     <span className="absolute top-3.5 left-3.5 z-10 text-[10px] tracking-widest uppercase bg-black/50 backdrop-blur-sm text-white/50 px-2.5 py-1 rounded-full border border-white/10">
//                       Original
//                     </span>
//                     <img
//                       src={preview}
//                       alt="Original"
//                       className="w-full h-full object-contain transition-all duration-500"
//                       style={{
//                         filter:
//                           stage === "loading" ? "brightness(0.35)" : "none",
//                       }}
//                     />
//                     {stage !== "loading" && (
//                       <button
//                         onClick={handleReset}
//                         className="cursor-pointer absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
//                       >
//                         <X size={11} />
//                       </button>
//                     )}
//                   </div>

//                   {/* Result */}
//                   {result && (
//                     <div className="relative rounded-2xl overflow-hidden bg-[#0f0f0f] border border-[#c9a84c]/15 flex items-center justify-center min-h-75">
//                       <span className="absolute top-3.5 left-3.5 z-10 text-[10px] tracking-widest uppercase bg-black/50 backdrop-blur-sm text-[#c9a84c]/70 px-2.5 py-1 rounded-full border border-[#c9a84c]/20">
//                         Enhanced
//                       </span>
//                       <img
//                         src={result}
//                         alt="Enhanced"
//                         className="w-full h-full object-contain"
//                       />
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Progress bar */}
//               {stage === "loading" && (
//                 <div className="px-5 pb-2 shrink-0">
//                   <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-6">
//                     <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 shrink-0">
//                       Processing
//                     </p>
//                     <div className="flex items-center gap-4 flex-1 overflow-hidden">
//                       {STATUS_STEPS.map((step, i) => (
//                         <div
//                           key={step.key}
//                           className="flex items-center gap-2 shrink-0"
//                         >
//                           <div
//                             className={[
//                               "w-1.5 h-1.5 rounded-full transition-all duration-300",
//                               i < activeStep
//                                 ? "bg-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.5)]"
//                                 : i === activeStep
//                                   ? "border border-[#c9a84c] animate-pulse"
//                                   : "bg-white/15",
//                             ].join(" ")}
//                           />
//                           <span
//                             className={[
//                               "text-xs whitespace-nowrap transition-colors duration-300",
//                               i < activeStep
//                                 ? "text-[#c9a84c]/80"
//                                 : i === activeStep
//                                   ? "text-white/70"
//                                   : "text-white/30",
//                             ].join(" ")}
//                           >
//                             {step.label}
//                             {i < activeStep ? " ✓" : ""}
//                           </span>
//                           {i < STATUS_STEPS.length - 1 && (
//                             <div
//                               className={`w-6 h-px ml-1 transition-colors duration-300 ${i < activeStep ? "bg-[#c9a84c]/30" : "bg-white/10"}`}
//                             />
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                     <div className="flex gap-1 shrink-0">
//                       {[0, 1, 2].map((i) => (
//                         <div
//                           key={i}
//                           className="w-1 h-1 rounded-full bg-[#c9a84c]/60 animate-bounce"
//                           style={{ animationDelay: `${i * 0.15}s` }}
//                         />
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Error */}
//               {stage === "error" && error && (
//                 <div className="px-5 pb-2 shrink-0">
//                   <div className="bg-red-950/20 border border-red-900/30 rounded-2xl px-5 py-3">
//                     <p className="text-red-400/80 text-sm">{error}</p>
//                   </div>
//                 </div>
//               )}

//               {/* Bottom bar */}
//               {stage !== "loading" && (
//                 <div className="flex items-center justify-between px-5 py-4 border-t border-white/10 shrink-0">
//                   <button
//                     onClick={handleReset}
//                     className="cursor-pointer flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
//                   >
//                     <ArrowLeft size={14} />
//                     New Photo
//                   </button>

//                   <div className="flex items-center gap-3">
//                     {result && (
//                       <button
//                         onClick={handleDownload}
//                         className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-xl text-sm border border-white/10 text-white/50 hover:border-[#c9a84c]/30 hover:text-[#c9a84c]/70 transition-all"
//                       >
//                         <Download size={14} />
//                         Download
//                       </button>
//                     )}
//                     <button
//                       onClick={handleEnhance}
//                       disabled={useCustomPrompt && !customPrompt.trim()}
//                       className="cursor-pointer px-6 py-2 rounded-xl text-sm font-medium text-black bg-linear-to-r from-[#c9a84c] to-[#a8873b] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(201,168,76,0.22)] disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-200"
//                     >
//                       {stage === "done" ? "Enhance Again" : "Enhance Photo"}
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import { startEnhancement, getJobStatus } from "@/app/lib/api";
import { EDITING_STYLES, EditingStyle } from "@/app/types/image";
import { useState, useRef, useCallback } from "react";
import { Upload, ArrowLeft, Download, X } from "lucide-react";
import Header from "../Header/Header";

type Stage = "idle" | "loading" | "done" | "error";

const STATUS_STEPS = [
  { key: "uploading", label: "Uploading image" },
  { key: "straightening", label: "Correcting perspective" },
  { key: "enhancing", label: "AI enhancing" },
  { key: "finishing", label: "Finishing up" },
];

const STEP_MAP: Record<string, number> = {
  pending: 0,
  processing: 1,
  straightening: 1,
  enhancing: 2,
  finishing: 3,
};

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<EditingStyle>(
    EDITING_STYLES[0],
  );
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePrompt = useCustomPrompt ? customPrompt : selectedStyle.prompt;

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const pollJobStatus = (jobId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const job = await getJobStatus(jobId);

        if (STEP_MAP[job.status] !== undefined)
          setActiveStep(STEP_MAP[job.status]);

        if (job.status === "completed" && job.resultUrl) {
          stopPolling();
          setResult(job.resultUrl);
          setStage("done");
        }

        if (job.status === "failed") {
          stopPolling();
          setError(job.error || "Processing failed");
          setStage("error");
        }
      } catch {
        stopPolling();
        setError("Failed to check job status");
        setStage("error");
      }
    }, 3000);

    // Safety timeout — 10 minutes
    timeoutRef.current = setTimeout(
      () => {
        stopPolling();
        setError("Job timed out. Please try again.");
        setStage("error");
      },
      10 * 60 * 1000,
    );
  };

  // On "Enhance Again" — convert Cloudinary result URL back to File
  const resultToFile = async (): Promise<File | null> => {
    if (!result || !file) return null;
    const res = await fetch(result);
    const blob = await res.blob();
    return new File([blob], file.name, { type: blob.type });
  };

  const handleFile = (selected: File) => {
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
    setStage("idle");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected && selected.type.startsWith("image/")) handleFile(selected);
  }, []);

  const handleEnhance = async () => {
    if (!activePrompt.trim()) return;

    let imageFile = file;
    if (stage === "done" && result) imageFile = await resultToFile();
    if (!imageFile) return;

    stopPolling();
    setStage("loading");
    setError(null);
    setResult(null);
    setActiveStep(0);

    try {
      const { jobId } = await startEnhancement(
        imageFile,
        activePrompt,
        useCustomPrompt,
      );
      setActiveStep(1);
      pollJobStatus(jobId);
    } catch (err: any) {
      setError(err.message);
      setStage("error");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    window.open(result, "_blank");
  };

  const handleReset = () => {
    stopPolling();
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStage("idle");
    setActiveStep(0);
  };

  return (
    <div className="h-screen w-screen bg-[#090909] text-white font-sans flex flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR ─────────────────────────────────────── */}
        <aside className="w-72 shrink-0 border-r border-white/10 flex flex-col overflow-y-auto">
          <div className="px-5 py-5 border-b border-white/10">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#c9a84c]/70 mb-1 font-light">
              Mode
            </p>
            <h2 className="font-playfair text-base font-medium text-white/90">
              Enhancement Style
            </h2>
          </div>

          <nav className="px-3 py-3 space-y-0.5">
            {EDITING_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  setSelectedStyle(style);
                  setUseCustomPrompt(false);
                }}
                className={[
                  "cursor-pointer w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-center justify-between",
                  !useCustomPrompt && selectedStyle.id === style.id
                    ? "bg-[#c9a84c]/10 text-white border border-[#c9a84c]/25"
                    : "text-white/45 hover:text-white/70 hover:bg-white/5 border border-transparent",
                ].join(" ")}
              >
                <span>{style.label}</span>
                {!useCustomPrompt && selectedStyle.id === style.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
                )}
              </button>
            ))}

            <button
              onClick={() => setUseCustomPrompt(true)}
              className={[
                "cursor-pointer w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-150 flex items-center justify-between",
                useCustomPrompt
                  ? "bg-[#c9a84c]/10 text-white border border-[#c9a84c]/25"
                  : "text-white/45 hover:text-white/70 hover:bg-white/5 border border-transparent",
              ].join(" ")}
            >
              <span>Custom Prompt</span>
              {useCustomPrompt && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" />
              )}
            </button>
          </nav>

          <div className="mx-5 h-px bg-white/10 my-1" />

          {useCustomPrompt ? (
            <div className="px-4 py-4">
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-2.5">
                Instructions
              </p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Convert to a warm twilight scene with golden hour lighting..."
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/70 placeholder-white/25 resize-none focus:outline-none focus:border-[#c9a84c]/30 transition-colors leading-relaxed"
              />
              <div className="flex justify-between mt-1.5">
                <p className="text-[10px] text-white/35">
                  AI will refine your prompt
                </p>
                <p className="text-[10px] text-white/35">
                  {customPrompt.length}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-4">
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-2.5">
                Active Prompt
              </p>
              <p className="text-[11px] text-white/40 leading-relaxed line-clamp-5 bg-white/5 border border-white/10 rounded-xl p-3">
                {selectedStyle.prompt}
              </p>
            </div>
          )}

          <div className="px-4 pb-6 mt-auto">
            <div className="h-px bg-white/10 mb-4" />
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-3">
              Tips
            </p>
            <ul className="space-y-2.5">
              {[
                "High-res photos give the best results",
                "Natural daylight enhances most effectively",
                "Custom prompts are AI-refined before processing",
              ].map((tip, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <div className="w-1 h-1 rounded-full bg-[#c9a84c]/35 mt-1.25 shrink-0" />
                  <p className="text-[11px] text-white/35 leading-relaxed">
                    {tip}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── MAIN CANVAS ─────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Empty state */}
          {!preview && (
            <div className="flex-1 flex items-center justify-center p-10">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={[
                  "cursor-pointer w-full max-w-xl border-2 border-dashed rounded-3xl py-24 px-16 text-center transition-all duration-300",
                  isDragging
                    ? "border-[#c9a84c]/50 bg-[#c9a84c]/5"
                    : "border-white/10 hover:border-white/20 hover:bg-white/1",
                ].join(" ")}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl border border-[#c9a84c]/25 bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-6">
                  <Upload size={22} className="text-[#c9a84c]" />
                </div>
                <p className="font-playfair text-xl font-medium text-white/70 mb-2">
                  Drop your property photo
                </p>
                <p className="text-sm text-white/35 mb-1">
                  or <span className="text-[#c9a84c]/70">browse files</span>
                </p>
                <p className="text-xs text-white/25 mt-2">
                  JPEG · PNG · WEBP · up to 20MB
                </p>
              </div>
            </div>
          )}

          {/* Image loaded */}
          {preview && (
            <>
              <div className="flex-1 overflow-auto p-5">
                <div
                  className={`grid gap-4 h-full ${result ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {/* Original */}
                  <div className="relative group rounded-2xl overflow-hidden bg-[#0f0f0f] border border-white/5 flex items-center justify-center min-h-75">
                    <span className="absolute top-3.5 left-3.5 z-10 text-[10px] tracking-widest uppercase bg-black/50 backdrop-blur-sm text-white/50 px-2.5 py-1 rounded-full border border-white/10">
                      Original
                    </span>
                    <img
                      src={preview}
                      alt="Original"
                      className="w-full h-full object-contain transition-all duration-500"
                      style={{
                        filter:
                          stage === "loading" ? "brightness(0.35)" : "none",
                      }}
                    />
                    {stage !== "loading" && (
                      <button
                        onClick={handleReset}
                        className="cursor-pointer absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  {/* Result */}
                  {result && (
                    <div className="relative rounded-2xl overflow-hidden bg-[#0f0f0f] border border-[#c9a84c]/15 flex items-center justify-center min-h-75">
                      <span className="absolute top-3.5 left-3.5 z-10 text-[10px] tracking-widest uppercase bg-black/50 backdrop-blur-sm text-[#c9a84c]/70 px-2.5 py-1 rounded-full border border-[#c9a84c]/20">
                        Enhanced
                      </span>
                      <img
                        src={result}
                        alt="Enhanced"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {stage === "loading" && (
                <div className="px-5 pb-2 shrink-0">
                  <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-6">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 shrink-0">
                      Processing
                    </p>
                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                      {STATUS_STEPS.map((step, i) => (
                        <div
                          key={step.key}
                          className="flex items-center gap-2 shrink-0"
                        >
                          <div
                            className={[
                              "w-1.5 h-1.5 rounded-full transition-all duration-300",
                              i < activeStep
                                ? "bg-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.5)]"
                                : i === activeStep
                                  ? "border border-[#c9a84c] animate-pulse"
                                  : "bg-white/15",
                            ].join(" ")}
                          />
                          <span
                            className={[
                              "text-xs whitespace-nowrap transition-colors duration-300",
                              i < activeStep
                                ? "text-[#c9a84c]/80"
                                : i === activeStep
                                  ? "text-white/70"
                                  : "text-white/30",
                            ].join(" ")}
                          >
                            {step.label}
                            {i < activeStep ? " ✓" : ""}
                          </span>
                          {i < STATUS_STEPS.length - 1 && (
                            <div
                              className={`w-6 h-px ml-1 transition-colors duration-300 ${i < activeStep ? "bg-[#c9a84c]/30" : "bg-white/10"}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full bg-[#c9a84c]/60 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {stage === "error" && error && (
                <div className="px-5 pb-2 shrink-0">
                  <div className="bg-red-950/20 border border-red-900/30 rounded-2xl px-5 py-3">
                    <p className="text-red-400/80 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Bottom bar */}
              {stage !== "loading" && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-white/10 shrink-0">
                  <button
                    onClick={handleReset}
                    className="cursor-pointer flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    New Photo
                  </button>

                  <div className="flex items-center gap-3">
                    {result && (
                      <button
                        onClick={handleDownload}
                        className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-xl text-sm border border-white/10 text-white/50 hover:border-[#c9a84c]/30 hover:text-[#c9a84c]/70 transition-all"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    )}
                    <button
                      onClick={handleEnhance}
                      disabled={useCustomPrompt && !customPrompt.trim()}
                      className="cursor-pointer px-6 py-2 rounded-xl text-sm font-medium text-black bg-linear-to-r from-[#c9a84c] to-[#a8873b] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(201,168,76,0.22)] disabled:opacity-30 disabled:cursor-not-allowed disabled:translate-y-0 transition-all duration-200"
                    >
                      {stage === "done" ? "Enhance Again" : "Enhance Photo"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
