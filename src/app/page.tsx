// app/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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
      const url = `http://localhost:8000/api/channel-info/${encodeURIComponent(channelInput)}`;
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

  const validateInput = (input) => {
    const channelUrlPattern = /^(https?:\/\/(www\.)?youtube\.com\/(channel\/[a-zA-Z0-9_-]+|@([a-zA-Z0-9_-]+)))$/;
    const channelIdPattern = /^UC[a-zA-Z0-9_-]{22}$/;
    const handlePattern = /^@[a-zA-Z0-9_-]+$/;
    const searchUrlPattern = /youtube\.com\/results\?search_query=/;

    if (searchUrlPattern.test(input)) {
      return "🚫 Veuillez entrer une URL de chaîne ou un handle (ex. @TMZ).";
    }
    if (channelUrlPattern.test(input) || channelIdPattern.test(input) || handlePattern.test(input)) {
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
    if (!channelInput.trim()) {
      setInputError("🚫 Veuillez entrer une URL ou un handle valide.");
      return;
    }
    console.log("Vérification chaîne :", channelInput);
    refetch();
    setShowResults(true);
  };

  const handleInputChange = (e) => {
    setChannelInput(e.target.value);
    setShowResults(false);
    setInputError("");
  };

  const handleCopyTags = () => {
    if (data && data.tags) {
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

        {inputError && <p className="error-message text-center">{inputError}</p>}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 max-w-sm mx-auto"
          >
            <div className="progress-bar">
              <div className="progress-bar-inner" style={{ width: `${progress}%` }} />
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
              className="results-frame max-w-3xl mx-auto"
            >
              {error ? (
                <div className="text-center p-4">
                  <p className="text-base text-[#F87171]">{error.message}</p>
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
                        className="banner-image"
                      />
                    </div>
                  )}
                  {data.thumbnails && (
                    <div className="profile-pic-container">
                      <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring" }}>
                        <Image
                          src={data.thumbnails}
                          alt="Photo de profil"
                          width={80}
                          height={80}
                          className="profile-pic"
                        />
                      </motion.div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="monetization-status"
                    >
                      <span className="emoji">💸</span>
                      <span className="label">Statut de monétisation</span>
                      <span className="emoji">💵</span> :{" "}
                      <span
                        className={data.monetization_status.is_likely_monetized ? "value" : "disabled"}
                      >
                        {data.monetization_status.is_likely_monetized ? "ACTIVÉ" : "DÉSACTIVÉ"}
                      </span>
                      <span className="emoji">💰</span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: data.google_analytics && data.google_analytics.is_connected ? 1.8 : 1.7,
                      }}
                      className="section-item"
                    >
                      <span className="emoji">🕵️</span>
                      <span className="label">Statut de la publicité de la chaîne :</span>
                      <span
                        className={data.monetization_status.is_likely_monetized ? "value" : "disabled"}
                      >
                        {data.monetization_status.is_likely_monetized
                          ? "🏆 Les publicités sont actives sur cette chaîne."
                          : "Les publicités ne sont pas actives sur cette chaîne."}
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="section-item"
                    >
                      <span className="emoji">🎨</span>
                      <span className="label">Originalité de la chaîne :</span>
                      <span className={data.originality_status.is_original ? "value" : "disabled"}>
                        {data.originality_status.display}
                      </span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="section-item"
                    >
                      <span className="emoji">🎯</span>
                      <span className="label">Catégorie/Niche :</span>
                      <span className={data.niche_info.main_niche === "inconnue" ? "warning" : "value"}>
                        {data.niche_info.description}
                      </span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="section-item"
                    >
                      <span className="emoji">🌍</span>
                      <span className="label">Localisation :</span>
                      <span className="value">
                        {data.location.country_name} ({data.location.country_code})
                      </span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      className="section-item"
                    >
                      <span className="emoji">☎️</span>
                      <span className="label">Indicatif téléphonique :</span>
                      <span className="secondary-value">{data.location.phone_code}</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                      className="section-item"
                    >
                      <span className="emoji">📅</span>
                      <span className="label">Date de création :</span>
                      <span className="value">
                        {data.creation_date} ({data.time_elapsed.description})
                      </span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                      className="section-item"
                    >
                      <span className="emoji">🏷️</span>
                      <span className="label">Tags/Mots-clés :</span>
                      <span className={data.tags[0].startsWith("⚠️") ? "warning" : "value"}>
                        {data.tags.join(", ")}
                        <button onClick={handleCopyTags} className="copy-button">
                          {copied ? "✔ Copié !" : "📋 Copier"}
                        </button>
                      </span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                      className="section-item"
                    >
                      <span className="emoji">👥</span>
                      <span className="label">Abonnés :</span>
                      <span className="value">
                        {data.statistics.subscribers.toLocaleString()} ({data.statistics.badge})
                      </span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                      className="section-item"
                    >
                      <span className="emoji">📈</span>
                      <span className="label">Croissance des abonnés :</span>
                      <span className="value">{data.growth_info.description}</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.9 }}
                      className="section-item"
                    >
                      <span className="emoji">❤️</span>
                      <span className="label">Engagement global :</span>
                      <span className="value">{data.engagement_info.description}</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 1.0 }}
                      className="section-item"
                    >
                      <span className="emoji">🎥</span>
                      <span className="label">Nombre de vidéos :</span>
                      <span className="value">{data.statistics.videos.toLocaleString()} vidéos</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 1.1 }}
                      className="section-item"
                    >
                      <span className="emoji">👀</span>
                      <span className="label">Nombre total de vues :</span>
                      <span className="value">{data.statistics.views.toLocaleString()}</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 1.2 }}
                      className="section-item"
                    >
                      <span className="emoji">📊</span>
                      <span className="label">Performance récente :</span>
                      <span className="value">{data.recent_performance.description}</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 1.3 }}
                      className="section-item"
                    >
                      <span className="emoji">🎬</span>
                      <span className="label">Fréquence de téléchargement :</span>
                      <div className="sub-list">
                        <span>➡️ {data.frequency.videos_per_year} vidéos par an</span>
                        <span>➡️ {data.frequency.videos_per_month} vidéos par mois</span>
                        <span>➡️ {data.frequency.videos_per_week} vidéos par semaine</span>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 1.4 }}
                      className="section-item"
                    >
                      <span className="emoji">📐</span>
                      <span className="label">Moyennes :</span>
                      <div className="sub-list">
                        <span>
                          ➡️ Vues par an : {data.averages.views_per_year.toLocaleString()}
                          {data.time_elapsed.years < 1 && " (Moins d'un an)"}
                        </span>
                        <span>
                          ➡️ Vues par mois : {data.averages.views_per_month.toLocaleString()}
                        </span>
                        <span>
                          ➡️ Vues par jour : {data.averages.views_per_day.toLocaleString()}
                        </span>
                        <span>
                          ➡️ Vues par vidéo : {data.averages.views_per_video.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>

                    {data.revenue_estimation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 1.5 }}
                        className="section-item"
                      >
                        <span className="emoji">💰</span>
                        <span className="label">Revenus estimés :</span>
                        <span className="value">{data.revenue_estimation.description}</span>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 1.6 }}
                      className="section-item"
                    >
                      <span className="emoji">👪</span>
                      <span className="label">Destinée aux enfants ? :</span>
                      <span className="value">{data.child_directed_status.display}</span>
                    </motion.div>

                    {data.google_analytics && data.google_analytics.is_connected && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 1.7 }}
                        className="section-item"
                      >
                        <span className="emoji">📈</span>
                        <span className="label">Suivi Google Analytics :</span>
                        <span className="value">
                          Un compte Google Analytics est-il connecté à cette chaîne ? Oui ! Cette
                          chaîne suit et mesure le trafic avec Google Analytics :{" "}
                          {data.google_analytics.tracking_id}
                        </span>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: data.google_analytics && data.google_analytics.is_connected ? 1.9 : 1.8,
                      }}
                      className="section-item"
                    >
                      <span className="emoji">🔗</span>
                      <span className="label">URL de la chaîne :</span>
                      <a href={data.channel_url} target="_blank" className="value">
                        {data.channel_url}
                      </a>
                    </motion.div>
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