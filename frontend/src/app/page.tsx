"use client";

import React, { useState, useRef } from "react";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Download,
  Users,
  LayoutDashboard,
  Zap,
  PhoneCall,
  Sliders,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FolderOpen
} from "lucide-react";

// CRM fields structure
interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string | null;
  crm_note: string;
  data_source: string | null;
  possession_time: string;
  description: string;
  lead_relevancy: "HIGH" | "MEDIUM" | "LOW";
  deal_probability: number;
  conversion_notes: string;
}

interface SkippedRecord {
  record: any;
  reason: string;
}

export default function ImporterDashboard() {
  const darkMode = true;
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Importing/AI mapping, 4: Results
  
  // File data
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  // Versatility and Dynamic Dataset Analysis states
  const [datasetType, setDatasetType] = useState<"crm_leads" | "general">("crm_leads");
  const [datasetSummary, setDatasetSummary] = useState("");
  const [generalAnalysis, setGeneralAnalysis] = useState<{
    normalized_headers: string[];
    key_takeaways: string[];
    data_quality_warnings: string[];
  } | null>(null);
  
  // Final Results
  const [mappedResults, setMappedResults] = useState<CRMRecord[]>([]);
  const [skippedResults, setSkippedResults] = useState<SkippedRecord[]>([]);
  const [metrics, setMetrics] = useState({ total_imported: 0, total_skipped: 0 });
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle File Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Parse CSV File locally
  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid .csv file.");
      return;
    }
    setError("");
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(2) + " KB");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setRawHeaders(Object.keys(results.data[0] as object));
          setRawRows(results.data);
          setStep(2); // Move to raw preview step
        } else {
          setError("The CSV file appears to be empty.");
        }
      },
      error: (err) => {
        setError("Error parsing CSV: " + err.message);
      }
    });
  };

  // Download Sample CSV
  const downloadSampleTemplate = () => {
    const link = document.createElement("a");
    link.setAttribute("href", "/mock_leads.csv");
    link.setAttribute("download", "groweasy_sample_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset state
  const resetImporter = () => {
    setStep(1);
    setFileName("");
    setFileSize("");
    setRawHeaders([]);
    setRawRows([]);
    setMappedResults([]);
    setSkippedResults([]);
    setMetrics({ total_imported: 0, total_skipped: 0 });
    setProgressPercent(0);
    setDatasetType("crm_leads");
    setDatasetSummary("");
    setGeneralAnalysis(null);
    setError("");
  };

  // Confirm Import & Send to Backend
  const confirmImport = async () => {
    setIsProcessing(true);
    setStep(3);
    setProgressMessage("Analyzing dataset schema and converting records...");
    setProgressPercent(15);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const totalRows = rawRows.length;
      
      setProgressMessage(`Sending ${totalRows} records to AI classification engine...`);
      setProgressPercent(40);

      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: rawRows }),
      });

      setProgressPercent(75);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process records on backend.");
      }

      const result = await response.json();
      setProgressPercent(100);

      // Save classification results
      setDatasetType(result.dataset_type || "general");
      setDatasetSummary(result.dataset_summary || "");
      setGeneralAnalysis(result.general_analysis || null);

      setMappedResults(result.data || []);
      setSkippedResults(result.skipped || []);
      setMetrics(result.metrics || { total_imported: 0, total_skipped: 0 });
      setStep(4);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during mapping.");
      setStep(2); // Go back to preview if error
    } finally {
      setIsProcessing(false);
    }
  };

  // Color helper for CRM status enums
  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case "GOOD_LEAD_FOLLOW_UP":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "DID_NOT_CONNECT":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "BAD_LEAD":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "SALE_DONE":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  // Color helper for CRM Lead Relevancy enums
  const getRelevancyBadgeColor = (relevancy: string) => {
    switch (relevancy) {
      case "HIGH":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "LOW":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="min-h-screen font-mono bg-black text-zinc-300 selection:bg-emerald-950 selection:text-emerald-300">
      {/* Top Banner Navigation */}
      <header className="flex items-center justify-between border-b px-8 py-4 border-zinc-900 bg-black">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 font-bold text-sm">
            &gt;_
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-100">
              groweasy-importer-v1.0
            </h1>
            <p className="text-[10px] text-emerald-500/70">STATUS: ONLINE // SECURE_SHELL</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pl-4">
            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-cyan-400">
              VK
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold">VK Test</p>
              <p className="text-[10px] text-zinc-500">OWNER</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden min-h-[calc(screen-65px)] w-64 flex-col border-r p-6 border-zinc-900 bg-black md:flex">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Main Menu</p>
              <nav className="mt-3 space-y-1">
                <a href="#" className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-emerald-950/20 hover:text-emerald-400 transition-colors">
                  <LayoutDashboard size={18} /> Dashboard
                </a>
                <a href="#" className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-emerald-950/20 hover:text-emerald-400 transition-colors">
                  <Zap size={18} /> Generate Leads
                </a>
                <a href="#" className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-emerald-950/20 hover:text-emerald-400 transition-colors">
                  <Users size={18} /> Manage Leads
                </a>
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Control Center</p>
              <nav className="mt-3 space-y-1">
                <a href="#" className="flex items-center gap-3 rounded px-3 py-2 text-sm font-bold bg-emerald-950/20 text-emerald-400 border border-emerald-500/20">
                  <FolderOpen size={18} className="text-emerald-400" /> Lead Sources
                </a>
                <a href="#" className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-emerald-950/20 hover:text-emerald-400 transition-colors">
                  <PhoneCall size={18} /> Tele Calling
                </a>
                <a href="#" className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-emerald-950/20 hover:text-emerald-400 transition-colors">
                  <Sliders size={18} /> CRM Fields
                </a>
                <a href="#" className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-emerald-950/20 hover:text-emerald-400 transition-colors">
                  <Settings size={18} /> Settings
                </a>
              </nav>
            </div>
          </div>
        </aside>

        {/* Dashboard Content Area */}
        <main className="flex-1 p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Lead Sources</h2>
              <p className="text-sm text-zinc-400">Connect, manage, and control all your lead channels from one dashboard.</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 rounded border border-emerald-500/50 bg-black px-4 py-2 text-xs font-mono font-bold text-emerald-400 hover:bg-emerald-500/10 transition-all shadow-sm shadow-emerald-500/5"
            >
              <Upload size={16} /> Import Leads via CSV
            </button>
          </div>

          {/* Admin KPI Stats */}
          <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded border p-4 border-zinc-900 bg-black">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Avg. AI Latency</p>
              <h3 className="mt-1 text-xl font-extrabold text-emerald-400">&gt; 2.51s</h3>
              <p className="text-[10px] text-zinc-600 mt-1">For 200+ row datasets</p>
            </div>
            <div className="rounded border p-4 border-zinc-900 bg-black">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">AI Mapping Accuracy</p>
              <h3 className="mt-1 text-xl font-extrabold text-emerald-400">99.4%</h3>
              <p className="text-[10px] text-zinc-600 mt-1">Based on recent 12 imports</p>
            </div>
            <div className="rounded border p-4 border-zinc-900 bg-black">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">AI Cleaning Rules</p>
              <h3 className="mt-1 text-xl font-extrabold text-emerald-400">4 Active</h3>
              <p className="text-[10px] text-emerald-400 mt-1">Format, Split, Skip, Score</p>
            </div>
          </div>

          {/* Connected Lead Channels */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Google Ads */}
            <div className="rounded border p-6 border-zinc-900 bg-black">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded border border-zinc-900 bg-black text-emerald-400">
                  <TrendingUp size={24} />
                </div>
                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Active</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-100">Google Ads Export</h3>
              <p className="mt-2 text-xs text-zinc-500">Sync lead data directly from your Google search campaigns.</p>
              <div className="mt-6 flex justify-end">
                <button className="flex items-center gap-1 text-xs text-emerald-400 font-semibold hover:underline">
                  Configure <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Facebook Ads */}
            <div className="rounded border p-6 border-zinc-900 bg-black">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded border border-zinc-900 bg-black text-emerald-400">
                  <Users size={24} />
                </div>
                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Active</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-zinc-100">Facebook Ads Lead Export</h3>
              <p className="mt-2 text-xs text-zinc-500">Import leads generated from Facebook Lead Ads campaigns.</p>
              <div className="mt-6 flex justify-end">
                <button className="flex items-center gap-1 text-xs text-emerald-400 font-semibold hover:underline">
                  Configure <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* AI CSV Importer Channel */}
            <div className="group rounded border p-6 border-zinc-900 bg-black hover:border-emerald-500/30 cursor-pointer" onClick={() => setShowModal(true)}>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 shadow-md">
                  <FileSpreadsheet size={24} />
                </div>
                <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">AI Powered</span>
              </div>
              <h3 className="mt-4 text-lg font-bold group-hover:text-emerald-400 transition-colors text-zinc-100">Import CSV File</h3>
              <p className="mt-2 text-xs text-zinc-500">Upload raw sales files, Excel spreadsheets, or competitor exports. Our AI maps columns dynamically.</p>
              <div className="mt-6 flex justify-end">
                <button className="flex items-center gap-1 text-xs text-emerald-400 font-semibold group-hover:underline">
                  Launch Importer <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* AI Importer System Settings */}
          <div className="mt-10">
            <h2 className="text-lg font-bold tracking-tight mb-2 text-zinc-100">AI Importer Configuration Settings</h2>
            <p className="text-xs text-zinc-500 mb-4">Admin toggle controls to customize data cleaning algorithms and validation rules in real-time.</p>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Rules Toggles */}
              <div className="rounded border p-6 border-zinc-900 bg-black">
                <h3 className="text-sm font-bold mb-4 text-emerald-400">Active Cleaning Directives</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-300">Isolate Primary Contacts (Rule 5)</p>
                      <p className="text-[10px] text-zinc-550">Auto-splits multiple phone numbers & emails, moving secondary ones to crm_notes.</p>
                    </div>
                    <span className="h-5 w-9 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">ON</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-300">Auto-format Date Timestamps (Rule 3)</p>
                      <p className="text-[10px] text-zinc-550">Normalizes messy dates to standard JS Date format.</p>
                    </div>
                    <span className="h-5 w-9 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">ON</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
                    <div>
                      <p className="text-xs font-semibold text-zinc-300">Predictive Quality Scoring (Relevancy)</p>
                      <p className="text-[10px] text-zinc-550">Calculates lead relevancy rating (HIGH/MEDIUM/LOW) using AI analysis.</p>
                    </div>
                    <span className="h-5 w-9 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">ON</span>
                  </div>
                </div>
              </div>

              {/* Historical Audit Logs */}
              <div className="rounded border p-6 border-zinc-900 bg-black">
                <h3 className="text-sm font-bold mb-4 text-emerald-400">Recent Admin Import History</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-zinc-300">groweasy_sample_leads.csv</p>
                      <p className="text-[9px] text-zinc-500">Today, 5:45 PM • 200 records • CRM Leads</p>
                    </div>
                    <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold border border-emerald-500/20">Success (2.5s)</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-xs">
                    <div>
                      <p className="font-semibold text-zinc-300">mock_inventory.csv</p>
                      <p className="text-[9px] text-zinc-500">Today, 5:50 PM • 3 records • Product Inventory</p>
                    </div>
                    <span className="rounded bg-cyan-500/10 text-cyan-400 px-2 py-0.5 text-[10px] font-semibold border border-cyan-500/20">Analyzed (2.1s)</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-xs">
                    <div>
                      <p className="font-semibold text-zinc-300">facebook_raw_leads_june.csv</p>
                      <p className="text-[9px] text-zinc-500">Yesterday, 1:22 PM • 42 records • CRM Leads</p>
                    </div>
                    <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold border border-emerald-500/20">Success (1.8s)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* CSV IMPORTER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative flex h-full max-h-[85vh] w-full max-w-6xl flex-col rounded-lg border shadow-2xl transition-colors overflow-hidden border-zinc-900 bg-black">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-cyan-400" size={20} />
                <h3 className="text-lg font-bold">Import Leads via CSV</h3>
              </div>
              <button
                onClick={() => { setShowModal(false); resetImporter(); }}
                className="text-zinc-400 hover:text-zinc-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: UPLOAD */}
              {step === 1 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded border border-dashed p-10 text-center transition-all border-zinc-800 bg-zinc-950/20 hover:border-emerald-500/30"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mb-4">
                      <Upload size={28} />
                    </div>
                    <h4 className="text-base font-semibold">Drop your CSV file here</h4>
                    <p className="mt-1 text-xs text-zinc-500">or click to browse files (max 5MB)</p>
                    
                    <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] text-zinc-500">
                      <span className="rounded bg-zinc-800/80 px-1.5 py-0.5">Required fields: email OR mobile</span>
                      <span className="rounded bg-zinc-800/80 px-1.5 py-0.5">Auto-maps enums, statuses & sources</span>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".csv"
                      className="hidden"
                    />
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={downloadSampleTemplate}
                      className="flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                    >
                      <Download size={14} /> Download Sample CSV Template
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="rounded-lg px-4 py-2 text-xs font-semibold bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: RAW PREVIEW */}
              {step === 2 && (
                <div className="flex flex-col h-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold">File Preview: {fileName}</h4>
                      <p className="text-xs text-zinc-400">{fileSize} | {rawRows.length} total rows detected. Click 'Confirm Import' to parse fields using AI.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={resetImporter}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${darkMode ? "border-zinc-800 bg-zinc-900 hover:bg-zinc-800" : "border-zinc-200 bg-zinc-100 hover:bg-zinc-200"}`}
                      >
                        <RefreshCw size={12} /> Clear File
                      </button>
                      <button
                        onClick={confirmImport}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:opacity-95 shadow-md shadow-cyan-500/10"
                      >
                        Confirm Import <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Raw preview table */}
                  <div className={`flex-1 min-h-[300px] max-h-[45vh] overflow-auto rounded-xl border ${darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50"}`}>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className={`sticky top-0 z-10 font-semibold border-b ${darkMode ? "bg-[#0f111a] border-zinc-800 text-zinc-300" : "bg-zinc-200 border-zinc-300 text-zinc-700"}`}>
                        <tr>
                          <th className="p-3 select-none">#</th>
                          {rawHeaders.map((header) => (
                            <th key={header} className="p-3 font-semibold select-none whitespace-nowrap">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850">
                        {rawRows.slice(0, 100).map((row, index) => (
                          <tr key={index} className={`hover:bg-zinc-800/10 ${darkMode ? "hover:bg-zinc-900" : "hover:bg-zinc-100"}`}>
                            <td className="p-3 text-zinc-500 font-mono">{index + 1}</td>
                            {rawHeaders.map((header) => (
                              <td key={header} className="p-3 truncate max-w-[200px]">{row[header] || <span className="text-zinc-600">-</span>}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rawRows.length > 100 && (
                      <div className="p-4 text-center text-xs text-zinc-500 border-t border-zinc-800 bg-[#0c0d15]/50">
                        Showing first 100 preview rows.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: PROCESSING / AI MAPPING */}
              {step === 3 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 mb-6 animate-pulse">
                    <RefreshCw size={36} className="animate-spin text-cyan-400" />
                  </div>
                  <h4 className="text-lg font-bold">Intelligent AI Mapping in Progress</h4>
                  
                  {/* Visual Progress Bar */}
                  <div className="mt-4 w-full max-w-md bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-700/50">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-cyan-400">{progressPercent}%</span>

                  <p className="mt-3 max-w-md text-xs text-zinc-400 leading-5">
                    {progressMessage}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    Applying CRM status matching, phone splitting, and validation logic.
                  </p>
                </div>
              )}

              {/* STEP 4: MAPPED RESULTS DISPLAY */}
              {step === 4 && (
                <div className="flex flex-col h-full animate-fadeIn">
                  {/* Result Header & Statistics */}
                  <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <div className={`flex flex-col justify-center rounded-xl border p-4 text-center ${darkMode ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-200 bg-zinc-50"}`}>
                      <span className="text-xs text-zinc-400">Total Raw Rows</span>
                      <span className="mt-1 text-2xl font-bold text-zinc-300">{rawRows.length}</span>
                    </div>
                    <div className={`flex flex-col justify-center rounded-xl border p-4 text-center ${datasetType === "crm_leads" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-cyan-500/20 bg-cyan-500/5 text-cyan-400"}`}>
                      <span className="text-xs font-medium">{datasetType === "crm_leads" ? "Successfully Mapped" : "Imported Records"}</span>
                      <span className="mt-1 text-2xl font-bold">{metrics.total_imported}</span>
                    </div>
                    <div className={`flex flex-col justify-center rounded-xl border p-4 text-center ${datasetType === "crm_leads" ? "border-rose-500/20 bg-rose-500/5 text-rose-400" : "border-zinc-800 bg-zinc-900/50 text-zinc-400"}`}>
                      <span className="text-xs font-medium">{datasetType === "crm_leads" ? "Skipped Records" : "Detected Columns"}</span>
                      <span className="mt-1 text-2xl font-bold">{datasetType === "crm_leads" ? metrics.total_skipped : rawHeaders.length}</span>
                    </div>
                    <div className="flex items-center justify-center p-2">
                      <button
                        onClick={resetImporter}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:opacity-95 shadow-md shadow-cyan-500/10"
                      >
                        Import Another File
                      </button>
                    </div>
                  </div>

                  {/* General Dataset Analysis Insights Panel */}
                  {datasetType === "general" && generalAnalysis && (
                    <div className="grid gap-6 md:grid-cols-2 mb-6">
                      {/* Key Takeaways */}
                      <div className={`rounded-xl border p-5 ${darkMode ? "border-zinc-800 bg-[#0f111a]" : "border-zinc-200 bg-white"}`}>
                        <h4 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                          <Zap size={16} /> Dataset Summary & Insights
                        </h4>
                        <p className="text-xs text-zinc-300 mb-4 leading-relaxed">{datasetSummary}</p>
                        <h5 className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wide">Key Takeaways:</h5>
                        <ul className="space-y-2 text-xs text-zinc-400">
                          {generalAnalysis.key_takeaways.map((takeaway, i) => (
                            <li key={i} className="flex gap-2 items-start">
                              <span className="text-cyan-400 mt-0.5">•</span>
                              <span>{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Data Quality Warnings */}
                      <div className={`rounded-xl border p-5 ${darkMode ? "border-zinc-800 bg-[#0f111a]" : "border-zinc-200 bg-white"}`}>
                        <h4 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
                          <AlertTriangle size={16} /> Data Quality & Warnings
                        </h4>
                        {generalAnalysis.data_quality_warnings.length > 0 ? (
                          <ul className="space-y-2 text-xs text-zinc-400">
                            {generalAnalysis.data_quality_warnings.map((warning, i) => (
                              <li key={i} className="flex gap-2 items-start">
                                <span className="text-rose-400 mt-0.5">⚠️</span>
                                <span>{warning}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-emerald-400 flex items-center gap-2">
                            <CheckCircle size={14} /> No significant data quality issues detected in the sample!
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tabs for Mapped / Skipped */}
                  <div className="flex-1 flex flex-col">
                    {/* CRM Leads Table */}
                    {datasetType === "crm_leads" && mappedResults.length > 0 && (
                      <div className="flex flex-col mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="text-emerald-400" size={16} />
                          <h4 className="text-sm font-semibold text-zinc-300">Successfully Imported Leads ({mappedResults.length})</h4>
                        </div>
                        <div className={`overflow-x-auto rounded-xl border max-h-[35vh] ${darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"}`}>
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead className={`sticky top-0 z-10 font-semibold border-b ${darkMode ? "bg-[#0c0d15] border-zinc-800 text-zinc-300" : "bg-zinc-200 border-zinc-300 text-zinc-700"}`}>
                              <tr>
                                <th className="p-3">Created At</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3">Company</th>
                                <th className="p-3">Location</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Source</th>
                                <th className="p-3">Relevancy</th>
                                <th className="p-3">Deal Probability</th>
                                <th className="p-3">Notes & Prediction details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-850">
                              {mappedResults.map((mapped, idx) => (
                                <tr key={idx} className={`hover:bg-zinc-800/10 ${darkMode ? "hover:bg-zinc-900" : "hover:bg-zinc-100"}`}>
                                  <td className="p-3 whitespace-nowrap text-zinc-500">
                                    {new Date(mapped.created_at).toLocaleDateString() || mapped.created_at}
                                  </td>
                                  <td className="p-3 font-semibold text-zinc-300 whitespace-nowrap">{mapped.name || <span className="text-zinc-600">-</span>}</td>
                                  <td className="p-3 text-cyan-400 whitespace-nowrap">{mapped.email || <span className="text-zinc-600">-</span>}</td>
                                  <td className="p-3 whitespace-nowrap">
                                    {mapped.country_code ? `${mapped.country_code} ` : ""}{mapped.mobile_without_country_code || <span className="text-zinc-600">-</span>}
                                  </td>
                                  <td className="p-3 whitespace-nowrap">{mapped.company || <span className="text-zinc-600">-</span>}</td>
                                  <td className="p-3 truncate max-w-[120px]">
                                    {[mapped.city, mapped.state, mapped.country].filter(Boolean).join(", ") || <span className="text-zinc-600">-</span>}
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    {mapped.crm_status ? (
                                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${getStatusBadgeColor(mapped.crm_status)}`}>
                                        {mapped.crm_status.replace(/_/g, " ")}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-600">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    {mapped.data_source ? (
                                      <span className="rounded bg-zinc-800 border border-zinc-700/60 px-1.5 py-0.5 text-[9px] text-zinc-300 font-mono">
                                        {mapped.data_source}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-600">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${getRelevancyBadgeColor(mapped.lead_relevancy)}`}>
                                      {mapped.lead_relevancy || "LOW"}
                                    </span>
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    <div className="flex flex-col gap-1 w-20">
                                      <div className="flex items-center justify-between text-[9px]">
                                        <span className="font-semibold text-zinc-300">{mapped.deal_probability}%</span>
                                      </div>
                                      <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden border border-zinc-700/30">
                                        <div
                                          className={`h-full rounded-full transition-all duration-300 ${
                                            mapped.deal_probability >= 75 ? 'bg-emerald-400' :
                                            mapped.deal_probability >= 30 ? 'bg-amber-400' : 'bg-rose-500'
                                          }`}
                                          style={{ width: `${mapped.deal_probability}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 truncate max-w-[200px]" title={`CRM Note: ${mapped.crm_note}\nPrediction details: ${mapped.conversion_notes}`}>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-zinc-300 truncate">{mapped.crm_note || <span className="text-zinc-600">-</span>}</span>
                                      {mapped.conversion_notes && (
                                        <span className="text-[10px] text-zinc-500 italic truncate">{mapped.conversion_notes}</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* General Dataset Table */}
                    {datasetType === "general" && mappedResults.length > 0 && (
                      <div className="flex flex-col mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="text-cyan-400" size={16} />
                          <h4 className="text-sm font-semibold text-zinc-300">Dataset Records ({mappedResults.length})</h4>
                        </div>
                        <div className={`overflow-x-auto rounded-xl border max-h-[45vh] ${darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"}`}>
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead className={`sticky top-0 z-10 font-semibold border-b ${darkMode ? "bg-[#0c0d15] border-zinc-800 text-zinc-300" : "bg-zinc-200 border-zinc-300 text-zinc-700"}`}>
                              <tr>
                                <th className="p-3">#</th>
                                {generalAnalysis?.normalized_headers.map((hdr) => (
                                  <th key={hdr} className="p-3 whitespace-nowrap">{hdr}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-850">
                              {mappedResults.map((row, idx) => (
                                <tr key={idx} className={`hover:bg-zinc-800/10 ${darkMode ? "hover:bg-zinc-900" : "hover:bg-zinc-100"}`}>
                                  <td className="p-3 text-zinc-500 font-mono">{idx + 1}</td>
                                  {generalAnalysis?.normalized_headers.map((hdr) => (
                                    <td key={hdr} className="p-3 truncate max-w-[200px]">
                                      {(row as any)[hdr] !== undefined && (row as any)[hdr] !== null ? String((row as any)[hdr]) : <span className="text-zinc-600">-</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SKIPPED RECORDS */}
                    {skippedResults.length > 0 && (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="text-rose-400" size={16} />
                          <h4 className="text-sm font-semibold text-zinc-300">Skipped Records ({skippedResults.length})</h4>
                        </div>
                        <div className={`overflow-x-auto rounded-xl border max-h-[25vh] ${darkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"}`}>
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead className={`sticky top-0 z-10 font-semibold border-b ${darkMode ? "bg-[#0c0d15] border-zinc-800 text-zinc-300" : "bg-zinc-200 border-zinc-300 text-zinc-700"}`}>
                              <tr>
                                <th className="p-3">Reason</th>
                                <th className="p-3">Raw Content (As JSON)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-850">
                              {skippedResults.map((skipped, idx) => (
                                <tr key={idx} className={`hover:bg-zinc-800/10 ${darkMode ? "hover:bg-zinc-900" : "hover:bg-zinc-100"}`}>
                                  <td className="p-3 font-semibold text-rose-400 whitespace-nowrap">{skipped.reason}</td>
                                  <td className="p-3 font-mono text-[10px] text-zinc-500 truncate max-w-4xl">{JSON.stringify(skipped.record)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-zinc-800/80 px-6 py-4 bg-[#0c0d15]/50 gap-3">
              <button
                onClick={() => { setShowModal(false); resetImporter(); }}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${darkMode ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800" : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"}`}
              >
                Close Importer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
