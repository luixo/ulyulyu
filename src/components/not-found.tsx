import { Link } from "@tanstack/react-router";

export const NotFound: React.FC = () => (
  <div className="flex h-screen flex-col items-center justify-center text-center">
    <Link to="/" className="text-gray-300 underline">
      Home
    </Link>
    <div className="flex flex-col">
      <h1 className="text-9xl font-bold">404</h1>
      <h2 className="text-4xl font-bold">Ты попал куда-то не туда, друг</h2>
    </div>
  </div>
);
