'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { BUSINESS } from '@/lib/business';

type Fields = {
  name: string;
  email: string;
  company: string;
  stations: string;
  message: string;
  consent: boolean;
};

type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { name: '', email: '', company: '', stations: '', message: '', consent: false };

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (f.company.trim().length < 2) e.company = 'Enter your company name.';
  if (f.stations.trim() !== '') {
    const n = Number(f.stations);
    if (!Number.isInteger(n) || n < 1 || n > 10_000) e.stations = 'Enter a whole number of stations, or leave it blank.';
  }
  if (f.message.length > 2000) e.message = 'Keep the message under 2000 characters.';
  if (!f.consent) e.consent = 'Tick the box to confirm you have read the Privacy Policy.';
  return e;
}

/**
 * Demo request. Collects only what is needed to reply: name, email, company.
 * Station count and message are optional. Consent is explicit and required.
 *
 * Validation runs on submit rather than on every keystroke, and the first invalid
 * field receives focus so keyboard and screen-reader users land on the problem.
 */
export function DemoRequestForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [failure, setFailure] = useState('');
  const refs = useRef<Record<keyof Fields, HTMLInputElement | HTMLTextAreaElement | null>>({
    name: null,
    email: null,
    company: null,
    stations: null,
    message: null,
    consent: null,
  });

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const next = validate(fields);
    setErrors(next);
    const first = (Object.keys(next) as Array<keyof Fields>).find((k) => next[k]);
    if (first) {
      refs.current[first]?.focus();
      return;
    }

    setStatus('sending');
    setFailure('');
    try {
      await api.post('/contact/demo-request', {
        name: fields.name.trim(),
        email: fields.email.trim(),
        company: fields.company.trim(),
        ...(fields.stations.trim() ? { stations: Number(fields.stations) } : {}),
        ...(fields.message.trim() ? { message: fields.message.trim() } : {}),
        consent: true,
      });
      setStatus('sent');
      setFields(EMPTY);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setFailure(
        /too many/i.test(msg)
          ? 'Too many attempts from this connection. Wait a few minutes and try again, or email us directly.'
          : 'We could not send your request. Email us directly and we will get back to you.',
      );
      setStatus('failed');
    }
  };

  const describedBy = (key: keyof Fields, hintId?: string) =>
    [errors[key] ? `${key}-error` : null, hintId ?? null].filter(Boolean).join(' ') || undefined;

  if (status === 'sent') {
    return (
      <div role="status" className="mk-status mk-status-ok" style={{ marginTop: 24 }}>
        <p style={{ fontWeight: 600 }}>Thank you. Your request has been sent.</p>
        <p style={{ marginTop: 4 }}>
          We will reply by email to arrange a time. If you do not hear from us, write to{' '}
          <a className="mk-link" href={`mailto:${BUSINESS.contactEmail}`}>{BUSINESS.contactEmail}</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby="demo-form-intro" className="mk-form">
      <p id="demo-form-intro" className="mk-small">
        Fields marked required must be filled in.
      </p>

      <div>
        <label htmlFor="name" className="mk-label">Your name <span>(required)</span></label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="mk-field"
          value={fields.name}
          onChange={(e) => set('name', e.target.value)}
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={describedBy('name')}
          ref={(el) => { refs.current.name = el; }}
        />
        {errors.name && <p id="name-error" className="mk-error" role="alert">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="mk-label">Work email <span>(required)</span></label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className="mk-field"
          value={fields.email}
          onChange={(e) => set('email', e.target.value)}
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={describedBy('email', 'email-hint')}
          ref={(el) => { refs.current.email = el; }}
        />
        <p id="email-hint" className="mk-hint">Used only to reply to this request.</p>
        {errors.email && <p id="email-error" className="mk-error" role="alert">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="company" className="mk-label">Company <span>(required)</span></label>
        <input
          id="company"
          name="company"
          type="text"
          autoComplete="organization"
          required
          className="mk-field"
          value={fields.company}
          onChange={(e) => set('company', e.target.value)}
          aria-invalid={errors.company ? 'true' : undefined}
          aria-describedby={describedBy('company')}
          ref={(el) => { refs.current.company = el; }}
        />
        {errors.company && <p id="company-error" className="mk-error" role="alert">{errors.company}</p>}
      </div>

      <div>
        <label htmlFor="stations" className="mk-label">Number of stations <span>(optional)</span></label>
        <input
          id="stations"
          name="stations"
          type="number"
          inputMode="numeric"
          min={1}
          max={10000}
          step={1}
          className="mk-field"
          value={fields.stations}
          onChange={(e) => set('stations', e.target.value)}
          aria-invalid={errors.stations ? 'true' : undefined}
          aria-describedby={describedBy('stations')}
          ref={(el) => { refs.current.stations = el; }}
        />
        {errors.stations && <p id="stations-error" className="mk-error" role="alert">{errors.stations}</p>}
      </div>

      <div>
        <label htmlFor="message" className="mk-label">Anything we should know <span>(optional)</span></label>
        <textarea
          id="message"
          name="message"
          className="mk-field"
          maxLength={2000}
          value={fields.message}
          onChange={(e) => set('message', e.target.value)}
          aria-invalid={errors.message ? 'true' : undefined}
          aria-describedby={describedBy('message', 'message-hint')}
          ref={(el) => { refs.current.message = el; }}
        />
        <p id="message-hint" className="mk-hint">For example, whether your sites sell fuel, EV charging or both.</p>
        {errors.message && <p id="message-error" className="mk-error" role="alert">{errors.message}</p>}
      </div>

      <div>
        <div className="mk-check">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            className="mk-checkbox"
            checked={fields.consent}
            onChange={(e) => set('consent', e.target.checked)}
            aria-invalid={errors.consent ? 'true' : undefined}
            aria-describedby={describedBy('consent')}
            ref={(el) => { refs.current.consent = el; }}
          />
          <label htmlFor="consent">
            I have read the{' '}
            <Link href="/privacy" className="mk-link">Privacy Policy</Link> and agree that{' '}
            {BUSINESS.legalName} may use these details to reply to my request. (required)
          </label>
        </div>
        {errors.consent && <p id="consent-error" className="mk-error" role="alert">{errors.consent}</p>}
      </div>

      {status === 'failed' && (
        <div role="alert" className="mk-status mk-status-error">
          {failure}{' '}
          <a className="mk-link" href={`mailto:${BUSINESS.contactEmail}`}>{BUSINESS.contactEmail}</a>
        </div>
      )}

      <div className="mk-form-foot">
        <button type="submit" className="mk-btn mk-btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending request' : 'Send demo request'}
        </button>
        <p className="mk-small">Goes straight to our sales team. Kept only until we have replied.</p>
      </div>
    </form>
  );
}
