'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export default function LabAccess() {
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => { setReady(true); }, []);
  useEffect(() => {
    if (signedIn) panelRef.current?.querySelector<HTMLElement>('#lab-workspace-title')?.focus();
    else if (returnFocus.current) {
      panelRef.current?.querySelector<HTMLInputElement>('#lab-username')?.focus();
      returnFocus.current = false;
    }
  }, [signedIn]);

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Enter a username and password to continue.');
      setPassword('');
      return;
    }
    // Local interface preview only: no identity verification, request, or stored session.
    setUsername(username.trim());
    setPassword('');
    setError('');
    setSignedIn(true);
  }

  function signOut() {
    returnFocus.current = true;
    setSignedIn(false);
    setUsername('');
    setPassword('');
    setError('');
  }

  return <section className="lab-access" ref={panelRef} aria-labelledby={signedIn ? 'lab-workspace-title' : 'lab-sign-in-title'}>
    <p className="lab-preview-label">Preview</p>
    {signedIn ? <>
      <h2 id="lab-workspace-title" tabIndex={-1}>Your lab workspace</h2>
      <p className="lab-session-status">Workspace preview for {username}.</p>
      <div className="lab-workspace-card">
        <p className="lab-availability">Planned lab</p>
        <h3>Build an Active Directory domain</h3>
        <p>Start with the infrastructure and build out the environment.</p>
        <ul>
          <li>Configure domain controllers and DNS.</li>
          <li>Join systems and manage users, groups, and OUs.</li>
          <li>Apply Group Policy and connect security tools.</li>
        </ul>
        <p className="lab-preview-note">Live labs are coming soon. This preview doesn’t start any systems.</p>
        <a className="text-link" href="/training/dc01-dc02/index.html">Review the domain concepts →</a>
      </div>
      <Button type="button" variant="outline" className="lab-secondary-button" onClick={signOut}>Log out of preview</Button>
    </> : <>
      <h2 id="lab-sign-in-title">Log in to your labs</h2>
      <p className="lab-access-intro">Live accounts and labs are coming soon.</p>
      <form onSubmit={signIn} method="post" autoComplete="off" aria-labelledby="lab-sign-in-title">
        <div className="lab-field">
          <Label htmlFor="lab-username">Username</Label>
          <Input id="lab-username" type="text" value={username} onChange={event => { setUsername(event.target.value); setError(''); }} autoComplete="off" autoCapitalize="none" spellCheck={false} required disabled={!ready} aria-invalid={!!error} aria-describedby={error ? 'lab-login-error' : undefined}/>
        </div>
        <div className="lab-field">
          <Label htmlFor="lab-password">Password</Label>
          <Input id="lab-password" type="password" value={password} onChange={event => { setPassword(event.target.value); setError(''); }} autoComplete="new-password" required disabled={!ready} aria-invalid={!!error} aria-describedby={error ? 'lab-login-error' : undefined}/>
        </div>
        <div className="lab-login-feedback" aria-live="polite" aria-atomic="true">{error && <p id="lab-login-error">{error}</p>}</div>
        <Button type="submit" className="lab-primary-button" disabled={!ready}>Log in to labs <span aria-hidden="true">→</span></Button>
      </form>
      <noscript><p className="lab-preview-note">Enable JavaScript to try the sign-in preview.</p></noscript>
    </>}
  </section>;
}
