/**
 * Database types.
 *
 * Written to match supabase/migrations/*.sql exactly, in the shape the Supabase
 * CLI's TypeScript generator would emit — kept here as JSDoc typedefs, not a
 * generated `.ts` file, since this project has no `.ts` source anywhere.
 *
 * Two things worth knowing, honoured below:
 *
 *   · `posts.fy` and `posts.quarter` are GENERATED columns. They appear on Row
 *     but are absent from Insert and Update — the type system refuses to let
 *     you write to them, which is the same rule the database enforces.
 *
 *   · Columns with defaults are optional (`[name]`) on Insert, required on Row.
 *
 * This file is JSDoc-only — no runtime code — so it ends in `export {}` purely
 * to make TypeScript treat it as a module (giving every `@typedef` its own
 * scope) rather than a global script.
 */

/**
 * @import { Channel } from '@/lib/channels'
 * @import { PostStatus } from '@/lib/status'
 */

/**
 * @typedef {Object} ProductManagersRow
 * @property {string} id
 * @property {string} name
 * @property {string | null} email
 * @property {string} created_at
 */
/**
 * @typedef {Object} ProductManagersInsert
 * @property {string} [id]
 * @property {string} name
 * @property {string | null} [email]
 * @property {string} [created_at]
 */
/**
 * @typedef {Object} ProductManagersUpdate
 * @property {string} [id]
 * @property {string} [name]
 * @property {string | null} [email]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} PrincipalsRow
 * @property {string} id
 * @property {string} name
 * @property {string} group_name
 * @property {string | null} product_manager_id
 * @property {string | null} country
 * @property {string | null} brand_color
 * @property {boolean} is_active
 * @property {string} created_at
 */
/**
 * @typedef {Object} PrincipalsInsert
 * @property {string} [id]
 * @property {string} name
 * @property {string} group_name
 * @property {string | null} [product_manager_id]
 * @property {string | null} [country]
 * @property {string | null} [brand_color]
 * @property {boolean} [is_active]
 * @property {string} [created_at]
 */
/**
 * @typedef {Object} PrincipalsUpdate
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [group_name]
 * @property {string | null} [product_manager_id]
 * @property {string | null} [country]
 * @property {string | null} [brand_color]
 * @property {boolean} [is_active]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} FinancialYearsRow
 * @property {number} id
 * @property {string} label
 * @property {boolean} is_current
 */
/**
 * @typedef {Object} FinancialYearsInsert
 * @property {number} id
 * @property {string} label
 * @property {boolean} [is_current]
 */
/**
 * @typedef {Object} FinancialYearsUpdate
 * @property {number} [id]
 * @property {string} [label]
 * @property {boolean} [is_current]
 */

/**
 * @typedef {Object} TargetsRow
 * @property {string} id
 * @property {string} principal_id
 * @property {number} fy
 * @property {number} yearly_target
 * @property {number | null} q1_target
 * @property {number | null} q2_target
 * @property {number | null} q3_target
 * @property {number | null} q4_target
 * @property {string} created_at
 * @property {string} updated_at
 */
/**
 * @typedef {Object} TargetsInsert
 * @property {string} [id]
 * @property {string} principal_id
 * @property {number} fy
 * @property {number} [yearly_target]
 * @property {number | null} [q1_target]
 * @property {number | null} [q2_target]
 * @property {number | null} [q3_target]
 * @property {number | null} [q4_target]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */
/**
 * @typedef {Object} TargetsUpdate
 * @property {string} [id]
 * @property {string} [principal_id]
 * @property {number} [fy]
 * @property {number} [yearly_target]
 * @property {number | null} [q1_target]
 * @property {number | null} [q2_target]
 * @property {number | null} [q3_target]
 * @property {number | null} [q4_target]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} PostsRow
 * @property {string} id
 * @property {string} name
 * @property {string | null} description
 * @property {string} principal_id
 * @property {string | null} product_name
 * @property {Channel[]} channels
 * @property {string} post_date
 * @property {import('@/lib/post-formats').PostFormat | null} format
 * @property {PostStatus} status
 * @property {number} fy Generated from post_date by Postgres. Read-only.
 * @property {number} quarter Generated from post_date by Postgres. Read-only.
 * @property {string} created_at
 * @property {string} updated_at
 */
/**
 * @typedef {Object} PostsInsert
 * @property {string} [id]
 * @property {string} name
 * @property {string | null} [description]
 * @property {string} principal_id
 * @property {string | null} [product_name]
 * @property {Channel[]} [channels]
 * @property {string} post_date
 * @property {import('@/lib/post-formats').PostFormat} format
 * @property {PostStatus} status
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */
/**
 * @typedef {Object} PostsUpdate
 * @property {string} [id]
 * @property {string} [name]
 * @property {string | null} [description]
 * @property {string} [principal_id]
 * @property {string | null} [product_name]
 * @property {Channel[]} [channels]
 * @property {string} [post_date]
 * @property {import('@/lib/post-formats').PostFormat} [format]
 * @property {PostStatus} [status]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} AdminUsersRow
 * @property {string} user_id
 * @property {string} created_at
 */
/**
 * @typedef {Object} AdminUsersInsert
 * @property {string} user_id
 * @property {string} [created_at]
 */
/**
 * @typedef {Object} AdminUsersUpdate
 * @property {string} [user_id]
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} DashboardRollupArgs
 * @property {number} p_fy
 * @property {number | null} [p_quarter]
 * @property {string | null} [p_group]
 * @property {string | null} [p_pm]
 * @property {string | null} [p_format]
 * @property {string | null} [p_status]
 * @property {string | null} [p_from]
 * @property {string | null} [p_to]
 */
/**
 * @typedef {Object} DashboardRollupRow
 * @property {string} dimension
 * @property {string} key
 * @property {string} label
 * @property {string | null} accent
 * @property {number} planned
 * @property {number} implemented
 * @property {number} pending
 */

/**
 * @typedef {Object} PrincipalsRelationship
 * @property {'principals_product_manager_id_fkey'} foreignKeyName
 * @property {['product_manager_id']} columns
 * @property {'product_managers'} referencedRelation
 * @property {['id']} referencedColumns
 */
/**
 * @typedef {Object} TargetsPrincipalRelationship
 * @property {'targets_principal_id_fkey'} foreignKeyName
 * @property {['principal_id']} columns
 * @property {'principals'} referencedRelation
 * @property {['id']} referencedColumns
 */
/**
 * @typedef {Object} TargetsFyRelationship
 * @property {'targets_fy_fkey'} foreignKeyName
 * @property {['fy']} columns
 * @property {'financial_years'} referencedRelation
 * @property {['id']} referencedColumns
 */
/**
 * @typedef {Object} PostsRelationship
 * @property {'posts_principal_id_fkey'} foreignKeyName
 * @property {['principal_id']} columns
 * @property {'principals'} referencedRelation
 * @property {['id']} referencedColumns
 */

/**
 * The shape passed as the generic argument everywhere a Supabase client is
 * created — see `ReturnType<typeof createServerClient<Database>>` in
 * src/lib/supabase/server.js and src/lib/supabase/client.js.
 *
 * @typedef {Object} Database
 * @property {Object} public
 * @property {Object} public.Tables
 * @property {{ Row: ProductManagersRow, Insert: ProductManagersInsert, Update: ProductManagersUpdate, Relationships: [] }} public.Tables.product_managers
 * @property {{ Row: PrincipalsRow, Insert: PrincipalsInsert, Update: PrincipalsUpdate, Relationships: [PrincipalsRelationship] }} public.Tables.principals
 * @property {{ Row: FinancialYearsRow, Insert: FinancialYearsInsert, Update: FinancialYearsUpdate, Relationships: [] }} public.Tables.financial_years
 * @property {{ Row: TargetsRow, Insert: TargetsInsert, Update: TargetsUpdate, Relationships: [TargetsPrincipalRelationship, TargetsFyRelationship] }} public.Tables.targets
 * @property {{ Row: PostsRow, Insert: PostsInsert, Update: PostsUpdate, Relationships: [PostsRelationship] }} public.Tables.posts
 * @property {{ Row: AdminUsersRow, Insert: AdminUsersInsert, Update: AdminUsersUpdate, Relationships: [] }} public.Tables.admin_users
 * @property {Record<never, never>} public.Views
 * @property {Object} public.Functions
 * @property {{ Args: DashboardRollupArgs, Returns: DashboardRollupRow[] }} public.Functions.dashboard_rollup
 * @property {{ Args: DashboardRollupArgs, Returns: import('@/lib/post-formats').FormatRollup[] }} public.Functions.post_format_rollup
 * @property {{ Args: Record<string, never>, Returns: boolean }} public.Functions.is_admin
 * @property {Record<never, never>} public.Enums
 * @property {Record<never, never>} public.CompositeTypes
 */

/** The roll-up dimensions returned by dashboard_rollup. */
/** @type {readonly ['principal', 'group', 'manager', 'product', 'campaign']} */
export const ROLLUP_DIMENSIONS = ['principal', 'group', 'manager', 'product', 'campaign']

/** @typedef {(typeof ROLLUP_DIMENSIONS)[number]} RollupDimension */

/**
 * @typedef {Object} RollupRow
 * @property {RollupDimension} dimension
 * @property {string} key
 * @property {string} label
 * @property {string | null} accent
 * @property {number} planned
 * @property {number} implemented
 * @property {number} pending
 */

export {}
