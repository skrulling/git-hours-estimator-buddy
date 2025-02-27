export function estimateCodingHours(commitTimestamps: Date[]): number {
	if (commitTimestamps.length < 2) return 0;

	commitTimestamps.sort((a, b) => a.getTime() - b.getTime());

	let totalMinutes = 0;
	let sessionStart = commitTimestamps[0];

	for (let i = 1; i < commitTimestamps.length; i++) {
			const diffMinutes = (commitTimestamps[i].getTime() - commitTimestamps[i - 1].getTime()) / (1000 * 60);

			if (diffMinutes <= 120) {
					totalMinutes += diffMinutes;
			} else {
					totalMinutes += 120;
					sessionStart = commitTimestamps[i];
			}
	}

	return Math.round(totalMinutes / 60);
}