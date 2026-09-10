"use client";

import React, { useState, useRef } from "react";
import axios from "axios";

const TextToSpeechComponent = () => {
  const [text, setText] = useState("");
  const [lang, setLang] = useState("fr");
  const [slow, setSlow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleConvert = async () => {
    if (!text.trim()) return alert("Veuillez saisir du texte.");
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/text-to-speech",
        { text, lang, slow },
        { responseType: "blob" }
      );
      const blobUrl = URL.createObjectURL(response.data);
      setAudioUrl(blobUrl);

      if (audioRef.current) {
        audioRef.current.src = blobUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Erreur :", error);
      alert("Erreur de conversion.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Text-to-Speech</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Saisis ton texte ici..."
        className="w-full border rounded-md p-2 mb-3"
      />
      <div className="flex items-center gap-4 mb-4">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="border rounded p-2"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={slow}
            onChange={(e) => setSlow(e.target.checked)}
          />
          Lent
        </label>
      </div>
      <button
        onClick={handleConvert}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
      >
        {loading ? "Conversion..." : "Écouter"}
      </button>

      {audioUrl && (
        <>
          <audio ref={audioRef} controls className="mt-4 w-full" />
          <a
            href={audioUrl}
            download="audio.mp3"
            className="mt-3 block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
          >
            Télécharger l'audio
          </a>
        </>
      )}
    </div>
  );
};

export default TextToSpeechComponent;
