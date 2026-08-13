import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { BelowFold } from "@/components/sections/BelowFold";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BelowFold />
      </main>
    </>
  );
}
