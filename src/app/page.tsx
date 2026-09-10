// app/page.tsx (ou app/page.jsx)
"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// Initialisation propre du QueryClient en dehors du composant principal
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 3600000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomeContent />
    </QueryClientProvider>
  );
}

function HomeContent() {
  const [channelInput, setChannelInput] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [inputError, setInputError] = useState("");

  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ["channel", channelInput],
    queryFn: async () => {
      if (!channelInput.trim()) return null;
      const url = `http://localhost:8080/api/channel-info/${encodeURIComponent(channelInput.trim())}`;
      console.log("Envoi de la requête vers :", url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        console.log("Statut HTTP :", res.status);
        
        if (!res.ok) {
          const errorDetail = await res.json().catch(() => ({}));
          if (res.status === 404) {
            throw new Error("🚫 Chaîne non trouvée. Vérifiez l'URL ou le handle.");
          } else if (res.status === 503) {
            throw new Error("⏳ Erreur : Veuillez réessayer plus tard.");
          } else if (res.status === 500) {
            throw new Error("⚠️ Erreur serveur.");
          }
          throw new Error(errorDetail.detail || "Erreur inconnue.");
        }
        
        const json = await res.json();
        console.log("Réponse JSON :", json);
        return json;
      } catch (err: any) {
        clearTimeout(timeoutId);
        throw err.name === "AbortError" 
          ? new Error("⏳ Requête trop longue, essayez encore !") 
          : err;
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

  const validateInput = (input: string): string => {
    const trimmedInput = input.trim();
    const channelUrlPattern = /^(https?:\/\/(www\.)?youtube\.com\/(channel\/[a-zA-Z0-9_-]+|@([a-zA-Z0-9_-]+)))$/;
    const channelIdPattern = /^UC[a-zA-Z0-9_-]{22}$/;
    const handlePattern = /^@[a-zA-Z0-9_-]+$/;
    const searchUrlPattern = /youtube\.com\/results\?search_query=/;

    if (!trimmedInput) {
      return "🚫 Veuillez entrer une URL ou un handle valide.";
    }
    if (searchUrlPattern.test(trimmedInput)) {
      return "🚫 Veuillez entrer une URL de chaîne ou un handle (ex. @TMZ).";
    }
    if (
      channelUrlPattern.test(trimmedInput) ||
      channelIdPattern.test(trimmedInput) ||
      handlePattern.test(trimmedInput)
    ) {
      return "";
    }
    return "🚫 Veuillez entrer une URL de chaîne valide ou un handle (ex. @TMZ).";
  };

  const handleCheck = () => {
    const validationError = validateInput(channelInput);
    if (validationError) {
      setInputError(validationError);
      return;
    }
    setInputError("");
    console.log("Vérification chaîne :", channelInput);
    refetch();
    setShowResults(true);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChannelInput(e.target.value);
    setShowResults(false);
    setInputError("");
  };

  const handleCopyTags = () => {
    if (data?.tags) {
      navigator.clipboard.writeText(data.tags.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#181818] text-white p-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">🌟 Analyseur de Chaînes YouTube</h1>
          <p className="text-gray-400 text-base">
            Découvrez les statistiques de vos chaînes préférées en un clin d'œil ! 🚀
          </p>
        </motion.div>

        <div className="flex gap-4 justify-center mb-6 max-w-2xl mx-auto">
          <Input
            type="text"
            value={channelInput}
            onChange={handleInputChange}
            placeholder="Ex. @TMZ ou https://www.youtube.com/channel/UC..."
            className="input-field"
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCheck}
              disabled={isLoading}
              className="action-button"
            >
              {isLoading ? "🔄 Analyse..." : "Explorer 🌍"}
            </Button>
          </motion.div>
        </div>

        {inputError && <p className="error-message text-center text-[#F87171] mb-4">{inputError}</p>}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 max-w-sm mx-auto"
          >
            <div className="progress-bar w-full bg-gray-700 h-2 rounded overflow-hidden">
              <div className="progress-bar-inner bg-[#34D399] h-full transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-center mt-2 text-[#34D399] text-base">
              Analyse en cours... {progress}% ✨
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {showResults && !inputError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="results-frame max-w-3xl mx-auto space-y-4"
            >
              {error ? (
                <div className="text-center p-4">
                  <p className="text-base text-[#F87171]">{(error as Error).message}</p>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button
                      onClick={handleCheck}
                      className="mt-3 bg-[#F87171] hover:bg-[#EF4444] rounded-md"
                    >
                      Réessayer 🔄
                    </Button>
                  </motion.div>
                </div>
              ) : !data ? (
                <p className="text-[#F87171] text-center text-base">🚫 Chaîne non trouvée</p>
              ) : (
                <>
                  {data.banner && (
                    <div className="banner-container">
                      <Image
                        src={data.banner}
                        alt="Bannière de la chaîne"
                        width={800}
                        height={160}
                        className="banner-image rounded-lg object-cover"
                      />
                    </div>
                  )}
                  {data.thumbnails && (
                    <div className="profile-pic-container flex justify-center -mt-10 relative z-10">
                      <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring" }}>
                        <Image
                          src={data.thumbnails}
                          alt="Photo de profil"
                          width={80}
                          height={80}
                          className="profile-pic rounded-full border-2 border-white object-cover"
                        />
                      </motion.div>
                    </div>
                  )}

                  <div className="space-y-3 bg-[#202020] p-6 rounded-xl shadow-lg">
                    {/* Monétisation */}
                    <div className="monetization-status flex items-center gap-2">
                      <span className="emoji">💸</span>
                      <span className="label">Statut de monétisation</span>
                      <span className="emoji">💵</span> :{" "}
                      <span className={data.monetization_status?.is_likely_monetized ? "value text-green-400 font-bold" : "disabled text-red-400 font-bold"}>
                        {data.monetization_status?.is_likely_monetized ? "ACTIVÉ" : "DÉSACTIVÉ"}
                      </span>
                      <span className="emoji">💰</span>
                    </div>

                    {/* Originalité */}
                    <div className="section-item flex items-center gap-2">
                      <span className="emoji">🎨</span>
                      <span className="label">Originalité de la chaîne :</span>
                      <span className={data.originality_status?.is_original ? "value text-green-400" : "disabled text-yellow-400"}>
                        {data.originality_status?.display}
                      </span>
                    </div>

                    {/* Niche */}
                    <div className="section-item flex items-center gap-2">
                      <span className="emoji">🎯</span>
                      <span className="label">Catégorie/Niche :</span>
                      <span className="value">{data.niche_info?.description}</span>
                    </div>

                    {/* Localisation */}
                    <div className="section-item flex items-center gap-2">
                      <span className="emoji">🌍</span>
                      <span className="label">Localisation :</span>
                      <span className="value">
                        {data.location?.country_name} ({data.location?.country_code})
                      </span>
                    </div>

                    {/* Téléphone */}
                    <div className="section-item flex items-center gap-2">
                      <span className="emoji">☎️</span>
                      <span className="label">Indicatif téléphonique :</span>
                      <span className="secondary-value text-gray-300">{data.location?.phone_code}</span>
                    </div>

                    {/* Date de création */}
                    <div className="section-item flex items-center gap-2">
                      <span className="emoji">📅</span>
                      <span className="label">Date de création :</span>
                      <span className="value">
                        {data.creation_date} ({data.time_elapsed?.description})
                      </span>
                    </div>

                    {/* Tags */}
                    {data.tags && data.tags.length > 0 && (
                      <div className="section-item flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="emoji">🏷️</span>
                          <span className="label">Tags/Mots-clés :</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between bg-[#181818] p-3 rounded-md gap-2">
                          <span className="text-sm text-gray-300 break-all">
                            {data.tags.join(", ")}
                          </span>
                          <button 
                            onClick={handleCopyTags} 
                            className="copy-button bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs transition"
                          >
                            {copied ? "✔ Copié !" : "📋 Copier"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Abonnés */}
                    <div className="section-item flex items-center gap-2">
                      <span className="emoji">👥</span>
                      <span className="label">Abonnés :</span>
                      <span className="value">
                        {data.statistics?.subscribers?.toLocaleString()} ({data.statistics?.badge})
                      </span>
                    </div>

                    {/* Vidéos et Vues */}
                    <div className="section-item flex items-center gap-2">
                      <span className="emoji">🎥</span>
                      <span className="label">Nombre de vidéos :</span>
                      <span className="value">{data.statistics?.videos?.toLocaleString()} vidéos</span>
                    </div>

                    <div className="section-item flex items-center gap-2">
                      <span className="emoji">👀</span>
                      <span className="label">Nombre total de vues :</span>
                      <span className="value">{data.statistics?.views?.toLocaleString()}</span>
                    </div>

                    {/* URL de la chaîne */}
                    <div className="section-item flex items-center gap-2 pt-2 border-t border-gray-700">
                      <span className="emoji">🔗</span>
                      <span className="label">URL de la chaîne :</span>
                      <a href={data.channel_url} target="_blank" rel="noreferrer" className="value text-blue-400 underline">
                        {data.channel_url}
                      </a>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}