import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts";
import { ExplorerPage, Home } from "@/pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "explorer",
        element: <ExplorerPage />,
      },
    ],
  },
]);
