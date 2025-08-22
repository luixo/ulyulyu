import { Button } from "@heroui/react";
import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const DefaultCatchBoundary: React.FC<ErrorComponentProps> = ({
  error,
}) => {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });
  console.error("Error component:", error);

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-4">
      <ErrorComponent error={error} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onPress={() => {
            router.invalidate();
          }}
        >
          Try Again
        </Button>
        {isRoot ? (
          <Button as={Link} to="/" color="secondary">
            Home
          </Button>
        ) : (
          <Button
            as={Link}
            to="/"
            onPress={() => window.history.back()}
            color="secondary"
          >
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
};
