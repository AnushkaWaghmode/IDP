import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/profile', label: 'Profile' },
  { to: '/assessment', label: 'Assessment' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/history', label: 'History' },
]

const NavBar = () => {
  const { token, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const onAuthClick = () => {
    if (token) {
      logout()
    } else {
      navigate('/login')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-idp-border bg-[#0a1125]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-white">IDP System</Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                {item.label}
              </Link>
            )
          })}
          <button onClick={onAuthClick} className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
            {token ? 'Logout' : 'Login'}
          </button>
        </nav>
      </div>
    </header>
  )
}

export default NavBar

