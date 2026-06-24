import React from 'react';
import { Shield, Zap, Map as MapIcon, Users, BookOpen, Code, Headphones, Globe } from 'lucide-react';

const FooterPages = ({ view }) => {
  const pageData = {
    features: {
      title: 'Powerful Features',
      icon: <Zap size={32} color="var(--primary)" />,
      subtitle: 'Everything you need to manage and book events seamlessly.',
      content: 'NovaTix offers a state-of-the-art interactive seat mapping system, real-time ticket availability, secure payment gateways, and instant digital ticket delivery. Whether you are hosting a local workshop or a global music festival, our platform scales effortlessly to meet your demands.'
    },
    pricing: {
      title: 'Transparent Pricing',
      icon: <Globe size={32} color="var(--primary)" />,
      subtitle: 'No hidden fees. Just simple, straightforward pricing.',
      content: 'We believe in full transparency. NovaTix charges a flat 2.5% processing fee on all ticket sales, with zero setup costs and zero monthly subscriptions. Buyers see the exact total at checkout, and organizers receive their payouts within 48 hours of the event concluding.'
    },
    security: {
      title: 'Bank-Grade Security',
      icon: <Shield size={32} color="var(--primary)" />,
      subtitle: 'Your data and transactions are protected by industry-leading security.',
      content: 'Security is our top priority. All transactions are encrypted using AES-256 bank-level encryption. We are fully PCI-DSS compliant, and our infrastructure is monitored 24/7 to prevent fraud and ensure that your personal information is never compromised.'
    },
    roadmap: {
      title: 'Product Roadmap',
      icon: <MapIcon size={32} color="var(--primary)" />,
      subtitle: 'See what we are building next to make NovaTix even better.',
      content: 'Coming Q3 2026: Apple Wallet and Google Pay integrations for instant one-tap check-ins. Coming Q4 2026: Advanced organizer analytics dashboards and built-in marketing tools to help you sell out your events faster.'
    },
    careers: {
      title: 'Join Our Team',
      icon: <Users size={32} color="var(--primary)" />,
      subtitle: 'Help us revolutionize the live entertainment industry.',
      content: 'We are always looking for passionate engineers, designers, and event enthusiasts to join our remote-first team. If you love solving complex scaling challenges and want to build the future of ticketing, send your resume to careers@novatix.com.'
    },
    blog: {
      title: 'The NovaTix Blog',
      icon: <BookOpen size={32} color="var(--primary)" />,
      subtitle: 'Insights, updates, and stories from the live event world.',
      content: 'Check back soon for our latest articles on event management best practices, interviews with top festival organizers, and deep dives into the technology powering NovaTix.'
    },
    documentation: {
      title: 'Documentation',
      icon: <BookOpen size={32} color="var(--primary)" />,
      subtitle: 'Learn how to get the most out of NovaTix.',
      content: 'Our comprehensive guides cover everything from setting up your first event and creating interactive seating charts, to managing attendees and scanning QR codes at the door.'
    },
    'api-reference': {
      title: 'API Reference',
      icon: <Code size={32} color="var(--primary)" />,
      subtitle: 'Build custom integrations with the NovaTix API.',
      content: 'Access our RESTful API to sync ticket sales with your CRM, automatically generate discount codes, or build a completely custom frontend for your event. Documentation coming soon.'
    },
    support: {
      title: 'Help & Support',
      icon: <Headphones size={32} color="var(--primary)" />,
      subtitle: 'We are here to help you 24/7.',
      content: 'Need assistance with a booking or setting up an event? Our dedicated support team is available around the clock. Contact us via live chat or email support@novatix.com for immediate assistance.'
    },
    community: {
      title: 'Community Forum',
      icon: <Users size={32} color="var(--primary)" />,
      subtitle: 'Connect with other organizers and attendees.',
      content: 'Join our vibrant community of event creators. Share tips, ask questions, and network with industry professionals in our official Discord server.'
    },
    'privacy-policy': {
      title: 'Privacy Policy',
      icon: <Shield size={32} color="var(--primary)" />,
      subtitle: 'How we protect and manage your data.',
      content: 'We take your privacy seriously. We only collect the minimal amount of data necessary to process your bookings and improve your experience. We never sell your personal information to third parties. For full details on our data practices, please contact our privacy team.'
    },
    'terms-of-service': {
      title: 'Terms of Service',
      icon: <BookOpen size={32} color="var(--primary)" />,
      subtitle: 'The rules of the road.',
      content: 'By using NovaTix, you agree to our terms of service. This includes agreeing to provide accurate information during booking, respecting event organizer policies, and understanding our refund protocols. NovaTix reserves the right to suspend accounts that violate these terms.'
    },
    'cookie-policy': {
      title: 'Cookie Policy',
      icon: <Shield size={32} color="var(--primary)" />,
      subtitle: 'How we use cookies to improve your experience.',
      content: 'We use essential cookies to keep you logged in and secure your session. We also use analytics cookies to understand how our platform is used so we can make it better. You can manage your cookie preferences through your browser settings at any time.'
    }
  };

  const data = pageData[view] || {
    title: 'Page Not Found',
    icon: <Shield size={32} color="var(--primary)" />,
    subtitle: 'This page does not exist.',
    content: 'Please navigate back to the home page.'
  };

  return (
    <div className="fade-in flex-center" style={{ minHeight: '60vh', padding: '2rem' }}>
      <div className="glass-panel" style={{ 
        maxWidth: '800px', 
        width: '100%', 
        padding: '4rem 3rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          padding: '1.5rem',
          borderRadius: '50%',
          display: 'inline-flex',
          marginBottom: '1rem'
        }}>
          {data.icon}
        </div>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          margin: 0,
          background: 'linear-gradient(to right, #ffffff, #a5b4fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {data.title}
        </h1>
        
        <h3 style={{ 
          color: 'var(--text-main)', 
          fontSize: '1.2rem', 
          fontWeight: 500,
          margin: 0 
        }}>
          {data.subtitle}
        </h3>
        
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '1.05rem', 
          lineHeight: 1.8,
          maxWidth: '600px',
          marginTop: '1rem'
        }}>
          {data.content}
        </p>

        {view === 'careers' && (
          <button className="btn-primary" style={{ marginTop: '2rem', padding: '0.8rem 2rem' }}>
            View Open Positions
          </button>
        )}
      </div>
    </div>
  );
};

export default FooterPages;
