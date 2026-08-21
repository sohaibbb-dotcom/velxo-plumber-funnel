import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
      <Footer />
    </>
  );
}
