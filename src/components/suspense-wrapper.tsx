import React from "react";
import {
	QueryErrorResetBoundary,
	useQueryErrorResetBoundary,
} from "@tanstack/react-query";
import type {
	ErrorComponentProps,
	ErrorRouteComponent,
} from "@tanstack/react-router";
import {
	CatchBoundary,
	ErrorComponent as ErrorComponentRaw,
} from "@tanstack/react-router";

const ErrorComponent: ErrorRouteComponent = (props) => {
	const { reset: resetQuery } = useQueryErrorResetBoundary();
	React.useEffect(() => {
		resetQuery();
	}, [resetQuery]);
	return <ErrorComponentRaw {...props} />;
};

const SuspenseWrapper: React.FC<
	React.PropsWithChildren<{
		fallback: React.ReactNode;
		ErrorComponent?: ErrorRouteComponent;
	}>
> = ({ children, fallback, ErrorComponent: ExternalErrorComponent }) => (
	<React.Suspense fallback={fallback}>
		<QueryErrorResetBoundary>
			<CatchBoundary
				getResetKey={() => "static"}
				// oxlint-disable-next-line no-console
				onCatch={console.error}
				errorComponent={ExternalErrorComponent || ErrorComponent}
			>
				{children}
			</CatchBoundary>
		</QueryErrorResetBoundary>
	</React.Suspense>
);

export const suspendedFallback =
	<P extends object = Record<string, never>>(
		Component: React.ComponentType<P>,
		Fallback: React.ReactNode | React.FC<P>,
		ExternalErrorComponent?: React.FC<P & ErrorComponentProps>,
	): React.FC<P> =>
	(props) => (
		<SuspenseWrapper
			fallback={
				typeof Fallback === "function" ? <Fallback {...props} /> : Fallback
			}
			ErrorComponent={
				ExternalErrorComponent
					? (errorProps) => (
							<ExternalErrorComponent {...props} {...errorProps} />
						)
					: undefined
			}
		>
			<Component {...props} />
		</SuspenseWrapper>
	);
