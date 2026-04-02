import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts";
import { ExplorerPage } from "@/pages/ExplorerPage";
import { SearchPage } from "@/pages/SearchPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/folder" replace />,
      },
      {
        path: "folder",
        element: <ExplorerPage />,
      },
      {
        path: "folder/:folderId",
        element: <ExplorerPage />,
      },
      {
        path: "search",
        element: <SearchPage />,
      },
    ],
  },
]);
