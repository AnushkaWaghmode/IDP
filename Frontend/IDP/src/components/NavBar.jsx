import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/profile', label: 'Profile' },
  { to: '/assessment', label: 'Assessment' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/assessments', label: 'Assessments' },
  { to: '/learning-path', label: 'Learning Path' },
]

const NavBar = () => {
  const { token, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const onAuthClick = () => {
    if (token) {
      logout()
    } else {
      navigate('/login')
    }
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-idp-border bg-[#0a1125]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-white">IDP System</Link>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-idp-border text-white md:hidden"
          onClick={() => setOpen((p) => !p)}
          aria-label="Toggle navigation"
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-white"></span>
            <span className="block h-0.5 w-5 bg-white"></span>
            <span className="block h-0.5 w-5 bg-white"></span>
          </div>
        </button>

        <nav className="hidden items-center gap-2 sm:gap-4 md:flex">
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

      {open && (
        <div className="md:hidden border-t border-idp-border bg-[#0a1125]/95 px-4 pb-4">
          <div className="flex flex-col gap-2 pt-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-3 text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-200 hover:bg-white/5'}`}
                >
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={onAuthClick}
              className="rounded-xl bg-white/10 px-3 py-3 text-sm font-semibold text-white hover:bg-white/20"
            >
              {token ? 'Logout' : 'Login'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default NavBar
