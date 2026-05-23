import { minimatch } from "minimatch";

export interface ShouldCloseParams {
	isMarkdown: boolean;
	isVisible: boolean;
	isPinned: boolean;
	filePath: string;
	elapsed: number;
	threshold: number;
	excludePatterns: string[];
}

export function isExcluded(filePath: string, excludePatterns: string[]): boolean {
	return excludePatterns.some((pattern) =>
		minimatch(filePath, pattern, { matchBase: true })
	);
}

export function shouldClose(params: ShouldCloseParams): boolean {
	const { isMarkdown, isVisible, isPinned, filePath, elapsed, threshold, excludePatterns } = params;
	if (!isMarkdown) return false;
	if (isVisible) return false;
	if (isPinned) return false;
	if (filePath && isExcluded(filePath, excludePatterns)) return false;
	return elapsed > threshold;
}
