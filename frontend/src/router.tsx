import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthLayout } from './components/auth/AuthLayout'
import { ForgotPasswordForm } from './components/auth/ForgotPassword'
import { PrivateRoute } from './components/auth/PrivateRoute'
import { ResetPasswordForm } from './components/auth/ResetPassword'
import { SignInForm } from './components/auth/SignIn'
import { SignUpForm } from './components/auth/Signup'
import { SignUpSuccess } from './components/auth/SignUpSuccess'
import { DeploymentDetailPage } from './pages/deployment-detail-page'
import { DeploymentsPage } from './pages/deployments-page'
import { InventoryDetailPage } from './pages/inventory-detail-page'
import { InventoryPage } from './pages/inventory-page'
import { OverviewPage } from './pages/overview-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PrivateRoute>
        <App />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <OverviewPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'inventory/:inventoryId',
        element: <InventoryDetailPage />,
      },
      {
        path: 'deployments',
        element: <DeploymentsPage />,
      },
      {
        path: 'deployments/:deploymentId',
        element: <DeploymentDetailPage />,
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <SignInForm /> },
      { path: 'signup', element: <SignUpForm /> },
      { path: 'forgot-password', element: <ForgotPasswordForm /> },
      { path: 'reset-password', element: <ResetPasswordForm /> },
      { path: 'sign-up-success', element: <SignUpSuccess /> },
    ],
  },
])
