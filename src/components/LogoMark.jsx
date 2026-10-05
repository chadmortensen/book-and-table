export default function LogoMark({ compact = false }) {
  const logoUrl = `${import.meta.env.BASE_URL}book-and-table-logo.svg`

  return (
    <span
      className={compact ? 'logo-mark logo-mark--compact' : 'logo-mark'}
      role="img"
      aria-label="Book & Table"
      style={{ WebkitMaskImage: `url("${logoUrl}")`, maskImage: `url("${logoUrl}")` }}
    />
  )
}
