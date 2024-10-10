import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SocketProvider } from './context/useSocket.tsx'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Home from './screens/home.tsx'
import Game from './screens/game.tsx'
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  }, {
    path: "room/:roomId",
    element: <Game />
  }
]);


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SocketProvider>
      <RouterProvider router={router} />
    </SocketProvider>
  </React.StrictMode>,
)
