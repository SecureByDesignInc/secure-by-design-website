// Radware's map is drawn at this size on the homepage window and the Threat Map page. At this size Radware
// lays out its full dashboard, which puts its red "Contact sales" button at the top, right of "Under attack".
export const RADWARE_W = 1240;
export const RADWARE_H = 800;

// Where that button sits in the 1240 × 800 drawing (measured from the live site, 15 October 2026), with a
// small margin so it stays covered if Radware nudges it. If Radware moves it, update these numbers.
export const SALES_BOX = { left: 762, top: 22, width: 150, height: 52 };

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
