import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Capabilities } from "@/components/sections/Capabilities";
import { CompleteUpsell } from "@/components/sections/CompleteUpsell";
import { Problem } from "@/components/sections/Problem";
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
        <Capabilities />
        <CompleteUpsell />
        <Problem />
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
