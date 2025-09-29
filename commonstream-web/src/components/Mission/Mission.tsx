// src/components/Mission/Mission.tsx
"use client";

import { motion } from "framer-motion";
import { BsFillHeartFill, BsMusicNoteBeamed, BsPeople } from "react-icons/bs";
import React from "react";

const Mission: React.FC = () => {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-16">
      <motion.div
        className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 lg:p-12"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h2 className="text-3xl font-bold mb-4 text-center">Our Mission</h2>

        <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">
          CommonStream is putting audio search and discovery back in the hands
          of artists and listeners — not corporations. Our mission is to create
          a transparent, community-driven ecosystem where creativity and choice thrive.
        </p>

        <ul className="space-y-6 max-w-3xl mx-auto">
          <li className="flex items-start">
            <BsMusicNoteBeamed className="h-6 w-6 text-primary mr-3 mt-1" />
            <span className="text-gray-700">
              <strong>Transparent Discovery:</strong> AI-assisted search that surfaces
              music based on context and taste — not hidden algorithms.
            </span>
          </li>
          <li className="flex items-start">
            <BsPeople className="h-6 w-6 text-primary mr-3 mt-1" />
            <span className="text-gray-700">
              <strong>Community First:</strong> Give both listeners and artists control
              over how music is shared, recommended, and supported.
            </span>
          </li>
          <li className="flex items-start">
            <BsFillHeartFill className="h-6 w-6 text-primary mr-3 mt-1" />
            <span className="text-gray-700">
              <strong>Support Artists:</strong> Provide direct links to streaming
              platforms, marketplaces, and fan engagement options — empowering
              artists to thrive on their own terms.
            </span>
          </li>
        </ul>
      </motion.div>
    </section>
  );
};

export default Mission;
