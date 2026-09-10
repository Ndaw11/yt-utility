// app/transcription/page.tsx
"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Configuration du QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 3600000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function VideoTranscriptPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <VideoTranscriptContent />
    </QueryClientProvider>
  );
}

function VideoTranscriptContent() {
  const [videoInput, setVideoInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [inputError, setInputError] = useState("");
  const [progress, setProgress] = useState(0);

  // Requête pour la transcription
  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ["videoTranscript", videoInput],
    queryFn: async () => {
      if (!videoInput.trim()) return null;
      const url = `http://localhost:8080/api/video-transcript/${encodeURIComponent(videoInput)}`;
      console.log("Envoi de la requête vers :", url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        console.log("Statut HTTP :", res.status);
        if (!res.ok) {
          const errorDetail = await res.json();
          if (res.status === 404) {
            throw new Error("🚫 Aucune transcription disponible. Vérifiez l'URL ou l'ID.");
          } else if (res.status === 503) {
            throw new Error("⏳ Erreur : Quota API dépassé, réessayez plus tard.");
          } else if (res.status === 500) {
            throw new Error("⚠️ Erreur serveur.");
          }
          throw new Error(errorDetail.detail || "Erreur inconnue.");
        }
        const json = await res.json();
        console.log("Réponse JSON :", json);
        return json;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err.name === "AbortError" ? new Error("⏳ Requête trop longue, essayez encore !") : err;
      }
    },
    enabled: false,
  });

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? prev : prev + 10));
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

const validateInput = (input: string) => {
  const videoUrlPattern = /^(https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[0-9A-Za-z_-]{11})/;
  const videoIdPattern = /^[0-9A-Za-z_-]{11}$/;
  if (videoUrlPattern.test(input) || videoIdPattern.test(input)) {
    return "";
  }
  return "🚫 Veuillez entrer une URL de vidéo YouTube valide ou un ID (ex. https://www.youtube.com/watch?v=VIDEO_ID ou https://www.youtube.com/shorts/VIDEO_ID).";
};

  const handleCheck = () => {
    const validationError = validateInput(videoInput);
    if (validationError) {
      setInputError(validationError);
      return;
    }
    setInputError("");
    if (!videoInput.trim()) {
      setInputError("🚫 Veuillez entrer une URL ou un ID valide.");
      return;
    }
    console.log("Vérification vidéo :", videoInput);
    refetch();
  };

  const handleCopyTranscript = () => {
    if (data && data.transcript) {
      navigator.clipboard.writeText(data.transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#181818] text-white p-6">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎥 Transcription Vidéo YouTube</h1>
          <p className="text-gray-400 text-base">
            Entrez l'URL d'une vidéo YouTube pour obtenir sa transcription en texte ! 🚀
          </p>
        </div>

        <div className="flex gap-4 justify-center mb-6 max-w-2xl mx-auto">
          <Input
            type="text"
            value={videoInput}
            onChange={(e) => {
              setVideoInput(e.target.value);
              setInputError("");
            }}
            placeholder="Ex. https://www.youtube.com/watch?v=VIDEO_ID"
            className="input-field"
          />
          <Button
            onClick={handleCheck}
            disabled={isLoading}
            className="action-button"
          >
            {isLoading ? "🔄 Analyse..." : "Obtenir la transcription 🌍"}
          </Button>
        </div>

        {inputError && <p className="error-message text-center">{inputError}</p>}

        {isLoading && (
          <div className="mb-6 max-w-sm mx-auto">
            <div className="progress-bar">
              <div className="progress-bar-inner" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-center mt-2 text-[#34D399] text-base">
              Analyse en cours... {progress}% ✨
            </p>
          </div>
        )}
<br />
<br />
<AnimatePresence>
  {data && !error && !inputError && (
    <div className="results-frame max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          Transcription :{" "}
          <a 
            href={data.video_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#34D399] hover:underline"
          >
            🔗
          </a>
        </h2>
        <Button
          onClick={handleCopyTranscript}
          disabled={!data.transcript}
          className="copy-button"
        >
          {copied ? "✔ Copié !" : "📋 Copier la transcription"}
        </Button>
      </div>
      <div className="bg-[#333333] p-4 rounded-md">
        <p className="text-white whitespace-pre-wrap">{data.transcript}</p>
      </div>
    </div>
  )}
</AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-4"
          >
            <p className="text-base text-[#F87171]">{error.message}</p>
            <Button
              onClick={handleCheck}
              className="mt-3 bg-[#F87171] hover:bg-[#EF4444] rounded-md"
            >
              Réessayer 🔄
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}