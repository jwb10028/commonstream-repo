// src/components/Roadmap/Roadmap.tsx
"use client";

import clsx from "clsx";
import {
  BsRocketTakeoff,
  BsLink45Deg,
  BsCloudCheck,
  BsGraphUp,
  BsMusicNoteBeamed,
  BsScissors,
  BsShieldCheck,
  BsBroadcastPin,
} from "react-icons/bs";
import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

type Bullet = { text: string };
type Stage = {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  bullets: Bullet[];
};

const ROADMAP: Stage[] = [
  {
    id: "phase-1",
    title: "Phase 1 — Beta Launch (MVP)",
    subtitle:
      "Invite-only iOS/Android + web. Establish core loop and feedback path.",
    icon: <BsRocketTakeoff className="h-5 w-5" />,
    bullets: [
      { text: "AI-assisted audio search (vibe / text / genre queries)" },
      { text: "Profiles for artists & listeners; basic discovery feeds" },
      { text: "Contextual tags + early taste profiling" },
      { text: "Waitlist & in-app feedback collection" },
    ],
  },
  {
    id: "phase-2",
    title: "Phase 2 — Public Launch",
    subtitle:
      "Open access with platform linking and transparent discovery signals.",
    icon: <BsLink45Deg className="h-5 w-5" />,
    bullets: [
      { text: "Streaming account linking (Spotify, Apple Music, Tidal, …)" },
      { text: "Universal deeplinks to streaming & marketplaces" },
      { text: "Cross-media taste profile (music, artists, genres + books/film/TV)" },
      { text: "“Why this track?”—explanations for surfaced results" },
      { text: "Artist tools: metadata management & track highlighting" },
    ],
  },
  {
    id: "phase-3",
    title: "Phase 3 — Platform Expansion",
    subtitle:
      "Scale services & personalization while preserving privacy and control.",
    icon: <BsCloudCheck className="h-5 w-5" />,
    bullets: [
      { text: "Cloud-native services, auto-scaling, observability" },
      { text: "Global analytics (anonymized usage & discovery trends)" },
      { text: "Multi-domain taste graphs for contextual personalization" },
      { text: "User-defined system prompts to contour AI responses" },
      { text: "Security & privacy reviews / threat modeling" },
    ],
  },
  {
    id: "phase-4",
    title: "Phase 4 — Full Ecosystem",
    subtitle:
      "Own the experience end-to-end with in-app playback and creator revenue.",
    icon: <BsMusicNoteBeamed className="h-5 w-5" />,
    bullets: [
      { text: "CommonStream-hosted audio/media for seamless in-app listening" },
      { text: "Artist monetization: direct purchase, tips, merch integrations" },
      { text: "Community features: collab playlists, peer recommendations" },
      { text: "Governance & transparency: algorithm changelogs, community input" },
      { text: "Partnerships (labels, indie distributors, creator collectives)" },
    ],
  },
];

// Animations
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
const bulletVariants = {
  hidden: { opacity: 0, x: 8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const Roadmap: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll progress for the vertical "trail"
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 20%"], // reveal from near-enter to near-exit
  });
  const trailProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 20,
    mass: 0.2,
  });

  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold mb-3 text-center">Roadmap</h2>
      <p className="text-lg text-gray-600 mb-10 text-center max-w-3xl mx-auto">
        Where we’re headed: a clear path from MVP to a creator-first ecosystem.
        Built with transparency, portability, and artist empowerment at the core.
      </p>

      {/* Timeline */}
      <div ref={containerRef} className="relative">
        {/* Base line */}
        <div className="absolute left-4 top-0 h-full w-px bg-gray-200" />

        {/* Animated progress line (the “trail”) */}
        <motion.div
          className="absolute left-[14px] top-0 h-full w-1 origin-top rounded-full
                     bg-gradient-to-b from-primary to-primary/30"
          style={{ scaleY: trailProgress }}
          aria-hidden
        />

        <ol className="space-y-12">
          {ROADMAP.map((stage, idx) => (
            <motion.li
              key={stage.id}
              className="relative pl-12"
              variants={itemVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2, margin: "0px 0px -80px 0px" }}
              transition={{ delay: idx * 0.06 }}
            >
              {/* Node */}
              <span
                className={clsx(
                  "absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border",
                  "bg-white border-gray-300 text-gray-700 shadow-sm"
                )}
              >
                {stage.icon}
              </span>

              {/* Item card (kept minimal; no outer section card) */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold">{stage.title}</h3>
                    {stage.subtitle && (
                      <p className="mt-1 text-gray-600">{stage.subtitle}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span className="inline-block rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
                      {`Stage ${idx + 1}`}
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-2">
                  {stage.bullets.map((b, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start"
                      variants={bulletVariants}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <BsShieldCheck className="mt-1 mr-2 h-4 w-4 text-primary" />
                      <span className="text-gray-700">{b.text}</span>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <BsGraphUp className="h-4 w-4" /> measurable, iterative
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BsBroadcastPin className="h-4 w-4" /> community-driven
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BsScissors className="h-4 w-4" /> taste-driven personalization
                  </span>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Roadmap;
