// import NotFound from "../pages/NotFound";
// import Login from "../pages/login/page.jsx";
// import Dashboard from "../pages/dashboard/page.jsx";
// import UsersPage from "../pages/users/page.jsx";
// import StaffPage from "../pages/staff/page.jsx";
// import ClaimsPage from "../pages/claims/page.jsx";
// import ProductsPage from "../pages/products/page.jsx";
// import WalletPage from "../pages/wallet/page.jsx";
// import AMCsPage from "../pages/amcs/page.jsx";
// import CustomersPage from "../pages/customers/page.jsx";
// import ReportsPage from "../pages/reports/page.jsx";
// import SettingsPage from "../pages/settings/page.jsx";
// import ResetPassword from "../pages/resetPassword/ResetPassword.jsx";

// const routes = [
//   // {
//   //   path: "/home",
//   //   element: <Home />,
//   // },
//   {
//     path: "/",
//     element: <Login />,
//   },
//   {
//     path: "/admin/reset-password/:token",
//     element: <ResetPassword />,
//   },
//   {
//     path: "/dashboard",
//     element: <Dashboard />,
//   },
//   {
//     path: "/users",
//     element: <UsersPage />,
//   },
//   {
//     path: "/staff",
//     element: <StaffPage />,
//   },
//   {
//     path: "/claims",
//     element: <ClaimsPage />,
//   },
//   {
//     path: "/distributors",
//     element: <UsersPage />,
//   },
//   {
//     path: "/retailers",
//     element: <UsersPage />,
//   },
//   {
//     path: "/products",
//     element: <ProductsPage />,
//   },
//   {
//     path: "/wallet",
//     element: <WalletPage />,
//   },
//   {
//     path: "/amcs",
//     element: <AMCsPage />,
//   },
//   {
//     path: "/customers",
//     element: <CustomersPage />,
//   },
//   {
//     path: "/reports",
//     element: <ReportsPage />,
//   },
//   {
//     path: "/settings",
//     element: <SettingsPage />,
//   },
//   {
//     path: "*",
//     element: <NotFound />,
//   },
// ];

// export default routes;

import NotFound from "../pages/NotFound";
import Login from "../pages/login/page.jsx";
import Dashboard from "../pages/dashboard/page.jsx";
import UsersPage from "../pages/users/page.jsx";
import AllAdmin from "../pages/allAdmin/page.jsx";
import StaffPage from "../pages/staff/page.jsx";
import ClaimsPage from "../pages/claims/page.jsx";
import ProductsPage from "../pages/products/page.jsx";
import WalletPage from "../pages/wallet/page.jsx";
import AMCsPage from "../pages/amcs/page.jsx";
import CustomersPage from "../pages/customers/page.jsx";
import ReportsPage from "../pages/reports/page.jsx";
import SettingsPage from "../pages/settings/page.jsx";
import ResetPassword from "../pages/resetPassword/ResetPassword.jsx";
import ForgotPasswordCom from "../pages/login/ForgotPassword.jsx";

const routes = [
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordCom />,
  },
  {
    path: "/admin/reset-password/:token",
    element: <ResetPassword />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/users",
    element: <UsersPage />,
  },
  {
    path: "/alladmin",
    element: <AllAdmin />
  },
  {
    path: "/staff",
    element: <StaffPage />,
  },
  {
    path: "/claims",
    element: <ClaimsPage />,
  },
  {
    path: "/distributors",
    element: <UsersPage />,
  },
  {
    path: "/retailers",
    element: <UsersPage />,
  },
  {
    path: "/products",
    element: <ProductsPage />,
  },
  {
    path: "/wallet",
    element: <WalletPage />,
  },
  {
    path: "/amcs",
    element: <AMCsPage />,
  },
  {
    path: "/customers",
    element: <CustomersPage />,
  },
  {
    path: "/reports",
    element: <ReportsPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
