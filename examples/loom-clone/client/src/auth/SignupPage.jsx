import AuthForm from './AuthForm.jsx'
import { useSession } from './SessionProvider.jsx'

export default function SignupPage() {
  const { signUp } = useSession()
  return (
    <AuthForm
      heading="Create your account"
      action={signUp}
      submitLabel="Sign up"
      submitTestId="signup-button"
      footer={{ text: 'Already have an account?', label: 'Log in', to: '/login', testId: 'go-to-login' }}
    />
  )
}
