import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PostsPage from "../pages/PostsPage";
import MyPostsPage from "../pages/MyPostsPage";
import CreatePostPage from "../pages/CreatePostPage";
import EditPostPage from "../pages/EditPostPage";
import NotFoundPage from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <PostsPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        path: "my-posts",
        element: (
          <ProtectedRoute>
            <MyPostsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "posts/new",
        element: (
          <ProtectedRoute>
            <CreatePostPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "posts/:id/edit",
        element: (
          <ProtectedRoute>
            <EditPostPage />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
