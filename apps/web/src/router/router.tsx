import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts";
import { ExplorerPage } from "@/pages/ExplorerPage";
import { SearchPage } from "@/pages/SearchPage";
import { paths } from "./paths";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={paths.folderPath()} replace />,
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
