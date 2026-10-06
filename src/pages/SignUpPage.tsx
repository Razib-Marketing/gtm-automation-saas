import { SignUp } from '@clerk/clerk-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import '../components/layout/Navbar.css';

export const SignUpPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <BackgroundMesh />
      
      <header className="navbar" style={{ position: 'absolute', background: 'transparent' }}>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/gtmauto-logo.webp" alt="GTMAuto Logo" style={{ height: '40px', width: 'auto' }} />
          </Link>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9CA3AF', textDecoration: 'none', fontWeight: 500, transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'white'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>
            <span>Close</span>
            <X size={20} />
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
      </div>
    </div>
  );
};
