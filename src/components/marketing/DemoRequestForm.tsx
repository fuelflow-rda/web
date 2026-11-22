'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, CircleCheck, TriangleAlert } from 'lucide-react';
import api from '@/lib/api';
import { BUSINESS } from '@/lib/business';
import { cx } from '@/lib/cx';

type Fields = { name: string; company: string; contact: string; stations: string; consent: boolean };
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { name: '', company: '', contact: '', stations: '', consent: false };

/** The station-count choices; the values are what the API accepts. */
export const STATION_CHOICES = [
  { value: '1', label: '1' },
  { value: '2-5', label: '2 to 5' },
  { value: '6-20', label: '6 to 20' },
  { value: '21+', label: 'More than 20' },
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "0788 123 456", "+250 788-123-456": spaces kept, other separators made spaces. */
export function cleanPhone(raw: string): string {
  return raw.replace(/[-().]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Email if it has an @, otherwise a phone number of at least nine digits. */
export function readContact(raw: string): { email: string } | { phone: string } | null {
  const v = raw.trim();
  if (v.includes('@')) return EMAIL.test(v) ? { email: v } : null;
  const phone = cleanPhone(v);
  return /^\+?\d[\d ]{7,18}\d$/.test(phone) && phone.replace(/\D/g, '').length >= 9 ? { phone } : null;
}

export function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = 'Enter your name.';
  if (f.company.trim().length < 2) e.company = 'Enter your company name.';
  if (!readContact(f.contact)) e.contact = 'Enter an email address or a phone number we can reach you on.';
  if (!f.consent) e.consent = 'Tick the box to agree to be contacted about this request.';
  return e;
}

const field =
  'h-11 w-full rounded-control border border-border-strong bg-surface px-3.5 text-15 text-text placeholder:text-text-muted focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus aria-invalid:border-danger';
const label = 'text-13 font-medium text-text-secondary';

/**
 * Demo request (Pencil "Contact"). Collects only what is needed to reply: a
 * name, the company, and an email address or a phone number. The station count
 * is optional. Consent is explicit and required, here and in the API.
 *
 * Validation runs on submit, not on every keystroke, and the first invalid field
 * receives focus so keyboard and screen-reader users land on the problem.
 */
export function DemoRequestForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [failure, setFailure] = useState('');
  const refs = useRef<Partial<Record<keyof Fields, HTMLInputElement | HTMLSelectElement | null>>>({});

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const next = validate(fields);
    setErrors(next);
    const first = (['name', 'company', 'contact', 'stations', 'consent'] as const).find((k) => next[k]);
    if (first) {
      refs.current[first]?.focus();
      return;
    }
    setStatus('sending');
    setFailure('');
    try {
      await api.post('/contact/demo-request', {
        name: fields.name.trim(),
        company: fields.company.trim(),
        ...readContact(fields.contact),
        ...(fields.stations ? { station_range: fields.stations } : {}),
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

  const describedBy = (key: keyof Fields, hint?: string) =>
    [errors[key] ? `demo-${key}-error` : null, hint ?? null].filter(Boolean).join(' ') || undefined;
  const error = (key: keyof Fields) =>
    errors[key] ? (
      <p id={`demo-${key}-error`} className="m-0 text-12 text-danger">
        {errors[key]}
      </p>
    ) : null;

  if (status === 'sent') {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-12 bg-success-tint p-5 text-success">
        <p className="m-0 flex items-center gap-2 text-16 font-semibold">
          <CircleCheck size={18} aria-hidden />
          Thank you. Your request has been sent.
        </p>
        <p className="m-0 text-14 text-text-secondary">
          We will get back to you to arrange a time. If you do not hear from us, write to{' '}
          <a className="font-medium text-link underline" href={`mailto:${BUSINESS.contactEmail}`}>
            {BUSINESS.contactEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby="demo-form-title" className="flex flex-col gap-5">
      <h3 id="demo-form-title" className="m-0 text-22 font-semibold tracking-n10">
        Request a demo
      </h3>

      {status === 'failed' ? (
        <div role="alert" className="flex items-start gap-2 rounded-control bg-danger-tint px-4 py-3 text-14 text-danger">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            {failure}{' '}
            <a className="font-medium underline" href={`mailto:${BUSINESS.contactEmail}`}>
              {BUSINESS.contactEmail}
            </a>
          </span>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="demo-name" className={label}>
            Full name
          </label>
          <input
            id="demo-name"
            ref={(el) => {
              refs.current.name = el;
            }}
            className={field}
            value={fields.name}
            onChange={(e) => set('name', e.target.value)}
            autoComplete="name"
            maxLength={120}
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy('name')}
          />
          {error('name')}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="demo-company" className={label}>
            Company
          </label>
          <input
            id="demo-company"
            ref={(el) => {
              refs.current.company = el;
            }}
            className={field}
            value={fields.company}
            onChange={(e) => set('company', e.target.value)}
            autoComplete="organization"
            maxLength={160}
            required
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={describedBy('company')}
          />
          {error('company')}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="demo-contact" className={label}>
          Phone or email
        </label>
        <input
          id="demo-contact"
          ref={(el) => {
            refs.current.contact = el;
          }}
          className={field}
          value={fields.contact}
          onChange={(e) => set('contact', e.target.value)}
          autoComplete="email"
          maxLength={254}
          required
          aria-invalid={errors.contact ? true : undefined}
          aria-describedby={describedBy('contact', 'demo-contact-hint')}
        />
        {error('contact')}
        <p id="demo-contact-hint" className="m-0 text-12 text-text-muted">
          We only use this to reply to your request
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="demo-stations" className={label}>
          Number of stations <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <select
          id="demo-stations"
          ref={(el) => {
            refs.current.stations = el;
          }}
          className={cx(field, 'appearance-auto pr-3')}
          value={fields.stations}
          onChange={(e) => set('stations', e.target.value)}
        >
          <option value="">Choose</option>
          {STATION_CHOICES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-start gap-2.5 text-13 leading-[1.5] text-text-secondary">
          <input
            ref={(el) => {
              refs.current.consent = el;
            }}
            type="checkbox"
            className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-primary"
            checked={fields.consent}
            onChange={(e) => set('consent', e.target.checked)}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={describedBy('consent')}
          />
          <span>
            I agree that {BUSINESS.productName} may contact me about this request, as described in the{' '}
            <Link href="/privacy" className="font-medium text-link underline">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {error('consent')}
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-control border-0 bg-primary text-16 font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait disabled:opacity-70"
      >
        <ArrowRight size={18} aria-hidden />
        {status === 'sending' ? 'Sending…' : 'Send demo request'}
      </button>
    </form>
  );
}
