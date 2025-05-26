
import { Link } from "./link"

export const NavBar = () => {
  return (
    <nav className="flex items-center gap-2 flex-wrap" aria-label="Main navigation">
      <Link href="/" aria-label="React Three Fiber home">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-labelledby="logo-title"
        >
          <title id="logo-title">React Three Fiber Logo</title>
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M9.12 2.4H21.6V14.88H15.84V8.16H9.12V2.4ZM2.4 9.12H8.16V14.88H2.4V9.12ZM9.12 9.12H14.88V14.88H9.12V9.12ZM9.12 15.84H14.88V21.6H9.12V15.84Z"
            fill="#FAFAFA"
          />
        </svg>
      </Link>
      <Link href="https://github.com/pmndrs/react-three-fiber" isExternal>
        <p>github</p>
      </Link>
      <Link href="https://r3f.docs.pmnd.rs/getting-started/introduction" isExternal>
        <p>docs</p>
      </Link>
      <Link href="https://x.com/pmndrs" isExternal aria-label="Visit us on X (formerly Twitter)">
        <p>x</p>
      </Link>
      <Link href="https://discord.gg/poimandres" isExternal aria-label="Join our Discord community">
        <p>discord</p>
      </Link>
    </nav>
  )
}
