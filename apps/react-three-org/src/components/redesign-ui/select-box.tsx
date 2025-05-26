export const SelectBox = ({ selected }: { selected?: boolean }) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20H7V22H2V17H4V20ZM22 22H17V20H20V17H22V22ZM7 4H4V7H2V2H7V4ZM22 7H20V4H17V2H22V7Z" fill="#FAFAFA" />
      {selected && <rect x="7" y="17" width="10" height="10" transform="rotate(-90 7 17)" fill="#FAFAFA" />}
    </svg>
  )
}
