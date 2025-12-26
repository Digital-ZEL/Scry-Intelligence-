import { ReactNode } from 'react';

interface SectionProps {
  id: string;
  children: ReactNode;
  fullWidth?: boolean;
}

export const Section = ({ id, children, fullWidth }: SectionProps) => (
  <section
    id={id}
    className="min-h-screen flex items-center justify-center px-6 py-24 sm:py-32 relative overflow-hidden isolate"
  >
    <div
      className={`w-full text-slate-200 relative z-10 ${
        fullWidth ? "" : "max-w-5xl"
      }`}
    >
      {children}
    </div>
  </section>
);

export default Section;
