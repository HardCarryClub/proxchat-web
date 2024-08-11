import { Head } from '@inertiajs/react'

export default function Login() {
  return (
    <>
      <Head title="Login" />

      <div className="flex h-screen justify-center items-center">
        <a href="/auth/discord/redirect" className="btn btn-primary btn-wide">
          Log in with Discord
        </a>
      </div>
    </>
  )
}
