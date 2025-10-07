export type SiteConfig = typeof siteConfig;

export interface Board {
	id?: number; // Optional for when creating new boards
	description: string;
	owner: string;
	renter: string;
	pricePerDay: string;
	deposit: string;
	status: number;
	created_at?: string; // Optional timestamp from Supabase
}

export const siteConfig = {
	name: "Surf Rental",
	description: "Rent your SurfBoard",
	navItems: [
		{
			label: "Rent",
			href: "/rent",
		},
		{
			label: "List",
			href: "/list",
		},
		{
			label: "My Rentings",
			href: "/my-rentings",
		},
	],
	// navMenuItems: [
	// 	{
	// 		label: "Profile",
	// 		href: "/profile",
	// 	},
	// 	{
	// 		label: "Dashboard",
	// 		href: "/dashboard",
	// 	},
	// 	{
	// 		label: "Projects",
	// 		href: "/projects",
	// 	},
	// 	{
	// 		label: "Team",
	// 		href: "/team",
	// 	},
	// 	{
	// 		label: "Calendar",
	// 		href: "/calendar",
	// 	},
	// 	{
	// 		label: "Settings",
	// 		href: "/settings",
	// 	},
	// 	{
	// 		label: "Help & Feedback",
	// 		href: "/help-feedback",
	// 	},
	// 	{
	// 		label: "Logout",
	// 		href: "/logout",
	// 	},
	// ],
	links: {},
};
