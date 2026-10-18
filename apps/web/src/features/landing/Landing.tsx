import { useLandingMotion } from './useLandingMotion';
import WorkspacePreview from './WorkspacePreview';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Dialog, HelpDialog, Logo } from '../../components/ui';
const image = (name: string, alt: string, cls = '', eager = false) => (
  <img
    className={cls}
    src={`/images/${name}.jpg`}
    alt={alt}
    loading={eager ? 'eager' : 'lazy'}
    decoding="async"
  />
);
export default function Landing() {
  const motionRef = useLandingMotion();
  const [info, setInfo] = useState('');
  const [help, setHelp] = useState(false);
  return (
    <div className="landing" ref={motionRef}>
      <header className="landing-nav">
        <Logo />
        <nav aria-label="Main navigation">
          <a href="#businesses">For your business</a>
          <a href="#workspace">The workspace</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div>
          <Link to="/login">Sign in</Link>
          <Link className="pill-button" to="/signup">
            Get started
          </Link>
        </div>
      </header>
      <main>
        <section className="hero landing-container">
          <div className="hero-copy">
            <p className="eyebrow">Small beginnings. Big ambitions.</p>
            <h1>
              Built for your <br />
              business.
              <br />
              Ready for
              <br />
              what’s next.
            </h1>
            <p>
              An agentic merchant system built for your success.
              <br />
              Manage payments, track stock, and coordinate deliveries—all with AI by your side.
            </p>
            <div className="hero-actions">
              <Link className="pill-button" to="/signup">
                Start your business
              </Link>
              <Link to="/login?demo=1">Explore the workspace</Link>
            </div>
          </div>
          <div className="hero-collage">
            {image('tailor', 'Tailor sewing clothing in Abuja, Nigeria', 'hero-tailor', true)}
            {image(
              'fashion',
              'Customer browsing a fashion shop in Lagos, Nigeria',
              'hero-fashion',
              true,
            )}
            {image('team', 'Business owners collaborating in Lagos, Nigeria', 'hero-team', true)}
            <div className="collage-note">
              <strong>One workspace. Every next step.</strong>
              <small>AI by your side.</small>
            </div>
          </div>
        </section>
        <div className="business-types landing-container">
          <p className="eyebrow">For the people who keep business moving</p>
          <div>
            <span>Independent makers</span>
            <span>Retail & hospitality</span>
            <span>Online businesses</span>
            <span>Growing operations</span>
          </div>
        </div>
        <section id="businesses" className="business-gallery">
          <div className="landing-container">
            <p className="eyebrow">Your business belongs here</p>
            <div className="section-intro">
              <h2>
                From your first sale,
                <br />
                to your next big move.
              </h2>
              <p>
                One helpful AI workspace for everyday business—whatever your next stage looks like.
              </p>
            </div>
            <div className="gallery-grid">
              {[
                [
                  'craft',
                  'Makers & independent brands',
                  'Turn your craft into business, with less admin.',
                ],
                [
                  'boutique',
                  'Fashion shops & boutiques',
                  'Keep payments and everyday tasks connected.',
                ],
                [
                  'electronics',
                  'Electronics & accessories',
                  'From a payment link to the next delivery.',
                ],
                [
                  'market',
                  'Market traders & retailers',
                  'A clearer view of stock, sales, and money.',
                ],
                [
                  'entrepreneur',
                  'Independent entrepreneurs',
                  'Keep your growing operation in view.',
                ],
              ].map(([photo, title, copy]) => (
                <article key={photo}>
                  {image(photo, title + ' in an African business setting')}
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="how-it-works" className="feature-section payments-feature">
          <div className="landing-container feature-grid">
            <div className="feature-photo">
              {image('payment', 'Customer shopping at a boutique in Abuja, Nigeria')}
              <div className="photo-card">
                <span className="eyebrow">Payment link · Ready to share</span>
                <strong>$120.00 USD</strong>
                <small>US virtual account / USDC</small>
              </div>
            </div>
            <div>
              <p className="eyebrow">Get paid, near or far</p>
              <h2>
                Local roots.
                <br />
                Global possibilities.
              </h2>
              <p>
                Create a payment link in USD or naira. Give foreign customers a US virtual account
                or a USDC payment option.
              </p>
              <Link className="pill-button" to="/login?demo=1&next=links">
                Explore payment links
              </Link>
            </div>
          </div>
        </section>
        <section className="feature-section stock-feature">
          <div className="landing-container feature-grid">
            <div>
              <p className="eyebrow">Stock you can stay on top of</p>
              <h2>
                Know what’s sold.
                <br />
                See what’s next.
              </h2>
              <p>
                Ask your AI what has sold and what remains. Keep your catalogue private, and your
                next business decision a little clearer.
              </p>
              <Link className="pill-button" to="/login?demo=1&next=catalogue">
                Explore sales & stock
              </Link>
            </div>
            <div className="feature-photo">
              {image('inventory', 'A customer browsing stocked shelves in a Lagos supermarket')}
              <div className="photo-card">
                <span className="eyebrow">Your stock snapshot</span>
                <strong>32 sold / 18 remaining</strong>
              </div>
            </div>
          </div>
        </section>
        <section className="feature-section delivery-feature">
          <div className="landing-container feature-grid">
            <div className="delivery-collage">
              {image('delivery', 'Delivery rider in Lagos, Nigeria')}
              {image('rider', 'Motorcycle courier in Abuja, Nigeria')}
            </div>
            <div>
              <p className="eyebrow">From your business to their door</p>
              <h2>
                Keep your next
                <br />
                delivery moving.
              </h2>
              <p>
                Ask to connect with a rider. Review the delivery details, then follow progress from
                the same business conversation.
              </p>
              <Link className="pill-button white-pill" to="/login?demo=1&next=deliveries">
                Explore delivery coordination
              </Link>
            </div>
          </div>
        </section>
        <section id="workspace" className="workspace-feature landing-container">
          <p className="eyebrow">The workspace behind your next move</p>
          <h2>
            All that business.
            <br />
            One conversation.
          </h2>
          <p>Your AI prepares the action. You review the details. Your business keeps moving.</p>
          <WorkspacePreview />
        </section>
        <section className="closing-section">
          <div className="landing-container feature-grid">
            <div>
              <p className="eyebrow">Your business. Your next chapter.</p>
              <h2>
                Big ambition deserves
                <br />a little AI support.
              </h2>
              <Link className="pill-button" to="/signup">
                Get started today
              </Link>
            </div>
            {image('ambition', 'An entrepreneur working from her office in Lagos, Nigeria')}
          </div>
        </section>
      </main>
      <footer className="landing-footer landing-container">
        <div>
          <Logo />
          <p>An agentic merchant system built for your success.</p>
          <small>© {new Date().getFullYear()} Safer Business</small>
        </div>
        <div>
          <strong>Product</strong>
          <a href="#how-it-works">Payments · Stock · Deliveries</a>
          <a href="#workspace">Your agentic business workspace</a>
        </div>
        <div>
          <strong>Get started</strong>
          <Link to="/signup">Create an account</Link>
          <Link to="/login">Sign in</Link>
        </div>
        <div>
          <strong>Company</strong>
          <button onClick={() => setInfo('Privacy & terms')}>Privacy · Terms</button>
          <button onClick={() => setHelp(true)}>Contact</button>
          <a href="/photo-credits.md" target="_blank" rel="noreferrer">
            Photo credits
          </a>
        </div>
      </footer>
      {info && (
        <Dialog title={info} onClose={() => setInfo('')}>
          <p>
            This is a preview of Safer Business. Authentication, payments and delivery bookings are
            simulated. Do not enter sensitive information.
          </p>
          <p>
            Production privacy and service terms will be supplied before live account registration
            is enabled.
          </p>
          <Button onClick={() => setInfo('')}>Close</Button>
        </Dialog>
      )}
      {help && <HelpDialog onClose={() => setHelp(false)} />}
    </div>
  );
}
