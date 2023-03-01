import { migrate, Target } from "@/db/migration";

const isValidTarget = (target: string | undefined): target is Target =>
	["up", "down", "latest"].includes(target as string);

/* eslint-disable no-console */
const main = async () => {
	const maybeTarget = process.argv[2];
	const migrationResult = await migrate({
		target: isValidTarget(maybeTarget) ? maybeTarget : "latest",
	});
	if (migrationResult.ok) {
		if (migrationResult.results.length === 0) {
			console.log("No migrations to execute");
		}
		migrationResult.results.forEach((result) => {
			if (result.status === "Success") {
				console.log(
					`Migration "${result.migrationName}" was executed successfully`,
				);
			} else if (result.status === "Error") {
				console.error(`Failed to execute migration "${result.migrationName}"`);
			}
		});
	} else {
		console.error("Failed to migrate");
		console.error(migrationResult.error);
		process.exit(1);
	}
};
/* eslint-enable no-console */

void main();
