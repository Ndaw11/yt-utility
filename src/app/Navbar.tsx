"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  { name: "Accueil", path: "/" },
  { name: "Tags Vidéo", path: "/video-tags" },
  { name: "Transcription", path: "/transcription" }, // Nouvel onglet
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#1F2937] text-white p-4 shadow-lg fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          🌟 YouTube Analyzer
        </Link>
        <div className="flex space-x-6">
          {navItems.map((item) => (
            <Link key={item.name} href={item.path}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`relative px-3 py-2 rounded-md transition-colors ${
                  pathname === item.path
                    ? "bg-[#34D399] text-[#1F2937] font-semibold"
                    : "hover:bg-[#374151]"
                }`}
              >
                {item.name}
                {pathname === item.path && (
                  <motion.div
                    className="absolute bottom-0 left-0 w-full h-1 bg-[#A3E635]"
                    layoutId="underline"
                  />
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}