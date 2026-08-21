/**
 * Database types.
 *
 * Written to match supabase/migrations/*.sql exactly, in the shape the Supabase
 * CLI emits, so that once your project is live you can replace this file with
 * the real thing and nothing importing it has to change:
 *
 *   npm run gen:types
 *
 * Two things the generator gets right that are easy to get wrong by hand, and
 * which are honoured below:
 *
 *   · `posts.fy` and `posts.quarter` are GENERATED columns. They appear on Row
 *     but are absent from Insert and Update — the type system refuses to let
 *     you write to them, which is the same rule the database enforces.
 *
 *   · Columns with defaults are optional on Insert, required on Row.
 */

import type { Channel } from '@/lib/channels'
import type { PostStatus } from '@/lib/status'

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      product_managers: {
        Row: {
          id: string
          name: string
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          created_at?: string
        }
        Relationships: []
      }

      principals: {
        Row: {
          id: string
          name: string
          group_name: string
          product_manager_id: string | null
          country: string | null
          brand_color: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          group_name: string
          product_manager_id?: string | null
          country?: string | null
          brand_color?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          group_name?: string
          product_manager_id?: string | null
          country?: string | null
          brand_color?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'principals_product_manager_id_fkey'
            columns: ['product_manager_id']
            referencedRelation: 'product_managers'
            referencedColumns: ['id']
          },
        ]
      }

      financial_years: {
        Row: {
          id: number
          label: string
          is_current: boolean
        }
        Insert: {
          id: number
          label: string
          is_current?: boolean
        }
        Update: {
          id?: number
          label?: string
          is_current?: boolean
        }
        Relationships: []
      }

      targets: {
        Row: {
          id: string
          principal_id: string
          fy: number
          yearly_target: number
          q1_target: number | null
          q2_target: number | null
          q3_target: number | null
          q4_target: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          principal_id: string
          fy: number
          yearly_target?: number
          q1_target?: number | null
          q2_target?: number | null
          q3_target?: number | null
          q4_target?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          principal_id?: string
          fy?: number
          yearly_target?: number
          q1_target?: number | null
          q2_target?: number | null
          q3_target?: number | null
          q4_target?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'targets_principal_id_fkey'
            columns: ['principal_id']
            referencedRelation: 'principals'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'targets_fy_fkey'
            columns: ['fy']
            referencedRelation: 'financial_years'
            referencedColumns: ['id']
          },
        ]
      }

      posts: {
        Row: {
          id: string
          name: string
          description: string | null
          principal_id: string
          product_name: string | null
          channels: Channel[]
          post_date: string
          status: PostStatus
          /** Generated from post_date by Postgres. Read-only. */
          fy: number
          /** Generated from post_date by Postgres. Read-only. */
          quarter: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          principal_id: string
          product_name?: string | null
          channels?: Channel[]
          post_date: string
          status: PostStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          principal_id?: string
          product_name?: string | null
          channels?: Channel[]
          post_date?: string
          status?: PostStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'posts_principal_id_fkey'
            columns: ['principal_id']
            referencedRelation: 'principals'
            referencedColumns: ['id']
          },
        ]
      }
    }

    Views: Record<never, never>

    Functions: {
      dashboard_rollup: {
        Args: {
          p_fy: number
          p_quarter?: number | null
          p_group?: string | null
          p_pm?: string | null
          p_status?: string | null
          p_from?: string | null
          p_to?: string | null
        }
        Returns: {
          dimension: string
          key: string
          label: string
          accent: string | null
          planned: number
          implemented: number
          pending: number
        }[]
      }
    }

    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

/* -------------------------------------------------------------------------- */
/* Convenience aliases                                                         */
/* -------------------------------------------------------------------------- */

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type InsertDto<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type UpdateDto<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']

export type ProductManager = Tables<'product_managers'>
export type Principal = Tables<'principals'>
export type FinancialYear = Tables<'financial_years'>
export type Target = Tables<'targets'>
export type Post = Tables<'posts'>

/** The roll-up dimensions returned by dashboard_rollup. */
export const ROLLUP_DIMENSIONS = [
  'principal',
  'group',
  'manager',
  'product',
  'campaign',
] as const

export type RollupDimension = (typeof ROLLUP_DIMENSIONS)[number]

export type RollupRow = {
  dimension: RollupDimension
  key: string
  label: string
  accent: string | null
  planned: number
  implemented: number
  pending: number
}
