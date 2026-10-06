import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'My Account',
};

export default function MembershipsPage() {
  permanentRedirect('/my-progress#memberships');
}
