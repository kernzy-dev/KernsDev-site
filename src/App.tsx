import Nav from "./components/Nav";
import Hero from "./components/Hero";
import BuildingShowcase from "./components/BuildingShowcase";
import About from "./components/About";
import FeaturedWork from "./components/FeaturedWork";
import Products from "./components/Products";
import Services from "./components/Services";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <BuildingShowcase />
        <About />
        <FeaturedWork />
        <Products />
        <Services />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
