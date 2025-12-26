import { ReactNode } from 'react';

interface SectionProps {
  id: string;
  children: ReactNode;
  fullWidth?: boolean;
  background?: ReactNode;
  noPadding?: boolean;
}

export const Section = ({ id, children, fullWidth, background, noPadding }: SectionProps) => (
  <section
    id={id}
    className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
      noPadding ? 'px-6' : 'px-6 py-24 sm:py-32'
    }`}
  >
    {/* Background layer - spans the entire section */}
    {background && (
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {background}
      </div>
    )}
    {/* Content layer - above the background */}
    <div
      className={`w-full text-slate-200 relative ${
        fullWidth ? "" : "max-w-5xl"
      }`}
      style={{ zIndex: 10 }}
    >
      {children}
    </div>
  </section>
);

export default Section;
