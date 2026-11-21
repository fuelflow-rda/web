import { describe, expect, it } from 'vitest';
import { cleanPhone, readContact, STATION_CHOICES, validate } from './DemoRequestForm';

describe('readContact', () => {
  it('reads an email address as an email', () => {
    expect(readContact(' claudine@citygas.rw ')).toEqual({ email: 'claudine@citygas.rw' });
  });

  it('reads anything without an @ as a phone number, tidied for the API', () => {
    expect(readContact('0788-123-456')).toEqual({ phone: '0788 123 456' });
    expect(readContact('+250 (788) 123 456')).toEqual({ phone: '+250 788 123 456' });
  });

  it('refuses a broken email and a number too short to call', () => {
    expect(readContact('claudine@citygas')).toBeNull();
    expect(readContact('0788 12')).toBeNull();
    expect(readContact('call me')).toBeNull();
  });

  it('keeps separators as single spaces', () => {
    expect(cleanPhone('078.812..3456')).toBe('078 812 3456');
  });
});

describe('validate', () => {
  const ok = { name: 'Claudine', company: 'City Gas Co', contact: '0788123456', stations: '', consent: true };

  it('accepts the minimum: name, company, a way back and consent', () => {
    expect(validate(ok)).toEqual({});
  });

  it('names every missing piece', () => {
    expect(Object.keys(validate({ name: '', company: '', contact: '', stations: '', consent: false })).sort()).toEqual([
      'company',
      'consent',
      'contact',
      'name',
    ]);
  });
});

describe('station choices', () => {
  it('match the values the API accepts', () => {
    expect(STATION_CHOICES.map((c) => c.value)).toEqual(['1', '2-5', '6-20', '21+']);
  });
});
