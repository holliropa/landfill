import { MainLayout } from "@/layouts";
import { ExplorerPage } from "@/pages/ExplorerPage";
import { SearchPage } from "@/pages/SearchPage";
import { GalleryPage } from "@/pages/GalleryPage";
import { TrashPage } from "@/pages/TrashPage";
import { ArchiveExplorerPage } from "@/pages/ArchiveExplorerPage";
import { CapabilityWorkspacePage } from "@/features/file-capabilities";
import { createBrowserRouter, Navigate } from "react-router-dom";
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
        path: "archive/:fileId/*",
        element: <ArchiveExplorerPage />,
      },
      {
        path: "labs/:capabilityId/:fileId",
        element: <CapabilityWorkspacePage />,
      },
      {
        path: "search",
        element: <SearchPage />,
      },
      {
        path: "gallery",
        element: <GalleryPage />,
      },
      {
        path: "trash",
        element: <TrashPage />,
      },
    ],
  },
]);
