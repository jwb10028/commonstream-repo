import Hero from "@/components/Hero";
import FAQ from "@/components/FAQ";
import Logos from "@/components/Logos";
import Benefits from "@/components/Benefits/Benefits";
import Container from "@/components/Container";
import Section from "@/components/Section";
import CTA from "@/components/CTA";
import Mission from "@/components/Mission/Mission";
import Roadmap from "@/components/Roadmap/Roadmap";

const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <Logos />
      <Container>
        <Benefits />

        <Section
          id="Mission"
          title="Mission"
          description="Democratizing the artist & music discovery process."
        >
          <Mission/>
        </Section>

        <Section
          id="Roadmap"
          title="Roadmap"
          description="Visualizing the development & release schedule."
        >
          <Roadmap/>
        </Section>

        <FAQ />

        {/*<Stats />*/}
        
        <CTA />
      </Container>
    </>
  );
};

export default HomePage;
