"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { useRouter } from "next/navigation";

export function HotkeysProvider() {
	const router = useRouter();

	useHotkeys("k", (e) => {
		e.preventDefault();
		router.push("/admin");
	});

	// This component doesn't render anything, it just handles hotkeys
	return null;
}
