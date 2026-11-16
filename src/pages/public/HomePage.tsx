import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '../../router';
import { useAuth } from '../../context/AuthContext';
import { checkUsernameAvailability } from '../../services/creatorService';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Heart,
  Landmark,
  Layers,
  Link2,
  Loader2,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const { fbUser } = useAuth();

  // Interactive Hero link claim & live preview state
  const [heroUsername, setHeroUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [sampleAmount, setSampleAmount] = useState(2500);

  const displayHandle =
    heroUsername.length >= 2 ? heroUsername : 'yourname';

  useEffect(() => {
    const clean = heroUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (!clean || clean.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const isAvail = await checkUsernameAvailability(clean);
        setUsernameAvailable(isAvail);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [heroUsername]);

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = heroUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (clean && clean.length >= 3) {
      window.localStorage.setItem('buymedata_claimed_username', clean);
      navigate(`/auth/register?claim=${encodeURIComponent(clean)}`);
    } else {
      navigate('/auth/register');
    }
  };

  const handleStartGoal = () => {
    if (fbUser) {
      navigate('/dashboard/campaigns/new');
    } else {
      navigate('/auth/register?next=%2Fdashboard%2Fcampaigns%2Fnew');
    }
  };

  return (
    <div className="bg-[#F5F6F8] text-[#17191F]">
      {/* SECTION B: HERO */}
      <section className="bg-white border-b border-gray-200/80 pt-14 pb-20 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F22550]">
                YOUR SUPPORT CAN MAKE A DIFFERENCE
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold text-[#17191F] tracking-tight leading-[1.1] text-balance">
                Your passion deserves support. Your dreams deserve a chance.
              </h1>

              <div className="space-y-3 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                <p>
                  Whether you&apos;re creating something amazing, working towards a personal goal, or building something that matters, BuyMeData makes it easy to receive support from the people who believe in you.
                </p>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link
                  to="/auth/register"
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-sm sm:text-base rounded-2xl transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>Create your free page</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/#how-it-works"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-gray-50 text-[#17191F] font-bold text-sm sm:text-base rounded-2xl border border-gray-200 transition-colors inline-flex items-center justify-center whitespace-nowrap"
                >
                  See how it works
                </Link>
              </div>

              {/* Interactive Handle Reservation Input */}
              <form
                onSubmit={handleClaimSubmit}
                className="max-w-lg mx-auto lg:mx-0 pt-2"
              >
                <label htmlFor="hero-username-input" className="sr-only">
                  Reserve your BuyMeData username
                </label>
                <div className="flex items-center bg-[#F5F6F8] border border-gray-200 focus-within:border-[#F22550] focus-within:bg-white rounded-2xl p-1.5 pl-4 transition-colors">
                  <span className="text-xs sm:text-sm font-semibold text-gray-500 select-none whitespace-nowrap">
                    buymedata.com/@
                  </span>
                  <input
                    id="hero-username-input"
                    type="text"
                    placeholder="yourname"
                    value={heroUsername}
                    onChange={(e) =>
                      setHeroUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                    }
                    className="flex-1 min-w-0 bg-transparent px-1 py-2 text-xs sm:text-sm font-bold text-[#17191F] placeholder-gray-400 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 pr-1">
                    {checkingUsername && (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <span className="text-[11px] font-bold text-[#16865B] inline-flex items-center gap-1 whitespace-nowrap">
                        <Check className="w-3.5 h-3.5" /> Available
                      </span>
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <span className="text-[11px] font-bold text-red-600 whitespace-nowrap">
                        Unavailable
                      </span>
                    )}
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-[#17191F] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                    >
                      Claim link
                    </button>
                  </div>
                </div>
              </form>

              <p className="text-xs sm:text-sm font-medium text-gray-500">
                Free to join. Simple to use. Built for meaningful support.
              </p>
            </div>

            {/* Hero Right Visual: Sample Profile Page Card */}
            <div className="lg:col-span-5">
              <div className="mx-auto max-w-md bg-white rounded-3xl border border-gray-200/90 shadow-lg shadow-gray-900/5 overflow-hidden">
                {/* Clean Top Banner */}
                <div className="h-20 bg-[#17191F] px-6 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                    Page Preview
                  </span>
                  <span className="text-xs font-mono font-semibold text-white/90 truncate max-w-[210px]">
                    buymedata.com/@{displayHandle}
                  </span>
                </div>

                <div className="p-6 sm:p-7 space-y-5 -mt-6">
                  {/* Profile Header */}
                  <div className="flex items-end gap-3.5">
                    <div className="w-16 h-16 rounded-2xl bg-[#F22550] text-white font-extrabold text-xl flex items-center justify-center ring-4 ring-white shadow-sm flex-shrink-0">
                      {displayHandle.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="pb-0.5 min-w-0">
                      <h2 className="text-base font-extrabold text-[#17191F] truncate">
                        @{displayHandle}
                      </h2>
                      <p className="text-xs font-medium text-gray-500 truncate">
                        buymedata.com/@{displayHandle}
                      </p>
                    </div>
                  </div>

                  {/* Bio preview */}
                  <div className="p-4 rounded-2xl bg-[#F5F6F8] border border-gray-200/60 space-y-1.5">
                    <p className="text-xs font-bold text-[#17191F]">
                      Your page. Your story. Your community.
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Share what you are creating, learning, or building so people who believe in your work can contribute directly.
                    </p>
                  </div>

                  {/* Interactive Sample Naira Amounts */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Sample contribution</span>
                      <span className="font-bold text-[#17191F] tabular-nums">
                        ₦{sampleAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1000, 2500, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSampleAmount(amt)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors tabular-nums ${
                            sampleAmount === amt
                              ? 'bg-[#FFE6EA] border-[#F22550] text-[#F22550]'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          ₦{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sample Support CTA */}
                  <Link
                    to={
                      heroUsername.length >= 3
                        ? `/auth/register?claim=${encodeURIComponent(heroUsername)}`
                        : '/auth/register'
                    }
                    className="w-full py-3.5 px-4 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-sm rounded-2xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Support @{displayHandle}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: VALUE STRIP */}
      <section className="py-16 border-b border-gray-200/80 bg-[#F5F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17191F] tracking-tight text-center text-balance">
            Good things happen when people support each other.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Link2, label: 'One simple link' },
              { icon: Sparkles, label: 'No complicated setup' },
              { icon: ShieldCheck, label: 'Secure online contributions' },
              { icon: Target, label: 'Support for personal goals and creative projects' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 flex items-center gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-[#17191F] leading-snug">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION D: HOW IT WORKS */}
      <section id="how-it-works" className="py-20 lg:py-24 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17191F] tracking-tight text-balance">
              Getting support shouldn&apos;t be complicated.
            </h2>
            <p className="text-base text-gray-600">
              Three simple steps are all it takes to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                number: '01',
                title: 'Step 1 — Create your page',
                desc: "Choose your username, set up your profile and tell people what you're working towards.",
              },
              {
                number: '02',
                title: 'Step 2 — Share your link',
                desc: 'Share your personal BuyMeData link with friends, followers, supporters and your community.',
              },
              {
                number: '03',
                title: 'Step 3 — Receive support',
                desc: 'Receive contributions, track your progress and manage your support from one dashboard.',
              },
            ].map((step) => (
              <div
                key={step.number}
                className="bg-[#F5F6F8] rounded-3xl border border-gray-200/80 p-7 sm:p-8 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <span className="inline-block text-sm font-extrabold text-[#F22550] tabular-nums">
                    {step.number}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#17191F]">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-sm rounded-2xl transition-colors"
            >
              <span>Get started for free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION E: WHO IS BUYMEDATA FOR? */}
      <section className="py-20 lg:py-24 bg-[#F5F6F8] border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17191F] tracking-tight text-balance">
              Whatever you&apos;re working on, there&apos;s room for support.
            </h2>
            <p className="text-base text-gray-600 leading-relaxed">
              You don&apos;t have to be an influencer, celebrity or established organisation to receive support.
            </p>
            <p className="text-base text-gray-600 leading-relaxed">
              BuyMeData is for people with ideas, ambitions, projects and communities worth supporting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'Creators & Content Makers',
                desc: 'Give your audience a simple way to support your content, creativity and the work you put out.',
              },
              {
                icon: Briefcase,
                title: 'Entrepreneurs & Builders',
                desc: "Get support for your ideas, side projects, business experiments and the things you're building.",
              },
              {
                icon: GraduationCap,
                title: 'Students & Individuals',
                desc: 'Raise support for tuition, learning resources, personal milestones and important life goals.',
              },
              {
                icon: Users,
                title: 'Communities & Causes',
                desc: 'Bring people together to support meaningful initiatives and causes that matter.',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white rounded-3xl border border-gray-200/80 p-7 space-y-4 flex flex-col"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#17191F] leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION F: FUNDRAISING GOALS */}
      <section className="py-20 lg:py-24 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17191F] tracking-tight text-balance">
                Give your goals a place to grow.
              </h2>

              <div className="space-y-3 text-base text-gray-600 leading-relaxed">
                <p>
                  Some dreams need more than determination. They need a little help from the right people.
                </p>
                <p>
                  Create a fundraising goal, explain what you&apos;re raising money for and let supporters follow your progress.
                </p>
                <p>
                  Whether it&apos;s buying equipment, funding an education, launching a project or reaching a personal milestone, every contribution moves you closer.
                </p>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  'Set a fundraising target.',
                  'Share your reason for raising funds.',
                  'Track contributions and progress.',
                  'Let supporters be part of your journey.',
                ].map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm font-medium text-[#17191F]">
                    <CheckCircle2 className="w-4 h-4 text-[#16865B] flex-shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartGoal}
                  className="px-7 py-3.5 bg-[#17191F] hover:bg-black text-white font-bold text-sm rounded-2xl transition-colors inline-flex items-center gap-2"
                >
                  <span>Start a fundraising goal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Visual: Clearly Labelled Illustrative Example */}
            <div className="lg:col-span-5">
              <div className="bg-[#F5F6F8] rounded-3xl border border-gray-200/90 p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Illustrative Example
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500">
                    Goal Preview
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#F22550]">Education &amp; Equipment</p>
                    <h3 className="text-lg font-extrabold text-[#17191F] leading-snug">
                      Laptop Upgrade for Final-Year Engineering Project
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Sample campaign layout showing how a goal, target amount, and contribution progress bar appear on your page.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-lg font-extrabold text-[#F22550] tabular-nums">
                        ₦185,000
                      </span>
                      <span className="font-medium text-gray-500 tabular-nums">
                        of ₦300,000 goal
                      </span>
                    </div>
                    <div
                      className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={62}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Illustrative example fundraising progress"
                    >
                      <div className="h-full bg-[#F22550] rounded-full" style={{ width: '62%' }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 tabular-nums">
                      <span>62% funded</span>
                      <span>Example progress view</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Figures above are an illustrative preview only, not live platform totals. Browse active community goals anytime on{' '}
                  <Link to="/explore" className="font-bold text-[#F22550] hover:underline">
                    Explore
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION G: FOR SUPPORTERS */}
      <section className="py-20 lg:py-24 bg-[#F5F6F8] border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17191F] tracking-tight text-balance">
                Your support means more than you think.
              </h2>

              <div className="space-y-2.5 text-base text-gray-600 leading-relaxed">
                <p>Sometimes, a little contribution can make a big difference.</p>
                <p>
                  BuyMeData makes it easy to support people whose work, ideas and stories you believe in.
                </p>
              </div>

              <ul className="space-y-3 pt-1">
                {[
                  'Support people directly through their unique pages.',
                  'Contribute securely in Naira.',
                  'Leave a personal message of encouragement.',
                  'Choose to support publicly or anonymously.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-[#17191F]">
                    <CheckCircle2 className="w-4 h-4 text-[#16865B] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="text-sm text-gray-600 pt-1">
                No complicated registration process. Just find someone you believe in and show your support.
              </p>

              <div className="pt-2">
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-sm rounded-2xl transition-colors"
                >
                  <Compass className="w-4 h-4" />
                  <span>Find someone to support</span>
                </Link>
              </div>
            </div>

            {/* Right Card: Guest Checkout Experience Preview */}
            <div className="lg:col-span-5">
              <div className="bg-[#F5F6F8] rounded-2xl border border-gray-200/80 p-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Supporter Experience
                </p>
                <div className="space-y-3">
                  <div className="bg-white rounded-xl border border-gray-200/80 p-4 flex items-start gap-3">
                    <Wallet className="w-5 h-5 text-[#F22550] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#17191F]">Direct Naira checkout</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Pay securely via card, bank transfer, or USSD without creating a supporter account.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200/80 p-4 flex items-start gap-3">
                    <MessageSquareHeart className="w-5 h-5 text-[#F22550] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-[#17191F]">Personal note &amp; privacy control</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Send a note of encouragement, or tick anonymous support to keep your name private.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION H: WHY BUYMEDATA? */}
      <section className="py-20 lg:py-24 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17191F] tracking-tight text-balance">
              Simple support. Meaningful impact.
            </h2>
            <p className="text-base text-gray-600 leading-relaxed">
              We believe receiving support should be easy, accessible and transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Link2,
                title: '1. One link, many possibilities',
                desc: 'Your personal page gives people one simple place to support you.',
              },
              {
                icon: Landmark,
                title: '2. Built for local payments',
                desc: 'Make contributions in Naira with payment options suited to your supporters.',
              },
              {
                icon: TrendingUp,
                title: '3. Know your progress',
                desc: 'Follow your contributions and fundraising goals from your personal dashboard.',
              },
              {
                icon: Layers,
                title: '4. Transparency matters',
                desc: 'Clear contribution records and transparent platform charges help you understand your support.',
              },
              {
                icon: Users,
                title: '5. Made for everyone',
                desc: "Whether you're a creator, student, entrepreneur or community builder, you can get started.",
              },
            ].map((block) => {
              const Icon = block.icon;
              return (
                <div
                  key={block.title}
                  className="bg-[#F5F6F8] rounded-3xl border border-gray-200/80 p-7 space-y-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-[#F22550] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#17191F]">{block.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{block.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION J: FINAL CTA */}
      <section className="py-20 lg:py-24 bg-[#17191F] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
            Someone out there believes in what you&apos;re doing.
          </h2>
          <p className="text-base sm:text-lg text-gray-300 max-w-xl mx-auto leading-relaxed">
            Give them an easy way to support your work, your goals and your journey.
          </p>

          <div className="pt-2">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-sm sm:text-base rounded-2xl transition-colors"
            >
              <span>Create your free page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-xs sm:text-sm font-medium text-gray-400 pt-1">
            A little support goes a long way.
          </p>
        </div>
      </section>
    </div>
  );
}
