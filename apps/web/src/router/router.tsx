import { createHashRouter } from "react-router-dom";
import { MainLayout } from "@/layouts";
import { Home } from "@/pages/Home";

export const router = createHashRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/",
        index: true,
        element: <Home />,
      },
    ],
  },
]);
