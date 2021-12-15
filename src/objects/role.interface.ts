export interface RoleRequirement {
	// Name of the role
	name: string

	// Required number of players in this role
	count: number

	// Can number of player go above the required count
	overfill?: boolean
}