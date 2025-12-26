import { ReactNode } from 'react';

interface SectionProps {
  id: string;
  children: ReactNode;
  fullWidth?: boolean;
  background?: ReactNode;
}

export const Section = ({ id, children, fullWidth, background }: SectionProps) => (
  <section
    id={id}
    className="min-h-screen flex items-center justify-center px-6 py-24 sm:py-32 relative overflow-hidden isolate"
  >
    {background && (
      <div className="absolute inset-0 -z-10 w-full h-full">
        {background}
      </div>
    )}
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
