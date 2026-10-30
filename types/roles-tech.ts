export type RoleStatus = 'open' | 'closed';
export type TechnologyStatus = 'approved' | 'pending' | 'rejected';

export interface Role {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string; // Rich text / markdown job description
  status: RoleStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  technologies?: Technology[];
  candidate_count?: number;
}

export interface Technology {
  id: string;
  name: string;
  slug: string;
  status: TechnologyStatus;
  is_featured: boolean;
  suggested_by_candidate_id?: string | null;
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  role_ids?: string[];
  candidate_count?: number;
}

export interface RoleTechnology {
  role_id: string;
  technology_id: string;
  is_featured?: boolean;
}

export interface RoleFormValues {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  status: RoleStatus;
  display_order: number;
  technology_ids: string[];
}

export interface TechFormValues {
  name: string;
  status: TechnologyStatus;
  is_featured: boolean;
  role_ids: string[];
}
