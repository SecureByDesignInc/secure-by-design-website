import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'My Account',
};

export default function OldMembershipsLink() {
  // Owner request, 16 October 2026: membership tiers are gone. Old links open the free Community account section.
  permanentRedirect('/my-progress#community-account');
}
