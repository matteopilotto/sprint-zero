import AuthForm from './AuthForm.jsx'
import { useSession } from './SessionProvider.jsx'

export default function LoginPage() {
  const { signIn } = useSession()
  return (
    <AuthForm
      heading="Welcome back"
      action={signIn}
      submitLabel="Log in"
      submitTestId="login-button"
      footer={{ text: 'New here?', label: 'Sign up', to: '/signup', testId: 'go-to-signup' }}
    />
  )
}
