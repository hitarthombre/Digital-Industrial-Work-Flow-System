import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./Components-Layout/Navbar";
import Footer from "./Components-Layout/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  );
}