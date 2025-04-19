import { ReactNode } from 'react';

interface SectionProps {
  id: string;
  children: ReactNode;
}

export const Section = ({ id, children }: SectionProps) => (
  <section 
    id={id} 
    className="min-h-screen flex items-center justify-center px-6 py-24 sm:py-32"
  >
    <div className="max-w-5xl w-full text-slate-200">{children}</div>
  </section>
);

export default Section;
