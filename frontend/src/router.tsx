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
import { DashboardPage } from './pages/dashboard-page'
import { DatacenterDetailPage } from './pages/datacenter-detail-page'
import { DatacentersPage } from './pages/datacenters-page'
import { DeploymentsPage } from './pages/deployments-page'
import { DevicesPage } from './pages/devices-page'
import { InstancesPage } from './pages/instances-page'
import { NetworkPage } from './pages/network-page'
import { ReservationsPage } from './pages/reservations-page'

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
        element: <DashboardPage />,
      },
      {
        path: 'datacenters',
        element: <DatacentersPage />,
      },
      {
        path: 'datacenters/:datacenterId',
        element: <DatacenterDetailPage />,
      },
      {
        path: 'network',
        element: <NetworkPage />,
      },
      {
        path: 'devices',
        element: <DevicesPage />,
      },
      {
        path: 'instances',
        element: <InstancesPage />,
      },
      {
        path: 'reservations',
        element: <ReservationsPage />,
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
