/**
 * Business identity used by the public site: header, footer, contact section and
 * every legal page. It is the one place these facts live, so a change here updates
 * all of them at once.
 *
 * BEFORE LAUNCH: confirm every value below against the company's registration
 * documents. The legal name, registered address and registration number are
 * required on the Terms, Privacy and Refund pages; a wrong value there is a
 * compliance problem, not a typo. Fields left empty are simply not rendered.
 */
export interface BusinessDetails {
  productName: string;
  legalName: string;
  address: { line1: string; city: string; country: string };
  registrationNumber: string;
  tin: string;
  contactEmail: string;
  privacyEmail: string;
  supportEmail: string;
  phone: string;
  siteUrl: string;
  policiesUpdated: string;
}

export const BUSINESS: BusinessDetails = {
  /** Product name as shown to customers. */
  productName: 'Relai',

  /** Registered legal name of the operating company. TODO: confirm. */
  legalName: 'Relai Ltd',

  /** Registered office address. TODO: confirm. */
  address: {
    line1: 'KG 11 Ave',
    city: 'Kigali',
    country: 'Rwanda',
  },

  /**
   * Company registration number issued by the Rwanda Development Board.
   * TODO: fill in. Left empty, the line is not rendered.
   */
  registrationNumber: '',

  /** Tax identification number. TODO: fill in. Left empty, the line is not rendered. */
  tin: '',

  /** General and sales enquiries. */
  contactEmail: 'hello@relai.rw',

  /** Privacy requests (access, correction, deletion). Can be the same inbox. */
  privacyEmail: 'privacy@relai.rw',

  /** Support for existing customers. */
  supportEmail: 'support@relai.rw',

  /** Phone number in international format, or empty to hide. TODO: confirm. */
  phone: '',

  /** Public site origin, used for canonical links. */
  siteUrl: 'https://relai.rw',

  /** Legal pages carry the date of the last substantive change. */
  policiesUpdated: '2026-09-14',
};

export function formattedAddress(): string {
  const { line1, city, country } = BUSINESS.address;
  return [line1, city, country].filter(Boolean).join(', ');
}
