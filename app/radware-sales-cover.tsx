// Radware's map is drawn at this size in the homepage's Live Threat Map section. At this size Radware
// lays out its full dashboard, which puts its red "Contact sales" button at the top, right of "Under attack".
export const RADWARE_W = 1240;
export const RADWARE_H = 800;

// Where that button sits in the 1240 × 800 drawing (measured from the live site, 15 October 2026), with a
// small margin so it stays covered if Radware nudges it. If Radware moves it, update these numbers.
export const SALES_BOX = { left: 762, top: 22, width: 150, height: 52 };

// Radware's cookie notice is a bar across the bottom of the drawing, from about y = 656 to the bottom (measured
// from the live site, 17 October 2026). The owner asked that it never appear, so the map is shown only down to
// RADWARE_VISIBLE_H: the frame is cut off above the notice and nothing below that line can be seen or clicked.
// Because nobody can reach "Accept all", Radware's optional cookies are never accepted. If Radware moves the
// notice up, lower this number.
export const RADWARE_VISIBLE_H = 648;

// On touch screens the notice is taller. iPhone and iPad browsers (all of them use Apple's WebKit) enlarge the
// text of wide paragraphs inside the 1240-wide frame ("text autosizing", up to about 1.7× for this size of
// text), and the notice grows upward from the bottom of the page. On an iPhone it started at about y = 552
// (owner's screenshot, 27 October 2026), above the 648 line, so it showed. Touch screens are cut off at
// RADWARE_VISIBLE_H_TOUCH instead, with room to spare; the same number is in the .tm-stage aspect ratio for
// TOUCH_QUERY in app/threat-map/threat-map.css. If the notice shows on a phone again, lower this number.
export const RADWARE_VISIBLE_H_TOUCH = 520;
export const TOUCH_QUERY = '(pointer: coarse)';

const pct = (value: number, of: number) => `${(value / of) * 100}%`;

// The frame comes from Radware's servers, so this site can't change anything inside it. Instead, a frosted
// panel sits over the button: it blurs it and takes any click meant for it. Nothing else on the map is covered.
// Place it inside the box that holds the 1240 × 800 drawing (it is positioned in percentages of that box).
export default function RadwareSalesCover({ show = true }: { show?: boolean }) {
  return <span
    className={`sbd-sales-cover${show ? ' is-shown' : ''}`}
    aria-hidden="true"
    style={{
      left: pct(SALES_BOX.left, RADWARE_W),
      top: pct(SALES_BOX.top, RADWARE_H),
      width: pct(SALES_BOX.width, RADWARE_W),
      height: pct(SALES_BOX.height, RADWARE_H),
    }}
  />;
}
