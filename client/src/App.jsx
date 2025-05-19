import "./app.scss";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import React from "react";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";
import Home from "./pages/home/Home";
import Gigs from "./pages/gigs/Gigs";
import Gig from "./pages/gig/Gig";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import ForgotPassword from "./pages/forgotPassword/ForgotPassword";
import ResetPassword from "./pages/resetPassword/ResetPassword";
import Add from "./pages/add/Add";
import Edit from "./pages/edit/Edit";
import Orders from "./pages/orders/Orders";
import Messages from "./pages/messages/Messages";
import Message from "./pages/message/Message";
import MyGigs from "./pages/myGigs/MyGigs";
import Profile from "./pages/profile/Profile";
import ChangePassword from "./pages/changePassword/ChangePassword";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import Pay from "./pages/pay/Pay";
import Success from "./pages/success/Success";
import BecomeSeller from "./pages/becomeSeller/BecomeSeller";
import { Toaster } from "react-hot-toast";

function App() {
  const queryClient = new QueryClient();

  const Layout = () => {
    return (
      <div className="app">
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <Outlet />
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fff",
                color: "#333",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                padding: "16px",
                borderRadius: "8px",
                fontSize: "14px",
                maxWidth: "320px",
              },
              success: {
                iconTheme: {
                  primary: "#1dbf73",
                  secondary: "#fff",
                },
                style: {
                  border: "1px solid #e3f9ee",
                  borderLeft: "4px solid #1dbf73",
                },
              },
              error: {
                iconTheme: {
                  primary: "#FF5252",
                  secondary: "#fff",
                },
                style: {
                  border: "1px solid #ffeded",
                  borderLeft: "4px solid #FF5252",
                },
              },
              loading: {
                iconTheme: {
                  primary: "#1dbf73",
                  secondary: "#fff",
                },
                style: {
                  border: "1px solid #e3f9ee",
                  borderLeft: "4px solid #1dbf73",
                },
              },
            }}
          />
        </QueryClientProvider>
      </div>
    );
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/gigs",
          element: <Gigs />,
        },
        {
          path: "/myGigs",
          element: <MyGigs />,
        },
        {
          path: "/orders",
          element: <Orders />,
        },
        {
          path: "/messages",
          element: <Messages />,
        },
        {
          path: "/message/:id",
          element: <Message />,
        },
        {
          path: "/add",
          element: <Add />,
        },
        {
          path: "/edit/:id",
          element: <Edit />,
        },
        {
          path: "/gig/:id",
          element: <Gig />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/change-password",
          element: <ChangePassword />,
        },
        {
          path: "/pay/:id",
          element: <Pay />,
        },
        {
          path: "/success",
          element: <Success />,
        },
        {
          path: "/become-seller",
          element: <BecomeSeller />,
        },
      ],
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "/auth/reset-password/:token",
      element: <ResetPassword />,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
