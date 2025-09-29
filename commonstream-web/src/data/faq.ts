import { IFAQ } from "@/types";
import { siteDetails } from "./siteDetails";

export const faqs: IFAQ[] = [
  {
    question: `Is ${siteDetails.siteName} secure?`,
    answer:
      "Yes. We use industry-standard encryption and OAuth for account linking. We never store your streaming or marketplace passwords, and you can revoke access at any time."
  },
  {
    question: "How do deeplinks work?",
    answer:
      "When you find a track, we provide one-tap links to your preferred services—streaming platforms or digital marketplaces—so you choose how to listen or support the artist. No platform lock-in."
  },
  {
    question: "Do I need a paid streaming account to use it?",
    answer:
      "No. You can search, build a taste profile, and save items without linking an account. Playback happens on any connected service; seamless in-app listening is on our roadmap."
  },
  {
    question: "How are recommendations generated?",
    answer:
      "Our AI blends your taste profile with community tags and context (mood, scenes, adjacent media). Results include a brief “why this” explanation, and you can steer them with custom prompts."
  },
  {
    question: "What data does CommonStream collect?",
    answer:
      "Only minimal, privacy-respecting analytics (e.g., feature usage) to improve the product. Metrics are aggregated/anonymized, and you can request or delete your data at any time."
  }
];
