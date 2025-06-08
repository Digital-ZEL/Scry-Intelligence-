import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, ArrowRight, Brain, Atom, Sparkles, 
  Users, Award, Mail, MessageSquare, 
  Clock, Book, ChevronRight, GraduationCap 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Section from "@/components/Section";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "research", label: "Research" },
  { id: "courses", label: "Courses" },
  { id: "careers", label: "Careers" },
  { id: "contact", label: "Contact" }
];

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface CourseCardProps {
  title: string;
  description: string;
  duration: string;
  level: string;
  icon: ReactNode;
  delay: number;
  inviteOnly: boolean;
}

function CourseCard({ title, description, duration, level, icon, delay, inviteOnly }: CourseCardProps) {
  const { toast } = useToast();
  
  const handleCourseClick = () => {
    if (inviteOnly) {
      toast({
        title: "Access requires clearance",
        description: "This course is invitation-only.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <motion.div 
      className="group relative bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-indigo-500/10 transition-all"
      initial={{ y: 30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="h-full w-full p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div>
            <h4 className="text-xl font-semibold mb-3">{title}</h4>
            <p className="text-slate-300 mb-4">{description}</p>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center text-sm text-slate-300">
                <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                {duration}
              </div>
              <div className="flex items-center text-sm text-slate-300">
                <Book className="h-4 w-4 mr-2 text-indigo-400" />
                {level}
              </div>
            </div>
          </div>
          <Button
            className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 mt-4"
            onClick={handleCourseClick}
          >
            {inviteOnly ? (
              <>
                <Lock className="h-4 w-4 mr-2" /> Apply for Access
              </>
            ) : (
              <>
                Apply to Enroll <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
          {title}
          {inviteOnly && (
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-800 text-xs py-0 px-2 ml-2">
              <Lock size={10} className="mr-1" /> Invite Only
            </Badge>
          )}
        </h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center text-sm text-slate-400">
            <Clock className="h-4 w-4 mr-2 text-indigo-400" />
            {duration}
          </div>
          <div className="flex items-center text-sm text-slate-400">
            <Book className="h-4 w-4 mr-2 text-indigo-400" />
            {level}
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-slate-400">Hover for details</span>
          <GraduationCap className="h-5 w-5 text-indigo-400" />
        </div>
      </div>
    </motion.div>
  );
}

function ContactForm() {
  const { toast } = useToast();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: ""
    }
  });
  
  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Thank you for your message. We'll be in touch soon.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ContactFormValues) => {
    contactMutation.mutate(data);
  };

  return (
    <Card className="border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your name" 
                      {...field} 
                      className="bg-slate-800/50 border-slate-700 focus-visible:ring-indigo-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your.email@example.com" 
                      type="email" 
                      {...field} 
                      className="bg-slate-800/50 border-slate-700 focus-visible:ring-indigo-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Your message" 
                      className="min-h-32 bg-slate-800/50 border-slate-700 focus-visible:ring-indigo-500" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={contactMutation.isPending}
              >
                {contactMutation.isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                    </motion.div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message <MessageSquare className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

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
            <span className="text-indigo-400">Scry</span> Intelligence
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
            <Link to="/auth" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign In
            </Link>
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
            <Link 
              to="/auth" 
              className="block py-2 text-indigo-400 hover:text-indigo-300 transition-colors mt-2 border-t border-slate-800 pt-4"
              onClick={closeMobileMenu}
            >
              Sign In
            </Link>
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
            Revealing the <span className="text-indigo-400">Hidden Intelligence</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-10">
            Peering beyond the veil of the known, we uncover the future through our mystic lens of advanced Artificial Intelligence.
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
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -40 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6 }}
            className="order-2 md:order-1"
          >
            <h2 className="text-3xl font-bold mb-6">About Us</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              At Scry Intelligence, we see what others cannot. Like mystical scryers gazing into their crystal spheres, our elite team of scientists and engineers, led by founding engineer <span className="text-indigo-400 font-medium">Denzel Thomas</span>, peer beyond the veil of conventional AI, revealing hidden patterns and insights that remain invisible to others, all while maintaining the highest standards of confidentiality.
            </p>
            <p className="text-slate-300 leading-relaxed mb-4">
              Guided by our core values of foresight, curiosity, and precision, we illuminate paths invisible to others. Like ancient oracles deciphering cosmic patterns, we partner with select organizations to divine the hidden potential of AI.
            </p>
            <p className="text-slate-300 leading-relaxed mb-6">
              Founded in 2025 by visionary <span className="text-indigo-400 font-medium">Denzel Thomas</span>, Scry Intelligence emerged from a profound understanding that true intelligence lies not in what we see, but in what we perceive beyond the surface.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="flex items-start space-x-2">
                <Brain className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium">Scientific Excellence</h3>
                  <p className="text-sm text-slate-400">Pioneering research at the forefront of AI</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Users className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium">Elite Team</h3>
                  <p className="text-sm text-slate-400">World-class scientists and engineers</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Award className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium">Global Impact</h3>
                  <p className="text-sm text-slate-400">Solutions that transform industries</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Sparkles className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium">Visionary Leadership</h3>
                  <p className="text-sm text-slate-400">Founded by Denzel Thomas in 2025</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 md:order-2"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
              <div className="relative bg-slate-900/70 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-xl">Scry Intelligence at a glance</h3>
                  <Atom className="h-6 w-6 text-indigo-400" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Founded</span>
                      <span className="text-indigo-400">2025</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full">
                      <motion.div 
                        className="h-full bg-indigo-500 rounded-full" 
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                      ></motion.div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Research Scientists</span>
                      <span className="text-indigo-400">42+</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full">
                      <motion.div 
                        className="h-full bg-indigo-500 rounded-full" 
                        initial={{ width: 0 }}
                        whileInView={{ width: "80%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.7 }}
                      ></motion.div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Research Papers</span>
                      <span className="text-indigo-400">137</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full">
                      <motion.div 
                        className="h-full bg-indigo-500 rounded-full" 
                        initial={{ width: 0 }}
                        whileInView={{ width: "65%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.9 }}
                      ></motion.div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Partner Organizations</span>
                      <span className="text-indigo-400">12</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full">
                      <motion.div 
                        className="h-full bg-indigo-500 rounded-full" 
                        initial={{ width: 0 }}
                        whileInView={{ width: "40%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 1.1 }}
                      ></motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Research */}
      <Section id="research">
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Research Areas</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Our mystical vision penetrates the depths of artificial intelligence, uncovering hidden connections between seemingly disparate domains. Like seers of the digital age, we divine insights from the data void.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: "Machine Learning", 
              desc: "From self‑supervised models to adaptive agents, we unlock scalable learning paradigms.",
              icon: <Brain className="h-8 w-8 text-indigo-400" />,
              delay: 0.1
            },
            { 
              title: "Cognitive Systems", 
              desc: "Investigating architectures that mirror—yet surpass—human reasoning and perception.",
              icon: <Sparkles className="h-8 w-8 text-indigo-400" />,
              delay: 0.2
            },
            { 
              title: "Ethical AI", 
              desc: "Embedding responsibility and alignment into systems operating at the edge of possibility.",
              icon: <Users className="h-8 w-8 text-indigo-400" />,
              delay: 0.3
            },
            { 
              title: "Restricted Research", 
              desc: "Classified initiatives accelerating intelligence in unforeseen dimensions.",
              icon: <Lock className="h-8 w-8 text-indigo-400" />,
              delay: 0.4,
              restricted: true
            }
          ].map((area) => (
            <motion.div 
              key={area.title} 
              className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-2xl shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: area.delay }}
              whileHover={{ y: -5 }}
            >
              <div className="mb-4">
                {area.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                {area.title}
                {area.restricted && (
                  <span className="bg-yellow-500/20 text-yellow-300 text-xs py-0.5 px-2 rounded-full inline-flex items-center">
                    <Lock size={10} className="mr-1" /> Restricted
                  </span>
                )}
              </h3>
              <p className="text-slate-400 leading-relaxed">{area.desc}</p>
              <a 
                href="#" 
                className="mt-4 inline-flex items-center text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                Learn more <ArrowRight className="ml-1 h-3 w-3" />
              </a>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Courses */}
      <Section id="courses">
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Elevate Your Craft</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Unveil the arcane knowledge of AI through our elite master classes. Like initiates in a secret order, you'll be guided by our visionary scryers to see beyond the ordinary and perceive the obscured truths of advanced intelligence.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <CourseCard 
            title="Generative Models 201"
            description="Advanced techniques in generative AI, covering diffusion models, transformers, and optimization strategies."
            duration="8 weeks"
            level="Advanced"
            icon={<Brain className="h-8 w-8 text-indigo-400" />}
            delay={0.1}
            inviteOnly={false}
          />
          
          <CourseCard 
            title="Quantum Computing for AI"
            description="Explore the intersection of quantum computing and artificial intelligence with hands-on algorithm implementation."
            duration="6 weeks"
            level="Intermediate"
            icon={<Atom className="h-8 w-8 text-indigo-400" />}
            delay={0.2}
            inviteOnly={true}
          />
          
          <CourseCard 
            title="AI Alignment Fundamentals"
            description="Core principles and methodologies for ensuring AI systems remain aligned with human values and intentions."
            duration="10 weeks"
            level="Intermediate"
            icon={<Users className="h-8 w-8 text-indigo-400" />}
            delay={0.3}
            inviteOnly={false}
          />
        </div>
      </Section>

      {/* Careers */}
      <Section id="careers">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Join Our Team</h2>
            <p className="text-slate-300 mb-6">
              Join our circle of visionaries who can perceive what lies beyond the ordinary. At Scry Intelligence, we seek those with the rare gift to divine hidden patterns and forge new paths through the mists of uncertainty. We value the courage to gaze into the unknown and the wisdom to interpret what others cannot see.
            </p>
            
            <div className="mb-8 space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="min-w-12 min-h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Research Scientists</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Push the boundaries of AI with access to cutting-edge compute resources and a team of brilliant peers.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="min-w-12 min-h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Atom className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">ML Engineers</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Build systems that scale our research from theory to production-ready applications.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="min-w-12 min-h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Research Engineers</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Bridge the gap between theoretical breakthroughs and practical implementations.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <a
                href="mailto:talent@scryintelligence.com"
                className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Apply Now
              </a>
              <a
                href="#contact"
                className="px-6 py-3 rounded-full border border-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors"
              >
                Ask a Question
              </a>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 40 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-indigo-500/20 p-1.5 rounded-md mr-2">
                    <Users className="h-5 w-5 text-indigo-400" />
                  </span>
                  Why join Scry Intelligence?
                </h3>

                <ul className="space-y-3 mt-6">
                  <motion.li 
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-indigo-400 text-xs">✓</span>
                    </div>
                    <div>
                      <span className="font-medium">Meaningful Impact</span>
                      <p className="text-slate-400 text-sm mt-1">
                        Work on AI systems that solve real-world problems
                      </p>
                    </div>
                  </motion.li>
                  
                  <motion.li 
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-indigo-400 text-xs">✓</span>
                    </div>
                    <div>
                      <span className="font-medium">Cutting-edge Resources</span>
                      <p className="text-slate-400 text-sm mt-1">
                        Access to high-performance computing and large-scale datasets
                      </p>
                    </div>
                  </motion.li>
                  
                  <motion.li 
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-indigo-400 text-xs">✓</span>
                    </div>
                    <div>
                      <span className="font-medium">Collaborative Culture</span>
                      <p className="text-slate-400 text-sm mt-1">
                        Work alongside world-class researchers and engineers
                      </p>
                    </div>
                  </motion.li>
                  
                  <motion.li 
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-indigo-400 text-xs">✓</span>
                    </div>
                    <div>
                      <span className="font-medium">Flexible Work Environment</span>
                      <p className="text-slate-400 text-sm mt-1">
                        Remote-friendly with modern facilities for in-person collaboration
                      </p>
                    </div>
                  </motion.li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Contact */}
      <Section id="contact">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          whileInView={{ scale: 1, opacity: 1 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold mb-4 text-center">Get In Touch</h2>
          <p className="text-slate-300 mb-8 text-center">
            Reach beyond the veil and establish a connection with our mystic circle. Share your questions about our divinations or propose a joining of oracles.
          </p>
          <ContactForm />
        </motion.div>
      </Section>

      {/* Footer */}
      <footer className="py-10 bg-black/30 backdrop-blur-sm border-t border-slate-800 mt-16">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="font-semibold mb-4 text-white">About</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Our Mission</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Team</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Partners</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Research</h4>
              <ul className="space-y-2">
                <li><a href="#research" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Areas</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Publications</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Open Source</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Careers</h4>
              <ul className="space-y-2">
                <li><a href="#careers" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Open Positions</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Benefits</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Life at Scry Intelligence</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Connect</h4>
              <ul className="space-y-2">
                <li><a href="#contact" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Newsletter</a></li>
                <li><a href="#" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">Events</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800">
            <div className="text-sm text-slate-500 mb-4 md:mb-0">
              © {new Date().getFullYear()} Scry Intelligence. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link to="/admin" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">
                Admin
              </Link>
              <a href="#" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
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
