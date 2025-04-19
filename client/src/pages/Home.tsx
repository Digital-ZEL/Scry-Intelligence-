import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import Section from "@/components/Section";

const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "research", label: "Research" },
  { id: "careers", label: "Careers" },
  { id: "contact", label: "Contact" }
];

export default function Home() {
  const [secretClicks, setSecretClicks] = useState(0);
  const [showSecret, setShowSecret] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    const newCount = secretClicks + 1;
    if (newCount >= 5) {
      setShowSecret(true);
    } else {
      setSecretClicks(newCount);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#0a0f24] via-[#111827] to-[#1a2238] text-white font-sans scroll-smooth">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <button onClick={handleLogoClick} aria-label="AI Lab logo" className="text-xl font-semibold tracking-wider">
            <span className="text-indigo-400">ΔI</span>‑Lab
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 text-sm">
            {navItems.map((item) => (
              <a 
                key={item.id} 
                href={`#${item.id}`} 
                className="hover:text-indigo-400 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
          
          {/* Mobile Navigation Button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden text-white" 
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} bg-slate-900/95 backdrop-blur-md`}>
          <div className="px-6 py-4 space-y-3">
            {navItems.map((item) => (
              <a 
                key={item.id} 
                href={`#${item.id}`} 
                className="block py-2 hover:text-indigo-400 transition-colors"
                onClick={closeMobileMenu}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <Section id="home">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Shaping the Future of <span className="text-indigo-400">Intelligence</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-10">
            Unlocking tomorrow through discreet, groundbreaking research at the frontier of Artificial Intelligence.
          </p>
          <a
            href="#about"
            className="inline-block px-8 py-3 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/30"
          >
            Discover Our Mission
          </a>
        </motion.div>
      </Section>

      {/* About */}
      <Section id="about">
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-4">About Us</h2>
          <p className="text-slate-300 leading-relaxed">
            At ΔI‑Lab, we are committed to excellence, innovation, and global impact. Our elite team of scientists and engineers push the boundaries of intelligent systems, exploring uncharted territories while upholding the highest standards of confidentiality. Guided by our core values of integrity, curiosity, and precision, we partner with select organizations to unlock the future of AI.
          </p>
        </motion.div>
      </Section>

      {/* Research */}
      <Section id="research">
        <motion.div 
          initial={{ x: -40, opacity: 0 }} 
          whileInView={{ x: 0, opacity: 1 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-8">Research Areas</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { title: "Machine Learning", desc: "From self‑supervised models to adaptive agents, we unlock scalable learning paradigms." },
              { title: "Cognitive Systems", desc: "Investigating architectures that mirror—yet surpass—human reasoning and perception." },
              { title: "Ethical AI", desc: "Embedding responsibility and alignment into systems operating at the edge of possibility." },
              { title: "Restricted Research", desc: "Classified initiatives accelerating intelligence in unforeseen dimensions." }
            ].map((area) => (
              <div key={area.title} className="bg-slate-800/40 p-6 rounded-2xl shadow-inner shadow-black/20">
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  {area.title === "Restricted Research" && <Lock size={16} className="text-indigo-400" />} {area.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{area.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* Careers */}
      <Section id="careers">
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-4">Careers</h2>
          <p className="text-slate-300 mb-6 max-w-3xl">
            Join a team redefining what's possible. At ΔI‑Lab, you will collaborate with top talent on transformative projects that shift the paradigm of intelligence. We value curiosity, rigor, and the courage to venture beyond conventional limits.
          </p>
          <a
            href="mailto:talent@deltailab.ai"
            className="inline-block px-6 py-3 rounded-full border border-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors"
          >
            Express Interest
          </a>
        </motion.div>
      </Section>

      {/* Contact */}
      <Section id="contact">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          whileInView={{ scale: 1, opacity: 1 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-4">Contact</h2>
          <form
            action="#"
            className="grid gap-4 max-w-xl"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Message received — we'll be in touch.");
            }}
          >
            <input
              type="text"
              placeholder="Name"
              required
              className="bg-slate-800/40 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              placeholder="Email"
              required
              className="bg-slate-800/40 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              placeholder="Message"
              rows={4}
              className="bg-slate-800/40 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors"
            >
              Send Secure Message
            </button>
          </form>
        </motion.div>
      </Section>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-6 bg-black/20 backdrop-blur-sm">
        © {new Date().getFullYear()} ΔI‑Lab. All rights reserved.
      </footer>

      {/* Easter Egg Overlay */}
      {showSecret && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]"
          onClick={() => setShowSecret(false)}
        >
          <p className="text-indigo-400 text-lg md:text-2xl tracking-wider text-center px-6">
            "Knowledge speaks only to those who prepare their minds to receive it." — Classified
          </p>
        </motion.div>
      )}
    </div>
  );
}
