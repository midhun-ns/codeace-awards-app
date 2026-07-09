"use client";

import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface QRDisplayProps {
  url: string;
  presenterName: string;
  presenterTitle: string;
}

export function QRDisplay({ url, presenterName, presenterTitle }: QRDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-6 w-full"
    >
      <div className="admin-qr-glow">
        <div className="admin-qr-frame">
          <QRCodeSVG
            value={url}
            size={260}
            level="H"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#1e1b4b"
          />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">{presenterName}</h3>
        <p className="text-violet-400 font-medium">{presenterTitle}</p>
        <p className="text-slate-500 text-sm">Scan to rate this presentation</p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="admin-btn-outline"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </motion.div>
  );
}
