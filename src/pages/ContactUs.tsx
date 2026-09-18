import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, Copy, Check, MessageSquare, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ContactUs: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('contactus@quantumqbit.in');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setFormError('Please fill out all required fields.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/contact.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#00F0FF', '#A855F7', '#10B981'],
        });
      } else {
        setFormError(data.error || 'Failed to dispatch message. Please try again.');
      }
    } catch {
      setFormError('A network error occurred. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div className="liquid-glass-pill" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span>CONTACT & SUPPORT</span>
        </div>
        <h1 style={styles.title}>Get in Touch</h1>
        <p style={styles.subtitle}>
          Have feedback, feature requests for Image Studio or PDF Workshop, or general inquiries? We’d love to hear from you.
        </p>
      </div>

      <div style={styles.grid}>
        {/* Contact Info Card */}
        <div className="liquid-glass-card" style={styles.infoCard}>
          <div style={styles.infoTop}>
            <div style={styles.iconRing}>
              <Mail size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 style={styles.infoTitle}>Direct Contact</h3>
            <p style={styles.infoDesc}>
              Our engineering team reviews all user inquiries and feature requests promptly.
            </p>
          </div>

          <div style={styles.emailBox}>
            <span style={styles.emailLabel}>Official Support Email:</span>
            <div style={styles.emailRow}>
              <span style={styles.emailAddress}>contactus@quantumqbit.in</span>
              <button 
                onClick={handleCopyEmail} 
                className="liquid-glass-pill" 
                style={styles.copyBtn}
                title="Copy to clipboard"
              >
                {isCopied ? <Check size={14} style={{ color: 'var(--emerald)' }} /> : <Copy size={14} />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div style={styles.guaranteeBox}>
            <CheckCircle2 size={18} style={{ color: 'var(--emerald)' }} />
            <span style={styles.guaranteeText}>
              We never share or sell contact emails. All communication is strictly confidential.
            </span>
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="liquid-glass-card" style={styles.formCard}>
          {submitted ? (
            <div style={styles.successState}>
              <div style={styles.successIconWrap}>
                <CheckCircle2 size={44} style={{ color: 'var(--emerald)' }} />
              </div>
              <h3 style={styles.successTitle}>Message Sent!</h3>
              <p style={styles.successDesc}>
                Thank you for reaching out. We have received your inquiry and will respond as soon as possible.
              </p>
              <button onClick={handleReset} className="liquid-glass-btn-primary" style={{ marginTop: '12px' }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>
                <MessageSquare size={20} style={{ color: 'var(--secondary)' }} />
                <span>Send a Message</span>
              </h3>

              {formError && (
                <div style={styles.errorBanner}>
                  <span>⚠️ {formError}</span>
                </div>
              )}

              <div style={styles.inputRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Smith"
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Feature request, bug report, or inquiry"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Message *</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your suggestion or issue in detail..."
                  style={styles.textarea}
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="liquid-glass-btn-primary"
                style={styles.submitBtn}
              >
                <Send size={16} />
                <span>{sending ? 'Sending Message...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '40px 20px 80px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '40px',
  },
  header: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
    fontWeight: 800,
    fontFamily: 'var(--font-heading)',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '640px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
  },
  infoCard: {
    padding: '36px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  infoTop: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  iconRing: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 240, 255, 0.08)',
    border: '1px solid rgba(0, 240, 255, 0.25)',
  },
  infoTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
  },
  infoDesc: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  emailBox: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  emailLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  emailRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  emailAddress: {
    fontSize: '0.95rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--primary)',
  },
  copyBtn: {
    border: '1px solid var(--glass-border)',
    cursor: 'pointer',
    padding: '4px 10px',
    fontSize: '0.78rem',
  },
  guaranteeBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border)',
  },
  guaranteeText: {
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  formCard: {
    padding: '36px',
    borderRadius: 'var(--radius-xl)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  formTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.88rem',
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '0.84rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'var(--transition-fast)',
  },
  textarea: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    resize: 'vertical' as const,
    transition: 'var(--transition-fast)',
  },
  submitBtn: {
    marginTop: '6px',
    width: '100%',
  },
  successState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: '40px 20px',
    gap: '16px',
  },
  successIconWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    marginBottom: '8px',
  },
  successTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
  },
  successDesc: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    maxWidth: '420px',
    lineHeight: 1.6,
  },
};

export default ContactUs;
