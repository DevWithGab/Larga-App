// Firebase's email/password auth requires an email address, but the driver
// sign-up/login screens (matching the mockups) only collect a PH mobile
// number. Until real SMS/phone auth is wired up, we derive a synthetic,
// stable email from the phone digits so the same Firebase Auth flow can be
// reused for drivers. The real formatted phone number is still stored on
// the Firestore profile (`phone`) — the synthetic email never shown to the
// driver.
export function phoneToEmail(rawPhoneNumber) {
  const digits = rawPhoneNumber.replace(/\D/g, '');
  return {
    email: `${digits}@driver.larga.app`,
    phone: `+63${digits}`,
  };
}
