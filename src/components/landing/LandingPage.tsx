import React, { forwardRef, useRef, useState } from 'react';
import { FileTextIcon } from '@radix-ui/react-icons';
import { Archive, ArrowRight, BarChart3, FileSpreadsheet, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import { ThemeConfig } from '../../types/theming';
import { AnimatedBeam } from '@/components/magicui/animated-beam';
import { AnimatedList } from '@/components/magicui/animated-list';
import { BentoCard, BentoGrid } from '@/components/magicui/bento-grid';
import { Marquee } from '@/components/magicui/marquee';

const BACKGROUND_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4';

interface LandingPageProps {
  onEnterApp: () => void;
  theme: ThemeConfig;
}

const navigationLinks = [
  { href: '#platform', label: 'platform' },
  { href: '#solutions', label: 'solutions' },
  { href: '#company', label: 'company' },
  { href: '#support', label: 'support' },
];

const sourceFiles = [
  {
    name: 'respons_mahasiswa.csv',
    format: 'csv',
    detail: '134 respons · google forms',
  },
  {
    name: 'hasil_survei.xlsx',
    format: 'xlsx',
    detail: '27 kolom · siap diprofilkan',
  },
  {
    name: 'keamanan_kampus.csv',
    format: 'csv',
    detail: '197 respons · data demo',
  },
  {
    name: 'rekap_fakultas.xlsx',
    format: 'xlsx',
    detail: '15 pertanyaan · tervalidasi',
  },
];

const profileEvents = [
  { title: '27 kolom terbaca', detail: 'header dinormalisasi otomatis' },
  { title: '3 kolom pii disaring', detail: 'nama, nim, dan timestamp aman' },
  { title: '24 grafik direkomendasikan', detail: 'siap dikurasi sebelum diekspor' },
];

const workflowSteps = [
  {
    id: 'upload',
    number: '01',
    label: 'unggah',
    short: 'berkas survei anda',
    title: 'mulai dari berkas survei anda',
    description: 'pilih csv atau excel dari perangkat. berkas dibaca langsung di browser sebelum memasuki tahap berikutnya.',
    detail: 'csv dan xlsx · pemrosesan lokal',
  },
  {
    id: 'curate',
    number: '02',
    label: 'kurasi',
    short: 'profil otomatis',
    title: 'ubah respons menjadi visual yang jelas',
    description: 'profil otomatis mengenali struktur respons dan menyarankan grafik yang dapat ditinjau tim sebelum dipublikasikan.',
    detail: 'profil kolom · rekomendasi grafik',
  },
  {
    id: 'export',
    number: '03',
    label: 'ekspor',
    short: 'paket siap bagikan',
    title: 'siapkan paket untuk dibagikan',
    description: 'kemas grafik resolusi tinggi dan catatan audit menjadi satu berkas yang siap dipakai untuk materi advokasi.',
    detail: 'png 300 dpi · zip dan manifest audit',
  },
] as const;

type WorkflowStepId = (typeof workflowSteps)[number]['id'];

const FilePreview = () => (
  <Marquee
    pauseOnHover
    className="absolute left-4 top-7 w-[calc(100%+1.5rem)] [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_85%,transparent)]"
  >
    {sourceFiles.map((file) => (
      <figure key={file.name} className="w-44 rounded-xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white">
          <FileSpreadsheet className="h-4 w-4" />
          <figcaption className="truncate text-xs font-medium">{file.name}</figcaption>
        </div>
        <p className="mt-4 text-[10px] text-white/55">{file.detail}</p>
        <span className="mt-3 inline-flex rounded-full border border-white/10 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-white/70">{file.format}</span>
      </figure>
    ))}
  </Marquee>
);

const ProfilePreview = () => (
  <AnimatedList className="absolute right-10 top-10 md:-top-32 w-[18rem] md:w-[25rem] max-w-[calc(100%-2rem)]">
    {profileEvents.map((event, index) => (
      <div key={event.title} className="rounded-xl border border-white/15 bg-neutral-900/90 p-3.5 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[10px] text-white/80">0{index + 1}</span>
          <div>
            <p className="text-xs font-medium text-white">{event.title}</p>
            <p className="mt-0.5 text-[10px] text-white/55">{event.detail}</p>
          </div>
        </div>
      </div>
    ))}
  </AnimatedList>
);

const BeamNode = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`z-10 flex items-center justify-center border border-white/20 bg-neutral-900/95 text-white shadow-[0_0_24px_-14px_rgba(255,255,255,0.7)] backdrop-blur-sm ${className ?? ''}`}
    {...props}
  >
    {children}
  </div>
));

BeamNode.displayName = 'BeamNode';

const WorkflowNodeButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={`z-10 flex items-center justify-center border border-white/20 bg-neutral-900/95 text-white shadow-[0_0_24px_-14px_rgba(255,255,255,0.7)] backdrop-blur-sm ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  ),
);

WorkflowNodeButton.displayName = 'WorkflowNodeButton';

const CurationPreview = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const donutRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const likertRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <BeamNode ref={sourceRef} className="absolute bottom-8 left-[12%] h-16 w-16 rounded-full">
        <FileTextIcon className="h-6 w-6" />
      </BeamNode>
      <BeamNode ref={donutRef} className="absolute right-[10%] top-[10%] h-12 w-16 rounded-lg text-[10px] text-white/80">donut</BeamNode>
      <BeamNode ref={barRef} className="absolute right-[10%] top-[42%] h-12 w-16 rounded-lg text-[10px] text-white/80">bar</BeamNode>
      <BeamNode ref={likertRef} className="absolute bottom-2 right-[10%] h-12 w-16 rounded-lg text-[10px] text-white/80">likert</BeamNode>
      <AnimatedBeam containerRef={containerRef} fromRef={sourceRef} toRef={donutRef} duration={3.4} curvature={-18} />
      <AnimatedBeam containerRef={containerRef} fromRef={sourceRef} toRef={barRef} duration={3.4} delay={0.7} />
      <AnimatedBeam containerRef={containerRef} fromRef={sourceRef} toRef={likertRef} duration={3.4} delay={1.4} curvature={18} />
    </div>
  );
};

const ExportPreview = () => (
  <div className="absolute left-6 right-6 top-8 rounded-xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-sm">
    <div className="flex items-center justify-between border-b border-white/10 pb-3">
      <div className="flex items-center gap-2 text-xs font-medium text-white"><Archive className="h-4 w-4" />grafik_publikasi.zip</div>
      <span className="text-[10px] text-white/45">siap</span>
    </div>
    <div className="mt-4 space-y-3 text-[11px] text-white/65">
      {['01_kepuasan_mahasiswa.png', '02_keamanan_kampus.png', 'survey_summary_audit.txt'].map((file, index) => (
        <div key={file} className="flex items-center justify-between gap-3"><span className="truncate">{file}</span><span className="shrink-0 text-[10px] text-white/45">{index < 2 ? '300 dpi' : 'audit'}</span></div>
      ))}
    </div>
    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="landing-export-progress h-full w-full origin-left bg-white" /></div>
  </div>
);

const ActiveBadge = () => (
  <span className="absolute -top-8 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/25 bg-black px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-white/85">
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
    </span>
    sedang dilihat
  </span>
);

const stepVisuals: Record<WorkflowStepId, React.ReactNode> = {
  upload: (
    <div className="w-full">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/55">
        <span>berkas masuk</span>
        <span>01</span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10"><FileSpreadsheet className="h-5 w-5" /></span>
        <div>
          <p className="text-xs font-medium text-white">survei_mahasiswa</p>
          <p className="mt-1 text-[10px] text-white/55">134 respons terbaca</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2 text-[9px] uppercase tracking-[0.14em] text-white/65"><span className="rounded-full border border-white/15 px-2 py-1">csv</span><span className="rounded-full border border-white/15 px-2 py-1">xlsx</span></div>
    </div>
  ),
  curate: (
    <div className="w-full">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/55">
        <span>profil data</span>
        <span>02</span>
      </div>
      <div className="mt-4 flex items-end gap-1.5" aria-hidden="true">
        <span className="h-4 w-5 rounded-t bg-white/35" /><span className="h-9 w-5 rounded-t bg-white/70" /><span className="h-6 w-5 rounded-t bg-white/45" /><span className="h-12 w-5 rounded-t bg-white" /><span className="h-8 w-5 rounded-t bg-white/55" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-white/60"><span>27 kolom</span><span>24 visual</span><span>3 pii aman</span></div>
    </div>
  ),
  export: (
    <div className="w-full">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-white/55">
        <span>paket akhir</span>
        <span>03</span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10"><Archive className="h-5 w-5" /></span>
        <div>
          <p className="text-xs font-medium text-white">grafik_publikasi.zip</p>
          <p className="mt-1 text-[10px] text-white/55">siap dibagikan</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-white/65"><span>png 300 dpi</span><span>audit</span></div>
    </div>
  ),
};

const AuroraBackdrop = () => (
  <>
    <div
      className="landing-aurora pointer-events-none absolute -left-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white/[0.06] blur-3xl"
      aria-hidden="true"
    />
    <div
      className="landing-aurora pointer-events-none absolute -right-10 top-1/4 h-64 w-64 rounded-full bg-white/[0.045] blur-3xl"
      style={{ animationDelay: '-7s' }}
      aria-hidden="true"
    />
  </>
);

const WorkflowIllustration: React.FC<{ activeStep: WorkflowStepId; onSelectStep: (id: WorkflowStepId) => void }> = ({
  activeStep,
  onSelectStep,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLButtonElement>(null);
  const curateRef = useRef<HTMLButtonElement>(null);
  const exportRef = useRef<HTMLButtonElement>(null);
  const nodeRefs: Record<WorkflowStepId, React.RefObject<HTMLButtonElement>> = {
    upload: uploadRef,
    curate: curateRef,
    export: exportRef,
  };
  const nodeState = (step: WorkflowStepId) => (
    activeStep === step
      ? 'scale-100 border-white/60 bg-white/[0.1] opacity-100 shadow-[0_0_50px_-18px_rgba(255,255,255,0.9)]'
      : 'scale-[0.92] border-white/15 bg-neutral-950/95 opacity-40 hover:opacity-70 md:opacity-55'
  );
  const captionState = (step: WorkflowStepId) => (activeStep === step ? 'text-white/80' : 'text-white/30');

  const renderNode = (step: (typeof workflowSteps)[number]) => (
    <>
      {activeStep === step.id && <ActiveBadge />}
      <WorkflowNodeButton
        ref={nodeRefs[step.id]}
        onClick={() => onSelectStep(step.id)}
        aria-label={`lihat detail langkah ${step.label}`}
        aria-pressed={activeStep === step.id}
        className={`h-36 w-56 rounded-2xl p-4 text-left transition-[opacity,border-color,background-color,box-shadow,transform] duration-700 ease-out focus-visible:outline-2 focus-visible:outline-white ${nodeState(step.id)}`}
      >
        {stepVisuals[step.id]}
      </WorkflowNodeButton>
      <p className={`text-center text-[11px] font-medium transition-colors duration-500 ${captionState(step.id)}`}>{step.short}</p>
      <p className={`font-mono text-[9px] transition-colors duration-500 ${activeStep === step.id ? 'text-white/55' : 'text-white/20'}`}>{step.detail}</p>
    </>
  );

  return (
    <div>
      {/* mobile & tablet: natural stacked flow, no absolute canvas math */}
      <div className="relative flex flex-col items-center gap-16 overflow-hidden border-y border-white/10 px-5 py-10 sm:px-8 md:hidden">
        <AuroraBackdrop />
        {workflowSteps.map((step, index) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
            {index !== 0 && <span className="absolute -top-8 left-1/2 h-8 w-px -translate-x-1/2 bg-white/15" aria-hidden="true" />}
            {renderNode(step)}
          </div>
        ))}
      </div>

      {/* desktop: floating canvas connected by animated beams, cards double as step triggers */}
      <div ref={containerRef} className="relative hidden h-[20rem] overflow-hidden border-y border-white/10 md:block">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
        <AuroraBackdrop />
        {/* <div className="absolute inset-x-0 top-[35%] h-px bg-gradient-to-r from-white/10 via-white/50 to-white/10" /> */}

        <div className="absolute left-[8%] top-[25%] flex w-56 flex-col items-center gap-3">{renderNode(workflowSteps[0])}</div>
        <div className="absolute left-1/2 top-[25%] flex w-56 -translate-x-1/2 flex-col items-center gap-3">{renderNode(workflowSteps[1])}</div>
        <div className="absolute right-[8%] top-[25%] flex w-56 flex-col items-center gap-3">{renderNode(workflowSteps[2])}</div>

        <AnimatedBeam containerRef={containerRef} fromRef={uploadRef} toRef={curateRef} duration={3.8} curvature={-24} />
        <AnimatedBeam containerRef={containerRef} fromRef={curateRef} toRef={exportRef} duration={3.8} delay={0.9} curvature={24} />
      </div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, theme }) => {
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<WorkflowStepId>('upload');
  const effectiveLogo = theme.customLogoUrl || '/logo-birstat-transparent.png';
  const currentWorkflowStep = workflowSteps.find((step) => step.id === activeWorkflowStep) ?? workflowSteps[0];

  const handleWorkflowTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const lastIndex = workflowSteps.length - 1;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = lastIndex;
    if (nextIndex === null) return;

    event.preventDefault();
    setActiveWorkflowStep(workflowSteps[nextIndex].id);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  };

  return (
    <div className="landing-experience min-h-screen bg-black text-white">
      <section className="relative h-screen w-full overflow-hidden bg-black" aria-labelledby="landing-hero-title">
        <video
          className={`absolute inset-0 h-full w-full object-cover transition-none ${
            videoUnavailable ? 'opacity-0' : 'opacity-100'
          }`}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          src={BACKGROUND_VIDEO_URL}
          onError={() => setVideoUnavailable(true)}
        />
        <div className="absolute inset-0 bg-black/25" aria-hidden="true" />

        <nav
          className="absolute left-0 right-0 top-0 z-20 px-6 pt-6 md:px-10"
          aria-label="navigasi landing page"
        >
          <div className="flex items-center justify-between gap-4">
            <a
              href="#top"
              className="flex items-center gap-2 rounded-full bg-neutral-900/90 py-3 pl-4 pr-6 backdrop-blur"
              aria-label="kembali ke bagian awal"
            >
              <img
                src={effectiveLogo}
                alt="logo biro statistik bem undip"
                className="h-5 w-5 object-contain brightness-0 invert"
              />
              <span className="text-sm font-normal tracking-tight text-white">biro statistik bem undip</span>
            </a>

            <div className="hidden items-center gap-1 rounded-full bg-neutral-900/90 px-3 py-2 backdrop-blur md:flex">
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-5 py-2 text-sm text-neutral-300 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={onEnterApp}
              className="rounded-full bg-white px-6 py-3 text-sm font-normal text-black transition-colors hover:bg-neutral-200"
            >
              get started
            </button>
          </div>
        </nav>

        <div id="top" className="relative z-10 h-full w-full">
          <h1
            id="landing-hero-title"
            className="hero-title absolute left-4 top-[18%] text-[14vw] font-medium text-white md:left-10 md:text-[13vw]"
          >
            jaga
          </h1>
          <p className="absolute left-6 top-[46%] max-w-[240px] text-[15px] leading-snug text-white/90 md:left-10">
            data survei diproses dengan penuh perhatian, memberi anda privasi di setiap langkah
          </p>
          <h1 className="hero-title absolute right-4 top-[38%] text-[14vw] font-medium text-white md:right-10 md:text-[13vw]">
            data
          </h1>
          <h1 className="hero-title absolute left-[18%] top-[58%] text-[14vw] font-medium text-white md:left-[28%] md:text-[13vw]">
            survei
          </h1>

          <div className="absolute right-6 top-[14%] text-right md:right-24">
            <div className="flex items-center justify-end gap-3">
              <span className="hidden h-px w-24 rotate-[20deg] bg-white/40 md:block" aria-hidden="true" />
              <span className="text-4xl font-medium tracking-tight md:text-5xl">100%</span>
            </div>
            <p className="mt-1 text-xs text-white/70 md:text-sm">pemrosesan lokal</p>
          </div>

          <div className="absolute bottom-20 left-6 md:bottom-24 md:left-20">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-medium tracking-tight md:text-5xl">0</span>
              <span className="hidden h-px w-24 rotate-[-20deg] bg-white/40 md:block" aria-hidden="true" />
            </div>
            <p className="mt-1 text-xs text-white/70 md:text-sm">unggahan cloud</p>
          </div>

          <div className="absolute bottom-16 right-6 text-right md:bottom-20 md:right-20">
            <div className="flex items-center justify-end gap-3">
              <span className="hidden h-px w-24 rotate-[-20deg] bg-white/40 md:block" aria-hidden="true" />
              <span className="text-4xl font-medium tracking-tight md:text-5xl">~300 dpi</span>
            </div>
            <p className="mt-1 text-xs text-white/70 md:text-sm">ekspor grafik</p>
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-black"
          aria-hidden="true"
        />
      </section>

      <main className="w-full max-w-full overflow-x-hidden border-t border-white/10 px-6 py-28 md:px-10 md:py-40" aria-label="fitur biro statistik">
        <section className="mx-auto max-w-7xl" aria-labelledby="feature-grid-title">
          <div className="mb-12 max-w-2xl md:mb-16">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">empat langkah, satu alur kerja</p>
            <h2 id="feature-grid-title" className="mt-5 text-4xl font-medium tracking-[-0.04em] text-white md:text-6xl">dari berkas survei sampai aset publikasi</h2>
            <p className="mt-5 text-sm leading-relaxed text-white/65 md:text-base">setiap tahap dibuat untuk menjaga data mahasiswa tetap aman sekaligus memudahkan tim menyusun visual yang siap dibagikan.</p>
          </div>
          <BentoGrid>
            <BentoCard id="platform" icon={<UploadCloud className="h-5 w-5" />} name="unggah dan lindungi data" description="baca csv atau excel langsung dari perangkat, lalu singkirkan kolom sensitif sebelum data diproses." background={<FilePreview />} className="lg:col-span-1" />
            <BentoCard id="solutions" icon={<Sparkles className="h-5 w-5" />} name="profil otomatis" description="sistem mengenali struktur pertanyaan, tipe respons, dan grafik yang paling mudah dipahami publik." background={<ProfilePreview />} className="lg:col-span-2" />
            <BentoCard id="company" icon={<BarChart3 className="h-5 w-5" />} name="kurasi visual" description="pilih rekomendasi, sesuaikan tema institusi, dan tinjau setiap grafik sebelum menjadi materi advokasi." background={<CurationPreview />} className="lg:col-span-2" />
            <BentoCard id="support" icon={<ShieldCheck className="h-5 w-5" />} name="ekspor siap publikasi" description="kemas grafik png resolusi tinggi dan manifest audit dalam satu berkas zip yang rapi." background={<ExportPreview />} className="lg:col-span-1" />
          </BentoGrid>
        </section>

        <section id="workflow" className="mx-auto mt-32 max-w-7xl scroll-mt-8 md:mt-48" aria-labelledby="workflow-title">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">tiga langkah untuk mulai</p>
            <h2
              id="workflow-title"
              className="mt-5 text-4xl font-medium tracking-[-0.06em] text-white md:text-[clamp(3rem,4.4vw,4.75rem)]"
              style={{ lineHeight: 1.1 }}
            >
              dari data mentah menjadi cerita yang siap dibagikan
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/65 md:text-base">alur sederhana untuk mengolah respons survei secara lokal, meninjau visual, lalu menyusun materi publikasi.</p>
          </div>

          <div className="relative mt-10 overflow-hidden border border-white/15 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_42%),#0a0a0a] md:mt-16">
            <div className="">
              <div className="grid grid-cols-3 border border-white/15 bg-black/40" role="tablist" aria-label="alur kerja aplikasi">
                {workflowSteps.map((step, index) => {
                  const isActive = activeWorkflowStep === step.id;
                  return (
                    <button
                      key={step.id}
                      id={`workflow-tab-${step.id}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`workflow-panel-${step.id}`}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => setActiveWorkflowStep(step.id)}
                      onKeyDown={(event) => handleWorkflowTabKeyDown(event, index)}
                      className={`px-2 py-3 text-left text-[10px] transition-colors duration-500 sm:px-5 sm:py-5 sm:text-xs ${
                        isActive ? 'bg-white text-black shadow-[0_8px_24px_-12px_rgba(255,255,255,0.8)]' : 'text-white/55 hover:bg-white/[0.07] hover:text-white'
                      }`}
                    >
                      <span className="mr-2 font-mono text-[9px] opacity-70 sm:mr-3">{step.number}</span>
                      <span className="font-medium">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <WorkflowIllustration activeStep={activeWorkflowStep} onSelectStep={setActiveWorkflowStep} />

            <div
              id={`workflow-panel-${activeWorkflowStep}`}
              role="tabpanel"
              aria-labelledby={`workflow-tab-${activeWorkflowStep}`}
              className="border-t border-white/10 px-6 py-7 sm:px-8 md:flex md:items-end md:justify-between md:gap-8 md:px-12 md:py-9"
            >
              <div className="max-w-2xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">{currentWorkflowStep.number} / 03 · {currentWorkflowStep.detail}</p>
                <h3 className="mt-3 text-xl font-medium tracking-[-0.04em] text-white md:text-2xl">{currentWorkflowStep.title}</h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">{currentWorkflowStep.description}</p>
              </div>
              <button
                type="button"
                onClick={onEnterApp}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-neutral-200 md:mt-0"
              >
                mulai olah data
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/10 px-6 py-4 text-[10px] uppercase tracking-[0.14em] text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:px-12">
              <span>ilustrasi interaktif · tidak ada data diunggah ke cloud</span>
              <a href="#platform" className="inline-flex items-center gap-1 text-white/55 transition-colors hover:text-white">
                pelajari keamanan data
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
