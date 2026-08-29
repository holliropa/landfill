import { router } from "@/router";
import { RouterProvider } from "react-router-dom";
import { AuthBoundary } from "@/pages/AuthPage";

function App() {
  return (
    <AuthBoundary>
      <RouterProvider router={router} />
    </AuthBoundary>
  );
}

export default App;
