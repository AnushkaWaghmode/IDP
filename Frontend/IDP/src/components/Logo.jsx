import { Star } from 'lucide-react'

const Logo = ({ className = '' }) => (
  <div className={`flex items-center justify-center gap-3 ${className}`}>
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#7e4ef8] to-[#3b77ff] shadow-[0_0_30px_rgba(98,89,255,0.45)]">
      <Star className="h-5 w-5 text-white" />
    </span>
    <span className="text-[38px] font-semibold text-white tracking-tight">IDP System</span>
  </div>
)

export default Logo
