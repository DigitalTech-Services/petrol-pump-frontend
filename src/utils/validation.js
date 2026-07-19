// Shared validators for station/business-detail forms (Stations page, Settings
// → Station Details) — kept in one place so both stay consistent.

export const NAME_REGEX  = /^[A-Za-z][A-Za-z .'-]{1,254}$/
export const PAN_REGEX   = /^[A-Z]{5}[0-9]{4}[A-Z]$/
export const GST_REGEX   = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
export const PHONE_REGEX = /^[6-9][0-9]{9}$/

export function isValidName(name) {
  return NAME_REGEX.test((name || '').trim())
}

export function isValidPAN(pan) {
  return PAN_REGEX.test((pan || '').trim().toUpperCase())
}

export function isValidGST(gst) {
  return GST_REGEX.test((gst || '').trim().toUpperCase())
}

export function isValidPhone(phone) {
  return PHONE_REGEX.test((phone || '').replace(/[\s-]/g, '').replace(/^\+?91/, ''))
}

// Validates { name, gst, pan, phone } from a station/business-details form.
// gst/pan/phone are optional — only checked once something's been entered.
// Returns an error message string, or null when everything's valid.
export function validateStationForm(form) {
  if (!form.name || !form.name.trim()) return 'Station name is required.'
  if (!isValidName(form.name)) return "Station name should only contain letters, spaces, and . ' - characters."
  if (form.gst && !isValidGST(form.gst)) return 'Enter a valid 15-character GST number (e.g. 27ABCDE1234F1Z5).'
  if (form.pan && !isValidPAN(form.pan)) return 'Enter a valid 10-character PAN number (e.g. ABCDE1234F).'
  if (form.phone && !isValidPhone(form.phone)) return 'Enter a valid 10-digit phone number.'
  return null
}
