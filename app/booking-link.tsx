// The "Book a call" pill (owner direction, 20 October 2026): the same look everywhere on the site as the header's
// pill, with the Book a call logo tile and no underline. The address comes only from content/booking.json; while
// it holds no valid Google booking-page address, nothing renders. Static pages use renderBookingLink (lib/booking.mjs).
import bookingConfig from '../content/booking.json';
import { bookingLink } from '../lib/booking.mjs';
import LogoLink from './logo-link';

const booking = bookingLink(bookingConfig);

export default function BookingLink({ placement, className }: { placement: string; className?: string }) {
  if (!booking) return null;
  return (
    <LogoLink tile="book-a-call" href={booking.href} className={className ? `booking-pill ${className}` : 'booking-pill'} data-track="booking_click" data-placement={placement}>
      {booking.label}
    </LogoLink>
  );
}
