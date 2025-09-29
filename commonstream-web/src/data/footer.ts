import { IMenuItem, ISocials } from "@/types";

export const footerDetails: {
    subheading: string;
    quickLinks: IMenuItem[];
    email: string;
    telephone: string;
    socials: ISocials;
} = {
    subheading: "Empowering businesses with cutting-edge audio & music discovery solutions.",
    quickLinks: [
        {
            text: "Features",
            url: "#features"
        },
        {
            text: "Mission",
            url: "#pricing"
        },
        {
            text: "Roadmap",
            url: "#testimonials"
        }
    ],
    email: 'help@CommonStream.com',
    telephone: '+1 (111) 111-1111',
    socials: {
        // github: 'https://github.com',
        // x: 'https://twitter.com/x',
        twitter: 'https://twitter.com/Twitter',
        facebook: 'https://facebook.com',
        // youtube: 'https://youtube.com',
        linkedin: 'https://www.linkedin.com',
        // threads: 'https://www.threads.net',
        instagram: 'https://www.instagram.com',
    }
}