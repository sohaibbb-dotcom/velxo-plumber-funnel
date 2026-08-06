import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Demo } from "@/components/sections/Demo";
import { Comparison } from "@/components/sections/Comparison";
import { Calculator } from "@/components/sections/Calculator";
import { WhyVelxo } from "@/components/sections/WhyVelxo";
import { Pricing } from "@/components/sections/Pricing";
import { Showcase } from "@/components/sections/Showcase";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Demo />
        <Comparison />
        <Calculator />
        <WhyVelxo />
        <Pricing />
        <Showcase />
      </main>
    </>
  );
}
