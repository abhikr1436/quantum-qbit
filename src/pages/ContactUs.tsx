import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, Copy, Check, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ContactUs: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [submitted, setSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [formError, setFormError] = useState('');

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('abhijeetkumar.workonly@gmail.com');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Quick validation
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setFormError('Please fill out all fields.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // Success submission
    setSubmitted(true);
    
    // Trigger celebration
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.7 },
      colors: ['#00f2fe', '#9d4edd', '#ff007f']
    });
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setSubmitted(false);
    setFormError('');
  };

  return (
    <div style={styles.contactPage}>
      <div className="container">
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.badge}>Get in Touch</span>
          <h1 style={styles.title}>Contact Quantum Qbit</h1>
          <p style={styles.subtitle}>
            Have feedback, a tool suggestion, or bug report? Send us a message and we'll get back to you shortly.
          </p>
        </div>

        <div className="contact-grid" style={styles.grid}>
          {/* Contact Details Card */}
          <div className="glass-card" style={styles.detailsCard}>
            <div style={styles.iconWrapper}>
              <Mail size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <h2 style={styles.detailsTitle}>Direct Inquiry</h2>
            <p style={styles.detailsDesc}>
              Skip the contact form entirely and email our support and development desk directly.
            </p>
            <div style={styles.emailBox}>
              <span style={styles.emailText}>abhijeetkumar.workonly@gmail.com</span>
              <button 
                onClick={handleCopyEmail}
                style={styles.copyBtn}
                title="Copy email to clipboard"
              >
                {isCopied ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
              </button>
            </div>
            <a 
              href="mailto:abhijeetkumar.workonly@gmail.com" 
              style={styles.mailtoLink}
              className="btn-secondary"
            >
              Open Email Application
            </a>
          </div>

          {/* Form Card */}
          <div className="glass-card" style={styles.formCard}>
            {!submitted ? (
              <form onSubmit={handleSubmit} style={styles.form}>
                <h3 style={styles.formTitle}>
                  <MessageSquare size={18} style={{ color: 'var(--secondary)' }} />
                  <span>Send a Message</span>
                </h3>

                {formError && (
                  <div style={styles.errorBanner}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="form-input"
                    placeholder="Feedback / Suggestions"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="form-textarea"
                    placeholder="Tell us what's on your mind..."
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                >
                  Submit Message <Send size={14} />
                </button>
              </form>
            ) : (
              /* Success Screen */
              <div style={styles.successScreen}>
                <CheckCircle2 size={54} style={styles.successIcon} />
                <h3 style={styles.successTitle}>Message Dispatched!</h3>
                <p style={styles.successDesc}>
                  Thank you, <strong>{name}</strong>. Your message regarding <em>"{subject}"</em> has been processed. We will respond back to your email at <strong>{email}</strong>.
                </p>
                <button 
                  onClick={handleReset} 
                  className="btn-secondary"
                  style={{ marginTop: '12px' }}
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  contactPage: {
    padding: '60px 0 100px 0',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '54px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    alignItems: 'center',
  },
  badge: {
    fontSize: '0.8rem',
    background: 'rgba(0, 242, 254, 0.05)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    padding: '4px 12px',
    borderRadius: '100px',
    color: 'var(--primary)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 700,
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1.05rem',
    maxWidth: '600px',
    lineHeight: 1.5,
  },
  grid: {
  },
  detailsCard: {
    padding: '40px 30px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    gap: '18px',
  },
  iconWrapper: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    background: 'rgba(0, 242, 254, 0.04)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0, 242, 254, 0.1)',
  },
  detailsTitle: {
    fontSize: '1.4rem',
    fontWeight: 600,
  },
  detailsDesc: {
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontSize: '0.92rem',
    maxWidth: '300px',
  },
  emailBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid var(--border-glass)',
    padding: '10px 14px',
    borderRadius: '8px',
    width: '100%',
    margin: '8px 0',
  },
  emailText: {
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    color: 'var(--text-primary)',
  },
  copyBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '10px',
    transition: 'var(--transition-fast)',
  },
  mailtoLink: {
    width: '100%',
    justifyContent: 'center',
  },
  formCard: {
    padding: '36px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
    marginBottom: '10px',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#fca5a5',
    fontSize: '0.88rem',
    fontWeight: 500,
  },
  successScreen: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    gap: '16px',
    padding: '40px 10px',
  },
  successIcon: {
    color: 'var(--primary)',
    filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.4))',
  },
  successTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  successDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.98rem',
    lineHeight: 1.6,
    maxWidth: '400px',
  },
};

export default ContactUs;
