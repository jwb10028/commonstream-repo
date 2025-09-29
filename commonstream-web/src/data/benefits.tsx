import { FiBarChart2, FiBriefcase, FiDollarSign, FiLock, FiPieChart, FiShield, FiTarget, FiTrendingUp, FiUser } from "react-icons/fi";

import { IBenefit } from "@/types"

export const benefits: IBenefit[] = [
    {
        title: "AI-Assisted Discovery",
        description: "Take the guesswork out of finding your next favorite track. CommonStream’s AI-powered search adapts to your taste and helps you uncover music in ways traditional platforms can’t.",
        bullets: [
            {
                title: "Intelligent Search",
                description: "Find songs, artists, or genres through natural queries — even describe a vibe, and let the AI surface what matches.",
                icon: <FiBarChart2 size={26} />
            },
            {
                title: "Contextual Recommendations",
                description: "Explore new sounds based on mood, scene, or community-driven tags instead of generic algorithmic pushes.",
                icon: <FiTarget size={26} />
            },
            {
                title: "Transparent Results",
                description: "Understand why media appears in your feed with clear explanations — no hidden boosts or pay-to-play surfacing.",
                icon: <FiTrendingUp size={26} />
            }
        ],
        imageSrc: "/images/mockup-1.webp"
    },
    {
        title: "Seamless Access",
        description: "Discover music without limits. CommonStream connects you directly to streaming platforms and digital marketplaces, giving you the choice of how to listen — and how to support the artists you love.",
        bullets: [
            {
                title: "Universal Deeplinks",
                description: "Jump straight from discovery into your preferred platform — Spotify, Apple Music, Tidal, Bandcamp, and more.",
                icon: <FiDollarSign size={26} />
            },
            {
                title: "Artist-First Options",
                description: "Explore links to digital marketplaces so you can buy, download, or support creators directly.",
                icon: <FiBriefcase size={26} />
            },
            {
                title: "Freedom of Choice",
                description: "No platform lock-in. You decide where and how to experience the music you discover.",
                icon: <FiPieChart size={26} />
            }
        ],
        imageSrc: "/images/mockup-2.webp"
    },
    {
        title: "Tailored Exploration",
        description: "Go beyond generic recommendations. CommonStream builds a rich, multi-dimensional taste profile that captures the full scope of your interests and empowers you to shape your search experience.",
        bullets: [
            {
                title: "Context-Rich Profiles",
                description: "Define your tastes across music, artists, genres — plus books, films, and TV — to create a discovery graph that’s truly yours.",
                icon: <FiLock size={26} />
            },
            {
                title: "Adaptive Search",
                description: "Every query is filtered through your evolving profile, ensuring results feel personal, not random.",
                icon: <FiUser size={26} />
            },
            {
                title: "Custom Prompts",
                description: "Contour how the system responds by adding your own preferences and directives, giving you control over the AI’s voice in discovery.",
                icon: <FiShield size={26} />
            }
        ],
        imageSrc: "/images/mockup-3.png"
    },
]